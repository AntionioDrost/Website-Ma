import { attachLogoutButton, requireAuthPage } from "./auth.js";
import { hydrateAllDossiers, saveRemoteDossier, writeLocalState } from "./dossier-store.js";

const intakeStorageKey = "monument-app-state-v2";
const glassStorageKey = "glasisolatie-demo-state-v2";

const state = {
  auth: null,
  dossiers: null,
  editSection: "",
  drafts: {},
  saveMessage: "",
  saveError: "",
  loading: true,
};

const elements = {
  authDisplayName: document.querySelector("#auth-display-name"),
  authEmail: document.querySelector("#auth-email"),
  dossierShell: document.querySelector("#dossier-shell"),
  logoutButton: document.querySelector("#logout-button"),
  sidebarFocus: document.querySelector("#dossier-sidebar-focus"),
  sidebarNote: document.querySelector("#dossier-sidebar-note"),
};

const dossierDefinitions = [
  {
    dossierType: "intake",
    emptyState: createEmptyIntakeState,
    localKey: intakeStorageKey,
    title: "Intakechat",
  },
  {
    dossierType: "glass",
    emptyState: createEmptyGlassState,
    localKey: glassStorageKey,
    title: "Glaswizard",
  },
];

initialize();

async function initialize() {
  try {
    state.auth = await requireAuthPage();
    state.dossiers = await hydrateAllDossiers(dossierDefinitions);

    elements.authDisplayName.textContent =
      state.auth.profile.display_name || state.auth.user?.email || "Gast";
    elements.authEmail.textContent = state.auth.user?.email || "Gastmodus actief";
    if (state.auth.supabase) {
      attachLogoutButton(elements.logoutButton, elements.authEmail);
    } else {
      elements.logoutButton.hidden = true;
    }

    state.loading = false;
    render();
  } catch (error) {
    state.loading = false;
    state.saveError =
      error instanceof Error ? error.message : "Je dossier kon niet worden geladen.";
    render();
  }
}

elements.dossierShell.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) {
    return;
  }

  const section = action.dataset.section || "";
  const type = action.dataset.action;

  if (type === "edit") {
    state.editSection = section;
    state.saveError = "";
    state.saveMessage = "";
    state.drafts[section] = createDraftForSection(section, state.dossiers);
    render();
    return;
  }

  if (type === "cancel") {
    state.editSection = "";
    delete state.drafts[section];
    state.saveError = "";
    render();
    return;
  }

  if (type === "retry") {
    state.loading = true;
    state.saveError = "";
    render();
    await initialize();
    return;
  }

  if (type === "save") {
    await saveSection(section);
  }
});

elements.dossierShell.addEventListener("input", (event) => {
  const input = event.target;
  const section = input.closest("[data-edit-section]")?.dataset.editSection;
  if (!section || !state.drafts[section]) {
    return;
  }

  const field = input.name;
  if (!field) {
    return;
  }

  state.drafts[section][field] = input.type === "checkbox" ? input.checked : input.value;
});

function render() {
  const view = buildViewModel(state.dossiers);
  elements.sidebarFocus.textContent = view.sidebar.title;
  elements.sidebarNote.textContent = view.sidebar.note;

  if (state.loading) {
    elements.dossierShell.innerHTML = `
      <article class="dossier-loading app-side-sheet">
        <p class="card-text">Je dossier wordt geladen...</p>
      </article>
    `;
    return;
  }

  if (!state.dossiers) {
    elements.dossierShell.innerHTML = `
      <article class="dossier-empty app-side-sheet">
        <h2>Je dossier kon niet worden geladen</h2>
        <p class="card-text">${escapeHtml(state.saveError || "Probeer het opnieuw.")}</p>
        <button class="button button-primary" type="button" data-action="retry">Opnieuw proberen</button>
      </article>
    `;
    return;
  }

  if (!view.hasAnyProgress) {
    elements.dossierShell.innerHTML = `
      <article class="dossier-empty app-side-sheet">
        <h2>Hier verschijnt straks je dossier</h2>
        <p class="card-text">Zodra je begint met de intakechat of glaswizard, zie je hier wat al bekend is en wat je later kunt aanpassen.</p>
        <div class="dossier-empty-actions">
          <a class="button button-primary" href="/intake">Start intakechat</a>
          <a class="button button-secondary" href="/glasisolatie-demo">Start glaswizard</a>
        </div>
      </article>
    `;
    return;
  }

  elements.dossierShell.innerHTML = `
    ${renderSummaryCard(view)}
    ${state.saveError ? `<div class="dossier-banner is-error">${escapeHtml(state.saveError)}</div>` : ""}
    ${state.saveMessage ? `<div class="dossier-banner is-success">${escapeHtml(state.saveMessage)}</div>` : ""}
    <div class="dossier-grid">
      ${renderAccountSection(view)}
      ${renderSharedSection(view)}
      ${renderIntakeSection(view)}
      ${renderGlassSection(view)}
    </div>
  `;
}

