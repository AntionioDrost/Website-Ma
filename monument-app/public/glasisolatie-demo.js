import { attachLogoutButton, requireAuthPage } from "./auth.js";
import { hydrateDossier, saveRemoteDossier } from "./dossier-store.js";

const storageKey = "glasisolatie-demo-state-v2";
const maxUniquePairs = 12;
const measurementOrder = ["S", "G", "P", "B", "D", "R", "T"];
const measurementPositions = {
  S: "23% 9%",
  G: "40% 9%",
  P: "61% 9%",
  B: "8% 48%",
  D: "29% 84%",
  R: "64% 84%",
  T: "51% 95%",
};

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
    subtitle: "Nu gaat het alleen om de plek, de unieke kozijnparen en de foto's van de relevante vensters.",
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
    subtitle: "Per uniek kozijnpaar vul je hier de maten en technische keuzes in.",
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
    { name: "uniquePairCount", label: "Aantal unieke kozijnparen" },
    { name: "windowPairsComplete", label: "Gegevens van de unieke kozijnparen" },
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
    { name: "replacePairsComplete", label: "Maten en technische uitwerking per paar" },
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
  { key: "outsidePhotosReady", label: "Foto's van het venster buiten", fileKey: "outsidePhotos" },
  { key: "insidePhotosReady", label: "Detailfoto's van binnen", fileKey: "insidePhotos" },
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

