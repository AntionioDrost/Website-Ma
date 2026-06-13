const form = document.querySelector("#login-form");
const forgotPasswordButton = document.querySelector("#forgot-password");
const forgotPasswordMessage = document.querySelector("#forgot-password-message");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.assign("/thuis");
  });
}

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
