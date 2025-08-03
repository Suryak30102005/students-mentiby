// Centralized API service layer for all Supabase operations
import { supabase } from '@/integrations/supabase/client';
import type { Sheet, Question, UserProgress, Profile, QuestionFormData, SheetFormData } from '@/types';

// ============= AUTHENTICATION SERVICES =============
export const authService = {
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, name: string) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    return await supabase.auth.getUser();
  }
};

// ============= PROFILE SERVICES =============
export const profileService = {
  async getUserProfile(userId: string) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);
  }
};

// ============= SHEET SERVICES =============
export const sheetService = {
  async getAllSheets() {
    return await supabase
      .from('sheets')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async getSheet(id: string) {
    return await supabase
      .from('sheets')
      .select('*')
      .eq('id', id)
      .single();
  },

  async createSheet(sheetData: SheetFormData) {
    const topics = sheetData.topics.split(',').map(t => t.trim()).filter(Boolean);
    
    return await supabase
      .from('sheets')
      .insert([{
        title: sheetData.title,
        description: sheetData.description,
        topics
      }])
      .select()
      .single();
  },

  async updateSheet(id: string, sheetData: SheetFormData) {
    const topics = sheetData.topics.split(',').map(t => t.trim()).filter(Boolean);
    
    return await supabase
      .from('sheets')
      .update({
        title: sheetData.title,
        description: sheetData.description,
        topics
      })
      .eq('id', id);
  },

  async deleteSheet(id: string) {
    return await supabase
      .from('sheets')
      .delete()
      .eq('id', id);
  }
};

// ============= QUESTION SERVICES =============
export const questionService = {
  async getAllQuestions() {
    return await supabase
      .from('questions')
      .select('*')
      .order('order_index');
  },

  async getQuestionsBySheet(sheetId: string) {
    return await supabase
      .from('questions')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('order_index');
  },

  async getQuestion(id: string) {
    return await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
  },

  async createQuestion(questionData: QuestionFormData) {
    const tags = questionData.tags.split(',').map(t => t.trim()).filter(Boolean);
    
    return await supabase
      .from('questions')
      .insert([{
        sheet_id: questionData.sheet_id,
        title: questionData.title,
        topic: questionData.topic,
        tags,
        difficulty: questionData.difficulty,
        solve_url: questionData.solve_url || null,
        order_index: questionData.order_index
      }])
      .select()
      .single();
  },

  async updateQuestion(id: string, questionData: QuestionFormData) {
    const tags = questionData.tags.split(',').map(t => t.trim()).filter(Boolean);
    
    return await supabase
      .from('questions')
      .update({
        sheet_id: questionData.sheet_id,
        title: questionData.title,
        topic: questionData.topic,
        tags,
        difficulty: questionData.difficulty,
        solve_url: questionData.solve_url || null,
        order_index: questionData.order_index
      })
      .eq('id', id);
  },

  async deleteQuestion(id: string) {
    return await supabase
      .from('questions')
      .delete()
      .eq('id', id);
  }
};

// ============= USER PROGRESS SERVICES =============
export const progressService = {
  async getUserProgress(userId: string) {
    return await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
  },

  async getQuestionProgress(userId: string, questionId: string) {
    return await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();
  },

  async getRevisionQuestions(userId: string) {
    return await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('marked_for_revision', true);
  },

  async updateProgress(userId: string, questionId: string, updates: Partial<UserProgress>) {
    // First check if progress exists
    const { data: existing } = await this.getQuestionProgress(userId, questionId);
    
    if (existing) {
      // Update existing progress
      return await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .select()
        .single();
    } else {
      // Create new progress record
      return await supabase
        .from('user_progress')
        .insert([{
          user_id: userId,
          question_id: questionId,
          ...updates
        }])
        .select()
        .single();
    }
  },

  async markCompleted(userId: string, questionId: string, timeSpent?: number) {
    return await this.updateProgress(userId, questionId, {
      completed: true,
      completed_at: new Date().toISOString(),
      time_spent: timeSpent
    });
  },

  async markForRevision(userId: string, questionId: string, marked: boolean) {
    return await this.updateProgress(userId, questionId, {
      marked_for_revision: marked
    });
  },

  async updateNote(userId: string, questionId: string, note: string) {
    return await this.updateProgress(userId, questionId, {
      note
    });
  },

  async updateTimeSpent(userId: string, questionId: string, timeSpent: number) {
    return await this.updateProgress(userId, questionId, {
      time_spent: timeSpent
    });
  }
};

// ============= REAL-TIME SUBSCRIPTION SERVICES =============
export const realtimeService = {
  subscribeToQuestions(callback: (payload: any) => void) {
    return supabase
      .channel('questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions'
        },
        callback
      )
      .subscribe();
  },

  subscribeToSheets(callback: (payload: any) => void) {
    return supabase
      .channel('sheets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sheets'
        },
        callback
      )
      .subscribe();
  },

  subscribeToUserProgress(callback: (payload: any) => void) {
    return supabase
      .channel('user-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress'
        },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  }
};