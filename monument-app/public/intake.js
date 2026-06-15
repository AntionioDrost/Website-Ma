import { attachLogoutButton, requireAuthPage } from "./auth.js";
import { deleteRemoteDossier, hydrateDossier, saveRemoteDossier } from "./dossier-store.js";

const measureCatalog = [
  "Glasvervanging",
  "Dakisolatie",
  "Vloerisolatie",
  "Gevelisolatie",
  "Warmtepomp",
  "Zonnepanelen",
  "Ventilatie",
  "Dakkapel",
];

const storageKey = "monument-app-state-v2";
const legacyFallbackIntro = "Ik ga door in lokale intake-modus zodat we het dossier wel kunnen opbouwen. ";
const defaultChatMode = "guided-free";
const chatModeMeta = {
  "guided-free": {
    buttonId: "mode-guided-free",
    label: "Vrije intake",
    note: "Vrij gesprek actief<br />ik denk mee vanuit jouw situatie",
    openingMessage:
      "Welkom. Vertel gewoon in je eigen woorden wat je wilt doen met het pand of waar je over twijfelt. Ik denk met je mee en haal onderweg alleen de info op die echt nodig blijkt.",
  },
  strict: {
    buttonId: "mode-strict",
    label: "Strakke intake",
    note: "Strakke intake actief<br />1 vraag per beurt, dossiergericht",
    openingMessage:
      "Welkom. Ik help je dit monumentdossier stap voor stap opbouwen. Om te beginnen: wat is het adres van het pand? Als je dat niet weet, stuur dan postcode + huisnummer.",
  },
};

const emptyProfile = {
  street: "",
  houseNumber: "",
  postcode: "",
  city: "",
  municipality: "",
  buildingAge: "",
  buildingType: "",
  currentUse: "",
  ownershipRole: "",
  monumentStatus: "",
  protectedView: "",
  protectedValues: "",
  measureDescription: "",
  measureLocation: "",
  measureGoal: "",
  supportFocus: "",
  documentsAvailable: "",
  notes: "",
};

const emptyGuidance = {
  actionChecklist: [],
  documentChecklist: [],
  missingItems: [],
  nextStep: "",
  permitRisk: "",
  stage: "Basischeck",
};

const progressFields = [
  { id: "street", done: (profile) => Boolean(profile.street) },
  { id: "houseNumber", done: (profile) => Boolean(profile.houseNumber) },
  { id: "postcode", done: (profile) => Boolean(profile.postcode) },
  { id: "municipality", done: (profile) => Boolean(profile.city || profile.municipality) },
  { id: "buildingType", done: (profile) => Boolean(profile.buildingType) },
  { id: "monumentStatus", done: (profile) => Boolean(profile.monumentStatus) },
  { id: "protectedValues", done: (profile) => Boolean(profile.protectedValues) },
  { id: "currentUse", done: (profile) => Boolean(profile.currentUse) },
  { id: "measureDescription", done: (profile) => Boolean(profile.measureDescription) },
];

const displayFields = [
  "street",
  "houseNumber",
  "postcode",
  "city",
  "municipality",
  "buildingAge",
  "monumentStatus",
  "protectedView",
  "protectedValues",
  "currentUse",
  "buildingType",
  "ownershipRole",
  "measureDescription",
  "measureLocation",
  "measureGoal",
  "documentsAvailable",
];

const state = loadState();
let authContext = null;
let saveTimer = 0;

const elements = {
  actionList: document.querySelector("#action-list"),
  apiStatus: document.querySelector("#api-status"),
  authDisplayName: document.querySelector("#auth-display-name"),
  authEmail: document.querySelector("#auth-email"),
  chatForm: document.querySelector("#chat-form"),
  chatHeadNote: document.querySelector("#chat-head-note"),
  chatInput: document.querySelector("#chat-input"),
  documentList: document.querySelector("#document-list"),
  dossierSummary: document.querySelector("#dossier-summary"),
  measurePills: document.querySelector("#measure-pills"),
  messageList: document.querySelector("#message-list"),
  modeButtons: [...document.querySelectorAll("[data-chat-mode]")],
  missingItems: document.querySelector("#missing-items"),
  nextStep: document.querySelector("#next-step"),
  progressBar: document.querySelector("#progress-bar"),
  progressCount: document.querySelector("#progress-count"),
  resetButton: document.querySelector("#reset-dossier"),
  riskSignal: document.querySelector("#risk-signal"),
  logoutButton: document.querySelector("#logout-button"),
  stageLabel: document.querySelector("#stage-label"),
};

