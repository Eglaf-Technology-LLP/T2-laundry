import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/api/client";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    try {
      setProfile(await api.auth.getProfile());
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setIsAuthenticated(!!data.session);
      if (data.session) await loadProfile();
      setIsLoadingAuth(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session) await loadProfile();
      else setProfile(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    await api.auth.login(email, password);
    setIsAuthenticated(true);
    await loadProfile();
  };

  // Returns true if the caller is now logged in. If the Supabase project has
  // "Confirm email" turned on, signUp() succeeds but returns no session until
  // the user clicks the confirmation link — that's not an error, just a
  // different next step for the UI to show.
  const signup = async (email, password, fullName) => {
    const data = await api.auth.signup(email, password, fullName);
    const hasSession = !!data.session;
    if (hasSession) {
      setIsAuthenticated(true);
      await loadProfile();
    }
    return hasSession;
  };

  const logout = async () => {
    await api.auth.logout();
    setIsAuthenticated(false);
    setProfile(null);
  };

  const role = profile?.role || null;

  return (
    <AuthContext.Provider value={{ isLoadingAuth, isAuthenticated, role, profile, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
