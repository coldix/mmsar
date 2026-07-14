/* MMSAR — theme, support form, PDF reader */

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

  // ─── Support form (simple — maps to existing Apps Script sheet) ───
  // Keep field names: Email, Name, Phone, Address, Survey, Pledge,
  // Connection, Preference, Crew, Skipper, Radio, Admin, General, Other, Amount, Comments
  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbzcIuAmizvshrZm5l_vHBrs-tPMI2LrG1Ozcpl-pQ6pRm07Lr41QVpXs4GO8darkisLfQ/exec";

  const form = document.getElementById("support-form");
  const submitButton = document.getElementById("submit-button");
  const feedbackDiv = document.getElementById("form-feedback");
  const volunteerExtra = document.getElementById("volunteer-extra");
  const intentRadios = document.querySelectorAll('input[name="Intent"]');

  function selectedIntent() {
    const el = document.querySelector('input[name="Intent"]:checked');
    return el ? el.value : "support";
  }

  function syncIntentUI() {
    const intent = selectedIntent();
    if (volunteerExtra) {
      volunteerExtra.style.display = intent === "volunteer" ? "block" : "none";
    }

    // Hidden fields for legacy sheet columns
    const survey = document.getElementById("Survey");
    const pledge = document.getElementById("Pledge");
    const connection = document.getElementById("Connection");
    const preference = document.getElementById("Preference");
    const amount = document.getElementById("Amount");

    if (intent === "support") {
      if (survey) survey.value = "0";
      if (pledge) pledge.value = "1";
      if (connection) connection.value = "Community member with an interest";
      if (preference) preference.value = "A new, locally-managed MSAR unit";
      if (amount) amount.value = "";
    } else if (intent === "volunteer") {
      if (survey) survey.value = "1";
      if (pledge) pledge.value = "1";
      if (connection) connection.value = "Interested in volunteering in the future";
      if (preference) preference.value = "A new, locally-managed MSAR unit";
      if (amount) amount.value = "$time";
    } else {
      // stay informed
      if (survey) survey.value = "0";
      if (pledge) pledge.value = "1";
      if (connection) connection.value = "Community member with an interest";
      if (preference) preference.value = "I have no position";
      if (amount) amount.value = "";
    }
  }

  intentRadios.forEach(function (radio) {
    radio.addEventListener("change", syncIntentUI);
  });
  syncIntentUI();

  // Copy Facebook post text
  const copyShareBtn = document.getElementById("copy-share-btn");
  const shareBlurb = document.getElementById("share-blurb");
  if (copyShareBtn && shareBlurb) {
    copyShareBtn.addEventListener("click", function () {
      const text = shareBlurb.textContent.replace(/\s+/g, " ").trim();
      navigator.clipboard
        .writeText(text)
        .then(function () {
          copyShareBtn.innerHTML =
            '<i class="fas fa-check"></i> Copied — paste into Facebook';
          setTimeout(function () {
            copyShareBtn.innerHTML =
              '<i class="fas fa-copy"></i> Copy post text';
          }, 2500);
        })
        .catch(function () {
          // Fallback select
          const range = document.createRange();
          range.selectNodeContents(shareBlurb);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          copyShareBtn.innerHTML =
            '<i class="fas fa-info-circle"></i> Text selected — copy manually';
        });
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      syncIntentUI();

      const email = document.getElementById("Email");
      if (!email || !email.value.trim()) {
        feedbackDiv.textContent = "Please enter your email so we can record your support.";
        feedbackDiv.className = "error";
        email && email.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Sending…';
      feedbackDiv.textContent = "";
      feedbackDiv.className = "";

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Intent is UI-only; sheet does not need it, but keep in Comments prefix if useful
      const intent = selectedIntent();
      delete data.Intent;
      const intentLabel =
        intent === "volunteer"
          ? "[Volunteer offer] "
          : intent === "informed"
            ? "[Stay informed] "
            : "[Supporter] ";
      data.Comments = intentLabel + (data.Comments || "").trim();

      ["Survey", "Pledge", "Crew", "Skipper", "Radio", "Admin", "General"].forEach(
        function (name) {
          const el = document.getElementById(name);
          if (!el) {
            data[name] = "0";
            return;
          }
          if (el.type === "checkbox") {
            data[name] = el.checked ? "1" : "0";
          } else {
            data[name] = el.value === "1" || el.value === 1 ? "1" : String(el.value || "0");
          }
        }
      );

      // Force numeric-like flags for sheet
      data.Survey = document.getElementById("Survey").value === "1" ? "1" : "0";
      data.Pledge = document.getElementById("Pledge").value === "1" ? "1" : "0";

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

          form.querySelectorAll("input, textarea, button, fieldset").forEach(
            function (el) {
              if (el.id === "submit-button") return;
              el.disabled = true;
            }
          );
          submitButton.style.display = "none";

          feedbackDiv.innerHTML =
            "<strong>Thank you — you’re on the list.</strong><br>" +
            "If you can, share the post text with one boat person who should see this.";
          feedbackDiv.className = "success";

          const again = document.createElement("button");
          again.type = "button";
          again.className = "btn btn-secondary";
          again.style.marginTop = "1rem";
          again.innerHTML = '<i class="fas fa-copy"></i> Copy Facebook post';
          again.onclick = function () {
            if (copyShareBtn) copyShareBtn.click();
          };
          feedbackDiv.appendChild(again);
        })
        .catch(function (error) {
          console.error("Submission Error:", error);
          feedbackDiv.innerHTML =
            "Something went wrong sending the form. Please email " +
            '<a href="mailto:mallacootamsar@gmail.com">mallacootamsar@gmail.com</a> ' +
            "instead — we still want your name.";
          feedbackDiv.className = "error";
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<i class="fas fa-check"></i> Count me in';
        });
    });
  }

  // ─── PDF reader modal ────────────────────────────────────
  const PDF_URL = "images/Vic-MSAR-Reform.pdf";
  const pdfModal = document.getElementById("pdf-modal");
  const pdfFrame = document.getElementById("pdf-frame");

  window.openPdfModal = function () {
    if (!pdfModal) return;
    if (pdfFrame) {
      pdfFrame.src = PDF_URL + "#view=FitH";
    }
    pdfModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  window.closePdfModal = function () {
    if (!pdfModal) return;
    pdfModal.classList.remove("is-open");
    if (pdfFrame) pdfFrame.src = "about:blank";
    document.body.style.overflow = "";
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && pdfModal && pdfModal.classList.contains("is-open")) {
      window.closePdfModal();
    }
  });

  function selectVolunteerIntent() {
    const v = document.getElementById("intent-volunteer");
    if (v) {
      v.checked = true;
      syncIntentUI();
    }
  }

  // ─── Init ────────────────────────────────────────────────
  window.addEventListener("DOMContentLoaded", function () {
    const theme = localStorage.getItem("theme") || "dark";
    applyTheme(theme);

    const heroVol = document.getElementById("hero-volunteer-link");
    if (heroVol) {
      heroVol.addEventListener("click", function () {
        selectVolunteerIntent();
      });
    }

    if (location.hash === "#support") {
      // Allow ?volunteer=1 deep link from Facebook
      if (/[?&]volunteer=1/.test(location.search) || location.hash.indexOf("volunteer") !== -1) {
        selectVolunteerIntent();
      }
    }
  });
})();
