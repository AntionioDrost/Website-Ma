import { attachLogoutButton, requireAuthPage } from "./auth.js";
import { hydrateDossier } from "./dossier-store.js";

const intakeStorageKey = "monument-app-state-v2";
const glassStorageKey = "glasisolatie-demo-state-v2";
const welcomeTourSeenKey = "monument-gids-welcome-tour-seen-v1";

const intakeProgressFields = [
  (profile) => Boolean(profile.street),
  (profile) => Boolean(profile.houseNumber),
  (profile) => Boolean(profile.postcode),
  (profile) => Boolean(profile.city || profile.municipality),
  (profile) => Boolean(profile.monumentStatus),
  (profile) => Boolean(profile.protectedValues),
  (profile) => Boolean(profile.currentUse),
  (profile) => Boolean(profile.measureDescription),
];

const stepLabels = {
  project: "Pand en aanvrager",
  windows: "Vensters",
  condition: "Bestaande toestand",
  choice: "Glas en route",
  replace: "Techniek glas vervangen",
  secondary: "Techniek achterzetramen",
  review: "Controle en dossier",
};

const elements = {
  authDisplayName: document.querySelector("#auth-display-name"),
  authEmail: document.querySelector("#auth-email"),
  glassTourCard: document.querySelector("#tour-glass-card"),
  greeting: document.querySelector("#thuis-greeting"),
  homeTourPanel: document.querySelector("#tour-home-panel"),
  intakeTourCard: document.querySelector("#tour-intake-card"),
  logoutButton: document.querySelector("#logout-button"),
  primaryTitle: document.querySelector("#thuis-primary-title"),
  primaryCopy: document.querySelector("#thuis-primary-copy"),
  primaryAction: document.querySelector("#thuis-primary-action"),
  secondaryAction: document.querySelector("#thuis-secondary-action"),
  sidebarFocus: document.querySelector("#thuis-sidebar-focus"),
  sidebarNote: document.querySelector("#thuis-sidebar-note"),
  statusList: document.querySelector("#thuis-status-list"),
  tourBack: document.querySelector("#tour-back"),
  tourClose: document.querySelector("#tour-close"),
  tourCopy: document.querySelector("#tour-copy"),
  tourDialog: document.querySelector("#welcome-tour"),
  tourKicker: document.querySelector("#tour-kicker"),
  tourNext: document.querySelector("#tour-next"),
  tourProgress: document.querySelector("#tour-progress"),
  tourSkip: document.querySelector("#tour-skip"),
  tourTitle: document.querySelector("#tour-title"),
};

let intakeState = createEmptyIntakeState();
let glassState = createEmptyGlassState();
let activeTourStep = 0;

const tourSteps = [
  {
    body: "Hier begint je dossier. Vanaf hier zie je wat je al hebt gedaan en wat een goede volgende stap is.",
    kicker: "Rondleiding, stap 1 van 3",
    target: () => elements.homeTourPanel,
    title: "Welkom in je startscherm",
  },
  {
    body: "Twijfel je ergens over? In de intakechat kun je gewoon in je eigen woorden vertellen wat er speelt. Wij helpen je daarna verder.",
    kicker: "Rondleiding, stap 2 van 3",
    target: () => elements.intakeTourCard,
    title: "Hier kun je gewoon beginnen",
  },
  {
    body: "Wil je iets rustig uitwerken, zoals glasisolatie? Dan helpt de wizard je stap voor stap door het proces heen.",
    kicker: "Rondleiding, stap 3 van 3",
    target: () => elements.glassTourCard,
    title: "Stap voor stap verder",
  },
];

initialize();

async function initialize() {
  try {
    const auth = await requireAuthPage();
    const [intakeResult, glassResult] = await Promise.all([
      hydrateDossier({
        dossierType: "intake",
        emptyState: createEmptyIntakeState,
        localKey: intakeStorageKey,
        title: "Intakechat",
      }),
      hydrateDossier({
        dossierType: "glass",
        emptyState: createEmptyGlassState,
        localKey: glassStorageKey,
        title: "Glaswizard",
      }),
    ]);

    intakeState = intakeResult.state;
    glassState = glassResult.state;

    const userLabel = auth.profile.display_name || auth.user?.email || "Gast";
    elements.authDisplayName.textContent = userLabel;
    elements.authEmail.textContent = auth.user?.email || "Gastmodus actief";

    if (auth.supabase) {
      attachLogoutButton(elements.logoutButton, elements.authEmail);
    } else {
      elements.logoutButton.hidden = true;
    }

    render(userLabel);
    maybeStartWelcomeTour();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Je thuisomgeving kon niet worden geladen.";
    elements.authDisplayName.textContent = "Fout bij laden";
    elements.authEmail.textContent = message;
  }
}

elements.tourBack?.addEventListener("click", () => {
  if (activeTourStep === 0) {
    return;
  }

  activeTourStep -= 1;
  renderTourStep();
});

elements.tourNext?.addEventListener("click", () => {
  if (activeTourStep >= tourSteps.length - 1) {
    closeWelcomeTour();
    return;
  }

  activeTourStep += 1;
  renderTourStep();
});

