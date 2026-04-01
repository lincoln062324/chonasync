// src/hooks/useAuth.js
// ─────────────────────────────────────────────────────────────────────────────
// Manages the current logged-in user in sessionStorage so the session
// survives a page refresh but clears when the browser tab is closed.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

const SESSION_KEY = "chonasync_user";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Persist to sessionStorage on every change
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async (userId) => {
    try {
      const { logActivity } = await import("../lib/supabase");
      if (userId) await logActivity(userId, "logout", "Logged out");
    } catch { /* ignore */ }
    setUser(null);
  };

  return { user, login, logout };
}