import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Sun, Moon, Zap, Stars, Sunset, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Light", icon: Sun, color: "text-amber-500" },
    { id: "dark", label: "Dark", icon: Moon, color: "text-cyan-400" },
    { id: "cyberpunk", label: "Cyberpunk", icon: Zap, color: "text-fuchsia-500" },
    { id: "anime-neon", label: "Anime Neon", icon: Monitor, color: "text-purple-400" },
    { id: "space", label: "Space", icon: Stars, color: "text-indigo-400" },
    { id: "sunset", label: "Sunset", icon: Sunset, color: "text-orange-500" },
  ];

  const activeTheme = themes.find(t => t.id === theme) || themes[1];
  const ActiveIcon = activeTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-between h-9 bg-card/80 border border-border/50 rounded-full px-3 py-1 cursor-pointer select-none overflow-hidden transition-all duration-300 hover:border-primary/50 shadow-sm backdrop-blur-sm"
          aria-label="Select Theme"
        >
          <ActiveIcon className={`w-4 h-4 mr-2 ${activeTheme.color}`} />
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground">{activeTheme.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl p-2 min-w-[160px]">
        <div className="text-[9px] font-black uppercase text-muted-foreground mb-2 px-2 tracking-widest">Select Theme</div>
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                theme === t.id ? "bg-primary/20 text-foreground border border-primary/30" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${t.color}`} />
              {t.label}
              {theme === t.id && <span className="ml-auto text-[10px] animate-pulse">⭐</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