elements.tourSkip?.addEventListener("click", () => {
  closeWelcomeTour();
});

elements.tourClose?.addEventListener("click", () => {
  closeWelcomeTour();
});

elements.tourDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeWelcomeTour();
});

function render(name) {
  const preferredName = firstName(name) || getPreferredName();
  elements.greeting.textContent = preferredName ? `Welkom thuis, ${preferredName}` : "Welkom thuis";

  const routes = buildRoutes();
  const primaryRoute = routes[0];
  const secondaryRoute = routes[1];

  if (primaryRoute) {
    elements.primaryTitle.textContent = primaryRoute.headline;
    elements.primaryCopy.textContent = primaryRoute.copy;
    elements.primaryAction.href = primaryRoute.href;
    elements.primaryAction.innerHTML = `
      ${routeIconMarkup(primaryRoute.icon)}
      ${primaryRoute.cta}
    `;
    elements.sidebarFocus.textContent = primaryRoute.sidebarTitle;
    elements.sidebarNote.textContent = primaryRoute.sidebarNote;
  }

  if (secondaryRoute) {
    elements.secondaryAction.href = secondaryRoute.href;
    elements.secondaryAction.innerHTML = `
      ${routeIconMarkup(secondaryRoute.icon)}
      ${secondaryRoute.shortCta}
    `;
  }

  renderStatusList(routes);
}

function renderStatusList(routes) {
  elements.statusList.innerHTML = "";

  for (const route of routes) {
    const item = document.createElement("a");
    item.className = "app-home-status-card";
    item.href = route.href;
    item.innerHTML = `
      <div class="app-home-status-head">
        <strong>${escapeHtml(route.label)}</strong>
        <span>${escapeHtml(route.stateLabel)}</span>
      </div>
      <p>${escapeHtml(route.detail)}</p>
    `;
    elements.statusList.appendChild(item);
  }
}

function buildRoutes() {
  const intakeRoute = buildIntakeRoute();
  const glassRoute = buildGlassRoute();
  return [intakeRoute, glassRoute].sort((left, right) => right.priority - left.priority);
}

function buildIntakeRoute() {
  const profile = intakeState?.profile || {};
  const guidance = intakeState?.guidance || {};
  const completed = intakeProgressFields.filter((check) => check(profile)).length;
  const hasProgress = completed > 0 || (Array.isArray(intakeState?.messages) && intakeState.messages.length > 1);
  const stage = guidance.stage || "Basischeck";

  return {
    label: "Intakechat",
    href: "/intake",
    icon: "chat",
    priority: hasProgress ? 2 : 0,
    stateLabel: hasProgress ? `${completed} / 8 velden` : "Nog niet gestart",
    detail: hasProgress
      ? `${stage}. ${guidance.nextStep || "Ga verder met het dossier."}`
      : "Begin met een korte intake en verzamel eerst de basis.",
    headline: hasProgress ? "Ga verder met je intakechat" : "Start met je intakechat",
    copy: hasProgress
      ? `${completed} van de 8 kernvelden zijn al vastgelegd. Je kunt direct verder waar je gebleven was.`
      : "Gebruik de chat om rustig de basis van het pand, de vraag en de maatregel op te bouwen.",
    cta: hasProgress ? "Ga verder met intakechat" : "Start intakechat",
    shortCta: "Open intakechat",
    sidebarTitle: hasProgress ? "Intakechat staat klaar" : "Kies je startroute",
    sidebarNote: hasProgress ? `${stage}, je kunt meteen verder.` : "Begin met intake of spring direct naar de glaswizard.",
  };
}

function buildGlassRoute() {
  const fields = glassState?.fields || {};
  const eligibility = glassState?.eligibility || {};
  const currentStep = glassState?.currentStep || "project";
  const visibleSteps = getVisibleSteps(fields.routeChoice);
  const completed = countCompletedSteps(fields, eligibility, visibleSteps);
  const hasProgress =
    Boolean(fields.applicantName || fields.propertyAddress || fields.routeChoice) ||
    Boolean(glassState?.houseProfile);
  const stepLabel = stepLabels[currentStep] || "Glaswizard";

  return {
    label: "Glaswizard",
    href: "/glasisolatie-demo",
    icon: "window",
    priority: hasProgress ? 3 : 1,
    stateLabel: hasProgress ? `${completed} / ${visibleSteps.length} stappen` : "Nog niet gestart",
    detail: hasProgress ? `Nu bij ${stepLabel.toLowerCase()}.` : "Start een glasisolatieroute en werk per segment door het dossier.",
    headline: hasProgress ? "Ga verder met je glaswizard" : "Start met je glaswizard",
    copy: hasProgress
      ? `${completed} stappen zijn al rond. De wizard bewaart je voortgang en laat je vrij terugscrollen.`
      : "Werk een glasisolatiedossier stap voor stap uit, met voorinvulling vanuit het huisdossier zodra die bron is gekoppeld.",
    cta: hasProgress ? "Ga verder met glaswizard" : "Start glaswizard",
    shortCta: "Open glaswizard",
    sidebarTitle: hasProgress ? "Glaswizard staat klaar" : "Kies je startroute",
    sidebarNote: hasProgress ? `${stepLabel} is je volgende stap.` : "Kies intake of start direct aan het glasdossier.",
  };
}

