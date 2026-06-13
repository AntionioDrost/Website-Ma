import { getPostLoginPath } from "./auth.js";
import { getSupabase } from "./supabase-client.js";

const form = document.querySelector("#login-form");
const forgotPasswordButton = document.querySelector("#forgot-password");
const forgotPasswordMessage = document.querySelector("#forgot-password-message");
const statusMessage = document.querySelector("#login-status");
const submitButton = form?.querySelector('button[type="submit"]');

initialize();

if (forgotPasswordButton && forgotPasswordMessage) {
  forgotPasswordButton.addEventListener("click", () => {
    const isHidden = forgotPasswordMessage.hasAttribute("hidden");
    if (isHidden) {
      forgotPasswordMessage.removeAttribute("hidden");
      return;
    }

    forgotPasswordMessage.setAttribute("hidden", "");
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = String(form.email.value || "").trim();
    const password = String(form.password.value || "");

    if (!email || !password) {
      showStatus("Vul eerst je e-mailadres en wachtwoord in.", "error");
      return;
    }

    setBusy(true);
    showStatus("We loggen je veilig in...", "success");

    try {
      const supabase = await getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      window.location.assign(getPostLoginPath());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Inloggen lukte niet. Probeer het opnieuw.";
      showStatus(message, "error");
      setBusy(false);
    }
  });
}

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
  } catch (error) {
    window.location.replace(getPostLoginPath());
  }
}

function setBusy(isBusy) {
  if (!form || !submitButton) {
    return;
  }

  form.email.disabled = isBusy;
  form.password.disabled = isBusy;
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Bezig met inloggen..." : "Inloggen";
}

function showStatus(message, variant) {
  if (!statusMessage) {
    return;
  }

  statusMessage.hidden = false;
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", variant === "error");
  statusMessage.classList.toggle("is-success", variant === "success");
}
