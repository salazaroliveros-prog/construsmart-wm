'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocalUser {
  email: string;
  name: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  getUserAvatar: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('localUser');
    const storedAuth = localStorage.getItem('isAuthenticated');

    if (storedUser && storedAuth === 'true') {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Save credentials to localStorage (for demo purposes - in production, never store passwords in localStorage)
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);

    // Create user object
    const newUser: LocalUser = {
      email,
      name: email.split('@')[0], // Use email prefix as name
    };

    // Save user to localStorage
    localStorage.setItem('localUser', JSON.stringify(newUser));
    localStorage.setItem('isAuthenticated', 'true');

    setUser(newUser);
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem('localUser');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getUserAvatar = () => {
    if (!user) {
      return 'https://ui-avatars.com/api/?name=User&background=0D8BC&color=fff&size=128';
    }

    // Try Gravatar based on email
    const email = user.email;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const hash = btoa(normalizedEmail).replace(/=+$/, '');
      return `https://www.gravatar.com/avatar/${hash}?d=identicon&size=128`;
    }

    // Fallback to generated avatar
    return 'https://ui-avatars.com/api/?name=User&background=0D8BC&color=fff&size=128';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, signIn, signOut, getUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
