import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let configPromise;
let supabasePromise;

export async function getSupabaseConfig() {
  if (!configPromise) {
    configPromise = fetchClientConfig();
  }

  return configPromise;
}

export async function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = initializeSupabase();
  }

  return supabasePromise;
}

async function initializeSupabase() {
  const config = await getSupabaseConfig();

  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    return null;
  }

  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: "check-je-erfgoed-auth",
    },
  });
}

async function fetchClientConfig() {
  const response = await fetch("/api/client-config", {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "De clientconfig kon niet worden geladen.");
  }

  return payload;
}
