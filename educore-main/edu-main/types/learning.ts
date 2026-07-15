// Local types for learning portal (until auto-generated types update)
export interface Subject {
  id: string;
  name: string;
  name_tamil: string | null;
  description: string | null;
  icon: string;
  color: string;
  class_level: number;
  school_id: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Lesson {
  id: string;
  subject_id: string;
  title: string;
  title_tamil: string | null;
  content: string | null;
  content_tamil: string | null;
  lesson_order: number;
  lesson_type: "reading" | "video" | "interactive" | "game";
  xp_reward: number;
  is_active: boolean;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  title_tamil: string | null;
  quiz_type: "mcq" | "true_false" | "fill_blank" | "match";
  xp_reward: number;
  passing_score: number;
  is_active: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_text_tamil: string | null;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: string[];
  options_tamil?: string[] | null;
  correct_answer: string;
  explanation: string | null;
  explanation_tamil: string | null;
  question_order: number;
  points: number;
}

export interface StudentProgress {
  id: string;
  user_id: string;
  lesson_id: string | null;
  quiz_id: string | null;
  status: "not_started" | "in_progress" | "completed";
  score: number | null;
  xp_earned: number;
  completed_at: string | null;
}
