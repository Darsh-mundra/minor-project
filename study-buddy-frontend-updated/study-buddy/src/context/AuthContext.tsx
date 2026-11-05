import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { User } from '../types';
import {
  api,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  completeLogin: (res: { token: string; user: User }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const { addToast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    // 1. Check if tokens were just passed via URL parameters from Google OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const oauthAccessToken = urlParams.get('accessToken');
    const oauthRefreshToken = urlParams.get('refreshToken');

    if (oauthAccessToken) {
      setStoredToken(oauthAccessToken);
      if (oauthRefreshToken) {
        localStorage.setItem('sb_session_refresh', oauthRefreshToken);
      }
      // Clean up the URL parameters so they don't linger in the browser bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedToken = getStoredToken();
    const refreshToken = localStorage.getItem('sb_session_refresh');

    if (!storedToken && !refreshToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();

      setUser(userData);
      setToken(getStoredToken());
    } catch (err: any) {
      console.error('Failed to restore user session:', err);

      if (err?.status === 401 || err?.status === 403) {
        const refreshTokenStillExists =
          localStorage.getItem('sb_session_refresh');

        if (!refreshTokenStillExists) {
          removeStoredToken();
          setToken(null);
          setUser(null);
        } else {
          setToken(getStoredToken());
          setUser(null);
        }
      } else {
        setToken(getStoredToken());
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  const completeLogin = (res: { token: string; user: User }) => {
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);

    addToast({
      type: 'success',
      title: `Welcome, ${res.user.fullName}!`,
      message:
        res.user.role === 'ADMIN'
          ? 'Signed in as administrator.'
          : 'You are signed in to Study Buddy.',
    });
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);

    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been logged out of your session.',
    });
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        completeLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};