async function saveSection(section) {
  state.saveError = "";
  state.saveMessage = "";

  try {
    if (section === "shared") {
      await saveSharedSection();
    } else if (section === "intake") {
      await saveIntakeSection();
    } else if (section === "glass") {
      await saveGlassSection();
    } else if (section === "account") {
      await saveAccountSection();
    }

    state.editSection = "";
    delete state.drafts[section];
    if (!state.saveMessage) {
      state.saveMessage = "Je gegevens zijn bijgewerkt.";
    }
    render();
  } catch (error) {
    state.saveError =
      error instanceof Error ? error.message : "Opslaan lukte niet. Probeer het opnieuw.";
    render();
  }
}

async function saveSharedSection() {
  const draft = state.drafts.shared || {};
  const intakeState = cloneValue(state.dossiers.intake.state);
  const glassState = cloneValue(state.dossiers.glass.state);

  glassState.fields = {
    ...(glassState.fields || {}),
    applicantName: draft.name || "",
    emailAddress: draft.email || "",
    propertyAddress: draft.address || "",
    monumentType: draft.monumentStatus || "",
  };

  intakeState.profile = {
    ...(intakeState.profile || {}),
    city: draft.city || "",
    municipality: draft.municipality || "",
    currentUse: draft.currentUse || "",
    protectedValues: draft.protectedValues || "",
    measureDescription: draft.measureDescription || "",
    measureGoal: draft.measureGoal || "",
  };

  await Promise.all([
    saveAndPersistLocal("glass", glassState, glassStorageKey, "Glaswizard"),
    saveAndPersistLocal("intake", intakeState, intakeStorageKey, "Intakechat"),
  ]);

  state.dossiers.glass.state = glassState;
  state.dossiers.intake.state = intakeState;
}

async function saveIntakeSection() {
  const draft = state.drafts.intake || {};
  const intakeState = cloneValue(state.dossiers.intake.state);

  intakeState.summary = draft.summary || "";
  intakeState.selectedMeasures = splitLines(draft.selectedMeasures);
  intakeState.profile = {
    ...(intakeState.profile || {}),
    street: draft.street || "",
    houseNumber: draft.houseNumber || "",
    postcode: draft.postcode || "",
    city: draft.city || "",
    municipality: draft.municipality || "",
    monumentStatus: draft.monumentStatus || "",
    measureDescription: draft.measureDescription || "",
    documentsAvailable: draft.documentsAvailable || "",
    notes: draft.notes || "",
  };

  await saveAndPersistLocal("intake", intakeState, intakeStorageKey, "Intakechat");
  state.dossiers.intake.state = intakeState;
}

async function saveGlassSection() {
  const draft = state.drafts.glass || {};
  const glassState = cloneValue(state.dossiers.glass.state);

  glassState.fields = {
    ...(glassState.fields || {}),
    applicantName: draft.applicantName || "",
    propertyAddress: draft.propertyAddress || "",
    monumentType: draft.monumentType || "",
    emailAddress: draft.emailAddress || "",
    routeChoice: draft.routeChoice || "",
    mainGoal: draft.mainGoal || "",
    facade: draft.facade || "",
    windDirection: draft.windDirection || "",
    uniquePairCount: draft.uniquePairCount || "1",
  };
  glassState.eligibility = {
    ...(glassState.eligibility || {}),
    inZeist: draft.inZeist || "",
    heritageScope: draft.heritageScope || "",
    measureScope: draft.measureScope || "",
  };

  await saveAndPersistLocal("glass", glassState, glassStorageKey, "Glaswizard");
  state.dossiers.glass.state = glassState;
}

