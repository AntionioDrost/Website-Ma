const storageKey = "glasisolatie-demo-state-v2";

const stepMeta = {
  eligibility: {
    label: "Geschiktheidscheck",
    railLabel: "Check",
    subtitle: "We controleren eerst of deze demo-route past bij jouw pand en maatregel.",
  },
  project: {
    label: "Pand en aanvrager",
    railLabel: "Pand en\naanvrager",
    subtitle: "We leggen eerst de basis van het pand en de contactgegevens vast.",
  },
  windows: {
    label: "Vensters",
    railLabel: "Vensters",
    subtitle: "Nu gaat het alleen om de plek, gevel en foto's van de relevante vensters.",
  },
  condition: {
    label: "Bestaande toestand",
    railLabel: "Bestaande\nsituatie",
    subtitle: "Hier kijken we naar ventilatie, onderhoud en de huidige staat van het venster.",
  },
  choice: {
    label: "Glas en route",
    railLabel: "Glas en\nroute",
    subtitle: "In deze stap kies je de oplossingsrichting die de rest van het dossier bepaalt.",
  },
  replace: {
    label: "Techniek glas vervangen",
    railLabel: "Glas\nvervangen",
    subtitle: "Alleen de technische uitwerking voor glasvervanging blijft nu in beeld.",
  },
  secondary: {
    label: "Techniek achterzetramen",
    railLabel: "Achterzet-\nramen",
    subtitle: "Alleen de technische uitwerking voor achterzetramen blijft nu in beeld.",
  },
  review: {
    label: "Controle en dossier",
    railLabel: "Controle",
    subtitle: "Hier zie je wat al compleet is en wat nog openstaat voordat je exporteert.",
  },
  submit: {
    label: "Verzoek indienen",
    railLabel: "Verzoek\nindienen",
    subtitle: "Deze laatste stap is alvast voorbereid voor een latere koppeling met de Omgevingswet API.",
  },
};

const requiredFields = {
  eligibility: [
    { name: "inZeist", label: "Ligging in Zeist" },
    { name: "heritageScope", label: "Bescherming" },
    { name: "measureScope", label: "Glasisolatie" },
  ],
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
    { name: "outsidePhotosReady", label: "Buitenfoto's" },
    { name: "insidePhotosReady", label: "Binnenfoto's" },
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
  submit: [],
};