const tooltipCatalog = {
  "measurement-overview": {
    title: "Sponning van het glas",
    text:
      "Plaats hier een tekening van de opbouw van het raamkozijn en geef de maten aan in millimeters. T is de totale dikte van het raamhout, R de afstand tot het glas, P het platte deel, B de sponninghoogte, S de stopverfdiepte en D de sponningdiepte. Als T niet te meten is, geldt volgens de toelichting: D is ongeveer S plus 3 a 4 millimeter vermoedelijke glasdikte plus 1, omdat het glas vastzit in de stopverf. Dit schema komt uit het afwegingskader van de Rijksdienst voor het Cultureel Erfgoed. Aan de hand van deze maten kan worden bepaald of isolerend, dus dikker, glas in het raam past. Als er schuin gemeten wordt, kloppen de maten niet. Een profielkam of profielmeter is hierbij een handig hulpmiddel.",
    images: [
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-11-img-1.jpg",
        alt: "Maattekening uit de toelichting voor de sponning van het glas",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-11-img-3.jpg",
        alt: "Voorbeeldfoto van meten aan het kozijn uit de toelichting",
      },
    ],
  },
  "measurement-photo": {
    title: "Voorbeeld uit de toelichting",
    text:
      "De toelichting laat hier zowel de maattekening als een meetvoorbeeld zien. Gebruik die combinatie om te controleren of je de juiste maat op de juiste plek invult. Meet niet schuin, want dan kloppen de maten niet.",
    images: [
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-11-img-1.jpg",
        alt: "Referentietekening met maatletters uit de toelichting",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-11-img-3.jpg",
        alt: "Meetvoorbeeld uit de toelichting",
      },
    ],
  },
  "measurement-B": {
    title: "Toelichting bij B",
    text:
      "Fotografeer, indien mogelijk, de hele gevel. Geef op de foto duidelijk aan om welke vensters het gaat. Voorbeeld: wil je 3 van de 5 vensters in de voorgevel verduurzamen? Geef dan op de foto aan welke dat zijn. Noem ze bijvoorbeeld A, B en C. Gaat het om drie identieke vensters? Noem ze dan bijvoorbeeld A1, A2 en A3. Hier heb je geen fotoprogramma voor nodig. Dit kan eenvoudig in Word met Invoegen > Tekstvak en de tekst typen. Daarna rechter muisknop > Vorm opmaken > Geen opvulling en Tekstcontour > Geen lijn.",
  },
  "window-age": {
    title: "Ouderdom van het venster",
    text:
      "Heb je informatie over de ouderdom van het venster? Vermeld dit dan hier. Denk aan een oude foto, een bouwtekening, of informatie over een restauratie waarbij het venster is aangepast. Ook een stukje tekst uit een bouwhistorisch onderzoek is bruikbaar. Is er niets bekend? Laat dit veld dan leeg.",
  },
  "ventilation-draught": {
    title: "Ventilatie en tochtwering",
    text:
      "Tochtwering kan prettig zijn tegen koude luchtstromen, maar het kan ook de ventilatie in een kamer verminderen. Soms zelfs zoveel dat er te weinig frisse lucht binnenkomt. Goede ventilatie is eigenlijk regelbare tocht: genoeg frisse lucht voor een gezond binnenklimaat, maar niet zo veel dat het oncomfortabel wordt of extra energie kost. In veel huizen gaat dit nog mis: ruimtes waar niemand is worden constant geventileerd, terwijl kamers waar mensen wel zijn te weinig frisse lucht krijgen. Twijfel je of je voldoende ventileert? Gebruik een CO2-meter om de luchtkwaliteit te meten.",
  },
  "window-condition": {
    title: "Staat van je raam",
    text:
      "Isolerend glas is zwaarder dan oud enkel glas. Daarom moet het raam stevig genoeg zijn om het nieuwe glas veilig te dragen. De technische staat van het raam speelt dus een belangrijke rol bij de keuze voor isolatieglas. Twijfel je of je raam geschikt is? Vraag advies aan een deskundige. Maak bij eventuele gebreken duidelijke foto's, zodat je goed kunt laten zien wat er aan de hand is. Heb je stalen ramen? Let extra goed op roestvorming. Bij ernstige roest kan het raam verzwakken en bestaat zelfs het risico dat het glas breekt.",
  },
  "outside-photos": {
    title: "Overzichts- en buitenfoto's",
    text:
      "Voeg foto's toe van het venster buiten en van dichtbij. Voeg een overzichtsfoto toe van het hele venster en een detailfoto waarop is te zien hoe het glas in het raamhout zit.",
    images: [
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-4-img-1.jpg",
        alt: "Voorbeeld van buitenfoto van het venster",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-4-img-2.jpg",
        alt: "Voorbeeld van detailfoto van dichtbij",
      },
    ],
  },
  "inside-photos": {
    title: "Binnenfoto's en details",
    text:
      "Voeg detailfoto's van binnen toe. Ten minste: een overzicht, een detail van raamhout of roede, lijstwerk en vensterbank. In het voorbeeld uit de toelichting werkt van origine een schuifraam met touwen en katrollen, waarmee het raam omhoog kan worden geschoven. In dit voorbeeld zijn de touwen en katrollen in 1985 vervangen door balansveren van het merk Avri. Vandaar de naam Avri-veren.",
    images: [
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-5-img-1.jpg",
        alt: "Voorbeeld van detailfoto binnen van vensterbank en onderdorpel",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-5-img-2.jpg",
        alt: "Voorbeeld van detailfoto binnen van wisseldorpel",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-5-img-4.jpg",
        alt: "Voorbeeld van detailfoto binnen van roede",
      },
    ],
  },
  "glass-type": {
    title: "Huidig glas",
    text:
      "Modern glas is helemaal vlak en wordt floatglas genoemd. Historisch glas is op een andere manier gemaakt en heeft vaak lichte of duidelijke welvingen. Dit noemen we getrokken glas. Een voorbeeld van getrokken glas zie je op de foto. Diverse fabrikanten hebben isolerend glas in de handel met een getrokken buitenruit. Overleg hierover met je glaszetter. Glas-in-lood mag in principe niet ingepakt worden in dubbel glas. Overleg met jouw gemeente over wat de waarde van het glas-in-lood is en welke oplossingen er mogelijk zijn. Meestal is dit een achterzetraam aan de binnenzijde van het glas-in-lood.",
    images: [
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-8-img-1.jpg",
        alt: "Voorbeeld van getrokken glas uit de toelichting",
      },
    ],
  },
  "pair-photo": {
    title: "Foto per uniek paar",
    text:
      "Voeg hier een foto bij van de gevel met de vensters. Fotografeer, indien mogelijk, de hele gevel en geef op de foto duidelijk aan om welke vensters het gaat. Wil je bijvoorbeeld 3 van de 5 vensters verduurzamen, noem ze dan bijvoorbeeld A, B en C. Gaat het om identieke vensters, gebruik dan bijvoorbeeld A1, A2 en A3. Daarna voeg je ook foto's toe van het venster buiten, van dichtbij en van binnen.",
    images: [
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-3-img-1.jpg",
        alt: "Voorbeeldfoto van gevel met vensters uit de toelichting",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-4-img-1.jpg",
        alt: "Voorbeeldfoto van venster buiten uit de toelichting",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-4-img-2.jpg",
        alt: "Voorbeeld van detailfoto van dichtbij uit de toelichting",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-5-img-1.jpg",
        alt: "Voorbeeld van detailfoto binnen van vensterbank en onderdorpel uit de toelichting",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-5-img-2.jpg",
        alt: "Voorbeeld van detailfoto binnen van wisseldorpel uit de toelichting",
      },
      {
        src: "/assets/glasformulier/idv-toelichting-extract/page-5-img-4.jpg",
        alt: "Voorbeeld van detailfoto binnen van roede uit de toelichting",
      },
    ],
  },
};

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
      uniquePairCount: "1",
      glassTypeCurrent: "enkel-glas",
      routeChoice: "secondary",
      mainGoal: "Meer comfort zonder het buitenbeeld van het venster te verliezen.",
    },
    windowPairs: [
      {
        label: "Voorgevel standaardpaar",
        quantity: "6",
        notes: "Slanke roeden en bestaand enkel glas",
      },
    ],
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
      facade: "voorgevel",
      windDirection: "zuid",
      uniquePairCount: "2",
      glassTypeCurrent: "dubbel-glas",
      routeChoice: "replace",
      mainGoal: "Tocht verminderen en het comfort in de werkruimte verbeteren.",
    },
    windowPairs: [
      {
        label: "Links naast entree",
        quantity: "2",
        notes: "Zelfde indeling en houtprofiel",
      },
      {
        label: "Bovenlichten entree",
        quantity: "2",
        notes: "Kleiner paar met afwijkende maatvoering",
      },
    ],
  },
];

const houseProfileRepository = {
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
};

