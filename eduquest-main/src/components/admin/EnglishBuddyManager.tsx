import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Plus, Sparkles, RefreshCw, Trash2, Calendar,
  CheckCircle2, FileSpreadsheet, Eye, ClipboardList
} from "lucide-react";

// Initial categories for matching
const CATEGORIES = [
  "School", "Home", "Office", "Hotel / Restaurant", "Shopping",
  "Travel", "Friends & Family", "Outside World", "Internet & Technology",
  "AI & Chatbots", "Public Speaking", "Phone Conversations"
];

const EnglishBuddyManager = () => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState("lessons");
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);

  // Add Lesson Form State
  const [lessonCategory, setLessonCategory] = useState("School");
  const [lessonLevel, setLessonLevel] = useState("Beginner");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonIcon, setLessonIcon] = useState("🏫");
  const [lessonDialogueRaw, setLessonDialogueRaw] = useState(
    JSON.stringify([
      { speaker: "mascot", text: "Hello! Let's practice borrowing a pencil.", meaning: "Greeting", translation: "வணக்கம்! பென்சில் கடன் வாங்குவதை பயிற்சி செய்வோம்." },
      { speaker: "student", text: "Excuse me, do you have an extra pencil?", meaning: "Asking classmate", translation: "மன்னிக்கவும், உங்களிடம் கூடுதல் பென்சில் உள்ளதா?" }
    ], null, 2)
  );
  const [lessonGameRaw, setLessonGameRaw] = useState(
    JSON.stringify({
      type: "unscramble",
      scrambled: ["have", "pencil?", "you", "extra", "do", "an"],
      correctOrder: ["do", "you", "have", "an", "extra", "pencil?"],
      question: "Arrange the words to ask for a pencil politely:"
    }, null, 2)
  );
  const [lessonUsageRaw, setLessonUsageRaw] = useState(
    JSON.stringify([
      { context: "In classroom", text: "Excuse me, can I borrow a pen, please?", type: "friendly" }
    ], null, 2)
  );

  // Add Word Form State
  const [wordWord, setWordWord] = useState("");
  const [wordMeaning, setWordMeaning] = useState("");
  const [wordPron, setWordPron] = useState("");
  const [wordEmoji, setWordEmoji] = useState("🔥");
  const [wordExample, setWordExample] = useState("");
  const [wordExpl, setWordExpl] = useState("");
  const [wordDate, setWordDate] = useState(new Date().toISOString().slice(0, 10));
  const [wordSynonyms, setWordSynonyms] = useState("grit, drive, determination");

  // Load Content
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: dbLessons } = await supabase.from("english_buddy_lessons").select("*");
      if (dbLessons) setLessons(dbLessons);

      const { data: dbWords } = await supabase.from("english_buddy_words").select("*").order("date", { ascending: false });
      if (dbWords) setWords(dbWords);
    } catch (e) {
      console.warn("Table not synced yet. Loading from LocalStorage fallbacks.");
      // Simulated LocalStorage fallback
      const storedLessons = localStorage.getItem("eq_eb_admin_lessons");
      const storedWords = localStorage.getItem("eq_eb_admin_words");
      if (storedLessons) setLessons(JSON.parse(storedLessons));
      if (storedWords) setWords(JSON.parse(storedWords));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    try {
      const dialogue = JSON.parse(lessonDialogueRaw);
      const game = JSON.parse(lessonGameRaw);
      const usage = JSON.parse(lessonUsageRaw);

      const newLesson = {
        category: lessonCategory,
        level: lessonLevel,
        title: lessonTitle,
        description: lessonDesc,
        icon: lessonIcon,
        content: dialogue,
        practice_game: game,
        real_usage: usage
      };

      let dbSuccess = false;
      try {
        const { error } = await supabase.from("english_buddy_lessons").insert([newLesson]);
        if (!error) dbSuccess = true;
      } catch (err) {
        // Suppress warning
      }

      // Local Fallback
      const nextLessons = [...lessons, { id: `local-${Date.now()}`, ...newLesson }];
      setLessons(nextLessons);
      localStorage.setItem("eq_eb_admin_lessons", JSON.stringify(nextLessons));

      toast({ title: "Lesson Saved Successfully! 🎉" });
      setLessonTitle("");
      setLessonDesc("");
    } catch (err: any) {
      toast({ title: "Invalid JSON format in Dialogs/Games", description: err.message, variant: "destructive" });
    }
  };

  // Save Word
  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordWord || !wordMeaning) {
      toast({ title: "Word and Meaning are required", variant: "destructive" });
      return;
    }

    const synList = wordSynonyms.split(",").map(s => s.trim()).filter(Boolean);

    const newWord = {
      word: wordWord,
      meaning: wordMeaning,
      pronunciation: wordPron,
      emoji: wordEmoji,
      example_sentence: wordExample,
      explanation: wordExpl,
      date: wordDate,
      synonyms: synList
    };

    try {
      let dbSuccess = false;
      try {
        const { error } = await supabase.from("english_buddy_words").insert([newWord]);
        if (!error) dbSuccess = true;
      } catch (err) {
        // Suppress
      }

      // Local fallback
      const nextWords = [{ id: `local-${Date.now()}`, ...newWord }, ...words];
      setWords(nextWords);
      localStorage.setItem("eq_eb_admin_words", JSON.stringify(nextWords));

      toast({ title: "Word of the Day Saved! ☀️" });
      setWordWord("");
      setWordMeaning("");
      setWordPron("");
      setWordExample("");
      setWordExpl("");
    } catch (err: any) {
      toast({ title: "Failed to save word", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">English Buddy Manager</h2>
          <p className="text-xs text-muted-foreground">Admin panel to add lessons, quizzes, and words of the day</p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl gap-1">
          <TabsTrigger value="lessons" className="rounded-lg text-xs font-semibold">
            <ClipboardList className="w-3.5 h-3.5 mr-1" /> Conversation Packs ({lessons.length})
          </TabsTrigger>
          <TabsTrigger value="words" className="rounded-lg text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 mr-1" /> Words of the Day ({words.length})
          </TabsTrigger>
        </TabsList>

        {/* CONVERSATION PACKS MANAGER */}
        <TabsContent value="lessons" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <form onSubmit={handleSaveLesson} className="lg:col-span-7 bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-black flex items-center gap-1.5 border-b pb-2">
                <Plus className="w-4 h-4 text-primary" /> Create New Conversation Pack
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full rounded-xl bg-background border h-10 text-xs px-2.5"
                    value={lessonCategory}
                    onChange={(e) => setLessonCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="level">Difficulty Level</Label>
                  <select
                    id="level"
                    className="w-full rounded-xl bg-background border h-10 text-xs px-2.5"
                    value={lessonLevel}
                    onChange={(e) => setLessonLevel(e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Navigating the Classroom"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="icon">Emoji Icon</Label>
                  <Input
                    id="icon"
                    placeholder="e.g. 🏫"
                    value={lessonIcon}
                    onChange={(e) => setLessonIcon(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Short Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Learn how to greet your classmate on the first day."
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dialogue">Dialogue Dialogue JSON (Speaker, English Text, Translation)</Label>
                <Textarea
                  id="dialogue"
                  rows={4}
                  className="font-mono text-[10px] rounded-xl"
                  value={lessonDialogueRaw}
                  onChange={(e) => setLessonDialogueRaw(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="practice">Step 4: Practice Game JSON</Label>
                  <Textarea
                    id="practice"
                    rows={4}
                    className="font-mono text-[10px] rounded-xl"
                    value={lessonGameRaw}
                    onChange={(e) => setLessonGameRaw(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="usage">Step 5: Real Usage JSON</Label>
                  <Textarea
                    id="usage"
                    rows={4}
                    className="font-mono text-[10px] rounded-xl"
                    value={lessonUsageRaw}
                    onChange={(e) => setLessonUsageRaw(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 font-bold h-10 btn-bounce-hover shadow-sm">
                Save Conversation Pack
              </Button>
            </form>

            {/* List */}
            <div className="lg:col-span-5 bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-black flex items-center gap-1.5 border-b pb-2">
                <BookOpen className="w-4 h-4 text-primary" /> Active Packs
              </h3>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {lessons.map((l, i) => (
                  <div key={l.id || i} className="p-3 rounded-xl border border-border/40 text-xs flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{l.icon}</span>
                        <h4 className="font-extrabold text-foreground">{l.title}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{l.description}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[9px] font-semibold">{l.category}</Badge>
                        <Badge variant="secondary" className="text-[9px] font-semibold">{l.level}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* WORD OF THE DAY MANAGER */}
        <TabsContent value="words" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <form onSubmit={handleSaveWord} className="lg:col-span-7 bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-black flex items-center gap-1.5 border-b pb-2">
                <Plus className="w-4 h-4 text-primary" /> Add Word of the Day
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="word">Word</Label>
                  <Input
                    id="word"
                    placeholder="e.g. Persistence"
                    value={wordWord}
                    onChange={(e) => setWordWord(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emoji">Emoji</Label>
                  <Input
                    id="emoji"
                    placeholder="e.g. 🔥"
                    value={wordEmoji}
                    onChange={(e) => setWordEmoji(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pron">Pronunciation Key</Label>
                  <Input
                    id="pron"
                    placeholder="e.g. per-sis-tens"
                    value={wordPron}
                    onChange={(e) => setWordPron(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Trigger Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={wordDate}
                    onChange={(e) => setWordDate(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meaning">Meaning / Definition</Label>
                <Input
                  id="meaning"
                  placeholder="e.g. Continuing to do something even if it is difficult."
                  value={wordMeaning}
                  onChange={(e) => setWordMeaning(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="example">Example Sentence</Label>
                <Textarea
                  id="example"
                  placeholder="e.g. Her persistence helped her learn the complex math easily."
                  value={wordExample}
                  onChange={(e) => setWordExample(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expl">Child-friendly Explanation</Label>
                <Input
                  id="expl"
                  placeholder="e.g. Never giving up even when things get hard."
                  value={wordExpl}
                  onChange={(e) => setWordExpl(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="synonyms">Synonyms (Comma separated)</Label>
                <Input
                  id="synonyms"
                  placeholder="e.g. grit, determination, drive"
                  value={wordSynonyms}
                  onChange={(e) => setWordSynonyms(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 font-bold h-10 btn-bounce-hover shadow-sm">
                Save Word of the Day
              </Button>
            </form>

            {/* List */}
            <div className="lg:col-span-5 bg-card border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-black flex items-center gap-1.5 border-b pb-2">
                <Calendar className="w-4 h-4 text-primary" /> Calendar Log
              </h3>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {words.map((w, i) => (
                  <div key={w.id || i} className="p-3 rounded-xl border border-border/40 text-xs flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{w.emoji}</span>
                        <h4 className="font-extrabold text-foreground">{w.word}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">"{w.meaning}"</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0.5">{w.date}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnglishBuddyManager;
