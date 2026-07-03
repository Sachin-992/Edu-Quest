import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageStore } from "@/store/useLanguageStore";

export interface MultilingualStory {
    id: string; // from stories.id
    slug: string;
    subject: string;
    emoji: string;
    classRange: [number, number];
    xpReward: number;
    title: string;

    // JSONB parsed structures
    pages: {
        text: string;
        character: string;
        keywords: { word: string; meaning: string }[];
        thinkMoment?: {
            question: string;
            options: { label: string; isCorrect: boolean; feedback: string }[];
        } | null;
    }[];

    questions: {
        question: string;
        options: string[];
        answer: string;
    }[];
}

export function useMultilingualStories() {
    const { language } = useLanguageStore();

    return useQuery({
        queryKey: ["multilingual_stories", language],
        queryFn: async (): Promise<MultilingualStory[]> => {
            // Fetch the core story data joined with the translation for the current language
            const { data, error } = await supabase
                .from("stories")
                .select(`
          id,
          slug,
          subject,
          emoji,
          min_class,
          max_class,
          xp_reward,
          story_translations!inner (
            language_code,
            title,
            pages,
            questions
          )
        `)
                .eq("story_translations.language_code", language)
                .order("created_at", { ascending: true }); // Standard ordering

            if (error) {
                console.error("Error fetching multilingual stories:", error);
                throw error;
            }

            // Map Supabase layout into our flattened MultilingualStory interface
            return (data || []).map((row: any) => {
                const tr = row.story_translations[0]; // because of inner join and eq filter, there's exactly 1
                return {
                    id: row.id,
                    slug: row.slug,
                    subject: row.subject,
                    emoji: row.emoji,
                    classRange: [row.min_class, row.max_class] as [number, number],
                    xpReward: row.xp_reward,
                    title: tr.title,
                    pages: tr.pages,
                    questions: tr.questions,
                };
            });
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}
