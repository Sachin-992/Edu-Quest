import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Coins, 
  ShoppingBag, 
  Check, 
  Lock, 
  Search, 
  Gift, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ALL_COSMETICS, type Cosmetic, RARITY_CONFIG, getCosmeticName, getCosmeticDescription } from "@/data/cosmetics";
import { getStableUuid } from "@/lib/utils";
import { CharacterSVG, type CharacterConfig, getItemCostType } from "./CharacterCreator";
import LootBoxReveal from "./LootBoxReveal";
import { useLanguageStore } from "@/store/useLanguageStore";

interface OwnedItem {
  item_id: string;
  is_equipped: boolean;
}

interface AvatarShopProps {
  onBack: () => void;
  onConfigChange?: (config: CharacterConfig) => void;
}

interface SpinPrize {
  id: number;
  label: string;
  subLabel: string;
  type: 'coins' | 'gems' | 'epic_item' | 'legendary_item';
  value: number;
  color: string;
  textColor: string;
}

const SPIN_PRIZES: (SpinPrize & { label_ta?: string; subLabel_ta?: string })[] = [
  { id: 0, label: "50 Coins", label_ta: "50 நாணயங்கள்", subLabel: "🪙", type: 'coins', value: 50, color: "#1e1b4b", textColor: "#facc15" },
  { id: 1, label: "5 Gems", label_ta: "5 ரத்தினங்கள்", subLabel: "💎", type: 'gems', value: 5, color: "#2e1065", textColor: "#c084fc" },
  { id: 2, label: "100 Coins", label_ta: "100 நாணயங்கள்", subLabel: "🪙", type: 'coins', value: 100, color: "#0f172a", textColor: "#f59e0b" },
  { id: 3, label: "10 Gems", label_ta: "10 ரத்தினங்கள்", subLabel: "💎", type: 'gems', value: 10, color: "#450a0a", textColor: "#f472b6" },
  { id: 4, label: "200 Coins", label_ta: "200 நாணயங்கள்", subLabel: "🪙", type: 'coins', value: 200, color: "#064e3b", textColor: "#34d399" },
  { id: 5, label: "25 Gems", label_ta: "25 ரத்தினங்கள்", subLabel: "💎", type: 'gems', value: 25, color: "#0c4a6e", textColor: "#38bdf8" },
  { id: 6, label: "Epic Drop", label_ta: "அரிய பரிசு", subLabel: "💜 Item", subLabel_ta: "💜 ஆடை", type: 'epic_item', value: 0, color: "#581c87", textColor: "#e9d5ff" },
  { id: 7, label: "Legend Drop", label_ta: "உன்னத பரிசு", subLabel: "💛 Item", subLabel_ta: "💛 ஆடை", type: 'legendary_item', value: 0, color: "#78350f", textColor: "#fef08a" },
];

const SHOP_CATEGORIES = [
  { key: "all", label: "All Items 📦", label_ta: "அனைத்தும் 📦" },
  { key: "outfit", label: "Outfits 👕", label_ta: "ஆடைகள் 👕" },
  { key: "jacket", label: "Jackets 🧥", label_ta: "ஜாக்கெட்டுகள் 🧥" },
  { key: "hat", label: "Headgear 🎩", label_ta: "தலைக்கவசங்கள் 🎩" },
  { key: "glasses", label: "Eyewear 🕶️", label_ta: "கண்ணாடிகள் 🕶️" },
  { key: "prop", label: "Props 🪄", label_ta: "உபகரணங்கள் 🪄" },
  { key: "backpack", label: "Backpacks 🎒", label_ta: "முதுகுப்பைகள் 🎒" },
  { key: "accessory", label: "Accessories ✨", label_ta: "துணைப் பொருட்கள் ✨" },
  { key: "hairstyle", label: "Hairstyles 💇", label_ta: "தலைமுடி 💇" },
  { key: "beard", label: "Beards 🧔", label_ta: "தாடி / மீசை 🧔" },
  { key: "aura", label: "Auras 🌟", label_ta: "ஒளிவட்டங்கள் 🌟" },
  { key: "pet", label: "Pets 🐾", label_ta: "செல்லப்பிராணிகள் 🐾" },
  { key: "background", label: "Lobby Themes 🖼️", label_ta: "அறை பின்னணிகள் 🖼️" },
  { key: "emote", label: "Emotes 💃", label_ta: "பாவனைகள் 💃" },
];

const DEFAULT_CONFIG: CharacterConfig = {
  gender: "male",
  style: "anime",
  skinTone: "#FCE3B6",
  hairstyle: "spiky",
  hairColor: "#1A1A1A",
  eyes: "anime",
  expression: "focused",
};

const OUTFIT_CATEGORIES = ['outfit', 'anime', 'superhero', 'fantasy', 'adventure', 'funny', 'school'];

const getItemCategoryGroup = (item: Cosmetic): string => {
  const slot = item.equipSlot || item.category;
  if (slot === 'outfit' || (OUTFIT_CATEGORIES.includes(item.category) && !item.equipSlot)) {
    return 'outfit';
  }
  return slot;
};

/** Resolve the effective equip slot for a cosmetic item.
 * Items in outfit-type categories (anime, superhero, fantasy, etc.) without an
 * explicit equipSlot are mapped to 'outfit'. */
const resolveSlot = (item: Cosmetic): string => {
  if (item.equipSlot) return item.equipSlot;
  if (OUTFIT_CATEGORIES.includes(item.category)) return 'outfit';
  return item.category;
};

