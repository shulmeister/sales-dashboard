import type { AuthProvider } from "ra-core";

export const getIsInitialized = async () => true;

// Supabase removed: provide no-op auth.
export const authProvider: AuthProvider = {
  login: async () => undefined,
  logout: async () => undefined,
  checkAuth: async () => undefined,
  checkError: async () => undefined,
  getPermissions: async () => undefined,
  canAccess: async () => true,
  getIdentity: async () => undefined,
};
