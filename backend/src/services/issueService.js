const { supabase } = require('../config/supabase');

class IssueService {
  static async createIssue(issueData) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...issueData,
          upvotes: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Award points to user for reporting
      await this.awardPointsToUser(issueData.user_id, 10, 'Issue reported');

      return { issue: data, error: null };
    } catch (error) {
      return { issue: null, error };
    }
  }

  static async getIssues(location, radius = 5000) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      let query = supabase
        .from('issues')
        .select(`
          *,
          users:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // If location is provided, filter by proximity
      if (location) {
        const { latitude, longitude } = location;
        const latMin = latitude - (radius / 111320);
        const latMax = latitude + (radius / 111320);
        const lonMin = longitude - (radius / (111320 * Math.cos(latitude * Math.PI / 180)));
        const lonMax = longitude + (radius / (111320 * Math.cos(latitude * Math.PI / 180)));

        query = query
          .gte('latitude', latMin)
          .lte('latitude', latMax)
          .gte('longitude', lonMin)
          .lte('longitude', lonMax);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { issues: data, error: null };
    } catch (error) {
      return { issues: [], error };
    }
  }

  static async upvoteIssue(issueId, userId) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('issue_id', issueId)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        return { error: 'Already voted' };
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          issue_id: issueId,
          user_id: userId,
        });

      if (voteError) throw voteError;

      // Increment upvotes count
      const { data: issue } = await supabase
        .from('issues')
        .select('upvotes')
        .eq('id', issueId)
        .single();

      const { error: updateError } = await supabase
        .from('issues')
        .update({ upvotes: (issue?.upvotes || 0) + 1 })
        .eq('id', issueId);

      if (updateError) throw updateError;

      // Award points to user for voting
      await this.awardPointsToUser(userId, 5, 'Issue upvoted');

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  static async updateIssueStatus(issueId, status) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('issues')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', issueId)
        .select()
        .single();

      if (error) throw error;
      return { issue: data, error: null };
    } catch (error) {
      return { issue: null, error };
    }
  }

  static async awardPointsToUser(userId, points, reason) {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Add to rewards table
      await supabase.from('rewards').insert({
        user_id: userId,
        points,
        reason,
      });

      // Update user points
      const { data: user } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      await supabase
        .from('users')
        .update({ points: (user?.points || 0) + points })
        .eq('id', userId);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }
}

module.exports = IssueService;
