import { createClient } from "@supabase/supabase-js";

type EnvRecord = Record<string, string | undefined>;

const ensureEnv = <T extends string>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message);
  }
  return value;
};

const resolveEnvVar = (
  key: keyof EnvRecord,
  fallback?: string,
): string | undefined => {
  const viteEnv =
    typeof import.meta !== "undefined"
      ? ((import.meta as unknown as { env?: EnvRecord }).env ?? {})
      : {};

  const globalEnv =
    typeof globalThis !== "undefined"
      ? ((globalThis as EnvRecord) ?? {})
      : {};

  const nodeEnv =
    typeof process !== "undefined" && process?.env
      ? (process.env as EnvRecord)
      : {};

  return viteEnv[key] ?? globalEnv[key] ?? nodeEnv[key] ?? fallback;
};

export const SUPABASE_URL = ensureEnv(
  resolveEnvVar(
    "VITE_SUPABASE_URL",
    "https://rmxunxuxlmmhghiqtgnr.supabase.co",
  ),
  "Please set the VITE_SUPABASE_URL environment variable",
);

export const SUPABASE_ANON_KEY = ensureEnv(
  resolveEnvVar(
    "VITE_SUPABASE_ANON_KEY",
    "sb_publishable_HPYpMGh7AxD4YzMu4HRQFw_yV_Z_98N",
  ),
  "Please set the VITE_SUPABASE_ANON_KEY environment variable",
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