async function saveAccountSection() {
  const draft = state.drafts.account || {};
  const supabase = state.auth?.supabase;
  const user = state.auth?.user;

  if (!supabase || !user) {
    throw new Error("Je accountinstellingen zijn nu niet beschikbaar.");
  }

  const nextDisplayName = String(draft.displayName || "").trim();
  const nextEmail = String(draft.email || "").trim().toLowerCase();
  const nextPassword = String(draft.password || "");
  const currentEmail = String(user.email || "").trim().toLowerCase();
  const emailChanged = Boolean(nextEmail && nextEmail !== currentEmail);

  if (!nextDisplayName) {
    throw new Error("Vul een naam in.");
  }

  if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    throw new Error("Vul een geldig e-mailadres in.");
  }

  if (nextPassword && nextPassword.length < 8) {
    throw new Error("Kies een wachtwoord van minimaal 8 tekens.");
  }

  const authPayload = {
    data: {
      ...(user.user_metadata || {}),
      display_name: nextDisplayName,
    },
  };

  if (emailChanged) {
    authPayload.email = nextEmail;
  }

  if (nextPassword) {
    authPayload.password = nextPassword;
  }

  const { data: authData, error: authError } = await supabase.auth.updateUser(authPayload);
  if (authError) {
    throw authError;
  }

  const profilePayload = {
    id: user.id,
    display_name: nextDisplayName,
    email: emailChanged ? nextEmail : nextEmail || user.email || "",
  };

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload)
    .select("id, email, display_name")
    .single();

  if (profileError) {
    throw profileError;
  }

  state.auth.profile = profileData;
  state.auth.user = authData.user || {
    ...user,
    email: emailChanged ? nextEmail : user.email,
    user_metadata: {
      ...(user.user_metadata || {}),
      display_name: nextDisplayName,
    },
  };

  elements.authDisplayName.textContent = profileData.display_name || state.auth.user.email || "Gebruiker";
  elements.authEmail.textContent = profileData.email || state.auth.user.email || "";
  state.saveMessage = emailChanged
    ? "Je account is bijgewerkt. Controleer ook je mailbox om je nieuwe e-mailadres te bevestigen."
    : "Je accountinstellingen zijn bijgewerkt.";
}

async function saveAndPersistLocal(dossierType, nextState, localKey, title) {
  await saveRemoteDossier({
    dossierType,
    state: nextState,
    title,
  });
  writeLocalState(localKey, nextState);
}