function countCompletedSteps(fields, eligibility, visibleSteps) {
  if (!isEligible(eligibility)) {
    return 0;
  }

  const requiredFields = {
    project: ["applicantName", "propertyAddress", "monumentType", "emailAddress"],
    windows: ["facade", "windDirection", "windowCount", "facadePhotoReady"],
    condition: ["openingTypeCurrent", "draughtCurrent", "ventilationCurrent", "ventilationPlan", "technicalState", "outsidePhotosReady", "insidePhotosReady"],
    choice: ["glassTypeCurrent", "routeChoice", "mainGoal"],
    replace: ["glassWidth", "glassHeight", "measureT", "measureP", "measureS", "technicalOption", "chosenGlassUpgrade", "existingSketchReady", "newSketchReady"],
    secondary: ["secondaryPlacement", "secondaryType", "secondaryOpening", "secondaryVentilation"],
    review: [],
  };

  return visibleSteps.filter((step) => (requiredFields[step] || []).every((name) => hasValue(fields[name]))).length;
}

function getVisibleSteps(routeChoice) {
  const branchStep = routeChoice === "secondary" ? "secondary" : "replace";
  return ["project", "windows", "condition", "choice", branchStep, "review"];
}

function isEligible(eligibility) {
  return (
    eligibility?.inZeist === "ja" &&
    ["rijksmonument", "gemeentelijk-monument", "beschermd-gezicht"].includes(eligibility?.heritageScope) &&
    eligibility?.measureScope === "ja"
  );
}

function hasValue(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return Boolean(String(value || "").trim());
}

function getPreferredName() {
  const applicantName = String(glassState?.fields?.applicantName || "").trim();
  if (applicantName) {
    return firstName(applicantName);
  }

  const ownerName = String(glassState?.fields?.ownerName || "").trim();
  if (ownerName) {
    return firstName(ownerName);
  }

  return "";
}

function firstName(value) {
  return String(value || "").split(/\s+/).filter(Boolean)[0] || "";
}

function routeIconMarkup(icon) {
  if (icon === "window") {
    return `
      <span class="app-window-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="4.5" y="4.5" width="15" height="15" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.7"></rect>
          <path d="M12 4.5v15M4.5 12h15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>
          <path d="M7.75 7.75h2.25M14 7.75h2.25M7.75 14h2.25M14 14h2.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
        </svg>
      </span>
    `;
  }

  return `<span class="material-symbols-outlined">${icon}</span>`;
}

function createEmptyIntakeState() {
  return {
    chatMode: "guided-free",
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
    fields: {},
    files: {},
    houseProfile: null,
    saveMessage: "",
    savedAt: 0,
    touchedSteps: {},
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function maybeStartWelcomeTour() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tour") !== "welcome") {
    return;
  }

  activeTourStep = 0;
  renderTourStep();
  elements.tourDialog?.showModal();
  document.body.classList.add("tour-active");
}

function renderTourStep() {
  const step = tourSteps[activeTourStep];
  if (!step) {
    return;
  }

  clearTourHighlights();
  highlightTourTarget(step.target?.());

  if (elements.tourKicker) {
    elements.tourKicker.textContent = step.kicker;
  }
  if (elements.tourTitle) {
    elements.tourTitle.textContent = step.title;
  }
  if (elements.tourCopy) {
    elements.tourCopy.textContent = step.body;
  }
  if (elements.tourBack) {
    elements.tourBack.disabled = activeTourStep === 0;
  }
  if (elements.tourNext) {
    elements.tourNext.textContent = activeTourStep === tourSteps.length - 1 ? "Ga naar mijn startscherm" : "Volgende";
  }
  if (elements.tourProgress) {
    elements.tourProgress.innerHTML = "";
    for (const [index] of tourSteps.entries()) {
      const dot = document.createElement("span");
      dot.className = "welcome-tour-dot";
      if (index === activeTourStep) {
        dot.classList.add("is-active");
      }
      elements.tourProgress.appendChild(dot);
    }
  }
}

function highlightTourTarget(target) {
  if (!target) {
    return;
  }

  target.classList.add("is-tour-highlight");
  target.scrollIntoView({
    block: "nearest",
    behavior: "smooth",
  });
}

function clearTourHighlights() {
  document.querySelectorAll(".is-tour-highlight").forEach((element) => {
    element.classList.remove("is-tour-highlight");
  });
}

function closeWelcomeTour() {
  clearTourHighlights();
  document.body.classList.remove("tour-active");
  elements.tourDialog?.close();
  localStorage.setItem(welcomeTourSeenKey, "true");
  clearTourQueryParam();
}

function clearTourQueryParam() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("tour") !== "welcome") {
    return;
  }

  url.searchParams.delete("tour");
  const nextUrl = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}
