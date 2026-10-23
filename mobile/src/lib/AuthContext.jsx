import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

// The mobile app is customer-only — admins use the web dashboard. login()
// rejects an admin account with this code so the login screen can say why.
export const ADMIN_NOT_ALLOWED = 'ADMIN_NOT_ALLOWED';

function signOutQuietly() {
  // Deferred: signing out from inside onAuthStateChange's own callback can
  // deadlock supabase-js's auth lock.
  setTimeout(() => api.auth.logout().catch(() => {}), 0);
}

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

  // Restored or newly-signed-in sessions only count if they belong to a
  // customer; an admin session is signed out instead of opening the app.
  const applySession = async (session) => {
    if (!session) {
      setIsAuthenticated(false);
      setProfile(null);
      return;
    }
    let p = null;
    try {
      p = await api.auth.getProfile();
    } catch {
      p = null;
    }
    if (p?.role === 'admin') {
      signOutQuietly();
      return;
    }
    setProfile(p);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      setIsLoadingAuth(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    await api.auth.login(email, password);
    const p = await api.auth.getProfile();
    if (p?.role === 'admin') {
      await api.auth.logout().catch(() => {});
      const err = new Error("Admin accounts can't sign in on the mobile app. Please use the web dashboard.");
      err.code = ADMIN_NOT_ALLOWED;
      throw err;
    }
    setProfile(p);
    setIsAuthenticated(true);
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
    <AuthContext.Provider value={{ isLoadingAuth, isAuthenticated, role, profile, login, signup, logout, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
