const { supabase } = require('../config/supabase');

class RewardService {
  static async getUserRewards(userId) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { rewards: data, error: null };
    } catch (error) {
      return { rewards: [], error };
    }
  }

  static async getUserStats(userId) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId);

      if (rewardsError) throw rewardsError;

      // Calculate stats
      const issuesReported = rewards.filter(r => r.reason.includes('reported')).length;
      const issuesUpvoted = rewards.filter(r => r.reason.includes('upvoted')).length;
      const daysActive = Math.ceil((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

      return {
        user,
        stats: {
          issuesReported,
          issuesUpvoted,
          daysActive,
          totalPoints: user.points,
        },
        rewards,
        error: null
      };
    } catch (error) {
      return { user: null, stats: null, rewards: [], error };
    }
  }
}

module.exports = RewardService;
