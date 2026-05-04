"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  configureCognito,
  signIn,
  signOut,
  getCurrentUser,
  getIdToken,
  type PatientUser,
} from "@/lib/aws/cognito";

interface AuthContextType {
  patient: PatientUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    configureCognito();
    getCurrentUser().then((user) => {
      setPatient(user);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      const result = await signIn(identifier, password);
      if (result.success) {
        const user = await getCurrentUser();
        setPatient(user);
        const token = await getIdToken();
        if (token) {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        return null;
      }
      return result.error;
    },
    []
  );

  const logout = useCallback(() => {
    fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    signOut().then(() => setPatient(null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        patient,
        isLoading,
        isAuthenticated: !!patient,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
