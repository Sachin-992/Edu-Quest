import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageStore } from "@/store/useLanguageStore";

export interface MultilingualQuestion {
    id: string;
    subject: string;
    grade_level: number;
    correct_option_key: "option_a" | "option_b" | "option_c" | "option_d";
    language_code: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d?: string;
    explanation?: string;
}

export const useMultilingualQuestions = (subject: string, gradeLevel: number) => {
    const { language } = useLanguageStore();

    return useQuery({
        queryKey: ["questions", subject, gradeLevel, language],
        queryFn: async (): Promise<MultilingualQuestion[]> => {
            const { data, error } = await supabase
                .from("questions")
                .select(`
          id,
          subject,
          grade_level,
          correct_option_key,
          question_translations!inner (
            language_code,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            explanation
          )
        `)
                .eq("subject", subject)
                // Filter questions by grade range: student's class level ±1 for smooth difficulty curve
                .gte("grade_level", Math.max(1, gradeLevel - 1))
                .lte("grade_level", Math.min(8, gradeLevel + 1))
                .eq("question_translations.language_code", language);

            if (error) {
                console.error("Error fetching multilingual questions:", error);
                throw error;
            }

            // Flatten the Supabase joined response for the frontend
            return data.map((q: any) => ({
                id: q.id,
                subject: q.subject,
                grade_level: q.grade_level,
                correct_option_key: q.correct_option_key,
                ...q.question_translations[0], // Extract the specific language translation
            }));
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
};