function renderSummaryCard(view) {
  return `
    <section class="dossier-summary-card app-side-sheet">
      <div class="dossier-summary-head">
        <div>
          <p class="app-kicker">Overzicht</p>
          <h2>${escapeHtml(view.summary.name || "Je dossier")}</h2>
          <p class="card-text">${escapeHtml(view.summary.subtitle)}</p>
        </div>
        <div class="dossier-summary-status">
          <span class="stage-pill">${escapeHtml(view.summary.primaryStatus)}</span>
          <span class="dossier-chip">${escapeHtml(view.summary.secondaryStatus)}</span>
        </div>
      </div>
      <div class="dossier-summary-grid">
        ${view.summary.items.map((item) => `
          <div class="dossier-summary-item">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAccountSection(view) {
  const account = view.account;
  const isEditing = state.editSection === "account";
  const draft = state.drafts.account || {};

  return `
    <article class="dossier-section app-side-sheet">
      <div class="dossier-section-head">
        <div>
          <h3>Accountinstellingen</h3>
          <p class="card-text">Pas hier je naam, e-mailadres of wachtwoord aan zonder je dossiergegevens te wijzigen.</p>
        </div>
        ${isEditing
          ? `<div class="dossier-inline-actions" data-edit-section="account">
              <button class="button button-secondary" type="button" data-action="cancel" data-section="account">Annuleren</button>
              <button class="button button-primary" type="button" data-action="save" data-section="account">Opslaan</button>
            </div>`
          : `<button class="button button-secondary" type="button" data-action="edit" data-section="account">Aanpassen</button>`}
      </div>
      ${isEditing
        ? renderFieldEditor("account", [
            { name: "displayName", label: "Naam", value: draft.displayName || "" },
            { name: "email", label: "E-mailadres", value: draft.email || "", type: "email", hint: "Bij een nieuw e-mailadres kan eerst nog bevestiging per mail nodig zijn." },
            { name: "password", label: "Nieuw wachtwoord", value: "", type: "password", hint: "Laat leeg als je je wachtwoord niet wilt wijzigen." },
          ])
        : renderKeyValueList(account.fields)}
    </article>
  `;
}

function renderSharedSection(view) {
  const shared = view.shared;
  const isEditing = state.editSection === "shared";
  const draft = state.drafts.shared || {};

  return `
    <article class="dossier-section app-side-sheet">
      <div class="dossier-section-head">
        <div>
          <h3>Pand en context</h3>
          <p class="card-text">De gedeelde basis van je dossier, samengebracht uit intake en glaswizard.</p>
        </div>
        ${isEditing
          ? `<div class="dossier-inline-actions" data-edit-section="shared">
              <button class="button button-secondary" type="button" data-action="cancel" data-section="shared">Annuleren</button>
              <button class="button button-primary" type="button" data-action="save" data-section="shared">Opslaan</button>
            </div>`
          : `<button class="button button-secondary" type="button" data-action="edit" data-section="shared">Aanpassen</button>`}
      </div>
      ${shared.conflicts.length ? `
        <div class="dossier-conflicts">
          ${shared.conflicts.map((conflict) => `<p>${escapeHtml(conflict)}</p>`).join("")}
        </div>
      ` : ""}
      ${isEditing
        ? renderFieldEditor("shared", [
            { name: "name", label: "Naam", value: draft.name || "" },
            { name: "email", label: "E-mailadres", value: draft.email || "", type: "email" },
            { name: "address", label: "Adres", value: draft.address || "" },
            { name: "city", label: "Plaats", value: draft.city || "" },
            { name: "municipality", label: "Gemeente", value: draft.municipality || "" },
            { name: "monumentStatus", label: "Monumentstatus", value: draft.monumentStatus || "" },
            { name: "currentUse", label: "Huidig gebruik", value: draft.currentUse || "" },
            { name: "protectedValues", label: "Beschermde waarden", value: draft.protectedValues || "", multiline: true },
            { name: "measureDescription", label: "Maatregel", value: draft.measureDescription || "", multiline: true },
            { name: "measureGoal", label: "Doel van de ingreep", value: draft.measureGoal || "", multiline: true },
          ])
        : renderKeyValueList(shared.fields)}
    </article>
  `;
}

function renderIntakeSection(view) {
  const intake = view.intake;
  const isEditing = state.editSection === "intake";
  const draft = state.drafts.intake || {};

  return `
    <article class="dossier-section app-side-sheet">
      <div class="dossier-section-head">
        <div>
          <h3>Intake</h3>
          <p class="card-text">${escapeHtml(intake.description)}</p>
        </div>
        ${isEditing
          ? `<div class="dossier-inline-actions" data-edit-section="intake">
              <button class="button button-secondary" type="button" data-action="cancel" data-section="intake">Annuleren</button>
              <button class="button button-primary" type="button" data-action="save" data-section="intake">Opslaan</button>
            </div>`
          : `<button class="button button-secondary" type="button" data-action="edit" data-section="intake">Aanpassen</button>`}
      </div>
      ${isEditing
        ? renderFieldEditor("intake", [
            { name: "summary", label: "Samenvatting", value: draft.summary || "", multiline: true },
            { name: "street", label: "Straat", value: draft.street || "" },
            { name: "houseNumber", label: "Huisnummer", value: draft.houseNumber || "" },
            { name: "postcode", label: "Postcode", value: draft.postcode || "" },
            { name: "city", label: "Plaats", value: draft.city || "" },
            { name: "municipality", label: "Gemeente", value: draft.municipality || "" },
            { name: "monumentStatus", label: "Monumentenstatus", value: draft.monumentStatus || "" },
            { name: "measureDescription", label: "Maatregel", value: draft.measureDescription || "", multiline: true },
            { name: "documentsAvailable", label: "Beschikbare stukken", value: draft.documentsAvailable || "", multiline: true },
            { name: "selectedMeasures", label: "Gekozen maatregelen", value: draft.selectedMeasures || "", multiline: true, hint: "Zet elke maatregel op een nieuwe regel." },
            { name: "notes", label: "Notities", value: draft.notes || "", multiline: true },
          ])
        : `
          ${renderKeyValueList(intake.fields)}
          <div class="dossier-subsection">
            <h4>Open punten</h4>
            ${renderPillList(intake.missingItems, "Nog geen open punten.")}
          </div>
          <div class="dossier-subsection">
            <h4>Gekozen maatregelen</h4>
            ${renderPillList(intake.selectedMeasures, "Nog geen maatregel vastgelegd.")}
          </div>
        `}
    </article>
  `;
}

function renderGlassSection(view) {
  const glass = view.glass;
  const isEditing = state.editSection === "glass";
  const draft = state.drafts.glass || {};

  return `
    <article class="dossier-section app-side-sheet">
      <div class="dossier-section-head">
        <div>
          <h3>Glaswizard</h3>
          <p class="card-text">${escapeHtml(glass.description)}</p>
        </div>
        ${isEditing
          ? `<div class="dossier-inline-actions" data-edit-section="glass">
              <button class="button button-secondary" type="button" data-action="cancel" data-section="glass">Annuleren</button>
              <button class="button button-primary" type="button" data-action="save" data-section="glass">Opslaan</button>
            </div>`
          : `<button class="button button-secondary" type="button" data-action="edit" data-section="glass">Aanpassen</button>`}
      </div>
      ${isEditing
        ? renderFieldEditor("glass", [
            { name: "applicantName", label: "Naam aanvrager", value: draft.applicantName || "" },
            { name: "propertyAddress", label: "Adres", value: draft.propertyAddress || "" },
            { name: "emailAddress", label: "E-mailadres", value: draft.emailAddress || "", type: "email" },
            { name: "monumentType", label: "Monumentstatus", value: draft.monumentType || "" },
            { name: "routeChoice", label: "Route", value: draft.routeChoice || "" },
            { name: "mainGoal", label: "Hoofddoel", value: draft.mainGoal || "", multiline: true },
            { name: "facade", label: "Gevel", value: draft.facade || "" },
            { name: "windDirection", label: "Windrichting", value: draft.windDirection || "" },
            { name: "uniquePairCount", label: "Aantal unieke kozijnparen", value: draft.uniquePairCount || "1", type: "number" },
            { name: "inZeist", label: "Ligging in Zeist", value: draft.inZeist || "" },
            { name: "heritageScope", label: "Bescherming", value: draft.heritageScope || "" },
            { name: "measureScope", label: "Glasisolatie", value: draft.measureScope || "" },
          ])
        : `
          ${renderKeyValueList(glass.fields)}
          <div class="dossier-subsection">
            <h4>Bestanden en stukken</h4>
            ${renderPillList(glass.files, "Nog geen bestandstatus bekend.")}
          </div>
        `}
    </article>
  `;
}

function renderFieldEditor(section, fields) {
  return `
    <div class="dossier-edit-grid" data-edit-section="${section}">
      ${fields.map((field) => `
        <label class="dossier-field ${field.multiline ? "is-wide" : ""}">
          <span>${escapeHtml(field.label)}</span>
          ${field.multiline
            ? `<textarea name="${escapeHtml(field.name)}" rows="3">${escapeHtml(field.value)}</textarea>`
            : `<input name="${escapeHtml(field.name)}" type="${escapeHtml(field.type || "text")}" value="${escapeHtml(field.value)}" />`}
          ${field.hint ? `<small>${escapeHtml(field.hint)}</small>` : ""}
        </label>
      `).join("")}
    </div>
  `;
}

function renderKeyValueList(items) {
  return `
    <div class="dossier-field-list">
      ${items.map((item) => `
        <div class="dossier-field-row">
          <span class="dossier-field-label">${escapeHtml(item.label)}</span>
          <div class="dossier-field-value-wrap">
            <strong>${escapeHtml(item.value || "Nog niet ingevuld")}</strong>
            ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPillList(items, emptyText) {
  if (!items.length) {
    return `<p class="list-empty">${escapeHtml(emptyText)}</p>`;
  }

  return `
    <div class="dossier-pill-list">
      ${items.map((item) => `<span class="dossier-pill">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function buildViewModel(dossiers) {
  const intake = sanitizeIntakeState(dossiers?.intake?.state);
  const glass = sanitizeGlassState(dossiers?.glass?.state);
  const accountDisplayName =
    state.auth?.profile?.display_name || state.auth?.user?.user_metadata?.display_name || "";
  const accountEmail = state.auth?.profile?.email || state.auth?.user?.email || "";

  const intakeAddress = joinParts([intake.profile.street, intake.profile.houseNumber, intake.profile.postcode, intake.profile.city || intake.profile.municipality]);
  const glassAddress = glass.fields.propertyAddress || "";
  const summaryName = glass.fields.applicantName || firstMeaningful([intake.profile.ownershipRole, intake.profile.street ? "Dossier van monumenteigenaar" : "Mijn dossier"]);
  const summaryEmail = glass.fields.emailAddress || "";
  const summaryMonumentStatus = glass.fields.monumentType || intake.profile.monumentStatus || "";
  const measureLabel = glass.fields.mainGoal || intake.profile.measureDescription || "";
  const hasAnyProgress = hasIntakeProgress(intake) || hasGlassProgress(glass);

  const sharedFields = [
    { label: "Naam", value: glass.fields.applicantName || "Nog niet ingevuld", meta: "Bron: glaswizard" },
    { label: "E-mailadres", value: summaryEmail || "Nog niet ingevuld", meta: summaryEmail ? "Bron: glaswizard" : "" },
    { label: "Adres", value: glassAddress || intakeAddress || "Nog niet ingevuld", meta: glassAddress ? "Bron: glaswizard" : intakeAddress ? "Bron: intakechat" : "" },
    { label: "Plaats", value: intake.profile.city || "Nog niet ingevuld", meta: intake.profile.city ? "Bron: intakechat" : "" },
    { label: "Gemeente", value: intake.profile.municipality || "Nog niet ingevuld", meta: intake.profile.municipality ? "Bron: intakechat" : "" },
    { label: "Monumentstatus", value: summaryMonumentStatus || "Nog niet ingevuld", meta: summaryMonumentStatus ? (glass.fields.monumentType ? "Bron: glaswizard" : "Bron: intakechat") : "" },
    { label: "Huidig gebruik", value: intake.profile.currentUse || "Nog niet ingevuld", meta: intake.profile.currentUse ? "Bron: intakechat" : "" },
    { label: "Beschermde waarden", value: intake.profile.protectedValues || "Nog niet ingevuld", meta: intake.profile.protectedValues ? "Bron: intakechat" : "" },
    { label: "Maatregel", value: intake.profile.measureDescription || "Nog niet ingevuld", meta: intake.profile.measureDescription ? "Bron: intakechat" : "" },
    { label: "Doel van de ingreep", value: intake.profile.measureGoal || glass.fields.mainGoal || "Nog niet ingevuld", meta: intake.profile.measureGoal ? "Bron: intakechat" : glass.fields.mainGoal ? "Bron: glaswizard" : "" },
  ];

  return {
    hasAnyProgress,
    sidebar: {
      title: hasAnyProgress ? "Je dossier staat klaar" : "Nog geen dossier opgebouwd",
      note: hasAnyProgress
        ? "Controleer je gegevens of pas iets aan wanneer het nodig is."
        : "Begin met intake of werk eerst een route uit.",
    },
    summary: {
      name: summaryName,
      subtitle: measureLabel || "Alle bekende gegevens uit je intake en glaswizard staan hier samengebracht.",
      primaryStatus: hasIntakeProgress(intake) ? "Intake actief" : "Intake nog leeg",
      secondaryStatus: hasGlassProgress(glass) ? "Glaswizard actief" : "Glaswizard nog leeg",
      items: [
        { label: "Adres", value: glassAddress || intakeAddress || "Nog niet ingevuld" },
        { label: "Monumentstatus", value: summaryMonumentStatus || "Nog niet ingevuld" },
        { label: "Maatregel", value: intake.profile.measureDescription || routeChoiceLabel(glass.fields.routeChoice) || "Nog niet ingevuld" },
        { label: "Voortgang intake", value: intakeProgressLabel(intake) },
        { label: "Voortgang glaswizard", value: glassProgressLabel(glass) },
      ],
    },
    account: {
      fields: [
        { label: "Naam", value: accountDisplayName || "Nog niet ingevuld", meta: "Bron: accountprofiel" },
        { label: "E-mailadres", value: accountEmail || "Nog niet ingevuld", meta: "Bron: accountprofiel" },
        { label: "Wachtwoord", value: "Niet zichtbaar om veiligheidsredenen" },
      ],
    },
    shared: {
      fields: sharedFields,
      conflicts: buildConflicts(intake, glass, intakeAddress),
    },
    intake: {
      description: intake.summary || "Wat uit het gesprek is opgebouwd, zonder de chat zelf te tonen.",
      fields: [
        { label: "Samenvatting", value: intake.summary || "Nog geen samenvatting" },
        { label: "Straat", value: intake.profile.street || "Nog niet ingevuld" },
        { label: "Huisnummer", value: intake.profile.houseNumber || "Nog niet ingevuld" },
        { label: "Postcode", value: intake.profile.postcode || "Nog niet ingevuld" },
        { label: "Plaats", value: intake.profile.city || "Nog niet ingevuld" },
        { label: "Gemeente", value: intake.profile.municipality || "Nog niet ingevuld" },
        { label: "Monumentenstatus", value: intake.profile.monumentStatus || "Nog niet ingevuld" },
        { label: "Maatregel", value: intake.profile.measureDescription || "Nog niet ingevuld" },
        { label: "Beschikbare stukken", value: intake.profile.documentsAvailable || "Nog niet ingevuld" },
        { label: "Notities", value: intake.profile.notes || "Nog niet ingevuld" },
      ],
      missingItems: intake.guidance.missingItems,
      selectedMeasures: intake.selectedMeasures,
    },
    glass: {
      description: "De concrete routegegevens van je glasisolatiedossier, met pand, route en uitwerking.",
      fields: [
        { label: "Naam aanvrager", value: glass.fields.applicantName || "Nog niet ingevuld" },
        { label: "Adres", value: glass.fields.propertyAddress || "Nog niet ingevuld" },
        { label: "E-mailadres", value: glass.fields.emailAddress || "Nog niet ingevuld" },
        { label: "Monumentstatus", value: glass.fields.monumentType || "Nog niet ingevuld" },
        { label: "Route", value: routeChoiceLabel(glass.fields.routeChoice) || "Nog niet ingevuld" },
        { label: "Hoofddoel", value: glass.fields.mainGoal || "Nog niet ingevuld" },
        { label: "Gevel", value: glass.fields.facade || "Nog niet ingevuld" },
        { label: "Windrichting", value: glass.fields.windDirection || "Nog niet ingevuld" },
        { label: "Unieke kozijnparen", value: glass.fields.uniquePairCount || "Nog niet ingevuld" },
        { label: "Ligging in Zeist", value: yesNoLabel(glass.eligibility.inZeist) },
        { label: "Bescherming", value: glass.eligibility.heritageScope || "Nog niet ingevuld" },
        { label: "Glasisolatie", value: yesNoLabel(glass.eligibility.measureScope) },
      ],
      files: buildGlassFileStatus(glass),
    },
  };
}

function createDraftForSection(section, dossiers) {
  const intake = sanitizeIntakeState(dossiers.intake.state);
  const glass = sanitizeGlassState(dossiers.glass.state);
  const intakeAddress = joinParts([intake.profile.street, intake.profile.houseNumber, intake.profile.postcode, intake.profile.city || intake.profile.municipality]);

  if (section === "shared") {
    return {
      name: glass.fields.applicantName || "",
      email: glass.fields.emailAddress || "",
      address: glass.fields.propertyAddress || intakeAddress || "",
      city: intake.profile.city || "",
      municipality: intake.profile.municipality || "",
      monumentStatus: glass.fields.monumentType || intake.profile.monumentStatus || "",
      currentUse: intake.profile.currentUse || "",
      protectedValues: intake.profile.protectedValues || "",
      measureDescription: intake.profile.measureDescription || "",
      measureGoal: intake.profile.measureGoal || glass.fields.mainGoal || "",
    };
  }

  if (section === "intake") {
    return {
      summary: intake.summary || "",
      street: intake.profile.street || "",
      houseNumber: intake.profile.houseNumber || "",
      postcode: intake.profile.postcode || "",
      city: intake.profile.city || "",
      municipality: intake.profile.municipality || "",
      monumentStatus: intake.profile.monumentStatus || "",
      measureDescription: intake.profile.measureDescription || "",
      documentsAvailable: intake.profile.documentsAvailable || "",
      selectedMeasures: intake.selectedMeasures.join("\n"),
      notes: intake.profile.notes || "",
    };
  }

  if (section === "glass") {
    return {
      applicantName: glass.fields.applicantName || "",
      propertyAddress: glass.fields.propertyAddress || "",
      emailAddress: glass.fields.emailAddress || "",
      monumentType: glass.fields.monumentType || "",
      routeChoice: glass.fields.routeChoice || "",
      mainGoal: glass.fields.mainGoal || "",
      facade: glass.fields.facade || "",
      windDirection: glass.fields.windDirection || "",
      uniquePairCount: glass.fields.uniquePairCount || "1",
      inZeist: glass.eligibility.inZeist || "",
      heritageScope: glass.eligibility.heritageScope || "",
      measureScope: glass.eligibility.measureScope || "",
    };
  }

  if (section === "account") {
    return {
      displayName: state.auth?.profile?.display_name || state.auth?.user?.user_metadata?.display_name || "",
      email: state.auth?.profile?.email || state.auth?.user?.email || "",
      password: "",
    };
  }

  return {};
}

function buildConflicts(intake, glass, intakeAddress) {
  const conflicts = [];
  if (glass.fields.propertyAddress && intakeAddress && normalizeText(glass.fields.propertyAddress) !== normalizeText(intakeAddress)) {
    conflicts.push("Het adres in de glaswizard wijkt af van het adres uit de intakechat.");
  }
  if (glass.fields.monumentType && intake.profile.monumentStatus && normalizeText(glass.fields.monumentType) !== normalizeText(intake.profile.monumentStatus)) {
    conflicts.push("De monumentstatus verschilt tussen intakechat en glaswizard.");
  }
  if (glass.fields.mainGoal && intake.profile.measureGoal && normalizeText(glass.fields.mainGoal) !== normalizeText(intake.profile.measureGoal)) {
    conflicts.push("Het doel van de ingreep is anders geformuleerd in beide routes.");
  }
  return conflicts;
}

function buildGlassFileStatus(glass) {
  const items = [];
  if (glass.fields.outsidePhotosReady) {
    items.push("Buitenfoto's gemarkeerd als klaar");
  }
  if (glass.fields.insidePhotosReady) {
    items.push("Binnenfoto's gemarkeerd als klaar");
  }
  if (glass.files && typeof glass.files === "object") {
    for (const [key, names] of Object.entries(glass.files)) {
      if (Array.isArray(names) && names.length) {
        items.push(`${key}: ${names.join(", ")}`);
      }
    }
  }
  return items;
}

function sanitizeIntakeState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
  const guidance = source.guidance && typeof source.guidance === "object" ? source.guidance : {};

  return {
    guidance: {
      missingItems: Array.isArray(guidance.missingItems) ? guidance.missingItems.filter(Boolean) : [],
      stage: guidance.stage || "Basischeck",
    },
    profile: {
      street: profile.street || "",
      houseNumber: profile.houseNumber || "",
      postcode: profile.postcode || "",
      city: profile.city || "",
      municipality: profile.municipality || "",
      currentUse: profile.currentUse || "",
      monumentStatus: profile.monumentStatus || "",
      protectedValues: profile.protectedValues || "",
      measureDescription: profile.measureDescription || "",
      measureGoal: profile.measureGoal || "",
      documentsAvailable: profile.documentsAvailable || "",
      notes: profile.notes || "",
      ownershipRole: profile.ownershipRole || "",
    },
    selectedMeasures: Array.isArray(source.selectedMeasures) ? source.selectedMeasures.filter(Boolean) : [],
    summary: source.summary || "",
  };
}

function sanitizeGlassState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const fields = source.fields && typeof source.fields === "object" ? source.fields : {};
  const eligibility = source.eligibility && typeof source.eligibility === "object" ? source.eligibility : {};

  return {
    currentStep: source.currentStep || "eligibility",
    eligibility: {
      inZeist: eligibility.inZeist || "",
      heritageScope: eligibility.heritageScope || "",
      measureScope: eligibility.measureScope || "",
    },
    fields: {
      applicantName: fields.applicantName || "",
      propertyAddress: fields.propertyAddress || "",
      monumentType: fields.monumentType || "",
      emailAddress: fields.emailAddress || "",
      routeChoice: fields.routeChoice || "",
      mainGoal: fields.mainGoal || "",
      facade: fields.facade || "",
      windDirection: fields.windDirection || "",
      uniquePairCount: fields.uniquePairCount || "",
      outsidePhotosReady: Boolean(fields.outsidePhotosReady),
      insidePhotosReady: Boolean(fields.insidePhotosReady),
    },
    files: source.files && typeof source.files === "object" ? source.files : {},
    windowPairs: Array.isArray(source.windowPairs) ? source.windowPairs : [],
  };
}

function createEmptyIntakeState() {
  return {
    guidance: {
      actionChecklist: [],
      documentChecklist: [],
      missingItems: [],
      nextStep: "",
      permitRisk: "",
      stage: "Basischeck",
    },
    messages: [],
    profile: {
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
    },
    selectedMeasures: [],
    summary: "",
  };
}

function createEmptyGlassState() {
  return {
    currentStep: "eligibility",
    eligibility: {
      heritageScope: "",
      inZeist: "",
      measureScope: "",
    },
    fieldSources: {},
    fields: {
      facadePhotoReady: false,
      insidePhotosReady: false,
      outsidePhotosReady: false,
      routeChoice: "",
      uniquePairCount: "1",
    },
    files: {},
    houseProfile: null,
    saveMessage: "",
    savedAt: 0,
    touchedSteps: {},
    windowPairs: [],
  };
}

function intakeProgressLabel(intake) {
  const filled = [
    intake.profile.street,
    intake.profile.houseNumber,
    intake.profile.postcode,
    intake.profile.city || intake.profile.municipality,
    intake.profile.monumentStatus,
    intake.profile.protectedValues,
    intake.profile.currentUse,
    intake.profile.measureDescription,
  ].filter(Boolean).length;
  return `${filled} / 8 kernvelden`;
}

function glassProgressLabel(glass) {
  const filled = [
    glass.fields.applicantName,
    glass.fields.propertyAddress,
    glass.fields.monumentType,
    glass.fields.emailAddress,
    glass.fields.routeChoice,
    glass.fields.mainGoal,
  ].filter(Boolean).length;
  return `${filled} / 6 basisvelden`;
}

function hasIntakeProgress(intake) {
  return Boolean(intake.summary || intake.profile.street || intake.profile.measureDescription || intake.selectedMeasures.length);
}

function hasGlassProgress(glass) {
  return Boolean(glass.fields.applicantName || glass.fields.propertyAddress || glass.fields.routeChoice || glass.windowPairs.length);
}

function routeChoiceLabel(value) {
  if (value === "replace") {
    return "Glas vervangen";
  }
  if (value === "secondary") {
    return "Achterzetramen";
  }
  return "";
}

function yesNoLabel(value) {
  if (value === "ja") {
    return "Ja";
  }
  if (value === "nee") {
    return "Nee";
  }
  return "Nog niet ingevuld";
}

function joinParts(parts) {
  return parts.filter(Boolean).join(", ");
}

function firstMeaningful(items) {
  return items.find(Boolean) || "";
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
