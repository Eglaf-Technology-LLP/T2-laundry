import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/api/client";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
      setIsLoadingAuth(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    await api.auth.login(email, password);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await api.auth.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isLoadingAuth, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
