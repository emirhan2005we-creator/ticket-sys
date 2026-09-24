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
  var started = Date.now();

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
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
  });

  /* Dezente Einblend-Animation beim Scrollen ---------------------------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var staggered = ".card, .feature, .step, .material, .timeline li";
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add("is-visible");
        // Klassen danach entfernen, damit Hover-Übergänge wieder normal greifen
        setTimeout(function () {
          el.classList.remove("reveal", "is-visible");
          el.style.removeProperty("--reveal-delay");
        }, 1300);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    document.querySelectorAll(".section-head, .split > *, .cta-inner, .form, .contact-card, " + staggered)
      .forEach(function (el) {
        // Bereits sichtbare Elemente nicht ausblenden (kein Flackern beim Laden)
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        if (el.matches(staggered) && el.parentElement) {
          var index = Array.prototype.indexOf.call(el.parentElement.children, el);
          el.style.setProperty("--reveal-delay", Math.min(index, 5) * 80 + "ms");
        }
        el.classList.add("reveal");
        observer.observe(el);
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
