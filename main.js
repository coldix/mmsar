/* MMSAR — theme, support form (JSON + email), PDF reader */

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

  // ─── Support form → api/submit.php ───────────────────────
  const SUBMIT_URL = "api/submit.php";

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
  }

  intentRadios.forEach(function (radio) {
    radio.addEventListener("change", syncIntentUI);
  });
  syncIntentUI();

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

      const emailEl = document.getElementById("Email");
      const nameEl = document.getElementById("Name");
      const commentsEl = document.getElementById("Comments");
      const otherEl = document.getElementById("Other");

      if (!emailEl || !emailEl.value.trim()) {
        feedbackDiv.textContent =
          "Please enter your email so we can record your support.";
        feedbackDiv.className = "error";
        emailEl && emailEl.focus();
        return;
      }

      const roles = [];
      ["Crew", "Skipper", "Radio", "Admin", "General"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el && el.checked) roles.push(id);
      });

      const payload = {
        name: nameEl ? nameEl.value.trim() : "",
        email: emailEl.value.trim(),
        intent: selectedIntent(),
        roles: roles,
        other: otherEl ? otherEl.value.trim() : "",
        comments: commentsEl ? commentsEl.value.trim() : "",
        website: (document.getElementById("website") || {}).value || "",
      };

      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Sending…';
      feedbackDiv.textContent = "";
      feedbackDiv.className = "";

      fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response.text().then(function (text) {
            var result;
            try {
              result = JSON.parse(text);
            } catch (err) {
              throw new Error("Bad server response");
            }
            if (!response.ok || result.result !== "success") {
              throw new Error(result.message || "Submit failed");
            }
            return result;
          });
        })
        .then(function () {
          form.querySelectorAll("input, textarea, button, fieldset").forEach(
            function (el) {
              if (el.id === "submit-button") return;
              el.disabled = true;
            }
          );
          submitButton.style.display = "none";

          feedbackDiv.innerHTML =
            "<strong>Thank you — you’re on the list.</strong><br>" +
            "We emailed the project inbox. If you can, share this with one boat person.";
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
            "Something went wrong saving the form. Please email " +
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
      if (
        /[?&]volunteer=1/.test(location.search) ||
        location.hash.indexOf("volunteer") !== -1
      ) {
        selectVolunteerIntent();
      }
    }
  });
})();
