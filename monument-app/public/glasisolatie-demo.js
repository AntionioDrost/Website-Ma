const storageKey = "glasisolatie-demo-state-v1";

const stepMeta = {
  project: { label: "Pand en aanvrager" },
  windows: { label: "Vensters" },
  condition: { label: "Bestaande toestand" },
  choice: { label: "Glas en route" },
  replace: { label: "Techniek glas vervangen" },
  secondary: { label: "Techniek achterzetramen" },
  review: { label: "Controle en dossier" },
};

const requiredFields = {
  project: [
    { name: "applicantName", label: "Naam aanvrager" },
    { name: "propertyAddress", label: "Adres van het pand" },
    { name: "monumentType", label: "Monumentstatus" },
    { name: "emailAddress", label: "E-mailadres" },
  ],
  windows: [
    { name: "facade", label: "Gevel" },
    { name: "windDirection", label: "Windrichting" },
    { name: "windowCount", label: "Aantal identieke vensters" },
    { name: "facadePhotoReady", label: "Overzichtsfoto gevel" },
  ],
  condition: [
    { name: "openingTypeCurrent", label: "Type openen bestaand raam" },
    { name: "draughtCurrent", label: "Huidige tochtwering" },
    { name: "ventilationCurrent", label: "Ventilatie in de ruimte" },
    { name: "ventilationPlan", label: "Verbetering ventilatie" },
    { name: "technicalState", label: "Technische staat" },
    { name: "outsidePhotosReady", label: "Buitenfoto’s" },
    { name: "insidePhotosReady", label: "Binnenfoto’s" },
  ],
  choice: [
    { name: "glassTypeCurrent", label: "Soort glas" },
    { name: "routeChoice", label: "Oplossingsrichting" },
    { name: "mainGoal", label: "Hoofddoel" },
  ],
  replace: [
    { name: "glassWidth", label: "Glasbreedte" },
    { name: "glassHeight", label: "Glashoogte" },
    { name: "measureT", label: "Maat T" },
    { name: "measureP", label: "Maat P" },
    { name: "measureS", label: "Maat S" },
    { name: "technicalOption", label: "Technisch haalbare optie" },
    { name: "chosenGlassUpgrade", label: "Gekozen verbetering" },
    { name: "existingSketchReady", label: "Schets bestaande sponning" },
    { name: "newSketchReady", label: "Schets nieuwe sponning" },
  ],
  secondary: [
    { name: "secondaryPlacement", label: "Plaats achterzetraam" },
    { name: "secondaryType", label: "Type achterzetraam" },
    { name: "secondaryOpening", label: "Indeling en openen" },
    { name: "secondaryVentilation", label: "Ventilatie van de luchtspouw" },
  ],
  review: [],
};

const attachmentMeta = [
  { key: "facadePhotoReady", label: "Overzichtsfoto van de gevel", fileKey: "facadePhoto" },
  { key: "outsidePhotosReady", label: "Foto’s van het venster buiten", fileKey: "outsidePhotos" },
  { key: "insidePhotosReady", label: "Detailfoto’s van binnen", fileKey: "insidePhotos" },
  { key: "existingSketchReady", label: "Schets bestaande sponning", fileKey: "existingSketch", branch: "replace" },
  { key: "newSketchReady", label: "Schets nieuwe sponning", fileKey: "newSketch", branch: "replace" },
];

const summaryMeta = [
  { label: "Aanvrager", value: (fields) => fields.applicantName },
  { label: "Pand", value: (fields) => fields.propertyAddress },
  { label: "Monumentstatus", value: (fields) => labelFromOption("monumentType", fields.monumentType) },
  { label: "Gevel", value: (fields) => labelFromOption("facade", fields.facade) },
  { label: "Huidig glas", value: (fields) => labelFromOption("glassTypeCurrent", fields.glassTypeCurrent) },
  { label: "Route", value: (fields) => routeLabel(fields.routeChoice) },
  { label: "Doel", value: (fields) => fields.mainGoal },
];

