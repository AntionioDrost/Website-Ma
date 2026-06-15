import { getSupabase } from "./supabase-client.js";

export async function requireAuthPage() {
  const config = await getClientConfigSafe();
  if (!config.authRequired) {
    return {
      profile: {
        display_name: "Gast",
        email: "",
      },
      session: null,
      supabase: null,
      user: null,
    };
  }

  const supabase = await getSupabase();
  const session = await getSessionOrRedirect(supabase);
  const profile = await ensureProfile(supabase, session.user);

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession) {
      redirectToLogin();
    }
  });

  return {
    profile,
    session,
    supabase,
    user: session.user,
  };
}

export function attachLogoutButton(button, fallbackLabel) {
  if (!button) {
    return;
  }

  button.addEventListener("click", async () => {
    button.disabled = true;

    try {
      const supabase = await getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      clearLocalWorkspaceCache();
      redirectToLogin();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Uitloggen lukte niet. Probeer het opnieuw.";
      button.disabled = false;
      if (fallbackLabel) {
        fallbackLabel.textContent = message;
      }
    }
  });
}

export function redirectToLogin() {
  const currentPath = window.location.pathname;
  const next = currentPath && currentPath !== "/login" ? `?next=${encodeURIComponent(currentPath)}` : "";
  window.location.replace(`/login${next}`);
}

function clearLocalWorkspaceCache() {
  localStorage.removeItem("glasisolatie-demo-state-v2");
  localStorage.removeItem("monument-app-state-v2");
}

export function getPostLoginPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") ? next : "/thuis";
}

async function getSessionOrRedirect(supabase) {
  if (!supabase) {
    throw new Error("Supabase is niet beschikbaar.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirectToLogin();
    throw new Error("Geen actieve sessie gevonden.");
  }

  return session;
}

async function ensureProfile(supabase, user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const fallbackProfile = {
    display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Gebruiker",
    email: user.email || "",
    id: user.id,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .upsert(fallbackProfile)
    .select("id, email, display_name")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

async function getClientConfigSafe() {
  try {
    const response = await fetch("/api/client-config", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return { authRequired: false };
    }

    const payload = await response.json();
    return {
      authRequired: Boolean(payload.authRequired),
    };
  } catch {
    return { authRequired: false };
  }
}