const elements = {
  authDisplayName: document.querySelector("#auth-display-name"),
  authEmail: document.querySelector("#auth-email"),
  demoProgressBar: document.querySelector("#demo-progress-bar"),
  demoStage: document.querySelector("#demo-stage"),
  eligibilityInputs: [...document.querySelectorAll("[data-eligibility]")],
  eligibilityResult: document.querySelector("#eligibility-result"),
  exportButton: document.querySelector("#export-dossier"),
  form: document.querySelector("#glass-demo-form"),
  helpBody: document.querySelector("#glass-help-body"),
  helpClose: document.querySelector("#glass-help-close"),
  helpDialog: document.querySelector("#glass-help-dialog"),
  helpTitle: document.querySelector("#glass-help-title"),
  loadDemoHouseProfileButton: document.querySelector("#load-demo-house-profile"),
  logoutButton: document.querySelector("#logout-button"),
  navNote: document.querySelector("#nav-note"),
  nextButton: document.querySelector("#next-step"),
  prevButton: document.querySelector("#prev-step"),
  progressCountText: document.querySelector("#progress-count-text"),
  progressSubtitle: document.querySelector("#progress-subtitle"),
  progressTitle: document.querySelector("#progress-title"),
  replacePairList: document.querySelector("#replace-pair-list"),
  reviewMissing: document.querySelector("#review-missing"),
  reviewSummary: document.querySelector("#review-summary"),
  routeChip: document.querySelector("#route-chip"),
  routeChoice: document.querySelector("#route-choice"),
  saveButton: document.querySelector("#save-progress"),
  saveStatus: document.querySelector("#save-status"),
  stepAlert: document.querySelector("#step-alert"),
  stepCounter: document.querySelector("#step-counter"),
  stepList: document.querySelector("#step-list"),
  stepPanels: [...document.querySelectorAll("[data-step-panel]")],
  stepPrefill: document.querySelector("#step-prefill"),
  stepStatus: document.querySelector(".glass-step-status"),
  stepStage: document.querySelector("#step-stage"),
  stepViewport: document.querySelector("#step-viewport"),
  submitSummary: document.querySelector("#submit-summary"),
  submitTechPlan: document.querySelector("#submit-tech-plan"),
  windowPairList: document.querySelector("#window-pair-list"),
  wizardPanel: document.querySelector("#wizard-panel"),
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let authContext = null;
let saveTimer = 0;
let transitionTimer = 0;

const state = createEmptyState();

applyStateToForm();
render();
initializeApp();

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
elements.helpClose.addEventListener("click", closeHelpDialog);
elements.helpDialog.addEventListener("click", (event) => {
  if (event.target === elements.helpDialog) {
    closeHelpDialog();
  }
});
document.addEventListener("click", handleTooltipClick);

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
  const { target } = event;

  if (target.dataset.eligibility !== undefined || target.type === "file") {
    return;
  }

  if (target.dataset.pairField) {
    syncPairField(target);
    persistState();
    return;
  }

  syncFieldsFromForm(target);
  persistState();
  render();
}

function handleFormChange(event) {
  const { target } = event;

  if (target.dataset.eligibility !== undefined) {
    return;
  }

  if (target.dataset.pairField) {
    if (target.type === "file") {
      const pairFileKey = getPairFileKey(target.dataset.pairId, target.dataset.pairField);
      state.files[pairFileKey] = [...target.files].map((file) => file.name);
    } else {
      syncPairField(target);
    }

    markStepTouched(getStepFromInput(target.dataset.pairField));
    persistState();
    render();
    return;
  }

  if (target.type === "file") {
    state.files[target.name] = [...target.files].map((file) => file.name);
    markStepTouched(getStepFromInput(target.name));
    persistState();
    render();
    return;
  }

  syncFieldsFromForm(target);
  persistState();
  render();
}

function syncFieldsFromForm(target) {
  state.fields = readFields();

  if (target?.name === "uniquePairCount") {
    syncUniquePairCount(state.fields.uniquePairCount);
  }

  if (target?.name) {
    markStepTouched(getStepFromInput(target.name));
    syncFieldOwnership(target.name);
  }

  syncCurrentStepWithRoute();
  void maybeLoadHouseProfileFromAddress();
}

