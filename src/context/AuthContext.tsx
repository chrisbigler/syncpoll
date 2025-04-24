import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();

        setUser({
          id: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture
        });
        setAccessToken(response.access_token);
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setLoading(false);
    },
    scope: 'openid profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    flow: 'implicit',
    ux_mode: 'redirect'
  });

  const login = async () => {
    if (loading || user) {
      console.log('Login attempt aborted: Already loading or authenticated.');
      return;
    }

    setLoading(true);
    try {
      await googleLogin();
    } catch (error) {
      console.error("Error initiating login:", error);
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      accessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("Missing VITE_GOOGLE_CLIENT_ID environment variable");
    return <div>Error: Google Client ID not configured.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
};