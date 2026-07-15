import { supabase } from './supabaseClient';

const LOCAL_STORAGE_KEY = 'educore_language';

export const userPreferenceService = {
  /**
   * Fetch language preference for the given user from Database
   * Falls back to localStorage if database call fails or table doesn't exist
   */
  getUserPreference: async (userId: string): Promise<string> => {
    try {
      if (!supabase) {
        return localStorage.getItem(LOCAL_STORAGE_KEY) || 'en';
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('language_preference')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Table might not exist yet, log warning and fall back
        console.warn('[PreferenceService] DB query failed, using localStorage fallback:', error.message);
        return localStorage.getItem(LOCAL_STORAGE_KEY) || 'en';
      }

      if (data && data.language_preference) {
        localStorage.setItem(LOCAL_STORAGE_KEY, data.language_preference);
        return data.language_preference;
      }
    } catch (e) {
      console.warn('[PreferenceService] Error fetching preference:', e);
    }

    return localStorage.getItem(LOCAL_STORAGE_KEY) || 'en';
  },

  /**
   * Save language preference to Database and localStorage
   */
  saveUserPreference: async (userId: string, language: 'en' | 'ta'): Promise<boolean> => {
    // Always backup in localStorage first
    localStorage.setItem(LOCAL_STORAGE_KEY, language);

    try {
      if (!supabase) {
        return true;
      }

      // First check if a preference already exists
      const { data: existing, error: checkError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.warn('[PreferenceService] Could not check preference in DB:', checkError.message);
        return false;
      }

      let dbResult;
      if (existing) {
        dbResult = await supabase
          .from('user_preferences')
          .update({
            language_preference: language,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        dbResult = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            language_preference: language
          });
      }

      if (dbResult.error) {
        console.warn('[PreferenceService] Failed to upsert to DB:', dbResult.error.message);
        return false;
      }

      return true;
    } catch (e) {
      console.warn('[PreferenceService] Error saving preference:', e);
      return false;
    }
  }
};

export default userPreferenceService;