const elements = {
  attachmentList: document.querySelector("#attachment-list"),
  demoProgressBar: document.querySelector("#demo-progress-bar"),
  demoProgressText: document.querySelector("#demo-progress-text"),
  demoStage: document.querySelector("#demo-stage"),
  eligibilityInputs: [...document.querySelectorAll("[data-eligibility]")],
  eligibilityResult: document.querySelector("#eligibility-result"),
  exportButton: document.querySelector("#export-dossier"),
  form: document.querySelector("#glass-demo-form"),
  missingList: document.querySelector("#missing-list"),
  navNote: document.querySelector("#nav-note"),
  nextButton: document.querySelector("#next-step"),
  prevButton: document.querySelector("#prev-step"),
  reviewMissing: document.querySelector("#review-missing"),
  reviewSummary: document.querySelector("#review-summary"),
  routeChip: document.querySelector("#route-chip"),
  routeChoice: document.querySelector("#route-choice"),
  saveButton: document.querySelector("#save-progress"),
  saveStatus: document.querySelector("#save-status"),
  stepCounter: document.querySelector("#step-counter"),
  stepList: document.querySelector("#step-list"),
  stepPanels: [...document.querySelectorAll("[data-step-panel]")],
  wizardPanel: document.querySelector("#wizard-panel"),
};

const state = loadState();

applyStateToForm();
render();

for (const input of elements.eligibilityInputs) {
  input.addEventListener("change", handleEligibilityChange);
}

elements.form.addEventListener("input", handleFormMutation);
elements.form.addEventListener("change", handleFormChange);
elements.nextButton.addEventListener("click", goNext);
elements.prevButton.addEventListener("click", goPrev);
elements.saveButton.addEventListener("click", () => persistState("handmatig opgeslagen"));
elements.exportButton.addEventListener("click", exportDossier);

function handleEligibilityChange() {
  state.eligibility = readEligibility();
  if (!isEligible(state.eligibility)) {
    state.currentStep = "project";
  }
  persistState();
  render();
}

function handleFormMutation(event) {
  if (event.target.type === "file") {
    return;
  }

  state.fields = readFields();
  syncCurrentStepWithRoute();
  persistState();
  render();
}

function handleFormChange(event) {
  const { target } = event;
  if (target.type === "file") {
    state.files[target.name] = [...target.files].map((file) => file.name);
    persistState();
    renderFileMeta();
    render();
    return;
  }

  state.fields = readFields();
  syncCurrentStepWithRoute();
  persistState();
  render();
}