renderMeasures();
renderChatMode();
renderMessages();
renderDashboard();
elements.apiStatus.textContent = "Sessie controleren...";
initializeApp();

elements.chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = elements.chatInput.value.trim();
  if (!value) return;
  elements.chatInput.value = "";
  await sendUserMessage(value);
});

elements.resetButton.addEventListener("click", async () => {
  localStorage.removeItem(storageKey);

  try {
    await deleteRemoteDossier("intake");
  } catch (error) {
    elements.apiStatus.textContent =
      error instanceof Error ? error.message : "Resetten in Supabase lukte niet.";
  }

  window.location.reload();
});

for (const button of elements.modeButtons) {
  button.addEventListener("click", () => {
    const nextMode = normalizeChatMode(button.dataset.chatMode);
    if (nextMode === state.chatMode) {
      return;
    }

    switchChatMode(nextMode);
  });
}

async function sendUserMessage(text) {
  state.messages.push({ role: "user", text });
  persistState();
  renderMessages();

  const typingId = crypto.randomUUID();
  state.messages.push({ role: "assistant", text: "", typing: true, typingId });
  renderMessages();

  toggleComposer(true);

  try {
    const session = authContext
      ? (await authContext.supabase.auth.getSession()).data.session
      : null;
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: state.messages.filter((message) => !message.typing).map(({ role, text: bodyText }) => ({
          role,
          text: bodyText,
        })),
        chatMode: state.chatMode,
        profile: state.profile,
        selectedMeasures: state.selectedMeasures,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "De chat kon geen antwoord ophalen.");
    }

    state.guidance = sanitizeGuidance(payload.guidance);
    state.chatMode = normalizeChatMode(payload.chatMode || state.chatMode);
    state.profile = sanitizeProfile(payload.profile);
    state.selectedMeasures = normalizeMeasures(payload.selectedMeasures);
    state.summary = payload.summary || state.summary;
    replaceTypingMessage(typingId, payload.reply, payload.quickReplies);

    if (payload.mode === "fallback") {
      elements.apiStatus.textContent = "Lokale intake + adresscan actief";
    } else {
      elements.apiStatus.textContent = "Live chat + adresscan actief";
    }

    persistState();
    renderChatMode();
    renderDashboard();
    renderMeasures();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Er ging iets mis tijdens het ophalen van het antwoord.";
    replaceTypingMessage(typingId, `Er ging iets mis: ${message}`);
  } finally {
    toggleComposer(false);
    renderMessages();
  }
}

function renderChatMode() {
  const activeMode = getChatModeMeta(state.chatMode);
  if (elements.chatHeadNote) {
    elements.chatHeadNote.innerHTML = activeMode.note;
  }

  for (const button of elements.modeButtons) {
    button.classList.toggle("is-active", normalizeChatMode(button.dataset.chatMode) === state.chatMode);
  }
}

function renderMessages() {
  elements.messageList.innerHTML = "";

  for (const [index, message] of state.messages.entries()) {
    const item = document.createElement("article");
    item.className = `message ${message.role}`;

    const badge = document.createElement("div");
    badge.className = "message-badge";
    badge.innerHTML =
      message.role === "assistant"
        ? '<span class="material-symbols-outlined">support_agent</span>'
        : '<span class="material-symbols-outlined">person</span>';

    const card = document.createElement("div");
    card.className = "message-card";

    if (message.typing) {
      const typing = document.createElement("div");
      typing.className = "typing-card";
      typing.innerHTML = "<span></span><span></span><span></span>";
      card.appendChild(typing);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = message.text;
      card.appendChild(paragraph);

      if (shouldRenderQuickReplies(index, message)) {
        const quickReplies = document.createElement("div");
        quickReplies.className = "message-quick-replies";

        for (const replyText of message.quickReplies) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "quick-reply-button";
          button.textContent = replyText;
          button.disabled = elements.chatInput.disabled;
          button.addEventListener("click", async () => {
            if (elements.chatInput.disabled) {
              return;
            }

            await sendUserMessage(replyText);
          });
          quickReplies.appendChild(button);
        }

        card.appendChild(quickReplies);
      }
    }

    if (message.role === "assistant") {
      item.append(badge, card);
    } else {
      item.append(card, badge);
    }

    elements.messageList.appendChild(item);
  }

  elements.messageList.scrollTop = elements.messageList.scrollHeight;
}

