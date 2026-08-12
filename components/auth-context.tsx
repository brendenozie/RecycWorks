'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

// Roles aligned with the RecycWorks "Wealth from Waste" model
export type UserRole = "admin" | "operations" | "supplier" | "driver" | "field-officer" | "hub-manager";

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  hubId?: string | null; // Critical for regional operations
  status: "active" | "suspended" | "pending_verification";
  image?: string;
  isAdmin: boolean;
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, role: UserRole) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  const checkAuth = async () => {
    try {
      // 1. Prioritize NextAuth Session (Google/Credentials Handover)
      if (session?.user) {
        setUser({
          _id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role as UserRole,
          hubId: session.user.hubId,
          status: (session.user as any).status || "active",
          image: session.user.image,
          isAdmin: session.user.role === "admin",
          createdAt: session.user.createdAt as any,
        } as User);

        if (session.appToken) {
          localStorage.setItem('token', session.appToken);
        }
        return;
      }

      // 2. Fallback to JWT Token for API-only sessions
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('RecycWorks Auth Check Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  /**
   * Enhanced Login with Role-Based Redirection
   */
  const login = (token: string, role: UserRole) => {
    localStorage.setItem('token', token);
    
    // Logic for role-based landing pages
    let destination = '/dashboard'; 
    
    if (role === 'hub-manager') destination = '/hubdashboard';//hub/management
    if (role === 'driver') destination = '/driverdashboard';//mobile/transit
    if (role === 'admin') destination = '/admindashboard';//admin/stats
    if (role === 'operations') destination = '/operationsdashboard';//ops/verification
    if (role === 'supplier') destination = '/supplierdashboard';//coop/ledger
    // if (role === 'fleet-operator') destination = '/fleetdashboard';//fleet/management
    if (role === 'field-officer') destination = '/fieldOfficerdashboard';//field/verification
    if (role === 'hub-manager') destination = '/hubdashboard';//hub/management

    window.location.href = destination;
  };

  const logout = async () => {
    localStorage.removeItem('token');
    await signOut({ redirect: true, callbackUrl: '/login' });
    setUser(null);
  };

  useEffect(() => {
    if (status !== 'loading') {
      checkAuth();
    }
  }, [session, status]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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