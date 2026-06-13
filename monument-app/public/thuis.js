const intakeStorageKey = "monument-app-state-v2";
const glassStorageKey = "glasisolatie-demo-state-v2";

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

const glassStepOrder = ["project", "windows", "condition", "choice", "replace", "secondary", "review"];
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
  greeting: document.querySelector("#thuis-greeting"),
  primaryTitle: document.querySelector("#thuis-primary-title"),
  primaryCopy: document.querySelector("#thuis-primary-copy"),
  primaryAction: document.querySelector("#thuis-primary-action"),
  secondaryAction: document.querySelector("#thuis-secondary-action"),
  sidebarFocus: document.querySelector("#thuis-sidebar-focus"),
  sidebarNote: document.querySelector("#thuis-sidebar-note"),
  statusList: document.querySelector("#thuis-status-list"),
};

const intakeState = readState(intakeStorageKey);
const glassState = readState(glassStorageKey);

render();

function render() {
  const name = getPreferredName();
  elements.greeting.textContent = name ? `Welkom thuis, ${name}` : "Welkom thuis";

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
    detail: hasProgress ? `${stage}. ${guidance.nextStep || "Ga verder met het dossier."}` : "Begin met een korte intake en verzamel eerst de basis.",
    headline: hasProgress ? "Ga verder met je intakechat" : "Start met je intakechat",
    copy: hasProgress ? `${completed} van de 8 kernvelden zijn al vastgelegd. Je kunt direct verder waar je gebleven was.` : "Gebruik de chat om rustig de basis van het pand, de vraag en de maatregel op te bouwen.",
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
    copy: hasProgress ? `${completed} stappen zijn al rond. De wizard bewaart je voortgang en laat je vrij terugscrollen.` : "Werk een glasisolatiedossier stap voor stap uit, met voorinvulling vanuit het huisdossier zodra die bron is gekoppeld.",
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
  return value.split(/\s+/).filter(Boolean)[0] || "";
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

function readState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
