const { supabase, supabaseAdmin } = require('../config/supabase');

class AuthService {
  static async createUser(email, password, fullName) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('🔐 Starting signup process...', { email, fullName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log('🔐 Supabase signup response:', { data, error });

      if (error) throw error;

      console.log('✅ Signup successful!', data.user);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { user: null, error };
    }
  }

  static async signInUser(email, password) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('🔐 Starting signin process...', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Supabase signin response:', { data, error });

      if (error) throw error;
      
      console.log('✅ Signin successful!', data.user);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Signin error:', error);
      return { user: null, error };
    }
  }

  static async getUserProfile(userId) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('👤 Getting user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('👤 User profile query result:', { profile, error });

      if (error) {
        console.error('👤 Error fetching user profile:', error);
        throw error;
      }
      
      console.log('✅ User profile:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  }

  static async verifyToken(token) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return null;
    }
  }
}

module.exports = AuthService;