const attachmentMeta = [
  { key: "facadePhotoReady", label: "Overzichtsfoto van de gevel", fileKey: "facadePhoto" },
  { key: "outsidePhotosReady", label: "Foto's van het venster buiten", fileKey: "outsidePhotos" },
  { key: "insidePhotosReady", label: "Detailfoto's van binnen", fileKey: "insidePhotos" },
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

const demoHouseProfiles = [
  {
    id: "slotlaan-12",
    title: "Demo-huisdossier Slotlaan 12",
    source: "Lokale demo-profielkaart totdat Supabase is gekoppeld.",
    addressTokens: ["slotlaan 12", "zeist"],
    eligibility: {
      inZeist: "ja",
      heritageScope: "gemeentelijk-monument",
      measureScope: "ja",
    },
    summary: [
      "Gemeentelijk monument in Zeist",
      "Voorgevel met zes vergelijkbare vensters",
      "Adviesroute start bij achterzetramen",
    ],
    fields: {
      applicantName: "Marieke van Dijk",
      ownerName: "Familie Van Dijk",
      propertyAddress: "Slotlaan 12, 3701 GP Zeist",
      monumentType: "gemeentelijk-monument",
      phoneNumber: "030 700 12 12",
      emailAddress: "bewoner@voorbeeld.nl",
      facade: "voorgevel",
      windDirection: "zuid",
      windowCount: "6",
      windowCharacter: "Slanke roeden en bestaand enkel glas",
      glassTypeCurrent: "enkel-glas",
      routeChoice: "secondary",
      mainGoal: "Meer comfort zonder het buitenbeeld van het venster te verliezen.",
    },
  },
  {
    id: "driebergsestraatweg-18",
    title: "Demo-huisdossier Driebergseweg 18",
    source: "Lokale demo-profielkaart totdat Supabase is gekoppeld.",
    addressTokens: ["drieberg", "18", "zeist"],
    eligibility: {
      inZeist: "ja",
      heritageScope: "rijksmonument",
      measureScope: "ja",
    },
    summary: [
      "Rijksmonument in Zeist",
      "Technische route glasvervanging als verkenning",
      "Basiscontact en adresgegevens bekend",
    ],
    fields: {
      applicantName: "Jan de Graaf",
      ownerName: "Jan de Graaf",
      propertyAddress: "Driebergseweg 18, 3708 JD Zeist",
      monumentType: "rijksmonument",
      phoneNumber: "06 1456 7788",
      emailAddress: "jandegraaf@voorbeeld.nl",
      glassTypeCurrent: "dubbel-glas",
      routeChoice: "replace",
      mainGoal: "Tocht verminderen en het comfort in de werkruimte verbeteren.",
    },
  },
];

const houseProfileRepository = {
  // This local data source mirrors the future Supabase integration point.
  async findByAddress(normalizedAddress) {
    if (!normalizedAddress) {
      return null;
    }

    const profile = demoHouseProfiles.find((candidate) =>
      candidate.addressTokens.every((token) => normalizedAddress.includes(token)),
    );

    return profile ? cloneValue(profile) : null;
  },
};

const futureSubmissionApi = {
  enabled: false,
  documentationUrl: "https://developer.omgevingswet.overheid.nl/api-register/api/verzoek-indienen/",
  version: "v5",
  environments: {
    preProduction: "https://service.pre.omgevingswet.overheid.nl/publiek/verzoeken/api/indienen/v5/",
    production: "https://service.omgevingswet.overheid.nl/publiek/verzoeken/api/indienen/v5/",
  },
  auth: {
    type: "access-token",
    flow: "OpenID Connect 2.0 Authorization Code Flow",
    provider: "DSO Identity Server",
  },
  processSteps: ["initieren", "documenten-toevoegen", "indienen"],
};

const elements = {
  demoProgressBar: document.querySelector("#demo-progress-bar"),
  demoStage: document.querySelector("#demo-stage"),
  eligibilityInputs: [...document.querySelectorAll("[data-eligibility]")],
  eligibilityResult: document.querySelector("#eligibility-result"),
  exportButton: document.querySelector("#export-dossier"),
  form: document.querySelector("#glass-demo-form"),
  loadDemoHouseProfileButton: document.querySelector("#load-demo-house-profile"),
  navNote: document.querySelector("#nav-note"),
  nextButton: document.querySelector("#next-step"),
  prevButton: document.querySelector("#prev-step"),
  progressCountText: document.querySelector("#progress-count-text"),
  progressSubtitle: document.querySelector("#progress-subtitle"),
  progressTitle: document.querySelector("#progress-title"),
  reviewMissing: document.querySelector("#review-missing"),
  reviewSummary: document.querySelector("#review-summary"),
  routeChip: document.querySelector("#route-chip"),
  routeChoice: document.querySelector("#route-choice"),
  saveButton: document.querySelector("#save-progress"),
  saveStatus: document.querySelector("#save-status"),
  submitSummary: document.querySelector("#submit-summary"),
  submitTechPlan: document.querySelector("#submit-tech-plan"),
  stepAlert: document.querySelector("#step-alert"),
  stepCounter: document.querySelector("#step-counter"),
  stepList: document.querySelector("#step-list"),
  stepPanels: [...document.querySelectorAll("[data-step-panel]")],
  stepPrefill: document.querySelector("#step-prefill"),
  stepStatus: document.querySelector(".glass-step-status"),
  stepStage: document.querySelector("#step-stage"),
  stepViewport: document.querySelector("#step-viewport"),
  wizardPanel: document.querySelector("#wizard-panel"),
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let transitionTimer = 0;

const state = loadState();

applyStateToForm();
render();

window.addEventListener("resize", syncCarouselHeight);

for (const input of elements.eligibilityInputs) {
  input.addEventListener("change", handleEligibilityChange);
}

elements.form.addEventListener("input", handleFormMutation);
elements.form.addEventListener("change", handleFormChange);
elements.nextButton.addEventListener("click", goNext);
elements.prevButton.addEventListener("click", goPrev);
elements.saveButton.addEventListener("click", () => persistState("Handmatig opgeslagen"));
elements.exportButton.addEventListener("click", exportDossier);
elements.stepList.addEventListener("click", handleStepJump);
elements.loadDemoHouseProfileButton.addEventListener("click", loadDemoHouseProfile);

function handleEligibilityChange() {
  const wasEligible = isEligible(state.eligibility);
  state.eligibility = readEligibility();
  const nowEligible = isEligible(state.eligibility);

  if (nowEligible) {
    state.currentStep = state.currentStep === "eligibility" ? "project" : state.currentStep;
    state.touchedSteps.eligibility = true;
  } else {
    state.currentStep = "eligibility";
  }

  persistState();
  render();

  if (!wasEligible && nowEligible) {
    requestAnimationFrame(() => {
      elements.wizardPanel?.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }
}

function handleFormMutation(event) {
  if (event.target.type === "file" || event.target.dataset.eligibility !== undefined) {
    return;
  }

  syncFieldsFromForm(event.target);
  persistState();
  render();
}

function handleFormChange(event) {
  const { target } = event;

  if (target.dataset.eligibility !== undefined) {
    return;
  }

  if (target.type === "file") {
    state.files[target.name] = [...target.files].map((file) => file.name);
    markStepTouched(getStepFromInput(target.name));
    persistState();
    renderFileMeta();
    render();
    return;
  }

  syncFieldsFromForm(target);
  persistState();
  render();
}

function syncFieldsFromForm(target) {
  state.fields = readFields();
  if (target?.name) {
    markStepTouched(getStepFromInput(target.name));
    syncFieldOwnership(target.name);
  }
  syncCurrentStepWithRoute();
  void maybeLoadHouseProfileFromAddress();
}

function goNext() {
  if (!isEligible(state.eligibility)) {
    elements.navNote.textContent = "Deze demo wordt actief zodra de geschiktheidscheck binnen scope uitkomt.";
    return;
  }

  markStepTouched(state.currentStep);
  const isValid = validateStep(state.currentStep, true);
  const steps = getVisibleSteps();
  const currentIndex = steps.indexOf(state.currentStep);

  if (currentIndex >= steps.length - 1) {
    return;
  }

  if (!isValid) {
    elements.navNote.textContent = "Je kunt door, maar we hebben open punten in deze stap gemarkeerd.";
  }

  transitionToStep(steps[currentIndex + 1]);
}

function goPrev() {
  const steps = getVisibleSteps();
  const currentIndex = steps.indexOf(state.currentStep);
  if (currentIndex <= 0) {
    return;
  }
  transitionToStep(steps[currentIndex - 1]);
}

function handleStepJump(event) {
  const button = event.target.closest("[data-step-target]");
  if (!button || !isEligible(state.eligibility)) {
    return;
  }

  const targetStep = button.dataset.stepTarget;
  if (!getVisibleSteps().includes(targetStep)) {
    return;
  }

  markStepTouched(state.currentStep);
  transitionToStep(targetStep);
}

function transitionToStep(nextStep) {
  if (state.currentStep === nextStep) {
    return;
  }

  window.clearTimeout(transitionTimer);

  const commitStepChange = () => {
    state.currentStep = nextStep;
    persistState();
    render();
    focusActiveStep();
  };

  if (prefersReducedMotion.matches) {
    commitStepChange();
    return;
  }

  elements.stepStage.classList.add("is-transitioning");
  requestAnimationFrame(() => {
    commitStepChange();
    transitionTimer = window.setTimeout(() => {
      elements.stepStage.classList.remove("is-transitioning");
    }, 180);
  });
}

function focusActiveStep() {
  elements.stepViewport?.focus?.();
  elements.wizardPanel?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });
}

function loadDemoHouseProfile() {
  applyHouseProfile(demoHouseProfiles[0], "manual");
  applyStateToForm();
  state.currentStep = "project";
  markStepTouched("project");
  persistState("Demo-huisdossier geladen");
  render();
}

async function maybeLoadHouseProfileFromAddress() {
  const normalizedAddress = normalizeValue(state.fields.propertyAddress);

  if (normalizedAddress === state.lastProfileQuery) {
    return;
  }

  state.lastProfileQuery = normalizedAddress;
  const requestId = (state.houseProfileRequestId || 0) + 1;
  state.houseProfileRequestId = requestId;
  const profile = await houseProfileRepository.findByAddress(normalizedAddress);

  if (state.houseProfileRequestId !== requestId) {
    return;
  }

  if (!profile) {
    if (state.houseProfile?.mode === "address") {
      clearHouseProfileState();
      persistState();
      render();
    }
    return;
  }

  applyHouseProfile(profile, "address");
  applyStateToForm();
  persistState("Huisdossier geladen");
  render();
}

function applyHouseProfile(profile, mode) {
  const nextProfile = {
    ...cloneValue(profile),
    mode,
    appliedAt: Date.now(),
  };

  state.houseProfile = nextProfile;
  if (nextProfile.eligibility) {
    state.eligibility = {
      ...state.eligibility,
      ...nextProfile.eligibility,
    };
  }

  for (const [name, value] of Object.entries(nextProfile.fields)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const manuallyEdited = Boolean(state.editedByUser[name]);
    const currentValue = state.fields[name];
    const hasCurrentValue = hasRawValue(currentValue);

    if (!manuallyEdited || !hasCurrentValue) {
      state.fields[name] = value;
      state.fieldSources[name] = "houseProfile";
      delete state.editedByUser[name];
    }
  }

  syncCurrentStepWithRoute();
}

function clearHouseProfileState() {
  state.houseProfile = null;
  for (const [name, source] of Object.entries(state.fieldSources)) {
    if (source === "houseProfile") {
      state.fieldSources[name] = "default";
    }
  }
}

function syncFieldOwnership(name) {
  if (!name) {
    return;
  }

  const profileValue = state.houseProfile?.fields?.[name];
  const currentValue = state.fields[name];

  if (profileValue !== undefined) {
    if (String(currentValue ?? "") === String(profileValue ?? "")) {
      state.fieldSources[name] = "houseProfile";
      delete state.editedByUser[name];
      return;
    }

    state.fieldSources[name] = hasRawValue(currentValue) ? "user" : "default";
    state.editedByUser[name] = true;
    return;
  }

  state.fieldSources[name] = hasRawValue(currentValue) ? "user" : "default";
}

function render() {
  syncCurrentStepWithRoute();
  renderEligibility();
  renderStepPanels();
  renderProgress();
  renderStepStatus();
  renderFileMeta();
  renderReview();
  renderFutureSubmission();
  renderNav();
  renderSaveStatus();
  renderFieldSources();
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
      <strong>Je komt in aanmerking voor deze route.</strong>
      <p class="card-text">Dit geldt voor glasisolatie in Zeist bij een rijksmonument, gemeentelijk monument of pand in beschermd gezicht. Je kunt nu door naar <em>Pand en aanvrager</em>.</p>
    `;
    return;
  }

  if (resolved === "fail") {
    elements.eligibilityResult.classList.add("is-fail");
    elements.eligibilityResult.innerHTML = `
      <strong>Deze demo is nu niet de juiste route.</strong>
      <p class="card-text">De huidige demonstratie is alleen bedoeld voor glasisolatie in Zeist bij een rijksmonument, gemeentelijk monument of pand in beschermd gezicht. Kies je daarbuiten, dan blijft de wizard geblokkeerd.</p>
    `;
    return;
  }

  elements.eligibilityResult.innerHTML = `
    <p class="card-text">Beantwoord eerst deze drie vragen. Deze route is bedoeld voor glasisolatie in Zeist bij een rijksmonument, gemeentelijk monument of pand in beschermd gezicht.</p>
  `;
}

function renderStepPanels() {
  const steps = getVisibleSteps();
  const currentIndex = Math.max(steps.indexOf(state.currentStep), 0);
  let activePanel = null;

  for (const panel of elements.stepPanels) {
    const stepId = panel.dataset.stepPanel;
    const visible = steps.includes(stepId);
    const active = stepId === state.currentStep;
    panel.hidden = !visible;
    panel.classList.toggle("is-active", active);
    panel.setAttribute("aria-hidden", visible && active ? "false" : "true");
    panel.inert = !active;

    if (active) {
      activePanel = panel;
    }
  }

  elements.stepStage.style.transform = `translateX(-${currentIndex * 100}%)`;
  elements.stepViewport?.setAttribute("aria-label", `${stepLabel(state.currentStep)} in beeld`);
  syncCarouselHeight(activePanel);
}

function syncCarouselHeight(activePanel = elements.stepStage?.querySelector(".glass-step-panel.is-active")) {
  if (!elements.stepViewport || !activePanel) {
    return;
  }

  const nextHeight = Math.ceil(activePanel.getBoundingClientRect().height);
  elements.stepViewport.style.height = `${nextHeight}px`;
}

function getConnectorStatus(step, index, currentIndex) {
  if (isStepComplete(step)) {
    return "done";
  }

  if (index < currentIndex) {
    return "open";
  }

  return "future";
}

function renderProgress() {
  const steps = getVisibleSteps();
  const completed = steps.filter((step) => isStepComplete(step)).length;
  const currentIndex = Math.max(steps.indexOf(state.currentStep), 0);
  const fillRatio = steps.length > 1 ? currentIndex / (steps.length - 1) : 1;
  const currentMeta = stepMeta[state.currentStep] || stepMeta.eligibility;

  elements.demoProgressBar.style.width = `${Math.max(0, Math.min(fillRatio, 1)) * 100}%`;
  elements.progressCountText.textContent = `${completed} / ${steps.length} klaar`;
  elements.demoStage.textContent = currentMeta.label;
  elements.progressTitle.textContent = currentMeta.label;
  elements.progressSubtitle.textContent = currentMeta.subtitle;
  elements.routeChip.textContent = routeLabel(state.fields.routeChoice) || "Route nog niet gekozen";
  elements.stepCounter.textContent = `Stap ${Math.max(currentIndex + 1, 1)} van ${steps.length}`;

  elements.stepList.innerHTML = "";

  for (const [index, step] of steps.entries()) {
    const status = getStepRailStatus(step, index, currentIndex);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.stepTarget = step;
    button.className = `glass-step-node is-${status}`;
    button.setAttribute("aria-current", status === "active" ? "step" : "false");
    const fullLabel = stepLabel(step);
    const railLabel = stepRailLabel(step);
    button.setAttribute("aria-label", `${fullLabel}${status === "done" ? ", afgerond" : status === "active" ? ", huidige stap" : ""}`);
    button.title = fullLabel;
    button.innerHTML = `
      <span class="glass-step-bullet">
        ${
          status === "done"
            ? '<span class="material-symbols-outlined">check</span>'
            : `<span class="glass-step-number">${index + 1}</span>`
        }
      </span>
      <span class="glass-step-text">${escapeHtml(railLabel)}</span>
    `;
    elements.stepList.appendChild(button);

    if (index < steps.length - 1) {
      const connectorStatus = getConnectorStatus(step, index, currentIndex);
      const arrow = document.createElement("span");
      arrow.className = `glass-step-arrow is-${connectorStatus}`;
      arrow.innerHTML = `<span class="material-symbols-outlined">east</span>`;
      elements.stepList.appendChild(arrow);
    }
  }
}

function renderStepStatus() {
  const missingItems = getStepMissingItems(state.currentStep);
  const touched = Boolean(state.touchedSteps[state.currentStep]);
  const houseFields = getHouseProfileFieldsForStep(state.currentStep);

  if (missingItems.length && touched) {
    elements.stepAlert.hidden = false;
    elements.stepAlert.innerHTML = `
      <strong>Deze stap is nog niet rond.</strong>
      <span>Er missen nog ${missingItems.length} onderdelen: ${escapeHtml(missingItems.slice(0, 3).join(", "))}${missingItems.length > 3 ? "..." : ""}</span>
    `;
  } else {
    elements.stepAlert.hidden = true;
    elements.stepAlert.innerHTML = "";
  }

  if (houseFields.length) {
    elements.stepPrefill.hidden = false;
    elements.stepPrefill.innerHTML = `
      <span class="material-symbols-outlined">database</span>
      <span>${houseFields.length} velden in deze stap zijn vooringevuld uit het huisdossier.</span>
    `;
  } else {
    elements.stepPrefill.hidden = true;
    elements.stepPrefill.innerHTML = "";
  }

  if (elements.stepStatus) {
    elements.stepStatus.hidden = elements.stepAlert.hidden && elements.stepPrefill.hidden;
  }
}

function renderFieldSources() {
  for (const field of elements.form.querySelectorAll(".glass-field")) {
    field.classList.remove("is-prefilled", "is-edited");
    field.querySelectorAll(".field-source-badge, .field-source-note").forEach((node) => node.remove());
  }

  for (const input of elements.form.querySelectorAll("input, select, textarea")) {
    if (!input.name || input.type === "file") {
      continue;
    }

    const wrapper = input.closest(".glass-field");
    if (!wrapper) {
      continue;
    }

    const source = state.fieldSources[input.name];
    const label = wrapper.querySelector("span");
    if (!label) {
      continue;
    }

    if (source === "houseProfile") {
      wrapper.classList.add("is-prefilled");
      label.insertAdjacentHTML("beforeend", '<em class="field-source-badge">Huisdossier</em>');
      wrapper.insertAdjacentHTML("beforeend", '<small class="field-source-note">Automatisch ingevuld uit een gevonden huisprofiel.</small>');
      continue;
    }

    if (state.editedByUser[input.name] && state.houseProfile?.fields?.[input.name] !== undefined) {
      wrapper.classList.add("is-edited");
      wrapper.insertAdjacentHTML("beforeend", '<small class="field-source-note">Handmatig aangepast na voorinvulling.</small>');
    }
  }
}

function renderFileMeta() {
  for (const meta of document.querySelectorAll("[data-file-meta]")) {
    const field = meta.dataset.fileMeta;
    const names = state.files[field] || [];
    meta.textContent = names.length ? `Lokaal onthouden: ${names.join(", ")}` : "Nog geen bestand gekozen";
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

function renderFutureSubmission() {
  const draft = buildFutureSubmissionDraft();

  renderSummaryRows(elements.submitSummary, [
    { label: "Status", value: draft.enabled ? "Live koppeling actief" : "Voorbereid, nog niet live" },
    { label: "Verzoektype", value: draft.requestType },
    { label: "Aanvrager", value: draft.applicantName || "Wordt overgenomen uit het dossier" },
    { label: "Locatie", value: draft.propertyAddress || "Wordt overgenomen uit het dossier" },
    { label: "Bijlagen", value: draft.attachmentCount ? `${draft.attachmentCount} voorbereid` : "Nog geen voorbereide bijlagen" },
  ]);

  renderSummaryRows(elements.submitTechPlan, [
    { label: "Authenticatie", value: `${futureSubmissionApi.auth.provider}, ${futureSubmissionApi.auth.flow}` },
    { label: "Endpoint", value: futureSubmissionApi.version },
    { label: "Proces", value: "Initieren, documenten toevoegen, indienen" },
    { label: "Conceptstatus", value: draft.isReadyForSubmission ? "Dossier is klaar voor een toekomstige submitflow" : "Werk eerst verplichte onderdelen af" },
    { label: "Payload", value: "Conceptpayload en veldmapping zijn lokaal voorbereid" },
  ]);
}

function renderNav() {
  const steps = getVisibleSteps();
  const currentIndex = steps.indexOf(state.currentStep);
  const eligible = isEligible(state.eligibility);
  const currentMissing = getStepMissingItems(state.currentStep);
  const globalMissing = getMissingItems();

  elements.prevButton.disabled = currentIndex <= 0;
  elements.nextButton.disabled = (!eligible && state.currentStep === "eligibility") || currentIndex === steps.length - 1;

  if (state.currentStep === "eligibility" && !eligible) {
    elements.navNote.textContent = "Beantwoord eerst de geschiktheidscheck om de wizard te activeren.";
    return;
  }

  if (state.currentStep === "review") {
    elements.navNote.textContent = globalMissing.length
      ? "Je kunt nu terugspringen naar open punten. Exporteren blijft geblokkeerd totdat de verplichte onderdelen rond zijn."
      : "Je dossier is compleet genoeg voor een concept-export.";
    return;
  }

  if (state.currentStep === "submit") {
    elements.navNote.textContent = futureSubmissionApi.enabled
      ? "Deze stap kan straks het verzoek digitaal versturen."
      : "Deze stap is alvast voorbereid voor de toekomstige Omgevingswet-koppeling.";
    return;
  }

  if (currentMissing.length && state.touchedSteps[state.currentStep]) {
    elements.navNote.textContent = "Je kunt verder, maar deze stap heeft nog open punten.";
    return;
  }

  elements.navNote.textContent = "Je kunt vrij springen tussen stappen. De demo bewaart je voortgang lokaal op dit apparaat.";
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

function validateStep(stepId, showErrors = false) {
  if (stepId === "eligibility") {
    return isEligible(state.eligibility);
  }

  clearInvalid(stepId);
  let valid = true;

  for (const requirement of requiredFields[stepId] || []) {
    if (!hasValue(requirement.name)) {
      valid = false;
      if (showErrors) {
        markInvalid(requirement.name);
      }
    }
  }

  return valid;
}

function isStepComplete(stepId) {
  if (stepId === "eligibility") {
    return isEligible(state.eligibility);
  }

  if (!isEligible(state.eligibility)) {
    return false;
  }

  if (stepId === "review") {
    return getVisibleSteps()
      .filter((step) => !["review", "submit"].includes(step))
      .every((step) => isStepComplete(step));
  }

  if (stepId === "submit") {
    return isEligible(state.eligibility) && getMissingItems().length === 0;
  }

  return (requiredFields[stepId] || []).every((requirement) => hasValue(requirement.name));
}

function getMissingItems() {
  const items = [];

  for (const step of getVisibleSteps()) {
    for (const requirement of requiredFields[step] || []) {
      if (!hasValue(requirement.name)) {
        items.push(requirement.label);
      }
    }
  }

  return [...new Set(items)];
}

function getStepMissingItems(stepId) {
  return (requiredFields[stepId] || [])
    .filter((requirement) => !hasValue(requirement.name))
    .map((requirement) => requirement.label);
}

function getVisibleSteps() {
  const route = state.fields.routeChoice;
  const branchStep = route === "secondary" ? "secondary" : "replace";
  return ["eligibility", "project", "windows", "condition", "choice", branchStep, "review", "submit"];
}

function syncCurrentStepWithRoute() {
  const steps = getVisibleSteps();
  if (!isEligible(state.eligibility) && state.currentStep !== "eligibility") {
    state.currentStep = "eligibility";
    return;
  }

  if (!steps.includes(state.currentStep)) {
    state.currentStep = steps[steps.length - 2] || "project";
  }
}

function readEligibility() {
  return {
    inZeist: getFieldValue("inZeist"),
    heritageScope: getFieldValue("heritageScope"),
    measureScope: getFieldValue("measureScope"),
  };
}

function readFields() {
  const nextFields = {};
  const formData = new FormData(elements.form);

  for (const [name, value] of formData.entries()) {
    const input = elements.form.elements.namedItem(name);
    if (input?.type === "file" || input?.dataset?.eligibility !== undefined) {
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
    if (!input || input instanceof RadioNodeList) {
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
    currentStep: "eligibility",
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
    fieldSources: {},
    editedByUser: {},
    touchedSteps: {},
    houseProfile: null,
    houseProfileRequestId: 0,
    lastProfileQuery: "",
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
      fieldSources: parsed.fieldSources && typeof parsed.fieldSources === "object" ? parsed.fieldSources : {},
      editedByUser: parsed.editedByUser && typeof parsed.editedByUser === "object" ? parsed.editedByUser : {},
      touchedSteps: parsed.touchedSteps && typeof parsed.touchedSteps === "object" ? parsed.touchedSteps : {},
      houseProfile: parsed.houseProfile || null,
      houseProfileRequestId: 0,
      lastProfileQuery: parsed.lastProfileQuery || "",
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
  if (Object.hasOwn(state.eligibility, name)) {
    return hasRawValue(state.eligibility[name]);
  }

  return hasRawValue(state.fields[name]);
}

function hasRawValue(value) {
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
      <span>${escapeHtml(item)}</span>
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
      <span>${escapeHtml(item.label)}</span>
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

function exportDossier() {
  if (!isEligible(state.eligibility)) {
    elements.navNote.textContent = "Alleen een passende demo-route kan worden geexporteerd.";
    return;
  }

  const missing = getMissingItems();
  if (missing.length) {
    const firstIncomplete = getVisibleSteps().find((step) => step !== "review" && !isStepComplete(step));
    if (firstIncomplete) {
      markStepTouched(firstIncomplete);
      state.currentStep = firstIncomplete;
      persistState();
      render();
      elements.navNote.textContent = "Werk eerst de verplichte open punten weg voordat je exporteert.";
    }
    return;
  }

  const rows = [
    ...summaryMeta.map((item) => ({ label: item.label, value: item.value(state.fields) || "Nog niet ingevuld" })),
    { label: "Huidige route", value: routeLabel(state.fields.routeChoice) || "Nog niet gekozen" },
    { label: "Ventilatie", value: labelFromOption("ventilationCurrent", state.fields.ventilationCurrent) || "Nog niet ingevuld" },
    { label: "Technische staat", value: state.fields.technicalState || "Nog niet ingevuld" },
  ];

  const attachments = attachmentMeta
    .filter((item) => !item.branch || item.branch === state.fields.routeChoice)
    .map((item) => ({
      label: item.label,
      value: state.fields[item.key] ? (state.files[item.fileKey] || []).join(", ") || "Voorbereid in deze demo" : "Nog open",
    }));

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

function getStepRailStatus(step, index, currentIndex) {
  if (step === state.currentStep) {
    return "active";
  }
  if (isStepComplete(step)) {
    return "done";
  }
  return index < currentIndex ? "open" : "future";
}

function stepStatusText(step, status) {
  if (status === "done") {
    return "klaar voor nu";
  }
  if (status === "active") {
    return "je werkt hier nu";
  }
  if (step === "review") {
    return "controle en export";
  }
  return "later invullen kan ook";
}

function stepLabel(step) {
  return step === "replace" || step === "secondary" ? getBranchStepLabel() : stepMeta[step].label;
}

function stepRailLabel(step) {
  if (step === "replace") {
    return state.fields.routeChoice === "replace" ? "Glas\nvervangen" : "Techniek";
  }
  if (step === "secondary") {
    return state.fields.routeChoice === "secondary" ? "Achterzet-\nramen" : "Techniek";
  }
  return stepMeta[step]?.railLabel || stepMeta[step]?.label || step;
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

function getHouseProfileFieldsForStep(stepId) {
  return (requiredFields[stepId] || [])
    .map((requirement) => requirement.name)
    .filter((name) => state.fieldSources[name] === "houseProfile");
}

function getAppliedHouseProfileFields() {
  return Object.entries(state.fieldSources)
    .filter(([, source]) => source === "houseProfile")
    .map(([name]) => name);
}

function markStepTouched(stepId) {
  if (!stepId) {
    return;
  }
  state.touchedSteps[stepId] = true;
}

function getStepFromInput(name) {
  for (const [stepId, requirements] of Object.entries(requiredFields)) {
    if (requirements.some((item) => item.name === name)) {
      return stepId;
    }
  }

  if (["ownerName", "phoneNumber"].includes(name)) {
    return "project";
  }
  if (["windowCharacter", "facadePhoto"].includes(name)) {
    return "windows";
  }
  if (["shutterState", "outsidePhotos", "insidePhotos"].includes(name)) {
    return "condition";
  }
  if (["muntinWidth", "measureR", "measureB", "measureD", "millingPossible", "openingTypeNew", "draughtNew", "quoteInfo", "existingSketch", "newSketch"].includes(name)) {
    return "replace";
  }
  if (["secondaryDraught", "secondaryQuote"].includes(name)) {
    return "secondary";
  }
  return "";
}

function lookupHouseProfile(normalizedAddress) {
  if (!normalizedAddress) {
    return null;
  }

  const profile = demoHouseProfiles.find((candidate) =>
    candidate.addressTokens.every((token) => normalizedAddress.includes(token)),
  );

  return profile ? cloneValue(profile) : null;
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

function buildFutureSubmissionDraft() {
  const attachmentCount = attachmentMeta
    .filter((item) => !item.branch || item.branch === state.fields.routeChoice)
    .filter((item) => state.fields[item.key])
    .length;

  return {
    requestType: "Aanvraag vergunning",
    applicantName: state.fields.applicantName,
    propertyAddress: state.fields.propertyAddress,
    route: routeLabel(state.fields.routeChoice) || "Nog niet gekozen",
    attachmentCount,
    isReadyForSubmission: isEligible(state.eligibility) && getMissingItems().length === 0,
    payload: buildFutureSubmissionPayload(),
  };
}

function buildFutureSubmissionPayload() {
  return {
    algemeneGegevens: {
      verzoekType: "Aanvraag vergunning",
      doel: "Initiëren",
    },
    aanvrager: {
      naam: state.fields.applicantName || "",
      email: state.fields.emailAddress || "",
      telefoon: state.fields.phoneNumber || "",
    },
    locatie: {
      adres: state.fields.propertyAddress || "",
      geometrie: null,
      bronlocatie: null,
    },
    activiteitContext: {
      monumentType: state.fields.monumentType || "",
      route: state.fields.routeChoice || "",
      hoofdDoel: state.fields.mainGoal || "",
    },
    bijlagen: attachmentMeta
      .filter((item) => !item.branch || item.branch === state.fields.routeChoice)
      .filter((item) => state.fields[item.key])
      .map((item) => ({
        label: item.label,
        files: state.files[item.fileKey] || [],
      })),
  };
}

function labelFromOption(name, value) {
  if (!value) {
    return "";
  }
  const input = document.querySelector(`[name="${name}"]`);
  const option = input?.querySelector(`option[value="${CSS.escape(value)}"]`);
  return option?.textContent || value;
}

function getFieldValue(name) {
  const input = document.querySelector(`[name="${name}"]`);
  return input?.value || "";
}

function normalizeValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
