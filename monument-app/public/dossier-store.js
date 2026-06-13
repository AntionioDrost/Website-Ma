import { getSupabase } from "./supabase-client.js";

export async function hydrateDossier({ dossierType, localKey, emptyState, title }) {
  const localState = readLocalState(localKey);
  const remoteRecord = await loadRemoteDossier(dossierType);

  if (remoteRecord?.state && typeof remoteRecord.state === "object") {
    writeLocalState(localKey, remoteRecord.state);
    return {
      source: "remote",
      state: remoteRecord.state,
    };
  }

  if (localState) {
    await saveRemoteDossier({
      dossierType,
      state: localState,
      title,
    });

    return {
      source: "local-migrated",
      state: localState,
    };
  }

  const fallbackState = emptyState();
  writeLocalState(localKey, fallbackState);

  return {
    source: "empty",
    state: fallbackState,
  };
}

export async function saveRemoteDossier({ dossierType, state, title }) {
  const supabase = await getSupabase();
  const user = await getCurrentUser(supabase);

  const payload = {
    dossier_type: dossierType,
    state,
    title,
    user_id: user.id,
  };

  const { error } = await supabase
    .from("application_dossiers")
    .upsert(payload, {
      onConflict: "user_id,dossier_type",
    });

  if (error) {
    throw error;
  }
}

export async function deleteRemoteDossier(dossierType) {
  const supabase = await getSupabase();
  const user = await getCurrentUser(supabase);

  const { error } = await supabase
    .from("application_dossiers")
    .delete()
    .eq("user_id", user.id)
    .eq("dossier_type", dossierType);

  if (error) {
    throw error;
  }
}

export function readLocalState(localKey) {
  try {
    const raw = localStorage.getItem(localKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeLocalState(localKey, state) {
  localStorage.setItem(localKey, JSON.stringify(state));
}

async function loadRemoteDossier(dossierType) {
  const supabase = await getSupabase();
  const user = await getCurrentUser(supabase);

  const { data, error } = await supabase
    .from("application_dossiers")
    .select("state")
    .eq("user_id", user.id)
    .eq("dossier_type", dossierType)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getCurrentUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Je sessie is verlopen. Log opnieuw in om verder te gaan.");
  }

  return user;
}
