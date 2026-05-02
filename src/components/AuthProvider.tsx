"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DemoPatient } from "@/types";
import {
  login as authLogin,
  logout as authLogout,
  getCurrentPatient,
  getSession,
} from "@/lib/auth";

interface AuthContextType {
  patient: DemoPatient | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<DemoPatient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setPatient(getCurrentPatient());
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      const result = await authLogin(identifier, password);
      if (result.success) {
        setPatient(result.patient);
        return null; // no error
      }
      return result.error;
    },
    []
  );

  const logout = useCallback(() => {
    authLogout();
    setPatient(undefined);
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