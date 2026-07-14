/* MMSAR — theme toggle + survey/pledge form */

(function () {
  "use strict";

  // ─── Theme ───────────────────────────────────────────────
  function applyTheme(theme) {
    const body = document.body;
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    const icon = btn.querySelector("i");
    const label = btn.querySelector("span");

    if (theme === "light") {
      body.classList.remove("dark");
      body.classList.add("light");
      if (icon) {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      }
      if (label) label.textContent = "Light";
    } else {
      body.classList.remove("light");
      body.classList.add("dark");
      if (icon) {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
      if (label) label.textContent = "Dark";
    }
    localStorage.setItem("theme", theme);
  }

  window.toggleTheme = function () {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
  };

  // ─── Form / modal ────────────────────────────────────────
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzcIuAmizvshrZm5l_vHBrs-tPMI2LrG1Ozcpl-pQ6pRm07Lr41QVpXs4GO8darkisLfQ/exec";

  const modal = document.getElementById("form-modal");
  const form = document.getElementById("unified-form");
  const formTitle = document.getElementById("form-title");
  const formSubtitle = document.getElementById("form-subtitle");
  const submitButton = document.getElementById("submit-button");
  const feedbackDiv = document.getElementById("form-feedback");
  const surveyCheckbox = document.getElementById("Survey");
  const pledgeCheckbox = document.getElementById("Pledge");
  const surveyQuestions = document.getElementById("survey-questions");
  const pledgeQuestions = document.getElementById("pledge-questions");

  window.openFormModal = function (action) {
    if (!modal || !form) return;
    form.style.display = "block";
    form.reset();
    feedbackDiv.textContent = "";
    feedbackDiv.className = "";
    formTitle.textContent = "Community Input & Support";
    formTitle.style.display = "block";
    formSubtitle.style.display = "block";
    submitButton.style.display = "inline-flex";
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
    surveyQuestions.style.display = "none";
    pledgeQuestions.style.display = "none";

    if (action === "Survey") {
      surveyCheckbox.checked = true;
      surveyQuestions.style.display = "block";
    } else if (action === "Pledge") {
      pledgeCheckbox.checked = true;
      pledgeQuestions.style.display = "block";
    }

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  window.closeFormModal = function () {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  if (surveyCheckbox && surveyQuestions) {
    surveyCheckbox.addEventListener("change", function () {
      surveyQuestions.style.display = surveyCheckbox.checked ? "block" : "none";
    });
  }
  if (pledgeCheckbox && pledgeQuestions) {
    pledgeCheckbox.addEventListener("change", function () {
      pledgeQuestions.style.display = pledgeCheckbox.checked ? "block" : "none";
    });
  }

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
      window.closeFormModal();
    }
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!surveyCheckbox.checked && !pledgeCheckbox.checked) {
        feedbackDiv.textContent =
          "Please select at least one action (Survey or Pledge).";
        feedbackDiv.className = "error";
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      feedbackDiv.textContent = "";
      feedbackDiv.className = "";

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const allCheckboxes = [
        "Survey",
        "Pledge",
        "Crew",
        "Skipper",
        "Radio",
        "Admin",
        "General",
      ];
      allCheckboxes.forEach(function (name) {
        const el = document.getElementById(name);
        data[name] = el && el.checked ? "1" : "0";
      });

      fetch(WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify(data),
      })
        .then(function (response) {
          return response.text();
        })
        .then(function (text) {
          const result = JSON.parse(text);
          if (result.result !== "success") {
            throw new Error(
              result.message || "An unknown error occurred on the server."
            );
          }

          form.style.display = "none";
          formSubtitle.style.display = "none";
          formTitle.textContent = "Thank You!";
          formTitle.style.display = "block";

          feedbackDiv.innerHTML =
            "Your submission has been recorded. Your support is vital.<br><br>Please consider sharing this website with a friend.";
          feedbackDiv.className = "success";

          const copyButton = document.createElement("button");
          copyButton.type = "button";
          copyButton.className = "btn btn-primary";
          copyButton.style.marginTop = "1.25rem";
          copyButton.innerHTML =
            '<i class="fas fa-copy"></i> Copy Share Message';
          copyButton.onclick = function () {
            const shareText =
              "Hi! Please take a look at the proposal for a new community-led Marine Search and Rescue unit in Mallacoota and show your support: https://mmsar.au/";
            navigator.clipboard
              .writeText(shareText)
              .then(function () {
                copyButton.innerHTML =
                  '<i class="fas fa-check"></i> Copied to Clipboard!';
              })
              .catch(function (err) {
                console.error("Copy failed", err);
              });
          };
          feedbackDiv.appendChild(copyButton);
        })
        .catch(function (error) {
          console.error("Submission Error:", error);
          feedbackDiv.textContent =
            "An error occurred, but your data may have been saved. Please check with the administrator.";
          feedbackDiv.className = "error";
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<i class="fas fa-paper-plane"></i> Submit';
        });
    });
  }

  // ─── Init ────────────────────────────────────────────────
  window.addEventListener("DOMContentLoaded", function () {
    const theme = localStorage.getItem("theme") || "dark";
    applyTheme(theme);
  });
})();
