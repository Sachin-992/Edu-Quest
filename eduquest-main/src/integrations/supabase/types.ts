export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adventure_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_boss_level: boolean
          is_completed: boolean
          is_unlocked: boolean
          level_number: number
          score: number | null
          stars_earned: number
          updated_at: string
          user_id: string
          world_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_boss_level?: boolean
          is_completed?: boolean
          is_unlocked?: boolean
          level_number?: number
          score?: number | null
          stars_earned?: number
          updated_at?: string
          user_id: string
          world_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_boss_level?: boolean
          is_completed?: boolean
          is_unlocked?: boolean
          level_number?: number
          score?: number | null
          stars_earned?: number
          updated_at?: string
          user_id?: string
          world_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          school_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          id: string
          school_id: string
          user_id: string
          function_name: string
          tokens_used: number
          cost_usd: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          user_id: string
          function_name: string
          tokens_used?: number
          cost_usd?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          user_id?: string
          function_name?: string
          tokens_used?: number
          cost_usd?: number
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_items: {
        Row: {
          category: string
          cost: number
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category?: string
          cost?: number
          created_at?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_settings: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          mode: string
          reward_most_improved: boolean
          school_id: string | null
          show_most_improved: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          mode?: string
          reward_most_improved?: boolean
          school_id?: string | null
          show_most_improved?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          mode?: string
          reward_most_improved?: boolean
          school_id?: string | null
          show_most_improved?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          content_tamil: string | null
          created_at: string
          id: string
          is_active: boolean
          lesson_order: number
          lesson_type: string
          subject_id: string
          title: string
          title_tamil: string | null
          updated_at: string
          xp_reward: number
        }
        Insert: {
          content?: string | null
          content_tamil?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lesson_order?: number
          lesson_type?: string
          subject_id: string
          title: string
          title_tamil?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          content?: string | null
          content_tamil?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lesson_order?: number
          lesson_type?: string
          subject_id?: string
          title?: string
          title_tamil?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_level: number | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          roll_number: string | null
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          class_level?: number | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          roll_number?: string | null
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          class_level?: number | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          roll_number?: string | null
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          explanation_tamil: string | null
          id: string
          options: Json
          points: number
          question_order: number
          question_text: string
          question_text_tamil: string | null
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          explanation_tamil?: string | null
          id?: string
          options?: Json
          points?: number
          question_order?: number
          question_text: string
          question_text_tamil?: string | null
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          explanation_tamil?: string | null
          id?: string
          options?: Json
          points?: number
          question_order?: number
          question_text?: string
          question_text_tamil?: string | null
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lesson_id: string
          passing_score: number
          quiz_type: string
          title: string
          title_tamil: string | null
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lesson_id: string
          passing_score?: number
          quiz_type?: string
          title: string
          title_tamil?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lesson_id?: string
          passing_score?: number
          quiz_type?: string
          title?: string
          title_tamil?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
          plan_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          billing_email: string | null
          logo_url: string | null
          settings: Json | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          plan_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          billing_email?: string | null
          logo_url?: string | null
          settings?: Json | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          plan_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          billing_email?: string | null
          logo_url?: string | null
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          max_students: number
          max_admins: number
          ai_quiz_quota_monthly: number
          price_inr_monthly: number
          features: Json | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          max_students: number
          max_admins?: number
          ai_quiz_quota_monthly: number
          price_inr_monthly?: number
          features?: Json | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          max_students?: number
          max_admins?: number
          ai_quiz_quota_monthly?: number
          price_inr_monthly?: number
          features?: Json | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      student_avatar_items: {
        Row: {
          id: string
          is_equipped: boolean
          item_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          item_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          item_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_avatar_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "avatar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string | null
          quiz_id: string | null
          score: number | null
          status: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          quiz_id?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          quiz_id?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_level: number
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_tamil: string | null
          school_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          class_level: number
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_tamil?: string | null
          school_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          class_level?: number
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_tamil?: string | null
          school_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_user_school_id: {
        Args: { _user_id: string }
        Returns: string | null
      }
      is_platform_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      get_school_ai_usage: {
        Args: { _school_id: string }
        Returns: number
      }
      get_school_ai_quota: {
        Args: { _school_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "student" | "admin" | "super_admin" | "school_admin" | "platform_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "admin", "super_admin", "school_admin", "platform_admin"],
    },
  },
} as const
