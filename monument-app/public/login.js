import { getPostLoginPath } from "./auth.js";
import { getSupabase } from "./supabase-client.js";

const tourRedirectPath = "/thuis?tour=welcome";
const queryMode = new URLSearchParams(window.location.search).get("mode");

const elements = {
  addressConfirmAddress: document.querySelector("#address-confirm-address"),
  addressConfirmCopy: document.querySelector("#address-confirm-copy"),
  addressConfirmForm: document.querySelector("#address-confirm-form"),
  addressConfirmTitle: document.querySelector("#address-confirm-title"),
  propertyFacts: document.querySelector("#login-property-facts"),
  propertySummary: document.querySelector("#login-property-summary"),
  addressForm: document.querySelector("#address-form"),
  backToAddressConfirm: document.querySelector("#back-to-address-confirm"),
  backToBranchFromLogin: document.querySelector("#back-to-branch-from-login"),
  backToBranchFromName: document.querySelector("#back-to-branch-from-name"),
  backToName: document.querySelector("#back-to-name"),
  branchPanel: document.querySelector("#login-branch-panel"),
  confirmAddress: document.querySelector("#confirm-address"),
  credentialsForm: document.querySelector("#credentials-form"),
  editAddress: document.querySelector("#edit-address"),
  editCredentials: document.querySelector("#edit-credentials"),
  email: document.querySelector("#email"),
  forgotPasswordButton: document.querySelector("#forgot-password"),
  forgotPasswordMessage: document.querySelector("#forgot-password-message"),
  houseNumberInput: document.querySelector("#signup-house-number"),
  kicker: document.querySelector("#login-kicker"),
  lead: document.querySelector("#login-lead"),
  loginForm: document.querySelector("#login-form"),
  loginToSignupButton: document.querySelector("#login-to-signup"),
  mediaKicker: document.querySelector("#login-media-kicker"),
  mediaLead: document.querySelector("#login-media-lead"),
  mediaTitle: document.querySelector("#login-media-title"),
  nameForm: document.querySelector("#name-form"),
  nameInput: document.querySelector("#signup-name"),
  password: document.querySelector("#password"),
  postcodeInput: document.querySelector("#signup-postcode"),
  resendCodeButton: document.querySelector("#resend-code"),
  showLoginButton: document.querySelector("#show-login"),
  signupEmailInput: document.querySelector("#signup-email"),
  signupPasswordInput: document.querySelector("#signup-password"),
  startSignupButton: document.querySelector("#start-signup"),
  statusMessage: document.querySelector("#login-status"),
  stepList: document.querySelector("#login-step-list"),
  streetInput: document.querySelector("#signup-street"),
  title: document.querySelector("#login-title"),
  verificationCode: document.querySelector("#verification-code"),
  verifyForm: document.querySelector("#verify-form"),
  verifyHelper: document.querySelector("#verify-helper"),
};

const stepLabels = [
  "Eerder hier geweest?",
  "Je naam",
  "Adres invullen",
  "Adres controleren",
  "Bereikbaarheid en wachtwoord",
  "Mailcode",
];

const stepDescriptions = [
  "Terugkomer of nieuwe gebruiker.",
  "Even kennismaken.",
  "Straat, huisnummer en postcode.",
  "Controleren of de match klopt.",
  "Je account afronden.",
  "Code invullen en naar binnen.",
];