function renderDashboard() {
  const profile = sanitizeProfile(state.profile);
  const guidance = sanitizeGuidance(state.guidance);

  for (const field of displayFields) {
    const element = document.querySelector(`#field-${field}`);
    if (!element) {
      continue;
    }

    const value = profile[field];
    element.textContent = value || "Nog niet ingevuld";
  }

  const completedCount = progressFields.filter((field) => field.done(profile)).length;
  const progress = Math.round((completedCount / progressFields.length) * 100);

  elements.progressBar.style.width = `${progress}%`;
  elements.progressCount.textContent = `${completedCount} / ${progressFields.length} kernvelden`;
  elements.stageLabel.textContent = guidance.stage || "Basischeck";
  elements.nextStep.textContent = guidance.nextStep || "We starten met het adres van het pand.";
  elements.riskSignal.textContent = guidance.permitRisk || "Nog niet bepaald";
  elements.dossierSummary.textContent =
    state.summary ||
    "Nog geen samenvatting beschikbaar. Start het gesprek rechts om gegevens op te bouwen.";

  renderStackList(elements.missingItems, guidance.missingItems, "Nog geen open punten.");
  renderCheckList(elements.actionList, guidance.actionChecklist, "De actielijst verschijnt zodra de intake loopt.");
  renderCheckList(
    elements.documentList,
    guidance.documentChecklist,
    "De documentencheck verschijnt zodra een maatregel gekozen is.",
  );
}

function renderMeasures() {
  elements.measurePills.innerHTML = "";

  for (const measure of measureCatalog) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "measure-pill";
    button.innerHTML = `
      <span class="material-symbols-outlined">eco</span>
      <span>${measure}</span>
    `;

    if (state.selectedMeasures.includes(measure)) {
      button.classList.add("is-active");
    }

    button.addEventListener("click", async () => {
      const sentence = `Ik wil ${measure.toLowerCase()} als maatregel onderzoeken.`;
      await sendUserMessage(sentence);
    });

    elements.measurePills.appendChild(button);
  }
}

function renderStackList(container, items, emptyText) {
  container.innerHTML = "";
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!normalizedItems.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  for (const item of normalizedItems) {
    const row = document.createElement("div");
    row.className = "stack-item";
    row.innerHTML = `
      <span class="material-symbols-outlined">arrow_right_alt</span>
      <span>${item}</span>
    `;
    container.appendChild(row);
  }
}

function renderCheckList(container, items, emptyText) {
  container.innerHTML = "";
  const normalizedItems = Array.isArray(items) ? items.filter((item) => item?.label) : [];

  if (!normalizedItems.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  for (const item of normalizedItems) {
    const row = document.createElement("div");
    row.className = `check-item${item.done ? " is-done" : ""}`;
    row.innerHTML = `
      <span class="material-symbols-outlined">${item.done ? "task_alt" : "radio_button_unchecked"}</span>
      <span>${item.label}</span>
    `;
    container.appendChild(row);
  }
}

function replaceTypingMessage(typingId, text, quickReplies = []) {
  state.messages = state.messages.map((message) => {
    if (message.typingId !== typingId) {
      return message;
    }

    return {
      role: "assistant",
      quickReplies: normalizeQuickReplies(quickReplies),
      text,
    };
  });
}

function toggleComposer(disabled) {
  elements.chatInput.disabled = disabled;
  elements.chatForm.querySelector("button").disabled = disabled;
}

function switchChatMode(chatMode) {
  state.chatMode = normalizeChatMode(chatMode);
  state.messages = [createAssistantMessage(state.chatMode)];
  persistState();
  renderChatMode();
  renderMessages();
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const payload = await response.json();

    if (!payload.configured) {
      elements.apiStatus.textContent = payload.addressLookup
        ? "Lokale demo-intake + adresscan actief"
        : "Lokale demo-intake actief";
      return;
    }

    elements.apiStatus.textContent = payload.addressLookup
      ? "Chatkoppeling geconfigureerd + adresscan actief"
      : "Chatkoppeling geconfigureerd";
  } catch {
    elements.apiStatus.textContent = "Kan lokale server niet bereiken";
  }
}

function loadState() {
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const sanitized = sanitizeState(parsed);
      localStorage.setItem(storageKey, JSON.stringify(sanitized));
      return sanitized;
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  return {
    chatMode: defaultChatMode,
    guidance: { ...emptyGuidance },
    messages: [createAssistantMessage(defaultChatMode)],
    profile: { ...emptyProfile },
    selectedMeasures: [],
    summary: "",
  };
}

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  scheduleRemoteSave();
}