function goNext() {
  if (!isEligible(state.eligibility)) {
    elements.navNote.textContent = "Deze demo is pas actief als de geschiktheidscheck binnen scope uitkomt.";
    return;
  }

  if (!validateStep(state.currentStep)) {
    elements.navNote.textContent = "Vul de gemarkeerde onderdelen van deze stap eerst aan.";
    render();
    return;
  }

  const steps = getVisibleSteps();
  const currentIndex = steps.indexOf(state.currentStep);
  if (currentIndex < steps.length - 1) {
    state.currentStep = steps[currentIndex + 1];
    persistState();
    render();
    document.querySelector(`#wizard-panel`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goPrev() {
  const steps = getVisibleSteps();
  const currentIndex = steps.indexOf(state.currentStep);
  if (currentIndex > 0) {
    state.currentStep = steps[currentIndex - 1];
    persistState();
    render();
    document.querySelector(`#wizard-panel`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function render() {
  syncCurrentStepWithRoute();
  renderEligibility();
  renderStepPanels();
  renderStepList();
  renderProgress();
  renderMissing();
  renderAttachmentList();
  renderFileMeta();
  renderReview();
  renderNav();
  renderSaveStatus();
}

function renderEligibility() {
  const { inZeist, heritageScope, measureScope } = state.eligibility;
  const resolved =
    inZeist && heritageScope && measureScope
      ? isEligible(state.eligibility)
        ? "pass"
        : "fail"
      : "pending";

  elements.eligibilityResult.classList.remove("is-pass", "is-fail");

  if (resolved === "pass") {
    elements.eligibilityResult.classList.add("is-pass");
    elements.eligibilityResult.innerHTML = `
      <strong>Je valt binnen de scope van deze demo.</strong>
      <p class="card-text">Je kunt nu door naar de voorbereidingsroute en de wizard voor glasisolatie in Zeist.</p>
    `;
    return;
  }

  if (resolved === "fail") {
    elements.eligibilityResult.classList.add("is-fail");
    elements.eligibilityResult.innerHTML = `
      <strong>Deze demo is nu niet de juiste route.</strong>
      <p class="card-text">De huidige demonstratie is alleen bedoeld voor glasisolatie in Zeist bij een monument of pand in beschermd gezicht. De inhoud hieronder blijft zichtbaar als voorbeeld, maar de wizard wordt niet actief.</p>
    `;
    return;
  }

  elements.eligibilityResult.innerHTML = `
    <p class="card-text">Beantwoord eerst deze drie vragen. Daarna laat de demo zien of je direct door kunt naar de voorbereidingsroute.</p>
  `;
}

function renderStepPanels() {
  for (const panel of elements.stepPanels) {
    panel.classList.toggle("is-active", panel.dataset.stepPanel === state.currentStep);
  }
}

function renderStepList() {
  const steps = getVisibleSteps();
  elements.stepList.innerHTML = "";

  for (const step of steps) {
    const row = document.createElement("div");
    const done = isStepComplete(step);
    const label = step === "replace" || step === "secondary" ? getBranchStepLabel() : stepMeta[step].label;
    row.className = `glass-step-item${state.currentStep === step ? " is-active" : ""}${done ? " is-done" : ""}`;
    row.innerHTML = `
      <span class="material-symbols-outlined">${done ? "task_alt" : "chevron_right"}</span>
      <div>
        <strong>${label}</strong>
        <small>${done ? "klaar voor nu" : "nog aandacht nodig"}</small>
      </div>
      <span class="material-symbols-outlined">drag_handle</span>
    `;
    elements.stepList.appendChild(row);
  }
}

function renderProgress() {
  const steps = getVisibleSteps();
  const completed = steps.filter((step) => isStepComplete(step)).length;
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  elements.demoProgressBar.style.width = `${progress}%`;
  elements.demoProgressText.textContent = `${completed} / ${steps.length} stappen voltooid`;
  elements.demoStage.textContent = isEligible(state.eligibility) ? stepMeta[state.currentStep].label : "Geschiktheidscheck";
  elements.routeChip.textContent = routeLabel(state.fields.routeChoice) || "Route nog niet gekozen";

  const currentIndex = steps.indexOf(state.currentStep);
  elements.stepCounter.textContent = `Stap ${Math.max(currentIndex + 1, 1)} van ${steps.length}`;
}

function renderMissing() {
  if (!isEligible(state.eligibility)) {
    renderSimpleList(
      elements.missingList,
      [],
      "De compleetheidscheck verschijnt zodra de geschiktheidscheck binnen scope uitkomt.",
    );
    return;
  }

  const items = getMissingItems();
  renderSimpleList(elements.missingList, items, "Nog geen open punten. Zodra je invult, verschijnen ontbrekende onderdelen hier.");
}

function renderAttachmentList() {
  if (!isEligible(state.eligibility)) {
    renderCheckList(
      elements.attachmentList,
      [],
      "Na een positieve doelgroepcheck verschijnt hier welke foto’s en schetsen je voor jouw route nodig hebt.",
    );
    return;
  }

  const items = attachmentMeta
    .filter((item) => !item.branch || item.branch === state.fields.routeChoice)
    .map((item) => ({
      done: Boolean(state.fields[item.key]),
      label: formatAttachmentLabel(item),
    }));

  renderCheckList(elements.attachmentList, items, "Bijlagen verschijnen hier zodra je route en stappen invult.");
}

function renderFileMeta() {
  for (const meta of document.querySelectorAll("[data-file-meta]")) {
    const field = meta.dataset.fileMeta;
    const names = state.files[field] || [];
    meta.textContent = names.length
      ? `Lokaal onthouden: ${names.join(", ")}`
      : "Nog geen bestand gekozen";
  }
}

function renderReview() {
  const summaryRows = summaryMeta
    .map((item) => ({ label: item.label, value: item.value(state.fields) }))
    .filter((item) => item.value);
  renderSummaryRows(
    elements.reviewSummary,
    summaryRows.length ? summaryRows : [{ label: "Nog leeg", value: "Begin bij stap 1 om je dossier op te bouwen." }],
  );

  const missing = getMissingItems();
  renderSummaryRows(
    elements.reviewMissing,
    missing.length
      ? missing.map((label) => ({ label: "Open punt", value: label }))
      : [{ label: "Compleetheidscheck", value: "Voor deze demo zijn alle verplichte onderdelen nu ingevuld." }],
  );
}

function renderNav() {
  const steps = getVisibleSteps();
  const currentIndex = steps.indexOf(state.currentStep);
  const eligible = isEligible(state.eligibility);
  elements.prevButton.disabled = !eligible || currentIndex <= 0;
  elements.nextButton.disabled = !eligible || currentIndex === steps.length - 1;

  if (!eligible) {
    elements.navNote.textContent = "Beantwoord eerst de geschiktheidscheck om de wizard te activeren.";
    return;
  }

  if (state.currentStep === "review") {
    elements.navNote.textContent = "Je kunt nu exporteren of teruggaan om nog onderdelen aan te vullen.";
    return;
  }

  elements.navNote.textContent = "De demo bewaart je voortgang lokaal op dit apparaat.";
}

function renderSaveStatus() {
  if (!state.savedAt) {
    elements.saveStatus.textContent = "Nog niet opgeslagen";
    return;
  }

  const formatted = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(state.savedAt));
  elements.saveStatus.textContent = `${state.saveMessage || "Automatisch opgeslagen"} om ${formatted}`;
}

function validateStep(stepId) {
  clearInvalid(stepId);
  let valid = true;

  for (const requirement of requiredFields[stepId] || []) {
    if (!hasValue(requirement.name)) {
      markInvalid(requirement.name);
      valid = false;
    }
  }

  return valid;
}

function isStepComplete(stepId) {
  if (!isEligible(state.eligibility)) {
    return false;
  }

  if (stepId === "review") {
    return getVisibleSteps()
      .filter((step) => step !== "review")
      .every((step) => isStepComplete(step));
  }

  return (requiredFields[stepId] || []).every((requirement) => hasValue(requirement.name));
}

function getMissingItems() {
  const steps = getVisibleSteps();
  const items = [];

  for (const step of steps) {
    for (const requirement of requiredFields[step] || []) {
      if (!hasValue(requirement.name)) {
        items.push(requirement.label);
      }
    }
  }

  return [...new Set(items)];
}

function getVisibleSteps() {
  const route = state.fields.routeChoice;
  const branchStep = route === "secondary" ? "secondary" : "replace";
  return ["project", "windows", "condition", "choice", branchStep, "review"];
}

function syncCurrentStepWithRoute() {
  const steps = getVisibleSteps();
  if (!steps.includes(state.currentStep)) {
    state.currentStep = steps[Math.min(steps.length - 2, 4)] || "project";
  }
}

function readEligibility() {
  return {
    inZeist: document.querySelector('[name="inZeist"]').value,
    heritageScope: document.querySelector('[name="heritageScope"]').value,
    measureScope: document.querySelector('[name="measureScope"]').value,
  };
}

function readFields() {
  const nextFields = {};
  const formData = new FormData(elements.form);

  for (const [name, value] of formData.entries()) {
    const input = elements.form.elements.namedItem(name);
    if (input?.type === "file") {
      continue;
    }
    nextFields[name] = typeof value === "string" ? value.trim() : value;
  }

  for (const checkbox of elements.form.querySelectorAll('input[type="checkbox"]')) {
    nextFields[checkbox.name] = checkbox.checked;
  }

  return {
    ...state.fields,
    ...nextFields,
  };
}

function applyStateToForm() {
  for (const [key, value] of Object.entries(state.eligibility)) {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) {
      input.value = value || "";
    }
  }

  for (const [key, value] of Object.entries(state.fields)) {
    const input = elements.form.elements.namedItem(key);
    if (!input) {
      continue;
    }

    if (input instanceof RadioNodeList) {
      continue;
    }

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
      continue;
    }

    if (input.type === "file") {
      continue;
    }

    input.value = value ?? "";
  }
}

function loadState() {
  const stored = localStorage.getItem(storageKey);
  const fallback = {
    currentStep: "project",
    eligibility: {
      inZeist: "",
      heritageScope: "",
      measureScope: "",
    },
    fields: {
      facadePhotoReady: false,
      insidePhotosReady: false,
      outsidePhotosReady: false,
      existingSketchReady: false,
      newSketchReady: false,
      routeChoice: "",
    },
    files: {},
    savedAt: 0,
    saveMessage: "",
  };

  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      ...fallback,
      ...parsed,
      eligibility: {
        ...fallback.eligibility,
        ...(parsed.eligibility || {}),
      },
      fields: {
        ...fallback.fields,
        ...(parsed.fields || {}),
      },
      files: parsed.files && typeof parsed.files === "object" ? parsed.files : {},
    };
  } catch {
    localStorage.removeItem(storageKey);
    return fallback;
  }
}

function persistState(message = "Automatisch opgeslagen") {
  state.savedAt = Date.now();
  state.saveMessage = message;
  localStorage.setItem(storageKey, JSON.stringify(state));
  renderSaveStatus();
}

function isEligible(eligibility) {
  return (
    eligibility.inZeist === "ja" &&
    ["rijksmonument", "gemeentelijk-monument", "beschermd-gezicht"].includes(eligibility.heritageScope) &&
    eligibility.measureScope === "ja"
  );
}

function hasValue(name) {
  const value = state.fields[name];
  if (typeof value === "boolean") {
    return value;
  }

  return Boolean(String(value || "").trim());
}

function markInvalid(name) {
  const input = elements.form.elements.namedItem(name);
  const field = input?.closest(".glass-field, .glass-upload, .glass-check");
  field?.classList.add("is-invalid");
}

function clearInvalid(stepId) {
  const panel = document.querySelector(`[data-step-panel="${stepId}"]`);
  panel?.querySelectorAll(".is-invalid").forEach((node) => node.classList.remove("is-invalid"));
}

function renderSimpleList(container, items, emptyText) {
  container.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  for (const item of items) {
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
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = `check-item${item.done ? " is-done" : ""}`;
    row.innerHTML = `
      <span class="material-symbols-outlined">${item.done ? "task_alt" : "radio_button_unchecked"}</span>
      <span>${item.label}</span>
    `;
    container.appendChild(row);
  }
}

function renderSummaryRows(container, rows) {
  container.innerHTML = "";
  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "glass-summary-row";
    item.innerHTML = `
      <strong>${escapeHtml(row.label)}</strong>
      <span>${escapeHtml(row.value)}</span>
    `;
    container.appendChild(item);
  }
}

