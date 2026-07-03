import { useState } from "react";
import { Coins, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_COSMETICS } from "@/data/cosmetics";

export default function AdminCosmetics() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? ALL_COSMETICS : ALL_COSMETICS.filter(c => c.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Cosmetic Engine (Admin)</h2>
          <p className="text-muted-foreground">Manage the Avatar Shop, adjust rarity drops, and trigger events.</p>
        </div>
        <Button className="bg-primary text-white"><Plus className="w-4 h-4 mr-2"/> New Cosmetic</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-2xl border shadow-sm flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Total Cosmetics</p><p className="text-2xl font-black">{ALL_COSMETICS.length}</p></div>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">🛍️</div>
        </div>
        <div className="p-4 bg-card rounded-2xl border shadow-sm flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Loot Box Drop Rate</p><p className="text-2xl font-black">Dynamic</p></div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">📦</div>
        </div>
        <div className="p-4 bg-card rounded-2xl border shadow-sm flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Active Events</p><p className="text-2xl font-black text-amber-500">1</p></div>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">🌟</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none">
            <option value="all">All Categories</option>
            <option value="outfit">Outfits</option>
            <option value="pet">Pets</option>
            <option value="background">Backgrounds</option>
            <option value="aura">Auras</option>
          </select>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Rarity</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <span className="font-bold">{c.name}</span>
                  </td>
                  <td className="px-6 py-4 capitalize">{c.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${c.rarity === 'mythic' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100'}`}>
                      {c.rarity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-amber-500 font-bold flex items-center gap-1">
                    <Coins className="w-4 h-4"/> {c.price}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Settings2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
