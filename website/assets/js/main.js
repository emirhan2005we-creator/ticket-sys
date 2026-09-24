/* AY-Tech Präzisionsteile GmbH – Skripte (ohne externe Abhängigkeiten) */
(function () {
  "use strict";

  /* Mobile Navigation ---------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var label = toggle.querySelector(".visually-hidden");

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Menü schließen" : "Menü öffnen";
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) {
        setOpen(false);
      }
    });

    var desktop = window.matchMedia("(min-width: 960px)");
    var onChange = function (mq) { if (mq.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
  }

  /* Aktuelles Jahr im Footer -------------------------------------------- */
  var year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = year; });

  /* Kontaktformular ------------------------------------------------------ */
  var form = document.querySelector("[data-contact-form]");

  if (form) {
    var started = Date.now();
    var duration = form.querySelector('input[name="dauer"]');
    var submit = form.querySelector('[type="submit"]');
    var submitText = submit ? submit.textContent : "";

    form.addEventListener("submit", function () {
      // Ausfüllzeit in Sekunden (Spam-Schutz, wird serverseitig geprüft)
      if (duration) duration.value = String(Math.round((Date.now() - started) / 1000));
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Wird gesendet …";
      }
    });

    // Nach „Zurück“ im Browser den Button wieder freigeben
    window.addEventListener("pageshow", function () {
      if (submit) {
        submit.disabled = false;
        submit.textContent = submitText;
      }
    });
  }

  /* Statusmeldung nach dem Absenden (?status=fehler | ungueltig) --------- */
  var status = new URLSearchParams(window.location.search).get("status");
  if (status) {
    var box = document.querySelector('[data-status="' + status.replace(/[^a-z]/g, "") + '"]');
    if (box) {
      box.hidden = false;
      box.setAttribute("tabindex", "-1");
      // Erst nach dem Laden fokussieren, sonst setzt der Sprung zu #formular den Fokus zurück
      window.addEventListener("load", function () {
        setTimeout(function () { box.focus(); }, 0);
      });
    }
  }
})();
