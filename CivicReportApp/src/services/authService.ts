import { supabase } from './supabase';
import { User } from '../types';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

// Complete the auth session for OAuth providers
WebBrowser.maybeCompleteAuthSession();

export class AuthService {
  static async restoreSession() {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('🔄 Attempting to restore session...');
      
      // Only check for URL params in web environment
      if (typeof window !== 'undefined' && window.location) {
        // Check if there's a session in the URL (OAuth callback)
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken) {
          console.log('🔑 Found access token in URL, setting session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          console.log('🔑 Set session result:', { data, error });
          
          if (data.session) {
            // Clear the URL to remove tokens
            window.history.replaceState({}, document.title, window.location.pathname);
            return data.session.user;
          }
        }
      }
      
      // Otherwise try to get existing session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔄 Existing session check:', session?.user);
      
      return session?.user || null;
    } catch (error) {
      console.error('❌ Session restoration error:', error);
      return null;
    }
  }
  static async signUp(email: string, password: string, fullName?: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('🔐 Starting signup process...', { email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('🔐 Supabase signup response:', { data, error });

      if (error) throw error;

      // User profile will be automatically created by database trigger
      console.log('✅ Signup successful!', data.user);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { user: null, error };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('🔐 Starting signin process...', { email });

      // For development, auto-confirm the email
      if (__DEV__) {
        try {
          console.log('🔑 Development mode: Attempting to auto-confirm email...');
          await supabase.auth.signInWithOtp({
            email,
            options: {
              data: { password }
            }
          });
          
          // Try the normal sign in again
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (otpError) {
          console.log('⚠️ OTP signin attempt failed, continuing with normal signin...');
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Supabase signin response:', { data, error });

      if (error) {
        if (error.message === 'Email not confirmed') {
          // Resend confirmation email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
          });

          if (resendError) {
            console.error('❌ Error resending confirmation:', resendError);
          } else {
            console.log('📧 Confirmation email resent');
          }

          return {
            user: null,
            error: new Error('Please check your email for a verification link. A new confirmation email has been sent.')
          };
        }
        throw error;
      }
      
      console.log('✅ Signin successful!', data.user);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Signin error:', error);
      return { user: null, error };
    }
  }

  static async signInWithGoogle() {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('🔐 Starting Google OAuth signin...');

      // Determine redirect URL based on environment
      let redirectUrl: string;
      
      if (typeof window !== 'undefined') {
        // Web environment - use the current origin with auth/callback path
        const currentOrigin = window.location.origin;
        redirectUrl = `${currentOrigin}/auth/callback`;
        console.log('🌐 Web environment detected, using redirect URL:', redirectUrl);
      } else {
        // Mobile environment - use app scheme
        const scheme = Constants.appOwnership === 'expo' ? 'exp' : 'civicreportapp';
        redirectUrl = makeRedirectUri({
          scheme,
          path: 'auth/callback',
          preferLocalhost: true,
        });
        console.log('📱 Mobile environment detected, using redirect URL:', redirectUrl);
      }
      
      console.log('🔐 Final redirect URI:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('🔐 Google OAuth response:', { data, error });

      if (error) throw error;
      
      // Handle web vs mobile OAuth flow
      if (typeof window !== 'undefined' && data?.url) {
        // Web environment - redirect directly
        console.log('🌐 Web OAuth: Redirecting to:', data.url);
        window.location.href = data.url;
        return { user: null, error: null }; // Will be handled by callback
      } else if (data?.url) {
        // Mobile environment - use WebBrowser
        console.log('📱 Mobile OAuth: Opening browser with URL:', data.url);
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
            createTask: true,
            dismissButtonStyle: 'done'
          }
        );
        
        console.log('🔐 Browser result:', result);
        
        if (result.type === 'success') {
          const { url: callbackUrl } = result;
          
          if (callbackUrl) {
            // Extract tokens from URL if present
            const params = new URL(callbackUrl).searchParams;
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
            }
          }
          
          // Wait briefly for session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('✅ Google signin successful!', user);
            return { user, error: null };
          }
        }
        
        throw new Error('OAuth authentication was cancelled or failed');
      }
      
      return { user: null, error: new Error('No OAuth URL received') };
    } catch (error) {
      console.error('❌ Google signin error:', error);
      return { user: null, error };
    }
  }

  static async signOut() {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }
      
      console.log('👤 Getting current user...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('👤 Auth user:', user);
      
      if (!user) {
        console.log('👤 No authenticated user found');
        return null;
      }

      // Try to get the user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('👤 User profile query result:', { profile, error });

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('👤 Creating missing user profile...');
        
        const newProfile = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          points: 0
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('👤 Error creating profile:', createError);
          // Return a minimal user object based on auth data
          return {
            id: user.id,
            email: user.email!,
            name: newProfile.name,
            avatar_url: newProfile.avatar_url,
            points: 0,
            created_at: new Date().toISOString()
          };
        }

        console.log('✅ Created user profile:', createdProfile);
        return createdProfile;
      }

      if (error) {
        console.error('👤 Error fetching user profile:', error);
        // Return a minimal user object based on auth data
        return {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          points: 0,
          created_at: new Date().toISOString()
        };
      }
      
      console.log('✅ Current user profile:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  static onAuthStateChange(callback: (user: any) => void) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}