const uiCopy = {
  address: {
    kicker: "Nieuw account, stap 3 van 6",
    lead: "Vul straat, huisnummer en postcode in. Dan zoeken we het adres meteen op.",
    mediaKicker: "Adrescontrole",
    mediaLead: "Zo weten we zeker dat we naar het juiste pand kijken.",
    mediaTitle: "We zoeken het adres alvast op.",
    title: "Waar staat het pand?",
  },
  addressConfirm: {
    kicker: "Nieuw account, stap 4 van 6",
    lead: "We vonden online een match. Klopt dit?",
    mediaKicker: "Adres gevonden",
    mediaLead: "Controleer even of dit het juiste pand is.",
    mediaTitle: "Zijn we bij het juiste adres?",
    title: "Zijn we bij het juiste adres?",
  },
  branch: {
    kicker: "Welkom",
    lead: "Heb je al een account, dan kun je zo weer verder.",
    mediaKicker: "Binnen een paar minuten binnen",
    mediaLead: "Eerst je account, daarna kort zien waar je alles vindt.",
    mediaTitle: "Rustig en duidelijk.",
    title: "Fijn dat je er bent. Ben je hier al eerder geweest?",
  },
  credentials: {
    kicker: "Nieuw account, stap 5 van 6",
    lead: "Vul je e-mailadres in en kies een wachtwoord.",
    mediaKicker: "Bijna klaar",
    mediaLead: "Daarna sturen we je meteen een code.",
    mediaTitle: "Nog één stap.",
    title: "E-mailadres en wachtwoord",
  },
  login: {
    kicker: "Welkom terug",
    lead: "Vul je e-mailadres en wachtwoord in.",
    mediaKicker: "Direct door naar je dossier",
    mediaLead: "Daarna ga je terug naar je dossier of startscherm.",
    mediaTitle: "Je voortgang blijft voor je klaarstaan.",
    title: "Log in en pak je monumentdossier weer op.",
  },
  name: {
    kicker: "Nieuw account, stap 2 van 6",
    lead: "Dan spreken we je meteen wat persoonlijker aan.",
    mediaKicker: "Kennismaken",
    mediaLead: "We beginnen klein.",
    mediaTitle: "Eerst even kennismaken.",
    title: "Hoe mogen we je noemen?",
  },
  verify: {
    kicker: "Bijna klaar",
    lead: "Vul de code uit je mail in.",
    mediaKicker: "Nog één stap",
    mediaLead: "Daarna kom je direct binnen.",
    mediaTitle: "Daarna ben je direct binnen.",
    title: "Je bent er bijna!",
  },
};

const state = {
  confirmedAddress: null,
  signup: {
    city: "",
    email: "",
    houseNumber: "",
    name: "",
    password: "",
    postcode: "",
    street: "",
  },
  view: queryMode === "login" ? "login" : "branch",
};

renderView();
initialize();

elements.startSignupButton?.addEventListener("click", () => {
  setView("name");
});

elements.showLoginButton?.addEventListener("click", () => {
  setView("login");
});

elements.backToBranchFromLogin?.addEventListener("click", () => {
  setView("branch");
});

elements.loginToSignupButton?.addEventListener("click", () => {
  setView("name");
});

elements.backToBranchFromName?.addEventListener("click", () => {
  setView("branch");
});

elements.backToName?.addEventListener("click", () => {
  setView("name");
});

elements.editAddress?.addEventListener("click", () => {
  setView("address");
});

elements.backToAddressConfirm?.addEventListener("click", () => {
  setView("addressConfirm");
});

elements.editCredentials?.addEventListener("click", () => {
  setView("credentials");
});

elements.forgotPasswordButton?.addEventListener("click", () => {
  if (!elements.forgotPasswordMessage) {
    return;
  }

  const isHidden = elements.forgotPasswordMessage.hasAttribute("hidden");
  if (isHidden) {
    elements.forgotPasswordMessage.removeAttribute("hidden");
  } else {
    elements.forgotPasswordMessage.setAttribute("hidden", "");
  }
});

elements.loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const email = String(elements.email?.value || "").trim().toLowerCase();
  const password = String(elements.password?.value || "");

  if (!email || !password) {
    showStatus("Vul eerst je e-mailadres en wachtwoord in.", "error");
    return;
  }

  setBusy(elements.loginForm, true, "Bezig met inloggen...");
  showStatus("We loggen je veilig in...", "success");

  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    window.location.assign(getPostLoginPath());
  } catch (error) {
    showStatus(getFriendlyAuthMessage(error, "Inloggen lukte niet. Probeer het opnieuw."), "error");
    setBusy(elements.loginForm, false, "Inloggen");
  }
});

elements.nameForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  clearStatus();

  const name = String(elements.nameInput?.value || "").trim();
  if (!name) {
    showStatus("Vul eerst je naam in.", "error");
    return;
  }

  state.signup.name = name;
  state.confirmedAddress = null;
  state.signup.city = "";
  state.signup.houseNumber = "";
  state.signup.postcode = "";
  state.signup.street = "";
  setView("address");
});

