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

  /* Scroll-Story „Vom Rohling zum Präzisionsteil“ ----------------------- */
  var story = document.querySelector("[data-story]");
  if (story && !reduceMotion) {
    story.classList.add("is-pinned");
    var storySteps = story.querySelectorAll("[data-step]");
    var storyPhase = story.querySelector("[data-story-phase]");
    var MARKS = [0, 0.1, 0.5, 0.72, 0.86];
    var currentStep = -1;
    var updateStory = function () {
      var r = story.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var prog = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      story.setAttribute("data-progress", prog.toFixed(4));
      story.style.setProperty("--p", prog.toFixed(4));
      var idx = 0;
      for (var i = 0; i < MARKS.length; i++) if (prog >= MARKS[i]) idx = i;
      if (idx !== currentStep) {
        currentStep = idx;
        storySteps.forEach(function (el, n) {
          el.classList.toggle("is-active", n === idx);
          el.classList.toggle("is-done", n < idx);
        });
        if (storyPhase && storySteps[idx]) storyPhase.textContent = storySteps[idx].querySelector("h3").textContent;
      }
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(updateStory); }, { passive: true });
    window.addEventListener("resize", updateStory);
    updateStory();
  }

  /* Laufband reagiert auf Scrollrichtung und -tempo ---------------------- */
  var marquee = document.querySelector(".marquee");
  if (marquee && !reduceMotion) {
    var mTrack = marquee.querySelector(".marquee-track");
    var mX = 0, mLastY = window.scrollY, mVel = 0, mDir = -1, mHover = false, mVisible = true;
    marquee.classList.add("is-js");
    marquee.addEventListener("pointerenter", function () { mHover = true; });
    marquee.addEventListener("pointerleave", function () { mHover = false; });
    if (hasIO) new IntersectionObserver(function (en) { mVisible = en[0].isIntersecting; }).observe(marquee);
    var mLoop = function () {
      var y = window.scrollY;
      var d = y - mLastY;
      mLastY = y;
      if (d !== 0) mDir = d > 0 ? -1 : 1;
      mVel += (Math.abs(d) - mVel) * 0.1;
      if (mVisible) {
        mX += (mHover ? 0.12 : 0.55 + Math.min(mVel, 60) * 0.14) * mDir;
        var half = mTrack.scrollWidth / 2;
        if (half > 0) { if (mX <= -half) mX += half; if (mX > 0) mX -= half; }
        var skew = Math.max(-7, Math.min(7, -d * 0.2));
        mTrack.style.transform = "translate3d(" + mX.toFixed(2) + "px,0,0) skewX(" + skew.toFixed(2) + "deg)";
      }
      requestAnimationFrame(mLoop);
    };
    requestAnimationFrame(mLoop);
  }

  /* CAD-Fadenkreuz mit Koordinaten in Millimetern ------------------------ */
  var heroEl = document.querySelector(".hero");
  var cad = heroEl ? heroEl.querySelector(".cad-cursor") : null;
  if (cad && finePointer && !reduceMotion) {
    var cadLabel = cad.querySelector(".cad-label");
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      cad.style.setProperty("--cx", x.toFixed(0) + "px");
      cad.style.setProperty("--cy", y.toFixed(0) + "px");
      cadLabel.textContent = "X " + (x * 0.2646).toFixed(1).padStart(5, "0") + " · Y " + (y * 0.2646).toFixed(1).padStart(5, "0");
      cad.classList.add("is-on");
    });
    heroEl.addEventListener("pointerleave", function () { cad.classList.remove("is-on"); });
  }

  /* Bento-Kacheln: Animationen beim Sichtbarwerden ------------------------ */
  var runDro = function (tile) {
    tile.querySelectorAll("[data-dro-to]").forEach(function (el, i) {
      var to = parseFloat(el.getAttribute("data-dro-to"));
      var from = to + (Math.random() - 0.5) * 400;
      var start = null;
      var dur = 1500 + i * 300;
      var step = function (ts) {
        if (start === null) start = ts;
        var k = Math.min(1, (ts - start) / dur);
        el.textContent = (from + (to - from) * (1 - Math.pow(1 - k, 4))).toFixed(3);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  var animTiles = document.querySelectorAll(".tile--batch, .tile--quality, .tile--time, .tile--prec");
  if (!reduceMotion && hasIO) {
    var tileObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tileObserver.unobserve(entry.target);
        entry.target.classList.add("is-in");
        if (entry.target.classList.contains("tile--prec")) runDro(entry.target);
      });
    }, { threshold: 0.35 });
    animTiles.forEach(function (el) { tileObserver.observe(el); });
  } else {
    animTiles.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Datei-Upload: Dateiliste, Prüfung, Drag & Drop ------------------------ */
  var MAX_FILES = 3;
  var MAX_BYTES = 10 * 1024 * 1024;
  var OK_EXT = /\.(pdf|step|stp|igs|iges|dxf|dwg|zip|jpe?g|png)$/i;
  document.querySelectorAll(".dropzone").forEach(function (zone) {
    var input = zone.querySelector('input[type="file"]');
    var list = zone.querySelector("[data-files]");
    if (!input || !list) return;
    ["dragenter", "dragover"].forEach(function (t) { zone.addEventListener(t, function () { zone.classList.add("is-drag"); }); });
    ["dragleave", "drop"].forEach(function (t) { zone.addEventListener(t, function () { zone.classList.remove("is-drag"); }); });
    input.addEventListener("change", function () {
      var files = Array.prototype.slice.call(input.files || []);
      var total = 0;
      var problem = "";
      list.textContent = "";
      files.forEach(function (f) {
        total += f.size;
        var chip = document.createElement("span");
        chip.textContent = f.name + " · " + (f.size < 1048576 ? Math.max(1, Math.round(f.size / 1024)) + " KB" : (f.size / 1048576).toFixed(1) + " MB");
        if (!OK_EXT.test(f.name)) { chip.className = "is-error"; problem = "Dateityp nicht erlaubt: " + f.name; }
        list.appendChild(chip);
      });
      if (files.length > MAX_FILES) problem = "Bitte höchstens " + MAX_FILES + " Dateien auswählen.";
      else if (total > MAX_BYTES) problem = "Die Dateien sind zusammen größer als 10 MB.";
      input.setCustomValidity(problem);
      zone.classList.toggle("has-files", files.length > 0);
      if (problem) {
        var err = document.createElement("span");
        err.className = "is-error";
        err.textContent = problem;
        list.appendChild(err);
      }
    });
  });

  /* Interaktives 3D (Startseite): Viewer im Hero + Scroll-Story ----------- */
  var viewer = document.querySelector("[data-viewer]");
  var storyLive = document.querySelector("[data-story].is-pinned");
  if ((viewer || storyLive) && scriptSrc) {
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
          'import { initViewer, initStory } from "' + src.href + '";' +
          'var o = { reducedMotion: ' + reduceMotion + ' };' +
          'var v = document.querySelector("[data-viewer]"); if (v) initViewer(v, o);' +
          'var s = document.querySelector("[data-story].is-pinned"); if (s) initStory(s, o);';
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