function sanitizeState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    return {
      chatMode: defaultChatMode,
      guidance: { ...emptyGuidance },
      messages: [createAssistantMessage(defaultChatMode)],
      profile: { ...emptyProfile },
      selectedMeasures: [],
      summary: "",
    };
  }

  const chatMode = normalizeChatMode(rawState.chatMode);
  const messages = Array.isArray(rawState.messages)
    ? rawState.messages.map((message) => sanitizeMessage(message)).filter(Boolean)
    : [];

  return {
    chatMode,
    guidance: sanitizeGuidance(rawState.guidance),
    messages: messages.length ? messages : [createAssistantMessage(chatMode)],
    profile: sanitizeProfile(rawState.profile),
    selectedMeasures: normalizeMeasures(rawState.selectedMeasures),
    summary: typeof rawState.summary === "string" ? rawState.summary : "",
  };
}

function sanitizeProfile(rawProfile) {
  return {
    ...emptyProfile,
    ...(rawProfile && typeof rawProfile === "object" ? rawProfile : {}),
  };
}

function sanitizeGuidance(rawGuidance) {
  const source = rawGuidance && typeof rawGuidance === "object" ? rawGuidance : {};

  return {
    ...emptyGuidance,
    ...source,
    actionChecklist: Array.isArray(source.actionChecklist)
      ? source.actionChecklist.filter((item) => item?.label)
      : [],
    documentChecklist: Array.isArray(source.documentChecklist)
      ? source.documentChecklist.filter((item) => item?.label)
      : [],
    missingItems: Array.isArray(source.missingItems)
      ? source.missingItems.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
  };
}

function sanitizeMessage(message) {
  if (!message || typeof message !== "object" || typeof message.text !== "string") {
    return null;
  }

  return {
    ...message,
    quickReplies: normalizeQuickReplies(message.quickReplies),
    text: message.text.replace(legacyFallbackIntro, ""),
  };
}

function shouldRenderQuickReplies(index, message) {
  if (message.role !== "assistant" || !Array.isArray(message.quickReplies) || !message.quickReplies.length) {
    return false;
  }

  return !state.messages.slice(index + 1).some((nextMessage) => nextMessage.role === "user");
}

function normalizeQuickReplies(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeMeasures(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = new Set();

  for (const item of items) {
    const match = measureCatalog.find(
      (candidate) => candidate.toLowerCase() === String(item || "").trim().toLowerCase(),
    );
    if (match) {
      normalized.add(match);
    }
  }

  return [...normalized];
}

function normalizeChatMode(value) {
  return value === "strict" ? "strict" : defaultChatMode;
}

function getChatModeMeta(chatMode) {
  return chatModeMeta[normalizeChatMode(chatMode)];
}

function createAssistantMessage(chatMode) {
  return {
    role: "assistant",
    text: getChatModeMeta(chatMode).openingMessage,
  };
}

async function initializeApp() {
  try {
    authContext = await requireAuthPage();

    const hydrated = await hydrateDossier({
      dossierType: "intake",
      emptyState: createEmptyState,
      localKey: storageKey,
      title: "Intakechat",
    });

    replaceStateContents(state, sanitizeState(hydrated.state));

    elements.authDisplayName.textContent =
      authContext.profile.display_name || authContext.user?.email || "Gast";
    elements.authEmail.textContent = authContext.user?.email || "Gastmodus actief";
    if (authContext.supabase) {
      attachLogoutButton(elements.logoutButton, elements.authEmail);
    } else {
      elements.logoutButton.hidden = true;
    }

    renderMeasures();
    renderChatMode();
    renderMessages();
    renderDashboard();
    await checkHealth();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "De intakeomgeving kon niet worden geladen.";
    elements.apiStatus.textContent = message;
    elements.authDisplayName.textContent = "Fout bij laden";
    elements.authEmail.textContent = message;
  }
}

function scheduleRemoteSave() {
  if (!authContext?.supabase) {
    return;
  }

  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try {
      await saveRemoteDossier({
        dossierType: "intake",
        state: sanitizeState(state),
        title: "Intakechat",
      });
    } catch (error) {
      elements.apiStatus.textContent =
        error instanceof Error ? error.message : "Opslaan in Supabase lukte niet.";
    }
  }, 350);
}

function replaceStateContents(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
}

function createEmptyState() {
  return {
    chatMode: defaultChatMode,
    guidance: { ...emptyGuidance },
    messages: [createAssistantMessage(defaultChatMode)],
    profile: { ...emptyProfile },
    selectedMeasures: [],
    summary: "",
  };
}