elements.addressForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const street = String(elements.streetInput?.value || "").trim();
  const houseNumber = String(elements.houseNumberInput?.value || "").trim();
  const postcode = normalizePostcode(String(elements.postcodeInput?.value || ""));

  if (!street || !houseNumber || !postcode) {
    showStatus("Vul straat, huisnummer en postcode in.", "error");
    return;
  }

  state.signup.street = street;
  state.signup.houseNumber = houseNumber;
  state.signup.postcode = postcode;

  setBusy(elements.addressForm, true, "Adres controleren...");
  showStatus("We zoeken het adres even voor je op...", "success");

  try {
    const response = await fetch("/api/address-lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        houseNumber,
        postcode,
        street,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      throw new Error(payload.error || "Adrescontrole lukte niet.");
    }

    if (!["matched", "needs_confirmation"].includes(payload.status)) {
      throw new Error("We konden dit adres nog niet goed koppelen. Controleer de invoer nog even.");
    }

    const confirmedProfile = payload.status === "matched" ? payload.profile : payload.suggestedProfile;
    state.confirmedAddress = confirmedProfile;
    state.signup.street = confirmedProfile.street || state.signup.street;
    state.signup.houseNumber = confirmedProfile.houseNumber || state.signup.houseNumber;
    state.signup.postcode = confirmedProfile.postcode || state.signup.postcode;
    state.signup.city = confirmedProfile.city || state.signup.city;

    renderConfirmedAddress(payload);
    setView("addressConfirm");
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : "Adrescontrole lukte niet. Probeer het opnieuw.",
      "error",
    );
  } finally {
    setBusy(elements.addressForm, false, "Adres controleren");
  }
});

elements.addressConfirmForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  clearStatus();
  if (!state.confirmedAddress) {
    showStatus("We hebben nog geen adres om te bevestigen.", "error");
    setView("address");
    return;
  }

  setView("credentials");
});

elements.credentialsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const email = String(elements.signupEmailInput?.value || "").trim().toLowerCase();
  const password = String(elements.signupPasswordInput?.value || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showStatus("Vul een geldig e-mailadres in.", "error");
    return;
  }

  if (password.length < 8) {
    showStatus("Kies een wachtwoord van minimaal 8 tekens.", "error");
    return;
  }

  state.signup.email = email;
  state.signup.password = password;

  await submitSignup();
});

elements.verifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const code = String(elements.verificationCode?.value || "").trim();
  if (!/^\d{6}$/.test(code)) {
    showStatus("Vul de 6-cijferige code uit je mail in.", "error");
    return;
  }

  setBusy(elements.verifyForm, true, "Account bevestigen...");
  showStatus("We bevestigen je account...", "success");

  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.verifyOtp({
      email: state.signup.email,
      token: code,
      type: "email",
    });

    if (error) {
      throw error;
    }

    showStatus("Je account staat klaar. We laten je even zien waar je alles vindt.", "success");
    window.setTimeout(() => {
      window.location.assign(tourRedirectPath);
    }, 450);
  } catch (error) {
    showStatus(
      getFriendlyAuthMessage(
        error,
        "Deze code lijkt niet te kloppen. Kijk nog even in je mail of vraag een nieuwe aan.",
      ),
      "error",
    );
    setBusy(elements.verifyForm, false, "Account bevestigen");
  }
});

elements.resendCodeButton?.addEventListener("click", async () => {
  clearStatus();
  setAuxBusy(elements.resendCodeButton, true, "Code versturen...");

  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.resend({
      email: state.signup.email,
      type: "signup",
    });

    if (error) {
      throw error;
    }

    showStatus("We hebben een nieuwe code naar je mailbox gestuurd.", "success");
  } catch (error) {
    showStatus(
      getFriendlyAuthMessage(error, "Een nieuwe code sturen lukte niet. Probeer het zo nog eens."),
      "error",
    );
  } finally {
    setAuxBusy(elements.resendCodeButton, false, "Code opnieuw sturen");
  }
});

async function initialize() {
  try {
    const configResponse = await fetch("/api/client-config");
    const config = configResponse.ok ? await configResponse.json() : { authRequired: false };

    if (!config.authRequired) {
      window.location.replace(getPostLoginPath());
      return;
    }

    const supabase = await getSupabase();
    if (!supabase) {
      window.location.replace(getPostLoginPath());
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      window.location.replace(getPostLoginPath());
    }
  } catch {
    window.location.replace(getPostLoginPath());
  }
}