function formatAttachmentLabel(item) {
  const filenames = state.files[item.fileKey] || [];
  if (!state.fields[item.key]) {
    return item.label;
  }
  return filenames.length ? `${item.label} - ${filenames.join(", ")}` : `${item.label} - voorbereid`;
}

function exportDossier() {
  if (!isEligible(state.eligibility)) {
    elements.navNote.textContent = "Alleen een passende demo-route kan worden geëxporteerd.";
    return;
  }

  const rows = [
    ...summaryMeta
      .map((item) => ({ label: item.label, value: item.value(state.fields) || "Nog niet ingevuld" })),
    { label: "Huidige route", value: routeLabel(state.fields.routeChoice) || "Nog niet gekozen" },
    { label: "Ventilatie", value: labelFromOption("ventilationCurrent", state.fields.ventilationCurrent) || "Nog niet ingevuld" },
    { label: "Technische staat", value: state.fields.technicalState || "Nog niet ingevuld" },
  ];

  const attachments = attachmentMeta
    .filter((item) => !item.branch || item.branch === state.fields.routeChoice)
    .map((item) => ({
      label: item.label,
      value: state.fields[item.key]
        ? (state.files[item.fileKey] || []).join(", ") || "Voorbereid in deze demo"
        : "Nog open",
    }));

  const missing = getMissingItems();
  const exportWindow = window.open("", "_blank");
  if (!exportWindow) {
    elements.navNote.textContent = "De browser blokkeert het exportvenster. Sta pop-ups tijdelijk toe en probeer opnieuw.";
    return;
  }

  exportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="utf-8" />
      <title>Conceptdossier glasisolatie Zeist</title>
      <style>
        body { font-family: Georgia, serif; margin: 32px; color: #1f2421; }
        h1, h2 { margin-bottom: 8px; }
        p { line-height: 1.6; }
        .meta { color: #5f675f; margin-bottom: 24px; }
        .grid { display: grid; gap: 10px; margin: 18px 0 28px; }
        .row { display: grid; grid-template-columns: 220px 1fr; gap: 16px; padding: 10px 12px; border: 1px solid #d8d0c4; border-radius: 12px; }
        .label { font-weight: 700; }
        ul { margin-top: 10px; }
        .note { margin-top: 28px; padding: 14px 16px; border: 1px solid #d8d0c4; border-radius: 12px; background: #f6f0e8; }
      </style>
    </head>
    <body>
      <h1>Conceptdossier glasisolatie in Zeist</h1>
      <p class="meta">Gegenereerd vanuit de demo-subpagina van Monumentenverkenner. Dit document vervangt de formele aanvraag in het Omgevingsloket niet.</p>

      <h2>Samenvatting</h2>
      <div class="grid">
        ${rows
          .map(
            (row) => `
              <div class="row">
                <div class="label">${escapeHtml(row.label)}</div>
                <div>${escapeHtml(row.value)}</div>
              </div>`,
          )
          .join("")}
      </div>

      <h2>Bijlagen en voorbereide stukken</h2>
      <div class="grid">
        ${attachments
          .map(
            (row) => `
              <div class="row">
                <div class="label">${escapeHtml(row.label)}</div>
                <div>${escapeHtml(row.value)}</div>
              </div>`,
          )
          .join("")}
      </div>

      <h2>Open punten</h2>
      ${missing.length ? `<ul>${missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>Alle verplichte demo-onderdelen zijn nu ingevuld.</p>"}

      <div class="note">
        <strong>Bronnen voor deze demo</strong>
        <p>De route is gebaseerd op het glasformulier, de toelichting, de Zeister regeling en relevante venster- en achterzetraam-hulp uit <em>Een warme jas voor oude huizen</em>.</p>
      </div>
      <script>window.print()</script>
    </body>
    </html>
  `);
  exportWindow.document.close();
}

function routeLabel(route) {
  if (route === "replace") {
    return "Bestaand glas vervangen";
  }
  if (route === "secondary") {
    return "Achterzetramen plaatsen";
  }
  return "";
}

function getBranchStepLabel() {
  if (state.fields.routeChoice === "replace") {
    return "Techniek glas vervangen";
  }
  if (state.fields.routeChoice === "secondary") {
    return "Techniek achterzetramen";
  }
  return "Technische uitwerking";
}

function labelFromOption(name, value) {
  if (!value) {
    return "";
  }
  const input = document.querySelector(`[name="${name}"]`);
  const option = input?.querySelector(`option[value="${CSS.escape(value)}"]`);
  return option?.textContent || value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
