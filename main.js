/* MMSAR — theme, public support form, voices list, PDF reader */

(function () {
  "use strict";

  const SUBMIT_URL = "api/submit.php";
  const LIST_URL = "api/list.php";

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
    applyTheme(document.body.classList.contains("light") ? "dark" : "light");
  };

  // ─── Form ────────────────────────────────────────────────
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
    if (volunteerExtra) {
      volunteerExtra.style.display =
        selectedIntent() === "volunteer" ? "block" : "none";
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
        });
    });
  }

  function isValidEmail(value) {
    // Practical client check; server re-validates
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
  }

  /** Client-side mirror of server alias filter (server is authoritative). */
  function aliasIsOffensive(alias) {
    var n = String(alias || "")
      .toLowerCase()
      .replace(/[\u200b-\u200d\ufeff\u00ad]/g, "");
    var compact = n.replace(/[\s\-_.,*\/\\|~'"`]+/g, "");
    var map = {
      "0": "o",
      "1": "i",
      "3": "e",
      "4": "a",
      "5": "s",
      "7": "t",
      "8": "b",
      "9": "g",
      "@": "a",
      $: "s",
      "!": "i",
      "#": "u",
      "+": "t",
    };
    var norm = compact.replace(/[01345789@$!#+]/g, function (ch) {
      return map[ch] || ch;
    });
    var letters = norm.replace(/[^a-z]/g, "");
    var blocked = [
      "fuck",
      "fuk",
      "fck",
      "fuc",
      "phuck",
      "shit",
      "cunt",
      "bitch",
      "asshole",
      "arsehole",
      "bastard",
      "dickhead",
      "wanker",
      "slut",
      "whore",
      "nigger",
      "nigga",
      "faggot",
      "retard",
      "motherfucker",
      "getfucked",
      "fuckyou",
      "fuckoff",
      "pedo",
      "paedo",
      "rape",
      "nazi",
      "hitler",
    ];
    for (var i = 0; i < blocked.length; i++) {
      if (letters.indexOf(blocked[i]) !== -1) return true;
    }
    if (/get\s*f+u+[c(k]+/i.test(n) || /f+u+[c(k]+\s*(you|off|u)\b/i.test(n)) {
      return true;
    }
    return false;
  }

  // If they try to leave the public list, keep them on it and explain Alias
  const publicEl = document.getElementById("Public");
  if (publicEl) {
    publicEl.addEventListener("click", function (e) {
      if (publicEl.checked) return; // allowing check is fine
      // They are unchecking
      e.preventDefault();
      publicEl.checked = true;
      const aliasEl = document.getElementById("Alias");
      window.alert(
        "Please stay on the public list using an Alias.\n\n" +
          "• The public list only shows your Alias and position\n" +
          "• Your email is never published\n" +
          "• You may be emailed by the project, but the email list is not released to anyone\n\n" +
          "Tip: enter something like “Sam M” or “Local coxswain” as your Alias."
      );
      if (aliasEl) {
        aliasEl.focus();
        if (!aliasEl.value.trim()) {
          aliasEl.placeholder = "e.g. Sam M — protects your privacy";
        }
      }
    });
    // Also catch change via keyboard
    publicEl.addEventListener("change", function () {
      if (!publicEl.checked) {
        publicEl.checked = true;
      }
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const emailEl = document.getElementById("Email");
      const aliasEl = document.getElementById("Alias");
      const commentsEl = document.getElementById("Comments");
      const otherEl = document.getElementById("Other");

      const alias = aliasEl ? aliasEl.value.trim() : "";
      const email = emailEl ? emailEl.value.trim().toLowerCase() : "";

      if (!alias) {
        feedbackDiv.textContent =
          "Please enter an Alias for the public list (protects your privacy).";
        feedbackDiv.className = "error";
        aliasEl && aliasEl.focus();
        return;
      }
      if (alias.indexOf("@") !== -1) {
        feedbackDiv.textContent =
          "Use an Alias for the public list — not your email address.";
        feedbackDiv.className = "error";
        aliasEl && aliasEl.focus();
        return;
      }
      if (aliasIsOffensive(alias)) {
        feedbackDiv.textContent =
          "That Alias is not allowed on the public list. Please choose a respectful name or nickname.";
        feedbackDiv.className = "error";
        aliasEl && aliasEl.focus();
        return;
      }
      if (!email || !isValidEmail(email)) {
        feedbackDiv.textContent =
          "Please enter a valid email address (kept private, one entry per email).";
        feedbackDiv.className = "error";
        emailEl && emailEl.focus();
        return;
      }

      const connection = [];
      document
        .querySelectorAll(
          'input[name="connection[]"]:checked, input[name="Connection"]:checked'
        )
        .forEach(function (el) {
          if (el.value) connection.push(el.value);
        });
      if (!connection.length) {
        feedbackDiv.textContent =
          "Please tick at least one connection (live here, boat here, etc.).";
        feedbackDiv.className = "error";
        const first = document.getElementById("conn-live");
        first && first.focus();
        return;
      }

      const roles = [];
      ["Crew", "Skipper", "Radio", "Admin", "General"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el && el.checked) roles.push(id);
      });

      const payload = {
        alias: alias,
        name: alias,
        email: email,
        intent: selectedIntent(),
        public: true,
        connection: connection,
        roles: roles,
        other: otherEl ? otherEl.value.trim() : "",
        comments: commentsEl ? commentsEl.value.trim() : "",
        website: (document.getElementById("website") || {}).value || "",
      };

      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Publishing…';
      feedbackDiv.textContent = "";
      feedbackDiv.className = "";

      fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
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
            "<strong>Thank you — recorded.</strong><br>" +
            "Your <em>Alias</em> is on the public list. Email stays private and is not released. " +
            "Share the winter push if you can.";
          feedbackDiv.className = "success";

          loadVoices();

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
            (error.message || "Something went wrong.") +
            " You can also email " +
            '<a href="mailto:mallacootamsar@gmail.com">mallacootamsar@gmail.com</a>.';
          feedbackDiv.className = "error";
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<i class="fas fa-check"></i> Publish my position';
        });
    });
  }

  // ─── Public voices list ──────────────────────────────────
  var voicesCache = [];
  var activeFilter = "all";

  function setStat(id, n) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(n);
  }

  function renderVoices() {
    const box = document.getElementById("voices-list");
    if (!box) return;

    var rows = voicesCache;
    if (activeFilter !== "all") {
      rows = voicesCache.filter(function (e) {
        return e.intent === activeFilter;
      });
    }

    if (!rows.length) {
      box.innerHTML =
        '<p class="voices-empty">No public names yet — be the first. Winter starts at zero.</p>';
      return;
    }

    box.innerHTML = rows
      .map(function (e) {
        var badgeClass = e.intent || "support";
        return (
          '<div class="voice-row">' +
          '<span class="voice-name"></span>' +
          '<span class="voice-badge ' +
          badgeClass +
          '"></span>' +
          '<span class="voice-meta"></span>' +
          "</div>"
        );
      })
      .join("");

    // Fill text safely
    var nodes = box.querySelectorAll(".voice-row");
    rows.forEach(function (e, i) {
      var row = nodes[i];
      if (!row) return;
      row.querySelector(".voice-name").textContent = e.alias || e.name;
      row.querySelector(".voice-badge").textContent = e.intent_label;
      var parts = [];
      if (e.connection_labels && e.connection_labels.length) {
        parts.push(e.connection_labels.join(" · "));
      }
      if (e.roles && e.roles.length) {
        parts.push("Roles: " + e.roles.join(", "));
      }
      if (e.date) parts.push(e.date);
      row.querySelector(".voice-meta").textContent = parts.join(" · ");
    });
  }

  function loadVoices() {
    fetch(LIST_URL, { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || data.result !== "success") throw new Error("list fail");
        voicesCache = data.entries || [];
        var c = data.counts || {};
        setStat("stat-public", c.public || 0);
        setStat("stat-support", (c.support || 0) + (c.volunteer || 0));
        setStat("stat-status", c.status_quo || 0);
        renderVoices();
      })
      .catch(function () {
        var box = document.getElementById("voices-list");
        if (box) {
          box.innerHTML =
            '<p class="voices-empty">Could not load the public list right now. Try refresh.</p>';
        }
      });
  }

  var filters = document.getElementById("voices-filters");
  if (filters) {
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".voices-filter");
      if (!btn) return;
      filters.querySelectorAll(".voices-filter").forEach(function (b) {
        b.classList.remove("is-active");
      });
      btn.classList.add("is-active");
      activeFilter = btn.getAttribute("data-filter") || "all";
      renderVoices();
    });
  }

  // ─── PDF ─────────────────────────────────────────────────
  const PDF_URL = "images/Vic-MSAR-Reform.pdf";
  const pdfModal = document.getElementById("pdf-modal");
  const pdfFrame = document.getElementById("pdf-frame");

  window.openPdfModal = function () {
    if (!pdfModal) return;
    if (pdfFrame) pdfFrame.src = PDF_URL + "#view=FitH";
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

  window.addEventListener("DOMContentLoaded", function () {
    applyTheme(localStorage.getItem("theme") || "dark");
    loadVoices();
  });
})();