async function submitSignup() {
  setBusy(elements.credentialsForm, true, "Account aanmaken...");
  showStatus("We maken je account voor je klaar...", "success");

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: state.signup.email,
      password: state.signup.password,
      options: {
        data: {
          city: state.signup.city,
          display_name: state.signup.name,
          house_number: state.signup.houseNumber,
          postcode: state.signup.postcode,
          street: state.signup.street,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      showStatus("Je account staat klaar. We laten je even zien waar je alles vindt.", "success");
      window.setTimeout(() => {
        window.location.assign(tourRedirectPath);
      }, 450);
      return;
    }

    if (elements.verificationCode) {
      elements.verificationCode.value = "";
    }

    setView("verify");
    showStatus(`We hebben een code gestuurd naar ${state.signup.email}.`, "success");
  } catch (error) {
    showStatus(
      getFriendlyAuthMessage(error, "Je account aanmaken lukte niet. Probeer het opnieuw."),
      "error",
    );
  } finally {
    setBusy(elements.credentialsForm, false, "Maak account aan");
  }
}

function renderView() {
  const copy = uiCopy[state.view] || uiCopy.branch;

  setPanelVisibility({
    address: state.view === "address",
    addressConfirm: state.view === "addressConfirm",
    branch: state.view === "branch",
    credentials: state.view === "credentials",
    login: state.view === "login",
    name: state.view === "name",
    verify: state.view === "verify",
  });

  elements.kicker.textContent = copy.kicker;
  elements.title.textContent = copy.title;
  elements.lead.textContent = copy.lead;
  elements.mediaKicker.textContent = copy.mediaKicker;
  elements.mediaLead.textContent = copy.mediaLead;
  elements.mediaTitle.textContent = copy.mediaTitle;

  if (state.view === "name") {
    elements.nameInput.value = state.signup.name;
  }

  if (state.view === "address") {
    elements.streetInput.value = state.signup.street;
    elements.houseNumberInput.value = state.signup.houseNumber;
    elements.postcodeInput.value = state.signup.postcode;
  }

  if (state.view === "credentials") {
    elements.signupEmailInput.value = state.signup.email;
    elements.signupPasswordInput.value = state.signup.password;
  }

  if (state.view === "verify") {
    elements.verifyHelper.textContent = `Bijna klaar. Voer de code in die we naar ${state.signup.email} hebben gestuurd.`;
  }

  renderStepList();
  focusActiveInput();
}

function renderStepList() {
  const activeIndex = getActiveStepIndex();
  elements.stepList.innerHTML = "";

  for (const [index, label] of stepLabels.entries()) {
    const item = document.createElement("div");
    item.className = "login-step-item";
    if (index === activeIndex) {
      item.classList.add("is-active");
    }
    if (index < activeIndex) {
      item.classList.add("is-complete");
    }

    item.innerHTML = `
      <span class="login-step-number">${index + 1}</span>
      <div class="login-step-copy">
        <strong>${label}</strong>
        <p>${stepDescriptions[index]}</p>
      </div>
    `;
    elements.stepList.appendChild(item);
  }
}

