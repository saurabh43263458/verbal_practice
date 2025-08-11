import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileError: string | null;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
  uploadAvatar: (file: File) => Promise<{ error: any; url?: string }>;
  retryProfileFetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 3000)
          )
        ]) as any;

        if (!mounted) return;

        if (error) {
          console.error('Auth session error:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id, abortController);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Cancel any ongoing profile fetch
        abortController.abort();
        abortController = new AbortController();
        
        setSession(session);
        setUser(session?.user ?? null);
        setProfileError(null);
        
        if (session?.user) {
          await fetchProfile(session.user.id, abortController);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      abortController.abort();
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, abortController?: AbortController) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setProfileError(null);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(abortController?.signal);

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      // Check if request was aborted
      if (abortController?.signal.aborted) {
        return;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - this is normal for new users
          console.log('Profile not found, user may need to complete setup');
          setProfileError('Profile not found. Please complete your profile setup.');
        } else {
          console.error('Error fetching profile:', error);
          setProfileError(`Failed to load profile: ${error.message}`);
        }
        setProfile(null);
      } else {
        setProfile(data);
        setProfileError(null);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't set error
        return;
      }
      
      console.error('Profile fetch failed:', error);
      setProfileError(error.message || 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const retryProfileFetch = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setProfileError(null);
    const abortController = new AbortController();
    await fetchProfile(user.id, abortController);
  };
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            first_name: userData.firstName,
            last_name: userData.lastName,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      if (data.user) {
        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            username: userData.username,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: userData.phoneNumber,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        toast.success('Account created! Please check your email to verify your account.');
      }

      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      toast.success('Welcome back!');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed out successfully');
        localStorage.removeItem('rememberMe');
      }
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return { error };
      }

      // Refresh profile data
      await retryProfileFetch();
      toast.success('Profile updated successfully!');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Password updated successfully!');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        toast.error('Error deleting profile');
        return { error: profileError };
      }

      // Note: Supabase doesn't allow deleting users from client-side
      // This would need to be handled by an admin function or RLS policy
      toast.success('Account deletion initiated. Please contact support if needed.');
      await signOut();
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error(uploadError.message);
        return { error: uploadError };
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: data.publicUrl });

      return { error: null, url: data.publicUrl };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    profileError,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    deleteAccount,
    uploadAvatar,
    retryProfileFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};