/* AY-Tech Präzisionsteile GmbH – Skripte (ohne externe Abhängigkeiten) */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var scriptSrc = document.currentScript ? document.currentScript.src : "";
  var hasIO = "IntersectionObserver" in window;

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

  /* Header-Schatten und Scroll-Fortschritt ------------------------------- */
  var header = document.querySelector(".site-header");
  var ticking = false;
  var onScroll = function () {
    ticking = false;
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    root.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : "0");
  };
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Kontaktformulare ----------------------------------------------------- */
  var started = Date.now();

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    var duration = form.querySelector('input[name="dauer"]');
    var submit = form.querySelector('[type="submit"]');
    var submitHTML = submit ? submit.innerHTML : "";

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
        submit.innerHTML = submitHTML;
      }
    });
  });

  /* Einblend-Animation beim Scrollen ------------------------------------ */
  if (!reduceMotion && hasIO) {
    var staggered = ".card, .feature, .step, .material, .timeline li, .shot";
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add("is-visible");
        // Klassen danach entfernen, damit Hover- und Neige-Effekte wieder greifen
        setTimeout(function () {
          el.classList.remove("reveal", "is-visible");
          el.style.removeProperty("--reveal-delay");
        }, 1300);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    document.querySelectorAll(".section-head, .split > *, .cta-inner, .form, .contact-card, .quote-card, " + staggered)
      .forEach(function (el) {
        // Bereits sichtbare Elemente nicht ausblenden (kein Flackern beim Laden)
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        if (el.matches(staggered) && el.parentElement) {
          var index = Array.prototype.indexOf.call(el.parentElement.children, el);
          el.style.setProperty("--reveal-delay", Math.min(index, 5) * 90 + "ms");
        }
        el.classList.add("reveal");
        observer.observe(el);
      });
  }

  /* Markierungen in Überschriften einzeichnen ----------------------------- */
  var highlights = document.querySelectorAll(".hl");
  if (!reduceMotion && hasIO) {
    var hlObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-on");
        hlObserver.unobserve(entry.target);
      });
    }, { threshold: 0.8 });
    highlights.forEach(function (el) { hlObserver.observe(el); });
  } else {
    highlights.forEach(function (el) { el.classList.add("is-on"); });
  }

  /* Zahlen hochzählen ---------------------------------------------------- */
  if (!reduceMotion && hasIO) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        var el = entry.target;
        var target = Number(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var start = null;
        var step = function (ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / 1600);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach(function (el) { countObserver.observe(el); });
  }

  /* Maus-Effekte: Licht, Neigen, magnetische Buttons ---------------------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".hero, .page-hero, [data-tilt], [data-spot]").forEach(function (el) {
      var tilt = el.hasAttribute("data-tilt");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (tilt) {
          el.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
          el.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
        }
      });
      el.addEventListener("pointerleave", function () {
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      });
    });

    document.querySelectorAll(".btn--accent, .nav-cta").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * 0.16).toFixed(1) + "px," + (dy * 0.28).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* Funkenflug beim Klicken ---------------------------------------------- */
  var sparkCanvas = null;
  var sparkCtx = null;
  var sparks = [];
  var sparking = false;
  var COLORS = ["#fff3d6", "#ffd27a", "#ffb13d", "#ff7a1a", "#ff5a1f"];

  var sparkFrame = function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    sparkCtx.clearRect(0, 0, w, h);
    sparkCtx.globalCompositeOperation = "lighter";
    sparkCtx.lineCap = "round";
    sparks = sparks.filter(function (p) { return p.life > 0; });
    sparks.forEach(function (p) {
      var px = p.x;
      var py = p.y;
      p.vy += 0.3;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      sparkCtx.globalAlpha = Math.max(0, p.life);
      sparkCtx.strokeStyle = p.c;
      sparkCtx.lineWidth = p.w;
      sparkCtx.beginPath();
      sparkCtx.moveTo(px - p.vx * 1.6, py - p.vy * 1.6);
      sparkCtx.lineTo(p.x, p.y);
      sparkCtx.stroke();
    });
    sparkCtx.globalAlpha = 1;
    if (sparks.length) requestAnimationFrame(sparkFrame);
    else { sparking = false; sparkCtx.clearRect(0, 0, w, h); }
  };

  var burst = function (x, y) {
    if (reduceMotion) return;
    if (!sparkCanvas) {
      sparkCanvas = document.createElement("canvas");
      sparkCanvas.className = "sparks";
      sparkCanvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(sparkCanvas);
      sparkCtx = sparkCanvas.getContext("2d");
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (sparkCanvas.width !== Math.round(window.innerWidth * dpr) || sparkCanvas.height !== Math.round(window.innerHeight * dpr)) {
      sparkCanvas.width = Math.round(window.innerWidth * dpr);
      sparkCanvas.height = Math.round(window.innerHeight * dpr);
      sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    for (var i = 0; i < 28; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
      var speed = 3 + Math.random() * 7.5;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 1, decay: 0.018 + Math.random() * 0.026,
        c: COLORS[i % COLORS.length], w: 1 + Math.random() * 1.8
      });
    }
    if (!sparking) { sparking = true; requestAnimationFrame(sparkFrame); }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest(".btn--accent, .nav-cta, [data-sparks]") : null;
    if (!el) return;
    var x = e.clientX;
    var y = e.clientY;
    if (!x && !y) { // Tastatur
      var r = el.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    burst(x, y);

    // Bei Links auf andere Seiten kurz warten, damit die Funken zu sehen sind
    if (reduceMotion || el.tagName !== "A" || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || el.target === "_blank") return;
    var href = el.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || /^(tel|mailto):/.test(href)) return;
    var url = new URL(el.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    setTimeout(function () { window.location.href = el.href; }, 230);
  });

  /* Interaktives 3D-Bauteil (nur Startseite) ------------------------------ */
  var viewer = document.querySelector("[data-viewer]");
  if (viewer && scriptSrc) {
    var webgl = false;
    try {
      var test = document.createElement("canvas");
      webgl = !!(window.WebGLRenderingContext && (test.getContext("webgl2") || test.getContext("webgl")));
    } catch (err) { webgl = false; }

    if (webgl) {
      var loadViewer = function () {
        var src = new URL("hero3d.js", scriptSrc);
        src.search = new URL(scriptSrc).search; // gleiche Version wie main.js (Cache)
        var module = document.createElement("script");
        module.type = "module";
        module.textContent =
          'import { initViewer } from "' + src.href + '";' +
          'initViewer(document.querySelector("[data-viewer]"), { reducedMotion: ' + reduceMotion + ' });';
        document.body.appendChild(module);
      };
      if (document.readyState === "complete") setTimeout(loadViewer, 100);
      else window.addEventListener("load", function () { setTimeout(loadViewer, 100); });
    }
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