function renderConfirmedAddress(payload) {
  const profile = state.confirmedAddress || {};
  const addressText = [
    `${profile.street || state.signup.street} ${profile.houseNumber || state.signup.houseNumber}`.trim(),
    `${profile.postcode || state.signup.postcode} ${profile.city || ""}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  elements.addressConfirmAddress.textContent = addressText;
  renderPropertySummary(profile);

  if (payload.status === "needs_confirmation") {
  elements.addressConfirmTitle.textContent = "Zijn we bij het juiste adres?";
  elements.addressConfirmCopy.textContent = "We vonden geen perfecte match, maar dit lijkt de beste overeenkomst. Klopt dit?";
  return;
}

  elements.addressConfirmTitle.textContent = "Zijn we bij het juiste adres?";
  elements.addressConfirmCopy.textContent = "Klopt dit met het pand waarvoor je begeleiding zoekt?";
}

function renderPropertySummary(profile) {
  if (!elements.propertySummary || !elements.propertyFacts) {
    return;
  }

  const facts = [
    {
      label: "Monumentstatus",
      value: profile.monumentStatus || "Nog geen monumentstatus gevonden",
    },
    {
      label: "Bouwjaar",
      value: profile.buildingAge || "Bouwjaar nog niet gevonden",
    },
    {
      label: "Plaats en gemeente",
      value: [profile.city, profile.municipality].filter(Boolean).join(", ") || "Nog niet gevonden",
    },
  ].filter((item) => item.value);

  elements.propertyFacts.innerHTML = "";

  for (const fact of facts) {
    const item = document.createElement("div");
    item.className = "login-property-fact";
    item.innerHTML = `
      <strong>${fact.label}</strong>
      <span>${fact.value}</span>
    `;
    elements.propertyFacts.appendChild(item);
  }

  if (facts.length) {
    elements.propertySummary.removeAttribute("hidden");
  } else {
    elements.propertySummary.setAttribute("hidden", "");
  }
}

function setView(nextView) {
  state.view = nextView;
  clearStatus();
  renderView();
}

function setPanelVisibility({ address, addressConfirm, branch, credentials, login, name, verify }) {
  toggleHidden(elements.addressForm, !address);
  toggleHidden(elements.addressConfirmForm, !addressConfirm);
  toggleHidden(elements.branchPanel, !branch);
  toggleHidden(elements.credentialsForm, !credentials);
  toggleHidden(elements.loginForm, !login);
  toggleHidden(elements.nameForm, !name);
  toggleHidden(elements.verifyForm, !verify);
}

function toggleHidden(element, shouldHide) {
  if (!element) {
    return;
  }

  if (shouldHide) {
    element.setAttribute("hidden", "");
  } else {
    element.removeAttribute("hidden");
  }
}

function getActiveStepIndex() {
  switch (state.view) {
    case "name":
      return 1;
    case "address":
      return 2;
    case "addressConfirm":
      return 3;
    case "credentials":
      return 4;
    case "verify":
      return 5;
    default:
      return 0;
  }
}

function focusActiveInput() {
  const input =
    state.view === "login"
      ? elements.email
      : state.view === "name"
        ? elements.nameInput
        : state.view === "address"
          ? elements.streetInput
          : state.view === "credentials"
            ? elements.signupEmailInput
            : state.view === "verify"
              ? elements.verificationCode
              : null;

  input?.focus();
}

function setBusy(form, isBusy, submitLabel) {
  if (!form) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const fields = [...form.querySelectorAll("input, button")];

  for (const field of fields) {
    field.disabled = isBusy;
  }

  if (submitButton) {
    submitButton.textContent = submitLabel;
  }
}

function setAuxBusy(button, isBusy, label) {
  if (!button) {
    return;
  }

  button.disabled = isBusy;
  button.textContent = label;
}

function showStatus(message, variant) {
  elements.statusMessage.hidden = false;
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("is-error", variant === "error");
  elements.statusMessage.classList.toggle("is-success", variant === "success");
}

function clearStatus() {
  elements.statusMessage.hidden = true;
  elements.statusMessage.textContent = "";
  elements.statusMessage.classList.remove("is-error", "is-success");
}

function normalizePostcode(value) {
  const compact = String(value || "").replace(/\s+/g, "").toUpperCase();
  if (/^[1-9][0-9]{3}[A-Z]{2}$/.test(compact)) {
    return `${compact.slice(0, 4)} ${compact.slice(4)}`;
  }
  return compact;
}

function getFriendlyAuthMessage(error, fallbackMessage) {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Die combinatie van e-mailadres en wachtwoord herkennen we niet.";
  }
  if (normalized.includes("user already registered")) {
    return "Voor dit e-mailadres bestaat al een account. Je kunt gewoon inloggen.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Je account is nog niet bevestigd. Vul eerst de code uit je mail in.";
  }
  if (normalized.includes("token has expired") || normalized.includes("otp expired")) {
    return "Deze code is verlopen. Vraag gerust een nieuwe aan.";
  }
  if (normalized.includes("invalid token") || normalized.includes("token is invalid")) {
    return "Deze code lijkt niet te kloppen. Kijk nog even in je mail of vraag een nieuwe aan.";
  }

  return message || fallbackMessage;
}
