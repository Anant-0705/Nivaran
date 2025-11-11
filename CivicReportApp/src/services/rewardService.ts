import ApiService from './apiService';
import { Reward } from '../types';

export class RewardService {
  static async getUserRewards(userId: string): Promise<{ rewards: Reward[], error: any }> {
    try {
      const response = await ApiService.get(`/rewards/user/${userId}`);
      return { rewards: response.rewards, error: null };
    } catch (error) {
      return { rewards: [], error };
    }
  }

  static async getUserStats(userId: string) {
    try {
      const response = await ApiService.get(`/rewards/stats/${userId}`);
      return { 
        user: response.user, 
        stats: response.stats, 
        rewards: response.rewards, 
        error: null 
      };
    } catch (error) {
      return { user: null, stats: null, rewards: [], error };
    }
  }
}