function syncPairField(target) {
  const pair = state.windowPairs.find((candidate) => candidate.id === target.dataset.pairId);
  if (!pair) {
    return;
  }

  const field = target.dataset.pairField;
  const value = target.type === "checkbox" ? target.checked : String(target.value || "").trim();

  if (field in pair.measurements) {
    pair.measurements[field] = value;
  } else {
    pair[field] = value;
  }

  if (field === "quantity") {
    state.fields.uniquePairCount = String(state.windowPairs.length);
  }
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

  for (const [name, value] of Object.entries(nextProfile.fields || {})) {
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

  if (Array.isArray(nextProfile.windowPairs) && nextProfile.windowPairs.length) {
    const normalizedPairs = nextProfile.windowPairs.map((pair, index) => normalizePair({ ...pair, id: createPairId(index) }, index));
    state.windowPairs = normalizedPairs;
    state.fields.uniquePairCount = String(normalizedPairs.length);
  } else {
    syncUniquePairCount(state.fields.uniquePairCount);
  }

  state.currentStep = state.currentStep === "eligibility" ? "project" : state.currentStep;
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
  ensureWindowPairs();
  syncCurrentStepWithRoute();
  renderEligibility();
  renderWindowPairs();
  renderReplacePairs();
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

function renderWindowPairs() {
  ensureWindowPairs();
  elements.windowPairList.innerHTML = "";

  for (const [index, pair] of state.windowPairs.entries()) {
    const article = document.createElement("article");
    article.className = "glass-pair-card";
    article.innerHTML = `
      <div class="glass-pair-card-head">
        <div>
          <p class="app-kicker">Uniek paar ${index + 1}</p>
          <h4>${escapeHtml(pair.label || `Kozijnpaar ${index + 1}`)}</h4>
        </div>
        <span class="glass-pair-chip">${pair.quantity ? `${escapeHtml(pair.quantity)} stuks` : "Aantal nog open"}</span>
      </div>
      <div class="glass-field-grid two-up">
        <label class="glass-field">
          <span>Naam of herkenning van dit paar</span>
          <input type="text" value="${escapeAttribute(pair.label)}" data-pair-id="${pair.id}" data-pair-field="label" placeholder="Bijvoorbeeld voorgevel links" />
        </label>
        <label class="glass-field">
          <span>Hoeveel van dit paar heb je?</span>
          <input type="number" min="1" value="${escapeAttribute(pair.quantity)}" data-pair-id="${pair.id}" data-pair-field="quantity" />
        </label>
        <label class="glass-field glass-field-wide">
          <span>Bijzonderheden</span>
          <input type="text" value="${escapeAttribute(pair.notes)}" data-pair-id="${pair.id}" data-pair-field="notes" placeholder="Bijvoorbeeld roeden, luiken of afwijkend profiel" />
        </label>
      </div>
      <div class="glass-upload-grid">
        <label class="glass-upload">
          <span>Overzichtsfoto van dit paar ${renderInfoButton("pair-photo")}</span>
          <input type="file" accept="image/*" data-pair-id="${pair.id}" data-pair-field="facadePhoto" />
          <small class="file-meta">${escapeHtml(getFileMetaText(getPairFileKey(pair.id, "facadePhoto")))}</small>
        </label>
        <label class="glass-check">
          <input type="checkbox" ${pair.facadePhotoReady ? "checked" : ""} data-pair-id="${pair.id}" data-pair-field="facadePhotoReady" />
          <span>Foto van dit paar staat klaar</span>
        </label>
      </div>
    `;
    elements.windowPairList.appendChild(article);
  }
}

function renderReplacePairs() {
  elements.replacePairList.innerHTML = "";

  if (state.fields.routeChoice !== "replace") {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = "Deze stap wordt actief zodra je kiest voor glas vervangen.";
    elements.replacePairList.appendChild(empty);
    return;
  }

  ensureWindowPairs();

  for (const [index, pair] of state.windowPairs.entries()) {
    const article = document.createElement("article");
    article.className = "glass-pair-card glass-measure-card";
    article.innerHTML = `
      <div class="glass-pair-card-head">
        <div>
          <p class="app-kicker">Technisch paar ${index + 1}</p>
          <h4>${escapeHtml(pair.label || `Kozijnpaar ${index + 1}`)}</h4>
        </div>
        <span class="glass-pair-chip">${pair.quantity ? `${escapeHtml(pair.quantity)} identiek` : "Aantal nog open"}</span>
      </div>

      <div class="glass-measure-layout">
        <div class="glass-measure-figure">
          <div class="glass-measure-figure-head">
            <strong>Meet direct op de tekening</strong>
            ${renderInfoButton("measurement-overview")}
          </div>
          <div class="glass-measure-figure-canvas">
            <img src="/assets/glasformulier/raamwerk-calculatie.svg" alt="Technische maattekening van een kozijnprofiel" />
            ${measurementOrder.map((label) => renderMeasurementInput(pair, label)).join("")}
          </div>
          <div class="glass-measure-meta">
            <span>${getFilledMeasurementCount(pair)} van ${measurementOrder.length} maten ingevuld</span>
            <button class="glass-inline-info" type="button" data-tooltip-key="measurement-photo">Bekijk voorbeeldformulier</button>
          </div>
        </div>

        <div class="glass-measure-fields">
          ${renderAssessmentCard(pair)}
          <div class="glass-field-grid two-up">
            <label class="glass-field">
              <span>Aantal van dit paar</span>
              <input type="number" min="1" value="${escapeAttribute(pair.quantity)}" data-pair-id="${pair.id}" data-pair-field="quantity" />
            </label>
            <label class="glass-field">
              <span>Uitfrezen</span>
              <select data-pair-id="${pair.id}" data-pair-field="millingPossible">
                ${renderOptions(pair.millingPossible, [
                  ["", "Kies"],
                  ["ja", "Ja"],
                  ["nee", "Nee"],
                  ["nog-onbekend", "Nog onbekend"],
                ])}
              </select>
            </label>
            <label class="glass-field">
              <span>Technische optie ${renderInfoButton("measurement-overview")}</span>
              <select data-pair-id="${pair.id}" data-pair-field="technicalOption">
                ${renderOptions(pair.technicalOption, [
                  ["", "Kies"],
                  ["gelaagd", "Isolerend enkel glas"],
                  ["dun-dubbel", "Dun dubbelglas"],
                  ["vacuum", "Vacuumglas"],
                  ["folie", "Raamfolie"],
                  ["nog-open", "Nog open"],
                ])}
              </select>
            </label>
            <label class="glass-field">
              <span>Openen nieuw</span>
              <select data-pair-id="${pair.id}" data-pair-field="openingTypeNew">
                ${renderOptions(pair.openingTypeNew, [
                  ["", "Kies"],
                  ["wel-open", "Blijft openend"],
                  ["niet-open", "Niet meer openend"],
                ])}
              </select>
            </label>
            <label class="glass-field glass-field-wide">
              <span>Gekozen verbetering</span>
              <input type="text" value="${escapeAttribute(pair.chosenGlassUpgrade)}" data-pair-id="${pair.id}" data-pair-field="chosenGlassUpgrade" placeholder="Bijvoorbeeld vacuümglas met behoud van roedenbeeld" />
            </label>
            <label class="glass-field glass-field-wide">
              <span>Nieuwe tochtwering</span>
              <textarea rows="3" data-pair-id="${pair.id}" data-pair-field="draughtNew">${escapeHtml(pair.draughtNew)}</textarea>
            </label>
            <label class="glass-field glass-field-wide">
              <span>Offerte of uitvoerder</span>
              <textarea rows="3" data-pair-id="${pair.id}" data-pair-field="quoteInfo">${escapeHtml(pair.quoteInfo)}</textarea>
            </label>
          </div>

          <div class="glass-upload-grid">
            <label class="glass-upload">
              <span>Schets bestaand</span>
              <input type="file" accept="image/*,.pdf" data-pair-id="${pair.id}" data-pair-field="existingSketch" />
              <small class="file-meta">${escapeHtml(getFileMetaText(getPairFileKey(pair.id, "existingSketch")))}</small>
            </label>
            <label class="glass-upload">
              <span>Schets nieuw</span>
              <input type="file" accept="image/*,.pdf" data-pair-id="${pair.id}" data-pair-field="newSketch" />
              <small class="file-meta">${escapeHtml(getFileMetaText(getPairFileKey(pair.id, "newSketch")))}</small>
            </label>
            <label class="glass-check">
              <input type="checkbox" ${pair.existingSketchReady ? "checked" : ""} data-pair-id="${pair.id}" data-pair-field="existingSketchReady" />
              <span>Schets bestaand klaar</span>
            </label>
            <label class="glass-check">
              <input type="checkbox" ${pair.newSketchReady ? "checked" : ""} data-pair-id="${pair.id}" data-pair-field="newSketchReady" />
              <span>Schets nieuw klaar</span>
            </label>
          </div>
        </div>
      </div>
    `;
    elements.replacePairList.appendChild(article);
  }
}

function renderMeasurementInput(pair, label) {
  const [left, top] = measurementPositions[label].split(" ");
  const chip =
    label === "B"
      ? `<button class="glass-overlay-chip glass-overlay-chip-button" type="button" data-tooltip-key="measurement-B">${label}</button>`
      : `<span class="glass-overlay-chip">${label}</span>`;
  return `
    <div class="glass-overlay-input glass-overlay-input-${label}" style="left:${left}; top:${top};">
      ${chip}
      <input aria-label="Maat ${label} in millimeters" type="number" min="0" value="${escapeAttribute(pair.measurements[label])}" data-pair-id="${pair.id}" data-pair-field="${label}" placeholder="mm" />
    </div>
  `;
}

function renderAssessmentCard(pair) {
  const assessment = assessPairMilling(pair);
  return `
    <article class="glass-assessment glass-assessment-${assessment.status}">
      <div class="glass-assessment-head">
        <div>
          <p class="app-kicker">Achtergrondcheck</p>
          <h5>Mag uitfrezen waarschijnlijk?</h5>
        </div>
        <span class="glass-assessment-pill">${escapeHtml(assessment.label)}</span>
      </div>
      <p class="glass-assessment-summary">${escapeHtml(assessment.summary)}</p>
      <div class="glass-assessment-list">
        ${assessment.details
          .map(
            (detail) => `
              <div class="glass-assessment-item is-${detail.status}">
                <strong>${escapeHtml(detail.label)}</strong>
                <span>${escapeHtml(detail.text)}</span>
              </div>`,
          )
          .join("")}
      </div>
      <small class="glass-assessment-note">Gemeenten kunnen hiervan afwijken. Dit is een snelle indicatie op basis van de RCE-uitgangspunten die je hebt meegegeven.</small>
    </article>
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
      const arrow = document.createElement("span");
      arrow.className = `glass-step-arrow is-${getConnectorStatus(step, index, currentIndex)}`;
      arrow.innerHTML = '<span class="material-symbols-outlined">east</span>';
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
    if (!input.name || input.type === "file" || input.dataset.pairField) {
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
    meta.textContent = getFileMetaText(field);
  }
}

function renderReview() {
  const summaryRows = [
    ...summaryMeta
      .map((item) => ({ label: item.label, value: item.value(state.fields) }))
      .filter((item) => item.value),
    {
      label: "Unieke kozijnparen",
      value: `${state.windowPairs.length} paar${state.windowPairs.length === 1 ? "" : "en"}`,
    },
    {
      label: "Totaal aantal opgegeven exemplaren",
      value: `${getTotalQuantity()} stuks`,
    },
  ];

  renderSummaryRows(
    elements.reviewSummary,
    summaryRows.length ? summaryRows : [{ label: "Nog leeg", value: "Begin bij stap 1 om je dossier op te bouwen." }],
  );

  const pairRows = state.windowPairs.map((pair, index) => ({
    label: pair.label || `Kozijnpaar ${index + 1}`,
    value: pair.quantity ? `${pair.quantity} identieke exemplaren` : "Aantal nog niet ingevuld",
  }));

  const missing = getMissingItems();
  renderSummaryRows(
    elements.reviewMissing,
    missing.length
      ? [...pairRows, ...missing.map((label) => ({ label: "Open punt", value: label }))]
      : [...pairRows, { label: "Compleetheidscheck", value: "Voor deze demo zijn alle verplichte onderdelen nu ingevuld." }],
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
    { label: "Kozijnparen", value: `${state.windowPairs.length} unieke paar${state.windowPairs.length === 1 ? "" : "en"}` },
    { label: "Conceptstatus", value: draft.isReadyForSubmission ? "Dossier is klaar voor een toekomstige submitflow" : "Werk eerst verplichte onderdelen af" },
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

  for (const checkbox of elements.form.querySelectorAll('input[type="checkbox"]:not([data-pair-field])')) {
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

function persistState(message = "Automatisch opgeslagen") {
  state.savedAt = Date.now();
  state.saveMessage = message;
  localStorage.setItem(storageKey, JSON.stringify(cloneValue(state)));
  renderSaveStatus();
  scheduleRemoteSave();
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

  if (name === "windowPairsComplete") {
    return state.windowPairs.every((pair) => hasRawValue(pair.label) && hasRawValue(pair.quantity) && pair.facadePhotoReady);
  }

  if (name === "replacePairsComplete") {
    if (state.fields.routeChoice !== "replace") {
      return true;
    }

    return state.windowPairs.every((pair) =>
      measurementOrder.every((label) => hasRawValue(pair.measurements[label])) &&
      hasRawValue(pair.quantity) &&
      hasRawValue(pair.technicalOption) &&
      hasRawValue(pair.chosenGlassUpgrade) &&
      Boolean(pair.existingSketchReady) &&
      Boolean(pair.newSketchReady),
    );
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
  if (name === "windowPairsComplete") {
    elements.windowPairList.querySelectorAll(".glass-pair-card").forEach((node) => node.classList.add("is-invalid"));
    return;
  }

  if (name === "replacePairsComplete") {
    elements.replacePairList.querySelectorAll(".glass-pair-card").forEach((node) => node.classList.add("is-invalid"));
    return;
  }

  const input = elements.form.elements.namedItem(name);
  const field = input?.closest(".glass-field, .glass-upload, .glass-check");
  field?.classList.add("is-invalid");
}

function clearInvalid(stepId) {
  const panel = document.querySelector(`[data-step-panel="${stepId}"]`);
  panel?.querySelectorAll(".is-invalid").forEach((node) => node.classList.remove("is-invalid"));
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
    { label: "Unieke kozijnparen", value: `${state.windowPairs.length}` },
  ];

  const pairRows = state.windowPairs
    .map((pair, index) => `
      <div class="row">
        <div class="label">${escapeHtml(pair.label || `Kozijnpaar ${index + 1}`)}</div>
        <div>
          <strong>Aantal:</strong> ${escapeHtml(pair.quantity || "Nog niet ingevuld")}<br />
          <strong>Maten:</strong> ${measurementOrder.map((label) => `${label} ${escapeHtml(pair.measurements[label] || "-")}`).join(", ")}<br />
          <strong>Optie:</strong> ${escapeHtml(optionLabelFromList(pair.technicalOption, [
            ["gelaagd", "Isolerend enkel glas"],
            ["dun-dubbel", "Dun dubbelglas"],
            ["vacuum", "Vacuumglas"],
            ["folie", "Raamfolie"],
            ["nog-open", "Nog open"],
          ]) || "Nog niet ingevuld")}
        </div>
      </div>`)
    .join("");

  const attachments = [
    ...attachmentMeta.map((item) => ({
      label: item.label,
      value: state.fields[item.key] ? (state.files[item.fileKey] || []).join(", ") || "Voorbereid in deze demo" : "Nog open",
    })),
    ...state.windowPairs.flatMap((pair, index) => [
      {
        label: `${pair.label || `Kozijnpaar ${index + 1}`} overzichtsfoto`,
        value: pair.facadePhotoReady ? getFileMetaText(getPairFileKey(pair.id, "facadePhoto")) : "Nog open",
      },
      {
        label: `${pair.label || `Kozijnpaar ${index + 1}`} schets bestaand`,
        value: pair.existingSketchReady ? getFileMetaText(getPairFileKey(pair.id, "existingSketch")) : "Nog open",
      },
      {
        label: `${pair.label || `Kozijnpaar ${index + 1}`} schets nieuw`,
        value: pair.newSketchReady ? getFileMetaText(getPairFileKey(pair.id, "newSketch")) : "Nog open",
      },
    ]),
  ];

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
        .note { margin-top: 28px; padding: 14px 16px; border: 1px solid #d8d0c4; border-radius: 12px; background: #f6f0e8; }
      </style>
    </head>
    <body>
      <h1>Conceptdossier glasisolatie in Zeist</h1>
      <p class="meta">Gegenereerd vanuit de demo-subpagina van Monumentenverkenner. Dit document vervangt de formele aanvraag in het Omgevingsloket niet.</p>

      <h2>Samenvatting</h2>
      <div class="grid">
        ${rows.map((row) => `
          <div class="row">
            <div class="label">${escapeHtml(row.label)}</div>
            <div>${escapeHtml(row.value)}</div>
          </div>`).join("")}
      </div>

      <h2>Unieke kozijnparen</h2>
      <div class="grid">${pairRows}</div>

      <h2>Bijlagen en voorbereide stukken</h2>
      <div class="grid">
        ${attachments.map((row) => `
          <div class="row">
            <div class="label">${escapeHtml(row.label)}</div>
            <div>${escapeHtml(row.value)}</div>
          </div>`).join("")}
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

function getConnectorStatus(step, index, currentIndex) {
  if (isStepComplete(step)) {
    return "done";
  }
  if (index < currentIndex) {
    return "open";
  }
  return "future";
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
  if (["label", "quantity", "notes", "facadePhoto", "facadePhotoReady"].includes(name)) {
    return "windows";
  }
  if (["shutterState", "outsidePhotos", "insidePhotos"].includes(name)) {
    return "condition";
  }
  if ([...measurementOrder, "millingPossible", "technicalOption", "chosenGlassUpgrade", "openingTypeNew", "draughtNew", "quoteInfo", "existingSketch", "newSketch", "existingSketchReady", "newSketchReady"].includes(name)) {
    return "replace";
  }
  if (["secondaryDraught", "secondaryQuote"].includes(name)) {
    return "secondary";
  }
  return "";
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
  const attachmentCount =
    attachmentMeta.filter((item) => state.fields[item.key]).length +
    state.windowPairs.filter((pair) => pair.facadePhotoReady || pair.existingSketchReady || pair.newSketchReady).length;

  return {
    enabled: futureSubmissionApi.enabled,
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
      doel: "Initieren",
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
      kozijnparen: state.windowPairs.map((pair) => ({
        label: pair.label,
        quantity: pair.quantity,
        notes: pair.notes,
        measurements: pair.measurements,
        technicalOption: pair.technicalOption,
        chosenGlassUpgrade: pair.chosenGlassUpgrade,
      })),
    },
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

function ensureWindowPairs() {
  syncUniquePairCount(state.fields.uniquePairCount || "1");
}

function syncUniquePairCount(rawCount) {
  const nextCount = clampPairCount(rawCount);
  state.fields.uniquePairCount = String(nextCount);

  while (state.windowPairs.length < nextCount) {
    state.windowPairs.push(createEmptyPair(state.windowPairs.length));
  }

  if (state.windowPairs.length > nextCount) {
    const removed = state.windowPairs.splice(nextCount);
    for (const pair of removed) {
      deletePairFiles(pair.id);
    }
  }

  state.windowPairs = state.windowPairs.map((pair, index) => normalizePair(pair, index));
}

function createEmptyPair(index = 0) {
  return {
    id: createPairId(index),
    label: "",
    quantity: "",
    notes: "",
    facadePhotoReady: false,
    measurements: createEmptyMeasurements(),
    millingPossible: "",
    technicalOption: "",
    chosenGlassUpgrade: "",
    openingTypeNew: "",
    draughtNew: "",
    quoteInfo: "",
    existingSketchReady: false,
    newSketchReady: false,
  };
}

function createEmptyMeasurements() {
  return Object.fromEntries(measurementOrder.map((label) => [label, ""]));
}

function normalizePair(rawPair, index) {
  return {
    ...createEmptyPair(index),
    ...(rawPair && typeof rawPair === "object" ? rawPair : {}),
    id: rawPair?.id || createPairId(index),
    measurements: {
      ...createEmptyMeasurements(),
      ...(rawPair?.measurements && typeof rawPair.measurements === "object" ? rawPair.measurements : {}),
    },
  };
}

function normalizePairs(rawPairs) {
  if (Array.isArray(rawPairs) && rawPairs.length) {
    return rawPairs.map((pair, index) => normalizePair(pair, index));
  }

  return normalizeLegacyPairs();
}

function normalizeLegacyPairs() {
  const fallback = createEmptyPair(0);
  return [fallback];
}

function createPairId(index) {
  return `pair-${index + 1}`;
}

function clampPairCount(value) {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(Math.max(parsed, 1), maxUniquePairs);
}

function deletePairFiles(pairId) {
  for (const fileKey of ["facadePhoto", "existingSketch", "newSketch"]) {
    delete state.files[getPairFileKey(pairId, fileKey)];
  }
}

function getPairFileKey(pairId, fileKey) {
  return `${pairId}-${fileKey}`;
}

function getFileMetaText(field) {
  const names = state.files[field] || [];
  return names.length ? `Lokaal onthouden: ${names.join(", ")}` : "Nog geen bestand gekozen";
}

function getTotalQuantity() {
  return state.windowPairs.reduce((total, pair) => total + (Number.parseInt(pair.quantity || "0", 10) || 0), 0);
}

function getFilledMeasurementCount(pair) {
  return measurementOrder.filter((label) => hasRawValue(pair.measurements[label])).length;
}

function renderInfoButton(key) {
  return `<button class="glass-info-button" type="button" aria-label="Meer uitleg" data-tooltip-key="${key}">i</button>`;
}

function handleTooltipClick(event) {
  const button = event.target.closest("[data-tooltip-key]");
  if (!button) {
    return;
  }

  event.preventDefault();
  const key = button.dataset.tooltipKey;
  openHelpDialog(key);
}

function openHelpDialog(key) {
  const tooltip = tooltipCatalog[key];
  if (!tooltip) {
    return;
  }

  elements.helpTitle.textContent = tooltip.title;
  elements.helpBody.innerHTML = `
    <div class="glass-help-copy">
      <p>${escapeHtml(tooltip.text)}</p>
      ${renderTooltipImages(tooltip)}
    </div>
  `;

  elements.helpDialog.showModal();
}

function closeHelpDialog() {
  elements.helpDialog.close();
}

function renderTooltipImages(tooltip) {
  const images = Array.isArray(tooltip.images)
    ? tooltip.images
    : tooltip.image
      ? [{ src: tooltip.image, alt: tooltip.imageAlt || tooltip.title }]
      : [];

  return images
    .map(
      (image) => `
        <figure class="glass-help-figure">
          <img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || tooltip.title)}" />
        </figure>`,
    )
    .join("");
}

function renderOptions(selectedValue, options) {
  return options
    .map(([value, label]) => `<option value="${escapeAttribute(value)}" ${selectedValue === value ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function optionLabelFromList(value, options) {
  return options.find(([candidate]) => candidate === value)?.[1] || "";
}

function assessPairMilling(pair) {
  const T = parseMeasurement(pair.measurements.T);
  const S = parseMeasurement(pair.measurements.S);
  const P = parseMeasurement(pair.measurements.P);
  const R = parseMeasurement(pair.measurements.R);

  if ([T, S, P, R].some((value) => value === null)) {
    return {
      status: "pending",
      label: "Nog niet compleet",
      summary: "Vul eerst T, S, P en R in. Dan kan ik een eerste indicatie geven of uitfrezen volgens deze uitgangspunten waarschijnlijk kan.",
      details: [
        buildAssessmentDetail("T", T, "Vul de totale dikte in om de ondergrens te kunnen toetsen."),
        buildAssessmentDetail("S", S, "Vul de stopverfdiepte in om te zien of genoeg diepte overblijft."),
        buildAssessmentDetail("P", P, "Vul het platte deel in om te toetsen of voldoende hout behouden blijft."),
        buildAssessmentDetail("R", R, "Vul de radius in om te vergelijken met 14 mm of 40% van T."),
      ],
    };
  }

  const requiredRadius = Math.max(14, Number((0.4 * T).toFixed(1)));
  const details = [
    assessT(T),
    assessS(S),
    assessP(P),
    assessR(R, requiredRadius),
  ];

  const statuses = details.map((detail) => detail.status);
  const status = statuses.includes("fail") ? "fail" : statuses.includes("warning") ? "warning" : "pass";
  const label =
    status === "fail" ? "Waarschijnlijk niet" : status === "warning" ? "Randgeval" : "Lijkt passend";
  const summary =
    status === "fail"
      ? "Volgens deze RCE-uitgangspunten lijkt uitfrezen voor dit paar nu niet passend."
      : status === "warning"
        ? "Dit paar zit rond de ondergrenzen. Mogelijk kan het, maar dit vraagt extra controle en afstemming."
        : "Volgens deze RCE-uitgangspunten lijkt uitfrezen voor dit paar verdedigbaar.";

  return {
    status,
    label,
    summary,
    details,
  };
}

function assessT(value) {
  if (value >= 38) {
    return {
      status: "pass",
      label: "T",
      text: `Totale dikte ${formatMillimeters(value)}. Dat zit boven de gebruikelijke ondergrens van 35-38 mm.`,
    };
  }

  if (value >= 35) {
    return {
      status: "warning",
      label: "T",
      text: `Totale dikte ${formatMillimeters(value)}. Dit zit op de ondergrens van de richtlijn.`,
    };
  }

  return {
    status: "fail",
    label: "T",
    text: `Totale dikte ${formatMillimeters(value)}. Dat blijft onder circa 35 mm en lijkt hiermee te krap.`,
  };
}

function assessS(value) {
  if (value >= 8) {
    return {
      status: "pass",
      label: "S",
      text: `Stopverfdiepte ${formatMillimeters(value)}. Dat voldoet aan de richtlijn van minimaal 8 mm.`,
    };
  }

  if (value >= 6) {
    return {
      status: "warning",
      label: "S",
      text: `Stopverfdiepte ${formatMillimeters(value)}. Dit zit onder 8 mm, maar valt binnen de band waarbij schilderwerk soms iets kan compenseren.`,
    };
  }

  return {
    status: "fail",
    label: "S",
    text: `Stopverfdiepte ${formatMillimeters(value)}. Dat blijft onder de geadviseerde 6-7 mm restmaat en lijkt te weinig.`,
  };
}

function assessP(value) {
  if (value >= 8) {
    return {
      status: "pass",
      label: "P",
      text: `Plat deel ${formatMillimeters(value)}. Daarmee lijkt voldoende hout over te blijven voor een zorgvuldige uitwerking.`,
    };
  }

  if (value >= 5) {
    return {
      status: "warning",
      label: "P",
      text: `Plat deel ${formatMillimeters(value)}. Dit voldoet net, maar geeft weinig extra freesruimte.`,
    };
  }

  return {
    status: "fail",
    label: "P",
    text: `Plat deel ${formatMillimeters(value)}. Dat blijft onder 5 mm en lijkt daardoor onvoldoende.`,
  };
}

function assessR(value, requiredRadius) {
  if (value >= requiredRadius) {
    return {
      status: "pass",
      label: "R",
      text: `Radius ${formatMillimeters(value)}. Dat ligt boven de vereiste ${formatMillimeters(requiredRadius)}.`,
    };
  }

  return {
    status: "fail",
    label: "R",
    text: `Radius ${formatMillimeters(value)}. Dat blijft onder de vereiste ${formatMillimeters(requiredRadius)} op basis van T.`,
  };
}

function buildAssessmentDetail(label, value, text) {
  return {
    status: value === null ? "pending" : "pass",
    label,
    text: value === null ? text : `${label} is ingevuld.`,
  };
}

function parseMeasurement(value) {
  const parsed = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMillimeters(value) {
  return `${String(value).replace(".", ",")} mm`;
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

function escapeAttribute(value) {
  return escapeHtml(value ?? "");
}

async function initializeApp() {
  try {
    authContext = await requireAuthPage();

    const hydrated = await hydrateDossier({
      dossierType: "glass",
      emptyState: createEmptyState,
      localKey: storageKey,
      title: "Glaswizard",
    });

    replaceStateContents(state, mergeHydratedState(hydrated.state));
    applyStateToForm();
    render();

    elements.authDisplayName.textContent =
      authContext.profile.display_name || authContext.user?.email || "Gast";
    elements.authEmail.textContent = authContext.user?.email || "Gastmodus actief";
    if (authContext.supabase) {
      attachLogoutButton(elements.logoutButton, elements.authEmail);
    } else {
      elements.logoutButton.hidden = true;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "De glaswizard kon niet worden geladen.";
    elements.authDisplayName.textContent = "Fout bij laden";
    elements.authEmail.textContent = message;
    elements.saveStatus.textContent = message;
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
        dossierType: "glass",
        state: cloneValue(state),
        title: "Glaswizard",
      });
    } catch (error) {
      elements.saveStatus.textContent =
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

function mergeHydratedState(rawState) {
  const emptyState = createEmptyState();
  const merged = {
    ...emptyState,
    ...(rawState && typeof rawState === "object" ? rawState : {}),
    eligibility: {
      ...emptyState.eligibility,
      ...(rawState?.eligibility && typeof rawState.eligibility === "object" ? rawState.eligibility : {}),
    },
    fields: {
      ...emptyState.fields,
      ...(rawState?.fields && typeof rawState.fields === "object" ? rawState.fields : {}),
    },
    files: rawState?.files && typeof rawState.files === "object" ? rawState.files : {},
    fieldSources:
      rawState?.fieldSources && typeof rawState.fieldSources === "object" ? rawState.fieldSources : {},
    editedByUser:
      rawState?.editedByUser && typeof rawState.editedByUser === "object" ? rawState.editedByUser : {},
    touchedSteps:
      rawState?.touchedSteps && typeof rawState.touchedSteps === "object" ? rawState.touchedSteps : {},
    windowPairs: normalizePairs(rawState?.windowPairs),
  };

  merged.fields.uniquePairCount = String(clampPairCount(merged.fields.uniquePairCount || merged.windowPairs.length));
  while (merged.windowPairs.length < clampPairCount(merged.fields.uniquePairCount)) {
    merged.windowPairs.push(createEmptyPair(merged.windowPairs.length));
  }
  merged.windowPairs = merged.windowPairs.slice(0, clampPairCount(merged.fields.uniquePairCount));
  merged.windowPairs = merged.windowPairs.map((pair, index) => normalizePair(pair, index));
  return merged;
}

function createEmptyState() {
  return {
    currentStep: "eligibility",
    eligibility: {
      inZeist: "",
      heritageScope: "",
      measureScope: "",
    },
    editedByUser: {},
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
    houseProfileRequestId: 0,
    lastProfileQuery: "",
    saveMessage: "",
    savedAt: 0,
    touchedSteps: {},
    windowPairs: [createEmptyPair(0)],
  };
}
