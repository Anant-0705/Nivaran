export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  points: number;
  created_at: string;
}

export interface Issue {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'infrastructure' | 'safety' | 'environment' | 'transport' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  location: { latitude: number; longitude: number; address?: string };
  images?: string[];
  audio_url?: string;
  votes: number;
  created_at: string;
  // Helper properties for backward compatibility
  latitude?: number;
  longitude?: number;
  address?: string;
  photo_url?: string;
  upvotes?: number;
}

export interface Vote {
  id: string;
  user_id: string;
  issue_id: string;
  created_at: string;
}

export interface Reward {
  id: string;
  user_id: string;
  points_earned: number;
  reason: string;
  created_at: string;
  // Helper property for backward compatibility
  points?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}