/** Apply a cosmetic item to a CharacterConfig by its resolved slot. */
const applySlotToConfig = (config: CharacterConfig, slot: string, itemId: string): CharacterConfig => {
  const next = { ...config };
  if (slot === 'outfit') next.outfit = itemId;
  else if (slot === 'jacket') next.jacket = itemId;
  else if (slot === 'hat') next.hat = itemId;
  else if (slot === 'glasses') next.glasses = itemId;
  else if (slot === 'prop') next.prop = itemId;
  else if (slot === 'backpack') next.backpack = itemId;
  else if (slot === 'beard') next.beard = itemId;
  else if (slot === 'pet') next.pet = itemId;
  else if (slot === 'aura') next.aura = itemId;
  else if (slot === 'background') next.background = itemId;
  else if (slot === 'frame') next.frame = itemId;
  else if (slot === 'pose') next.pose = itemId;
  else if (slot === 'hairstyle') next.hairstyle = itemId;
  return next;
};

export default function AvatarShop({ onBack, onConfigChange }: AvatarShopProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguageStore();
  const isTamil = language === "ta";
  
  // Navigation & Tabs state
  const [activeTab, setActiveTab] = useState<"buy" | "spin" | "crate">("buy");
  
  // Currency & Profile info
  const [owned, setOwned] = useState<OwnedItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  // Live Preview states
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [previewConfig, setPreviewConfig] = useState<CharacterConfig>(DEFAULT_CONFIG);
  const [selectedItem, setSelectedItem] = useState<Cosmetic | null>(null);
  
  // Catalog filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sortOption, setSortOption] = useState<"price-low" | "price-high" | "name">("price-low");
  
  // Lucky Spin Wheel states
  const [freeSpinAvailable, setFreeSpinAvailable] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [pendingPrizeIndex, setPendingPrizeIndex] = useState<number | null>(null);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [wonPrizeMessage, setWonPrizeMessage] = useState("");
  
  // Mystery Crate states
  const [openingCrate, setOpeningCrate] = useState(false);
  const [revealedCrateItem, setRevealedCrateItem] = useState<Cosmetic | null>(null);

  // Fetch initial user progress, economy balance, and customization configurations
  const loadShopData = async () => {
    if (!user) return;
    try {
      const [ownedRes, progressRes, transactionsRes, profileRes] = await Promise.all([
        supabase.from("student_avatar_items").select("item_id, is_equipped").eq("user_id", user.id),
        supabase.from("student_progress").select("xp_earned, score, quiz_id, status").eq("user_id", user.id),
        supabase.from("coin_transactions").select("amount").eq("user_id", user.id),
        supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle(),
      ]);

      if (ownedRes.data) {
        setOwned(ownedRes.data as OwnedItem[]);
      }

      let xp = 0;
      let perfect = 0;
      if (progressRes.data) {
        xp = progressRes.data.reduce((s, p) => s + (p.xp_earned || 0), 0);
        progressRes.data.forEach((p) => {
          if (p.quiz_id && p.status === "completed" && p.score && p.score >= 100) {
            perfect++;
          }
        });
      }

      const spent = transactionsRes.data?.reduce((s, t) => s + t.amount, 0) || 0;
      const calculatedCoins = xp + spent;
      setCoins(calculatedCoins);
      localStorage.setItem('eq_coins', String(calculatedCoins));

      let gemsSpent = 0;
      let gemsAwarded = 0;
      let parsedAvatar: any = {};
      
      if (profileRes.data?.avatar_url) {
        try {
          parsedAvatar = JSON.parse(profileRes.data.avatar_url);
          if (parsedAvatar.gender) {
            setCharacterConfig({ ...DEFAULT_CONFIG, ...parsedAvatar });
            setPreviewConfig({ ...DEFAULT_CONFIG, ...parsedAvatar });
          }
          gemsSpent = parsedAvatar.gems_spent || 0;
          gemsAwarded = parsedAvatar.gems_awarded || 0;
        } catch (e) {}
      }

      const calculatedGems = Math.floor(xp / 100) + (perfect * 2) + gemsAwarded - gemsSpent;
      const finalGems = Math.max(0, calculatedGems);
      setGems(finalGems);
      localStorage.setItem('eq_gems', String(finalGems));

      const lastFreeSpin = localStorage.getItem('last_free_spin');
      setFreeSpinAvailable(lastFreeSpin !== new Date().toDateString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [user]);

  const isOwned = (itemId: string) => {
    const uuid = getStableUuid(itemId);
    return owned.some((o) => o.item_id === uuid) || itemId === "school-uniform" || itemId === "classic-hair" || itemId === "bg-school";
  };

  const isEquipped = (itemId: string) => {
    const uuid = getStableUuid(itemId);
    return owned.find((o) => o.item_id === uuid)?.is_equipped ?? false;
  };

  const handlePreviewItem = (item: Cosmetic) => {
    const slot = resolveSlot(item);
    setPreviewConfig((prev) => applySlotToConfig(prev, slot, item.id));
    setSelectedItem(item);
  };

  const resetPreview = () => {
    setPreviewConfig(characterConfig);
    setSelectedItem(null);
  };

  const handlePurchase = async (item: Cosmetic) => {
    if (!user || isOwned(item.id)) return;
    const costInfo = getItemCostType(item);

    if (costInfo.type === 'coins') {
      if (coins < costInfo.amount) {
        toast({ title: "Not enough coins! 💰", description: `You need ${costInfo.amount - coins} more coins.`, variant: "destructive" });
        return;
      }

      setPurchasing(item.id);
      try {
        await supabase.from("coin_transactions").insert({
          user_id: user.id,
          amount: -costInfo.amount,
          description: `Purchased ${item.name}`,
        });
        
        await supabase.from("student_avatar_items").insert({
          user_id: user.id,
          item_id: getStableUuid(item.id),
          is_equipped: true,
        });

        // Auto-equip: update character preview immediately
        const slot = resolveSlot(item);
        const newConfig = applySlotToConfig(characterConfig, slot, item.id);
        setCharacterConfig(newConfig);
        setPreviewConfig(newConfig);
        onConfigChange?.(newConfig);

        // Unequip old items in the same slot from DB
        const categoryItems = ALL_COSMETICS.filter((i) => getItemCategoryGroup(i) === getItemCategoryGroup(item) && i.id !== item.id);
        const oldIds = categoryItems.map((i) => getStableUuid(i.id));
        if (oldIds.length > 0) {
          await supabase.from("student_avatar_items")
            .update({ is_equipped: false })
            .eq("user_id", user.id)
            .in("item_id", oldIds);
        }

        // Persist equip to profile avatar_url
        const { data: prof } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle();
        let parsedProfile: any = {};
        if (prof?.avatar_url) { try { parsedProfile = JSON.parse(prof.avatar_url); } catch (e) {} }
        const persistConfig = applySlotToConfig(parsedProfile as CharacterConfig, slot, item.id);
        await supabase.from("profiles").update({ avatar_url: JSON.stringify(persistConfig) }).eq("user_id", user.id);

        // Set to owned+equipped state locally
        setOwned(prev => [
          ...prev.map(o => oldIds.includes(o.item_id) ? { ...o, is_equipped: false } : o),
          { item_id: getStableUuid(item.id), is_equipped: true }
        ]);
        const nextCoins = coins - costInfo.amount;
        setCoins(nextCoins);
        localStorage.setItem('eq_coins', String(nextCoins));
        
        localStorage.removeItem('eq_avatar_discount');
        window.dispatchEvent(new Event("wallet_update"));
        
        // Trigger unboxing visual celebration
        setRevealedCrateItem(item);
        toast({ title: `${item.icon} ${item.name} unlocked & equipped!` });
      } catch {
        toast({ title: "Purchase failed", variant: "destructive" });
      }
    } else {
      // Gems payment
      if (gems < costInfo.amount) {
        toast({ title: "Not enough gems! 💎", description: `You need ${costInfo.amount - gems} more gems.`, variant: "destructive" });
        return;
      }

      setPurchasing(item.id);
      try {
        // Fetch current parsed avatar profile URL to write spent gems
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();
        
        let parsed: any = {};
        if (prof?.avatar_url) {
          try {
            parsed = JSON.parse(prof.avatar_url);
          } catch (e) {}
        }
        parsed.gems_spent = (parsed.gems_spent || 0) + costInfo.amount;

        await supabase
          .from("profiles")
          .update({ avatar_url: JSON.stringify(parsed) })
          .eq("user_id", user.id);

        await supabase.from("student_avatar_items").insert({
          user_id: user.id,
          item_id: getStableUuid(item.id),
          is_equipped: true,
        });

        // Auto-equip: update character preview immediately
        const slot = resolveSlot(item);
        const newConfig = applySlotToConfig(characterConfig, slot, item.id);
        setCharacterConfig(newConfig);
        setPreviewConfig(newConfig);
        onConfigChange?.(newConfig);

        // Unequip old items in the same slot from DB
        const catItems = ALL_COSMETICS.filter((i) => getItemCategoryGroup(i) === getItemCategoryGroup(item) && i.id !== item.id);
        const oldCatIds = catItems.map((i) => getStableUuid(i.id));
        if (oldCatIds.length > 0) {
          await supabase.from("student_avatar_items")
            .update({ is_equipped: false })
            .eq("user_id", user.id)
            .in("item_id", oldCatIds);
        }

        // Profile avatar_url already updated above with gems_spent, re-apply slot
        const { data: updatedProf } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).maybeSingle();
        let reParsed: any = {};
        if (updatedProf?.avatar_url) { try { reParsed = JSON.parse(updatedProf.avatar_url); } catch (e) {} }
        const rePersistedConfig = applySlotToConfig(reParsed as CharacterConfig, slot, item.id);
        await supabase.from("profiles").update({ avatar_url: JSON.stringify(rePersistedConfig) }).eq("user_id", user.id);

        setOwned(prev => [
          ...prev.map(o => oldCatIds.includes(o.item_id) ? { ...o, is_equipped: false } : o),
          { item_id: getStableUuid(item.id), is_equipped: true }
        ]);
        const nextGems = gems - costInfo.amount;
        setGems(nextGems);
        localStorage.setItem('eq_gems', String(nextGems));

        localStorage.removeItem('eq_avatar_discount');
        window.dispatchEvent(new Event("wallet_update"));

        // Trigger unboxing visual celebration
        setRevealedCrateItem(item);
        toast({ title: `${item.icon} ${item.name} unlocked & equipped!` });
      } catch {
        toast({ title: "Purchase failed", variant: "destructive" });
      }
    }
    setPurchasing(null);
  };

  const handleEquip = async (item: Cosmetic) => {
    if (!user) return;
    const slot = resolveSlot(item);

    // Optimistic UI update — character updates INSTANTLY before DB call
    const updatedConfig = applySlotToConfig(characterConfig, slot, item.id);
    setCharacterConfig(updatedConfig);
    setPreviewConfig(updatedConfig);
    onConfigChange?.(updatedConfig);

    try {
      // 1. Unequip old items in the same slot category
      const categoryItems = ALL_COSMETICS.filter((i) => getItemCategoryGroup(i) === getItemCategoryGroup(item));
      const categoryItemIds = categoryItems.map((i) => getStableUuid(i.id));

      await supabase.from("student_avatar_items")
        .update({ is_equipped: false })
        .eq("user_id", user.id)
        .in("item_id", categoryItemIds);

      // 2. Equip new item
      await supabase.from("student_avatar_items")
        .update({ is_equipped: true })
        .eq("user_id", user.id)
        .eq("item_id", getStableUuid(item.id));

      // 3. Update profiles.avatar_url configuration (source of truth for persistence)
      const { data: prof } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      
      let parsed: any = {};
      if (prof?.avatar_url) {
        try {
          parsed = JSON.parse(prof.avatar_url);
        } catch (e) {}
      }

      // Apply the resolved slot to the persisted config
      const persistedConfig = applySlotToConfig(parsed as CharacterConfig, slot, item.id);

      await supabase
        .from("profiles")
        .update({ avatar_url: JSON.stringify(persistedConfig) })
        .eq("user_id", user.id);

      // Update local owned items UI state
      setOwned(prev =>
        prev.map(o => ({
          ...o,
          is_equipped: o.item_id === getStableUuid(item.id) ? true : categoryItemIds.includes(o.item_id) ? false : o.is_equipped,
        }))
      );

      toast({ title: `${item.icon} Equipped!` });
    } catch {
      // Revert optimistic update on failure
      setCharacterConfig(characterConfig);
      setPreviewConfig(characterConfig);
      toast({ title: "Equip failed", variant: "destructive" });
    }
  };

  // SPIN WHEEL HANDLERS
  const getSectorPath = (index: number) => {
    const cx = 150;
    const cy = 150;
    const r = 135;
    const startAngle = index * 45 - 90;
    const endAngle = (index + 1) * 45 - 90;
    
    const rad1 = (startAngle * Math.PI) / 180;
    const rad2 = (endAngle * Math.PI) / 180;
    
    const x1 = cx + r * Math.cos(rad1);
    const y1 = cy + r * Math.sin(rad1);
    const x2 = cx + r * Math.cos(rad2);
    const y2 = cy + r * Math.sin(rad2);
    
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  const handleSpin = async () => {
    if (isSpinning || !user) return;

    const isFree = freeSpinAvailable;
    if (!isFree && coins < 30) {
      toast({ title: "Not enough coins! 💰", description: "Spinning the wheel costs 30 coins.", variant: "destructive" });
      return;
    }

    setIsSpinning(true);

    // Roll weighted index
    const roll = Math.random();
    let index = 0;
    
    if (roll < 0.25) index = 0; // 50 Coins
    else if (roll < 0.45) index = 1; // 5 Gems
    else if (roll < 0.63) index = 2; // 100 Coins
    else if (roll < 0.75) index = 3; // 10 Gems
    else if (roll < 0.83) index = 4; // 200 Coins
    else if (roll < 0.88) index = 5; // 25 Gems
    else if (roll < 0.96) index = 6; // Epic Item Drop
    else index = 7; // Legendary Item Drop

    try {
      if (!isFree) {
        await supabase.from("coin_transactions").insert({
          user_id: user.id,
          amount: -30,
          description: "Spin Lucky Wheel",
        });
        const nextCoins = coins - 30;
        setCoins(nextCoins);
        localStorage.setItem('eq_coins', String(nextCoins));
      } else {
        localStorage.setItem('last_free_spin', new Date().toDateString());
        setFreeSpinAvailable(false);
      }

      const nextAngle = spinAngle + 1800 + (360 - index * 45) - 22.5 - (spinAngle % 360);
      setSpinAngle(nextAngle);
      setPendingPrizeIndex(index);
    } catch {
      setIsSpinning(false);
      toast({ title: "Spin failed", variant: "destructive" });
    }
  };

  const handleSpinComplete = async () => {
    setIsSpinning(false);
    if (pendingPrizeIndex === null || !user) return;

    const prize = SPIN_PRIZES[pendingPrizeIndex];

    try {
      if (prize.type === 'coins') {
        await supabase.from("coin_transactions").insert({
          user_id: user.id,
          amount: prize.value,
          description: `Lucky Spin: Won ${prize.value} Coins`,
        });
        const nextCoins = coins + prize.value;
        setCoins(nextCoins);
        localStorage.setItem('eq_coins', String(nextCoins));
        setWonPrizeMessage(isTamil ? `நீங்கள் 🪙 ${prize.value} நாணயங்களை வென்றீர்கள்! 🎉` : `You won 🪙 ${prize.value} Coins!`);
        setShowPrizeDialog(true);
      } else if (prize.type === 'gems') {
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();
        
        let parsed: any = {};
        if (prof?.avatar_url) {
          try {
            parsed = JSON.parse(prof.avatar_url);
          } catch (e) {}
        }
        parsed.gems_awarded = (parsed.gems_awarded || 0) + prize.value;

        await supabase
          .from("profiles")
          .update({ avatar_url: JSON.stringify(parsed) })
          .eq("user_id", user.id);

        const nextGems = gems + prize.value;
        setGems(nextGems);
        localStorage.setItem('eq_gems', String(nextGems));
        setWonPrizeMessage(isTamil ? `நீங்கள் 💎 ${prize.value} ரத்தினங்களை வென்றீர்கள்! 🎉` : `You won 💎 ${prize.value} Gems!`);
        setShowPrizeDialog(true);
      } else {
        const rKey = prize.type === 'epic_item' ? 'epic' : 'legendary';
        const unownedPool = ALL_COSMETICS.filter(c => c.rarity === rKey && !isOwned(c.id));

        if (unownedPool.length > 0) {
          const item = unownedPool[Math.floor(Math.random() * unownedPool.length)];
          
          await supabase.from("student_avatar_items").insert({
            user_id: user.id,
            item_id: getStableUuid(item.id),
          });
          setOwned(prev => [...prev, { item_id: getStableUuid(item.id), is_equipped: false }]);
          setRevealedCrateItem(item);
        } else {
          // Fallback reward
          const fallbackCoins = rKey === 'epic' ? 100 : 200;
          await supabase.from("coin_transactions").insert({
            user_id: user.id,
            amount: fallbackCoins,
            description: `Lucky Spin: Epic/Legendary Fallback`,
          });
          const nextCoins = coins + fallbackCoins;
          setCoins(nextCoins);
          localStorage.setItem('eq_coins', String(nextCoins));
          setWonPrizeMessage(isTamil ? `உங்களிடம் ஏற்கனவே அனைத்து ${rKey === 'epic' ? 'அரிய' : 'உன்னத'} பொருட்களும் உள்ளன! அதற்கு பதிலாக 🪙 ${fallbackCoins} நாணயங்களைப் பெற்றீர்கள்.` : `You already own all ${rKey} items! Received 🪙 ${fallbackCoins} Coins instead.`);
          setShowPrizeDialog(true);
        }
      }
    } catch {
      toast({ title: isTamil ? "வெகுமதி அளிப்பதில் பிழை" : "Error awarding prize", variant: "destructive" });
    }
    setPendingPrizeIndex(null);
  };

  // MYSTERY CRATE HANDLERS
  const handleOpenCrate = async () => {
    if (openingCrate || !user) return;
    if (coins < 50) {
      toast({
        title: isTamil ? "போதுமான நாணயங்கள் இல்லை! 💰" : "Not enough coins! 💰",
        description: isTamil ? "மர்மப் பெட்டியைத் திறக்க 50 நாணயங்கள் தேவைப்படும்." : "Opening a mystery crate costs 50 coins.",
        variant: "destructive"
      });
      return;
    }

    setOpeningCrate(true);

    // Roll rarity weighting: Common 50%, Rare 30%, Epic 15%, Legendary/Mythic 5%
    const roll = Math.random();
    let rolledRarity: string[] = ["common"];
    if (roll < 0.5) rolledRarity = ["common"];
    else if (roll < 0.8) rolledRarity = ["rare"];
    else if (roll < 0.95) rolledRarity = ["epic"];
    else rolledRarity = ["legendary", "mythic"];

    let candidatePool = ALL_COSMETICS.filter(c => rolledRarity.includes(c.rarity) && !isOwned(c.id));
    if (candidatePool.length === 0) {
      // Fallback to any unowned
      candidatePool = ALL_COSMETICS.filter(c => !isOwned(c.id));
    }

    if (candidatePool.length === 0) {
      toast({
        title: isTamil ? "சேகரிப்பு நாயகன்! 🏆" : "Master Collector! 🏆",
        description: isTamil ? "அங்காடியிலுள்ள அனைத்து ஆடைகளும் உங்களிடம் ஏற்கனவே உள்ளன! 50 நாணயங்கள் திருப்பித் தரப்பட்டன." : "You already own every cosmetic in the shop! Refunded 50 Coins."
      });
      setOpeningCrate(false);
      return;
    }

    const unboxed = candidatePool[Math.floor(Math.random() * candidatePool.length)];

    try {
      await supabase.from("coin_transactions").insert({
        user_id: user.id,
        amount: -50,
        description: `Unboxing Mystery Crate: ${unboxed.name}`,
      });

      await supabase.from("student_avatar_items").insert({
        user_id: user.id,
        item_id: getStableUuid(unboxed.id),
      });

      setOwned(prev => [...prev, { item_id: getStableUuid(unboxed.id), is_equipped: false }]);
      const nextCoins = coins - 50;
      setCoins(nextCoins);
      localStorage.setItem('eq_coins', String(nextCoins));

      // Play shake animation and then pop up unbox dialog
      setTimeout(() => {
        setRevealedCrateItem(unboxed);
        setOpeningCrate(false);
      }, 1500);
    } catch {
      setOpeningCrate(false);
      toast({
        title: isTamil ? "பெட்டி திறப்பதில் தோல்வி" : "Crate opening failed",
        variant: "destructive"
      });
    }
  };

  // Filter and sorting operations
  const filteredItems = ALL_COSMETICS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || getItemCategoryGroup(item) === categoryFilter;
    const matchesRarity = rarityFilter === "all" || item.rarity === rarityFilter;
    return matchesSearch && matchesCategory && matchesRarity;
  }).sort((a, b) => {
    if (sortOption === "price-low") return a.price - b.price;
    if (sortOption === "price-high") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-foreground">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{isTamil ? "ஆடை அங்காடியை ஒத்திசைக்கிறது..." : "Syncing Cosmetic Shop..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground p-4 md:p-6 pb-40 relative overflow-hidden">
      {/* Dynamic Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-40 z-0" />
      
      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Navigation HUD */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> {isTamil ? "முகப்பு" : "Lobby"}
            </Button>
            <motion.h1
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
              className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent uppercase tracking-wider text-gradient-flow"
            >
              {isTamil ? "ஆடை அங்காடி" : "Cosmetic shop"}
            </motion.h1>
          </div>

          {/* Currency Display Bar */}
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-md border border-border/40 px-4 py-2 rounded-2xl">
            <div className="flex items-center gap-1.5">
              <span>🪙</span>
              <span className="font-black text-amber-600 dark:text-amber-300 text-sm">{coins.toLocaleString()}</span>
            </div>
            <div className="h-4 w-[1px] bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span>💎</span>
              <span className="font-black text-purple-600 dark:text-purple-300 text-sm">{gems.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Premium RPG Tab Bar */}
        <div className="flex bg-card/60 border border-border/30 rounded-2xl p-1 gap-1 max-w-md">
          <motion.button
            onClick={() => setActiveTab("buy")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === "buy" ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/50 text-cyan-600 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            {isTamil ? "ஆடைகள் 🛍️" : "Cosmetics 🛍️"}
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("spin")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === "spin" ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 text-purple-600 dark:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            {isTamil ? "அதிர்ஷ்ட சக்கரம் 🎡" : "Lucky Spin 🎡"}
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("crate")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === "crate" ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/50 text-pink-600 dark:text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]" : "text-muted-foreground hover:text-foreground"}`}
          >
            {isTamil ? "சின்னப் பெட்டிகள் 🎁" : "Crates 🎁"}
          </motion.button>
        </div>

        {/* TAB 1: BUY COSMETICS */}
        {activeTab === "buy" && (
          <div className="space-y-4">
            {localStorage.getItem('eq_avatar_discount') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/35 text-cyan-600 dark:text-cyan-300 flex items-center justify-between shadow-sm mb-2"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-cyan-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-black leading-tight">🎯 Avatar Discount Active!</p>
                    <p className="text-xs text-muted-foreground font-semibold">Enjoy 20% off your next outfit or item purchase.</p>
                  </div>
                </div>
                <span className="text-xs font-black bg-cyan-500/20 text-cyan-500 px-3 py-1 rounded-full animate-bounce">-20% OFF</span>
              </motion.div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Pedestal Preview Panel */}
            <div className="lg:col-span-4 bg-card/70 border border-border/40 rounded-3xl p-5 text-center flex flex-col justify-between min-h-[460px] relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">{isTamil ? "பீடக் காட்சி" : "PEDESTAL PREVIEW"}</span>
                {selectedItem && (
                  <Button variant="ghost" size="sm" onClick={resetPreview} className="text-xs text-muted-foreground hover:text-foreground h-7 px-2">
                    {isTamil ? "மீட்டமை" : "Reset"}
                  </Button>
                )}
              </div>

              {/* Pedestal & Character SVG */}
              <div className="flex-1 flex flex-col items-center justify-center relative my-4">
                <div className="absolute bottom-6 w-44 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full scale-y-50 blur-[2px] shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
                <div className="scale-90 relative z-10">
                  <CharacterSVG config={previewConfig} />
                </div>
              </div>

              {/* Selector / Detail Action Pane */}
              <div className="bg-card/60 border border-border/30 rounded-2xl p-4 mt-2 text-left z-10 relative">
                {selectedItem ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-opacity-10 ${
                        RARITY_CONFIG[selectedItem.rarity].bg
                      } ${
                        RARITY_CONFIG[selectedItem.rarity].color
                      } ${
                        RARITY_CONFIG[selectedItem.rarity].border
                      }`}>
                        {selectedItem.rarity}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold capitalize">{selectedItem.category}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{getCosmeticName(selectedItem, isTamil)}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{getCosmeticDescription(selectedItem, isTamil)}</p>
                    </div>

                    {isOwned(selectedItem.id) ? (
                      isEquipped(selectedItem.id) ? (
                        <Button disabled className="w-full bg-white/10 text-white rounded-xl h-10 font-bold border border-white/10 text-xs">
                          <Check className="w-3.5 h-3.5 mr-1.5" /> {isTamil ? "தற்போது அணிந்துள்ளது" : "CURRENTLY EQUIPPED"}
                        </Button>
                      ) : (
                        <Button onClick={() => handleEquip(selectedItem)} className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 font-bold text-white rounded-xl h-10 text-xs shadow-md shadow-cyan-500/20">
                          {isTamil ? "ஆடையை அணிந்துகொள்" : "EQUIP COSMETIC"}
                        </Button>
                      )
                    ) : (
                      <Button
                        onClick={() => handlePurchase(selectedItem)}
                        disabled={purchasing === selectedItem.id}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-black text-white rounded-xl h-10 text-xs shadow-lg shadow-orange-500/20"
                      >
                        {purchasing === selectedItem.id ? (
                          isTamil ? "வாங்குங்கள்..." : "PURCHASING..."
                        ) : (
                          <>
                            {isTamil ? "இப்போது திறக்கவும்" : "UNLOCK NOW"} (
                            {getItemCostType(selectedItem).type === 'gems' ? "💎 " : "🪙 "}
                            {getItemCostType(selectedItem).amount}
                            )
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground font-medium">{isTamil ? "பொருட்களின் விவரங்களைப் பார்க்கவும், உங்கள் பீடத்தில் அவற்றின் நேரடி மாதிரியைக் காணவும் கடையின் பட்டியலில் உள்ள ஏதேனும் ஒரு பொருளைத் தேர்ந்தெடுக்கவும்." : "Select any item in the store catalog to inspect details and live preview on your pedestal."}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Filters and Shop Grid */}
            <div className="lg:col-span-8 space-y-4">
              {/* Filter HUD panel */}
              <div className="bg-card/50 border border-border/20 rounded-3xl p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={isTamil ? "ஆடைகளைத் தேடுங்கள்..." : "Search cosmetics inventory..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/40 bg-card/50 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-card/60 border border-border/40 rounded-xl px-3 text-muted-foreground">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-card/60 border border-border/40 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    {SHOP_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {isTamil && cat.label_ta ? cat.label_ta : cat.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="bg-card/60 border border-border/40 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="all">{isTamil ? "அனைத்து வகைகள் ✨" : "All Rarities ✨"}</option>
                    <option value="common">{isTamil ? "சாதாரணவை 🦩" : "Common 🦩"}</option>
                    <option value="rare">{isTamil ? "அரியவை 💙" : "Rare 💙"}</option>
                    <option value="epic">{isTamil ? "மிகவும் அரியவை 💜" : "Epic 💜"}</option>
                    <option value="legendary">{isTamil ? "உன்னதமானவை 📛" : "Legendary 📛"}</option>
                    <option value="mythic">{isTamil ? "புராண அரியவை ❤️" : "Mythic ❤️"}</option>
                    <option value="limited">{isTamil ? "வரையறுக்கப்பட்ட பதிப்பு 💚" : "Limited Edition 💚"}</option>
                  </select>

                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-card/60 border border-border/40 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors ml-auto"
                  >
                    <option value="price-low">{isTamil ? "விலை: குறைந்ததிலிருந்து அதிகம் 🪙" : "Price: Low to High 🪙"}</option>
                    <option value="price-high">{isTamil ? "விலை: அதிகத்திலிருந்து குறைவு 🪙" : "Price: High to Low 🪙"}</option>
                    <option value="name">{isTamil ? "அகரவரிசை A-Z 🔠" : "Alphabetical A-Z 🔠"}</option>
                  </select>
                </div>
              </div>

              {/* Grid Catalog Items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {filteredItems.map((item, idx) => {
                    const owned_ = isOwned(item.id);
                    const equipped = isEquipped(item.id);
                    const costInfo = getItemCostType(item);
                    const rConfig = RARITY_CONFIG[item.rarity];
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 25, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ delay: Math.min(idx * 0.04, 0.4), type: 'spring', stiffness: 300, damping: 18 }}
                        whileHover={{ scale: 1.04, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePreviewItem(item)}
                        className={`bg-card/70 rounded-2xl p-3 border-2 cursor-pointer relative overflow-hidden transition-colors group card-shimmer card-press ${
                          selectedItem?.id === item.id
                            ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            : `${rConfig.border} hover:border-white/30`
                        }`}
                      >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        
                        {/* Equipped Indicator Badge */}
                        {equipped && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 text-[10px] flex items-center justify-center font-bold text-white shadow-md">
                            ✓
                          </div>
                        )}

                        <div className="text-4xl text-center py-4 drop-shadow-md select-none group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                        
                        <div className="space-y-1 text-center">
                          <p className="font-black text-xs text-white truncate max-w-full leading-tight">
                            {getCosmeticName(item, isTamil)}
                          </p>
                          
                          <div className="flex items-center justify-center gap-1">
                            {owned_ ? (
                              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-wide uppercase">{isTamil ? "உள்ளது" : "OWNED"}</span>
                            ) : (
                              <div className="flex items-center gap-0.5 text-xs font-black text-amber-600 dark:text-amber-400">
                                <span>{costInfo.type === 'gems' ? "💎" : "🪙"}</span>
                                <span>{costInfo.amount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredItems.length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted-foreground">
                    <Compass className="w-8 h-8 mx-auto mb-2 text-white/20 animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest">{isTamil ? "வடிப்பான்களுடன் பொருந்தக்கூடிய ஆடைகள் எதுவும் இல்லை." : "No cosmetics found matching filters."}</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* TAB 2: LUCKY SPIN WHEEL */}
        {activeTab === "spin" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-card/50 border border-border/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            {/* Left Section: Spinning Wheel */}
            <div className="md:col-span-7 flex flex-col items-center justify-center">
              <div className="relative flex flex-col items-center select-none scale-90 sm:scale-100">
                {/* Pointer Arrow */}
                <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 w-8 h-8 z-30 flex items-center justify-center filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)]">
                  <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400" />
                </div>
                
                {/* SVG Wheel Wrapper */}
                <div className="relative rounded-full p-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.3)] border-4 border-amber-500">
                  <motion.div
                    animate={{ rotate: spinAngle }}
                    transition={isSpinning ? {
                      duration: 5,
                      ease: [0.1, 0.8, 0.15, 1]
                    } : {
                      duration: 0
                    }}
                    onAnimationComplete={handleSpinComplete}
                    className="w-72 h-72 sm:w-80 sm:h-80"
                  >
                    <svg viewBox="0 0 300 300" className="w-full h-full rounded-full overflow-hidden">
                      {/* Slices */}
                      {SPIN_PRIZES.map((prize, idx) => {
                        const pathD = getSectorPath(idx);
                        const labelAngle = idx * 45 + 22.5 - 90;
                        const radLabel = (labelAngle * Math.PI) / 180;
                        const lx = 150 + 90 * Math.cos(radLabel);
                        const ly = 150 + 90 * Math.sin(radLabel);
                        
                        return (
                          <g key={prize.id}>
                            <path d={pathD} fill={prize.color} stroke="#1e293b" strokeWidth="2" />
                            
                            <text
                              fill={prize.textColor}
                              textAnchor="middle"
                              transform={`translate(${lx}, ${ly}) rotate(${idx * 45 + 22.5 + 90})`}
                              className="select-none font-black tracking-tighter drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                            >
                              <tspan x="0" dy="-0.3em" fontSize="11" fontWeight="900" className="uppercase">
                                {isTamil && (prize as any).label_ta ? (prize as any).label_ta : prize.label}
                              </tspan>
                              <tspan x="0" dy="1.2em" fontSize="14" fontWeight="normal">
                                {isTamil && (prize as any).subLabel_ta ? (prize as any).subLabel_ta : prize.subLabel}
                              </tspan>
                            </text>
                          </g>
                        );
                      })}

                      {/* Outer Decorative flashing lights bulbs */}
                      {[...Array(16)].map((_, i) => {
                        const bulbAngle = i * 22.5;
                        const rad = (bulbAngle * Math.PI) / 180;
                        const bx = 150 + 142 * Math.cos(rad);
                        const by = 150 + 142 * Math.sin(rad);
                        // Make bulbs flash during spin
                        const bulbActive = isSpinning 
                          ? i % 2 === Math.floor(Date.now() / 150) % 2 
                          : i % 2 === 0;
                        return (
                          <circle
                            key={i}
                            cx={bx}
                            cy={by}
                            r="3.5"
                            fill={bulbActive ? "#fef08a" : "#ca8a04"}
                          />
                        );
                      })}

                      {/* Center Hub */}
                      <circle cx="150" cy="150" r="30" fill="#1e1b4b" stroke="#ca8a04" strokeWidth="4" />
                    </svg>
                  </motion.div>
                </div>
                
                {/* Central spinner core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-white pointer-events-none z-10 animate-pulse">
                  <span className="text-lg select-none">🎡</span>
                </div>
              </div>
            </div>

            {/* Right Section: Details Panel */}
            <div className="md:col-span-5 space-y-6">
              <div className="text-left">
                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-widest uppercase">{isTamil ? "தினசரி அதிர்ஷ்டக் குலுக்கல்" : "DAILY LUCKY DRAW"}</span>
                <h2 className="text-2xl font-black text-foreground mt-1">{isTamil ? "அதிர்ஷ்ட சக்கரக் குலுக்கல்" : "LUCKY DRAW SPIN WHEEL"}</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {isTamil ? "உள்நுழைவதன் மூலம் தினசரி இலவச சுழற்சி வாய்ப்பைப் பெறுங்கள்! உங்கள் அதிர்ஷ்டத்தை சோதித்து பெரிய நாணய பரிசுகள், பிரீமியம் ரத்தினங்கள் அல்லது அரிய ஆடைகளைத் திறக்கவும்." : "Earn free daily spins by logging in! Test your fortune to unlock massive Coin jackpots, premium Gems, or guaranteed Epic/Legendary cosmetics."}
                </p>
              </div>

              <div className="bg-card/65 border border-border/30 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{isTamil ? "தினசரி சுழற்சி உள்ளது:" : "Daily Spin Available:"}</span>
                  <span className={`text-xs font-black uppercase ${freeSpinAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {freeSpinAvailable ? (isTamil ? "ஆம்! 🎉" : "YES! 🎉") : (isTamil ? "முடிந்தது" : "SPENT")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isTamil ? "சுழற்சி கட்டணம்:" : "Spin Cost:"}</span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-300 flex items-center gap-1">
                    {freeSpinAvailable ? (isTamil ? "இலவசம்" : "FREE") : (isTamil ? "🪙 30 நாணயங்கள்" : "🪙 30 Coins")}
                  </span>
                </div>

                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || (!freeSpinAvailable && coins < 30)}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black py-5 shadow-lg shadow-purple-500/20 text-xs uppercase tracking-wider rounded-xl btn-bounce-hover btn-glow-pulse btn-shake-attention"
                  style={{ '--glow-color': 'rgba(168, 85, 247, 0.5)' } as React.CSSProperties}
                >
                  {isSpinning ? (isTamil ? "சுழல்கிறது..." : "Spinning...") : freeSpinAvailable ? (isTamil ? "இலவச தினசரி சுழற்சி" : "FREE DAILY SPIN") : (isTamil ? "சுழற்று (🪙 30)" : "SPIN (🪙 30)")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MYSTERY CRATES */}
        {activeTab === "crate" && (
          <div className="flex flex-col items-center justify-center py-12 bg-card/50 border border-border/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-pink-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            {/* Loot box visual with shaking animations */}
            <motion.div
              animate={openingCrate ? {
                scale: [1, 1.2, 0.9, 1.3, 1.1],
                rotate: [-6, 6, -8, 8, 0],
                y: [0, -12, 5, -20, 0]
              } : {
                y: [0, -8, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={openingCrate ? {
                duration: 1.5,
                ease: "easeInOut",
              } : {
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onClick={handleOpenCrate}
              className="text-[140px] mb-8 filter drop-shadow-[0_0_40px_rgba(236,72,153,0.4)] select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-300"
            >
              🎁
            </motion.div>

            <div className="bg-card/65 border border-border/30 rounded-2xl p-6 text-center max-w-sm space-y-4">
              <div>
                <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 tracking-widest uppercase">{isTamil ? "உன்னத திறப்பு" : "SUPREME UNBOXING"}</span>
                <h3 className="text-lg font-black text-white mt-1">{isTamil ? "மர்ம ஆடை பெட்டி" : "MYSTERY COSMETIC CRATE"}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {isTamil ? "ஒரு மர்மப் பெட்டியைப் பெற 50 நாணயங்களைச் செலவிடுங்கள்! பட்டியலிலுள்ள ஏதேனும் ஒரு புதிய ஆடையைத் திறக்கும். இதில் அரிய ஆடைகள், செல்லப்பிராணிகள், ஒளிவட்டங்கள் ஆகியவை அடங்கும்." : "Spend 50 coins to roll a mystery crate! Unlocks one random, unowned cosmetic in the catalog. Includes rare outfits, companion pets, epic glowing auras, and custom titles."}
                </p>
              </div>

              <div className="h-[1px] bg-white/10" />

              <div className="flex justify-between items-center text-xs font-semibold text-slate-400 px-1">
                <span>{isTamil ? "வாய்ப்பு விகிதங்கள்:" : "Rarity Rates:"}</span>
                <span className="text-[10px] font-bold text-white tracking-wide">
                  {isTamil ? "சாதாரண 50% • அரிய 30% • மிக அரிய 15% • உன்னத 5%" : "Common 50% • Rare 30% • Epic 15% • Legend 5%"}
                </span>
              </div>

              <Button
                onClick={handleOpenCrate}
                disabled={openingCrate || coins < 50}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 font-black text-white shadow-xl shadow-pink-500/20 py-5 text-xs uppercase tracking-wider rounded-xl h-12"
              >
                {openingCrate ? (isTamil ? "பெட்டி திறக்கிறது..." : "UNBOXING CRATE...") : <><Gift className="w-4 h-4 mr-2" /> {isTamil ? "மர்மப் பெட்டியைத் திற (🪙 50)" : "UNBOX MYSTERY CRATE (🪙 50)"}</>}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP: SPIN WHEEL WIN REVEAL DIALOG */}
      <AnimatePresence>
        {showPrizeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 text-center max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
              
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                🎉
              </div>

              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                {isTamil ? "அதிர்ஷ்ட குலுக்கல் வெற்றி!" : "LUCKY SPIN SUCCESS!"}
              </h3>
              
              <p className="text-sm text-slate-300 font-bold mb-6">
                {wonPrizeMessage}
              </p>

              <Button
                onClick={() => setShowPrizeDialog(false)}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 font-bold text-slate-950 rounded-xl h-11"
              >
                {isTamil ? "வெகுமதியைப் பெறு!" : "CLAIM REWARD!"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: LOOTBOX UNBOXING STAGE */}
      {revealedCrateItem && (
        <LootBoxReveal
          item={revealedCrateItem}
          onClose={() => {
            setRevealedCrateItem(null);
            // Refresh shop configurations and owned inventory local states after reveal closed
            loadShopData();
          }}
        />
      )}
    </div>
  );
}



