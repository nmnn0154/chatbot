import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if localhost dev session is active
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      try {
        const savedDev = localStorage.getItem('rmutsv_dev_session');
        if (savedDev) {
          const parsed = JSON.parse(savedDev);
          if (parsed?.user && parsed?.profile) {
            setUser(parsed.user);
            setProfile(parsed.profile);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse dev session:', e);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          setProfile(retryData);
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  function devLogin(targetRole = 'admin') {
    const isAdm = targetRole === 'admin';
    const mockUser = {
      id: isAdm ? 'dev-admin-id' : 'dev-student-id',
      email: isAdm ? 'admin.dev@rmutsv.ac.th' : 'student.dev@rmutsv.ac.th',
      user_metadata: {
        full_name: isAdm ? 'แอดมินทดสอบ (Localhost)' : 'นักศึกษาทดสอบ (Localhost)',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${isAdm ? 'admin' : 'student'}`,
      },
    };
    const mockProfile = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: mockUser.user_metadata.full_name,
      role: targetRole,
      avatar_url: mockUser.user_metadata.avatar_url,
    };

    localStorage.setItem('rmutsv_dev_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  }

  async function signInWithGoogle() {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async function signOut() {
    localStorage.removeItem('rmutsv_dev_session');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
    setUser(null);
    setProfile(null);
  }

  const role = profile?.role || 'user';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        loading,
        signInWithGoogle,
        devLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
