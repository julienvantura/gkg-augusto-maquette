(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  var animOn = hasGsap && !reduced;
  if (!animOn) document.body.classList.add("no-anim");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ================= LENIS ================= */
  var lenis = null;
  if (animOn && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function toTop(){
    if (lenis) lenis.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }

  /* ================= CURSEUR CUSTOM ================= */
  if (animOn && finePointer) {
    document.body.classList.add("has-cursor");
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    var dx = gsap.quickTo(dot, "x", { duration: .08, ease: "power2.out" });
    var dy = gsap.quickTo(dot, "y", { duration: .08, ease: "power2.out" });
    var rx = gsap.quickTo(ring, "x", { duration: .32, ease: "power2.out" });
    var ry = gsap.quickTo(ring, "y", { duration: .32, ease: "power2.out" });
    window.addEventListener("mousemove", function(e){ dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener("mouseover", function(e){
      if (e.target.closest("a, button, summary, input, textarea, .chip")) ring.classList.add("is-link");
    });
    document.addEventListener("mouseout", function(e){
      if (e.target.closest("a, button, summary, input, textarea, .chip")) ring.classList.remove("is-link");
    });
  }

  /* ================= BOUTONS MAGNÉTIQUES ================= */
  if (animOn && finePointer) {
    document.querySelectorAll(".btn").forEach(function(btn){
      var setX = gsap.quickTo(btn, "x", { duration: .35, ease: "power3.out" });
      var setY = gsap.quickTo(btn, "y", { duration: .35, ease: "power3.out" });
      btn.addEventListener("mousemove", function(e){
        var r = btn.getBoundingClientRect();
        setX((e.clientX - r.left - r.width / 2) * .22);
        setY((e.clientY - r.top - r.height / 2) * .32);
      });
      btn.addEventListener("mouseleave", function(){ setX(0); setY(0); });
    });
  }

  /* ================= VAPEUR (canvas) ================= */
  function Steam(canvas){
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.parts = [];
    this.intensity = 0;
    this.running = false;
    this.sprite = document.createElement("canvas");
    this.sprite.width = this.sprite.height = 64;
    var sctx = this.sprite.getContext("2d");
    var g = sctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, "rgba(243,238,227,.55)");
    g.addColorStop(.55, "rgba(243,238,227,.18)");
    g.addColorStop(1, "rgba(243,238,227,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);
    var self = this;
    this.tick = function(){ self.draw(); if (self.running) requestAnimationFrame(self.tick); };
  }
  Steam.prototype.resize = function(){
    var r = this.c.getBoundingClientRect();
    this.c.width = Math.max(2, r.width);
    this.c.height = Math.max(2, r.height);
  };
  Steam.prototype.start = function(){ if (!this.running){ this.running = true; this.resize(); this.tick(); } };
  Steam.prototype.stop = function(){ this.running = false; };
  Steam.prototype.draw = function(){
    var ctx = this.ctx, W = this.c.width, H = this.c.height;
    ctx.clearRect(0, 0, W, H);
    if (this.intensity > 0.01 && this.parts.length < 90 && Math.random() < this.intensity * .55) {
      this.parts.push({
        x: W * (.5 + (Math.random() - .5) * .42),
        y: H * .96,
        r: 10 + Math.random() * 26,
        vy: .6 + Math.random() * 1.3,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: .008 + Math.random() * .02,
        life: 0,
        maxLife: 140 + Math.random() * 120
      });
    }
    for (var i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i];
      p.life++; p.y -= p.vy; p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * .5;
      p.r *= 1.006;
      var fade = Math.sin(Math.min(1, p.life / p.maxLife) * Math.PI);
      if (p.life >= p.maxLife || p.y < -40) { this.parts.splice(i, 1); continue; }
      ctx.globalAlpha = fade * .8 * Math.max(.25, this.intensity);
      ctx.drawImage(this.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
  };

  /* ================= SIMULATEUR ================= */
  var rp = document.getElementById("rangePizzas");
  var rx2 = document.getElementById("rangePrix");
  function setFill(el){
    var min = +el.min, max = +el.max, v = +el.value;
    el.style.setProperty("--fill", ((v - min) / (max - min) * 100) + "%");
  }
  function calc(){
    var p = +rp.value, prix = +rx2.value;
    document.getElementById("outPizzas").textContent = p;
    document.getElementById("outPrix").textContent = prix.toLocaleString("fr-FR", {minimumFractionDigits:2}) + " €";
    var mois = p * prix * 30;
    document.getElementById("caMois").textContent = mois.toLocaleString("fr-FR", {maximumFractionDigits:0}) + " €";
    document.getElementById("caAn").textContent = (mois * 12).toLocaleString("fr-FR", {maximumFractionDigits:0}) + " €";
    setFill(rp); setFill(rx2);
  }
  if (rp && rx2) { rp.addEventListener("input", calc); rx2.addEventListener("input", calc); calc(); }


  /* ---------- fiche ingrédients : tap (mobile) / survol (desktop) ---------- */
  document.querySelectorAll(".pizza-card .fiche-toggle").forEach(function(btn){
    var card = btn.closest(".pizza-card");
    var fiche = card.querySelector(".fiche");
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var open = !card.classList.contains("is-open");
      document.querySelectorAll(".pizza-card.is-open").forEach(function(c){
        c.classList.remove("is-open");
        c.querySelector(".fiche-toggle").setAttribute("aria-expanded", "false");
        c.querySelector(".fiche").setAttribute("aria-hidden", "true");
      });
      card.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      fiche.setAttribute("aria-hidden", String(!open));
    });
  });
  document.addEventListener("click", function(e){
    if (e.target.closest(".pizza-card")) return;
    document.querySelectorAll(".pizza-card.is-open").forEach(function(c){
      c.classList.remove("is-open");
      c.querySelector(".fiche-toggle").setAttribute("aria-expanded", "false");
      c.querySelector(".fiche").setAttribute("aria-hidden", "true");
    });
  });
  /* ================= FORMULAIRE → MAILTO ================= */
  var form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", function(e){
    e.preventDefault();
    var v = function(id){ return (document.getElementById(id).value || "").trim(); };
    var subject = "Demande d'étude gratuite — " + (v("fEtab") || v("fNom"));
    var body = "Nom : " + v("fNom")
      + "\nTéléphone : " + v("fTel")
      + "\nÉtablissement : " + v("fEtab")
      + "\nCommune : " + v("fVille")
      + "\n\nProjet :\n" + v("fMsg");
    window.location.href = "mailto:contact@gkg-distribution.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  /* ================= MENU MOBILE ================= */
  var burger = document.getElementById("burger");
  var mobmenu = document.getElementById("mobmenu");
  var menuOpen = false;
  function closeMenu(){
    if (!menuOpen) return;
    menuOpen = false;
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    if (animOn) {
      gsap.to(mobmenu, { opacity: 0, duration: .3, onComplete: function(){ mobmenu.classList.remove("open"); } });
    } else mobmenu.classList.remove("open");
    if (lenis) lenis.start();
  }
  function openMenu(){
    menuOpen = true;
    burger.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    mobmenu.classList.add("open");
    if (animOn) {
      gsap.fromTo(mobmenu, { opacity: 0 }, { opacity: 1, duration: .3 });
      gsap.fromTo(mobmenu.querySelectorAll(".mlink"), { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .07, ease: "power3.out", delay: .1, clearProps: "all" });
    }
    if (lenis) lenis.stop();
  }
  if (burger) burger.addEventListener("click", function(){ menuOpen ? closeMenu() : openMenu(); });

  /* ================= ROUTEUR ================= */
  var routes = {
    "": "home", "/": "home",
    "/pizzas": "pizzas",
    "/solution": "solution",
    "/gkg": "gkg",
    "/contact": "contact",
    "/mentions-legales": "legal"
  };
  var titles = {
    home: "Augusto × GKG Distribution",
    pizzas: "La carte — Augusto × GKG Distribution",
    solution: "La solution — Augusto × GKG Distribution",
    gkg: "GKG Distribution — Augusto La Réunion",
    contact: "Contact — Augusto × GKG Distribution",
    legal: "Mentions légales — GKG Distribution"
  };
  var current = null;
  var steamHero = null, steamOven = null;

  function parseRoute(){
    var h = location.hash.replace(/^#/, "");
    return routes.hasOwnProperty(h) ? routes[h] : "home";
  }
  function setNav(key){
    document.querySelectorAll("[data-nav]").forEach(function(a){
      a.classList.toggle("active", a.getAttribute("data-nav") === key);
    });
    document.title = titles[key] || titles.home;
  }

  function killPageAnims(){
    if (!hasGsap) return;
    ScrollTrigger.getAll().forEach(function(t){ t.kill(); });
    if (steamOven) { steamOven.stop(); steamOven = null; }
    var rail = document.getElementById("pizzaRail");
    if (rail) { rail.classList.remove("is-pinned"); gsap.set(rail, { clearProps: "transform" }); }
  }

  /* ---- reveals génériques pour la page affichée ---- */
  function initReveals(pageEl){
    pageEl.querySelectorAll(".reveal").forEach(function(el){
      gsap.fromTo(el, { y: 44, opacity: 0 }, {
        y: 0, opacity: 1, duration: .9, ease: "power3.out", overwrite: "auto",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });
  }

  /* ---- HOME ---- */
  function initHome(pageEl){
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo("#heroPizza", { scale: 1.18, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "power2.out" }, 0)
      .fromTo('#page-home [data-r="1"]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7 }, .15)
      .fromTo('#page-home [data-r="2"]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, .3)
      .fromTo('#page-home [data-r="2b"]', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .7 }, .42)
      .fromTo("#page-home .hero-title .line-inner", { yPercent: 112 }, { yPercent: 0, duration: .95, stagger: .12, ease: "power4.out" }, .5)
      .fromTo('#page-home [data-r="4"]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, .85)
      .fromTo('#page-home [data-r="5"]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7 }, .95)
      .fromTo('#page-home [data-r="6"]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7 }, 1.05);

    gsap.to("#heroPizza", {
      yPercent: -62, rotation: 10, ease: "none",
      scrollTrigger: { trigger: "#page-home .hero", start: "top top", end: "bottom top", scrub: true }
    });

    /* --- scène sortie du four --- */
    var pizza = document.getElementById("ovenPizza");
    var timerEl = document.getElementById("ovenTimer");
    var glow = document.getElementById("ovenGlow");
    var caps = document.querySelectorAll("#ovenCaps .oven-cap");
    steamOven = new Steam(document.getElementById("steamCanvas"));
    steamOven.start();
    var timerObj = { t: 0 };
    var capState = -1;
    function showCap(i){
      if (capState === i) return;
      capState = i;
      caps.forEach(function(c, idx){
        gsap.to(c, { opacity: idx === i ? 1 : 0, y: idx === i ? 0 : 14, duration: .4, overwrite: "auto" });
      });
    }
    gsap.set(caps, { opacity: 0, y: 14 });
    gsap.set(pizza, { yPercent: 106 });
    gsap.set(glow, { opacity: .25 });
    timerEl.textContent = "0:00";

    var sceneTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#ovenScene",
        start: "top top",
        end: "+=230%",
        pin: "#ovenStage",
        scrub: .6,
        onUpdate: function(self){
          var p = self.progress;
          steamOven.intensity = p < .3 ? 0 : Math.min(1, (p - .3) / .45);
          showCap(p < .3 ? 0 : (p < .68 ? 1 : 2));
        },
        onLeave: function(){ steamOven.intensity = .35; },
        onEnterBack: function(){ if (steamOven) steamOven.start(); }
      }
    });
    sceneTl.to(timerObj, {
      t: 120, ease: "none", duration: 1,
      onUpdate: function(){
        var s = Math.round(timerObj.t);
        timerEl.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
      }
    }, 0)
    .to(glow, { opacity: 1, duration: .3 }, .05)
    .to(pizza, { yPercent: 0, duration: .55, ease: "power2.inOut" }, .3)
    .to(pizza, { scale: 1.04, duration: .15, ease: "power1.inOut" }, .85)
    .to(glow, { opacity: .4, duration: .25 }, .75);

    /* --- fan de pizzas (teaser) --- */
    var fanImgs = document.querySelectorAll("#fan img");
    if (fanImgs.length === 3) {
      gsap.fromTo(fanImgs[0], { x: 0, rotation: 0, scale: .8 }, {
        x: "-34%", rotation: -10, scale: .92, ease: "power2.out",
        scrollTrigger: { trigger: "#fan", start: "top 85%", end: "top 35%", scrub: true }
      });
      gsap.fromTo(fanImgs[2], { x: 0, rotation: 0, scale: .8 }, {
        x: "34%", rotation: 10, scale: .92, ease: "power2.out",
        scrollTrigger: { trigger: "#fan", start: "top 85%", end: "top 35%", scrub: true }
      });
    }
  }

  /* ---- PIZZAS ---- */
  function initPizzas(pageEl){
    if (window.matchMedia("(min-width: 960px)").matches) {
      var rail = document.getElementById("pizzaRail");
      var hint = document.getElementById("railHint");
      rail.classList.add("is-pinned");
      if (hint) hint.style.display = "none";
      var getDist = function(){ return Math.max(0, rail.scrollWidth - rail.parentElement.clientWidth); };
      gsap.to(rail, {
        x: function(){ return -getDist(); },
        ease: "none",
        scrollTrigger: {
          trigger: "#page-pizzas .rail-outer",
          start: "top 15%",
          end: function(){ return "+=" + (getDist() + 300); },
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
    }
    /* tilt 3D des cartes */
    if (finePointer) {
      pageEl.querySelectorAll(".pizza-card").forEach(function(card){
        var qx = gsap.quickTo(card, "rotationY", { duration: .5, ease: "power3.out" });
        var qy = gsap.quickTo(card, "rotationX", { duration: .5, ease: "power3.out" });
        card.addEventListener("mousemove", function(e){
          var r = card.getBoundingClientRect();
          qx(((e.clientX - r.left) / r.width - .5) * 10);
          qy(-((e.clientY - r.top) / r.height - .5) * 8);
        });
        card.addEventListener("mouseleave", function(){ qx(0); qy(0); });
      });
    }
    gsap.fromTo("#craftVisual img", { yPercent: -6, scale: 1.08 }, {
      yPercent: 6, scale: 1.08, ease: "none",
      scrollTrigger: { trigger: "#craftVisual", start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  /* ---- SOLUTION ---- */
  function initSolution(pageEl){
    gsap.fromTo("#fourVisual img", { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: "#fourVisual", start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.to("#stepsProgress", {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: "#page-solution .steps-wrap", start: "top 80%", end: "bottom 45%", scrub: true }
    });
  }

  /* ---- GKG ---- */
  function initGkg(pageEl){
    pageEl.querySelectorAll(".m-stat b[data-num]").forEach(function(el){
      var target = +el.getAttribute("data-num");
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: function(){ el.innerHTML = Math.round(obj.v) + suffix; }
      });
    });
  }

  var inits = { home: initHome, pizzas: initPizzas, solution: initSolution, gkg: initGkg, contact: null, legal: null };

  function activate(key){
    document.querySelectorAll(".page").forEach(function(p){
      p.hidden = p.getAttribute("data-page") !== key;
    });
    toTop();
    setNav(key);
    if (animOn) {
      var pageEl = document.querySelector('[data-page="' + key + '"]');
      if (key !== "home") {
        /* le hero home gère ses propres entrées */
      }
      initReveals(pageEl);
      if (inits[key]) inits[key](pageEl);
      ScrollTrigger.refresh();
    }
    current = key;
  }

  var wipe = document.getElementById("wipe");
  var navigating = false;
  function go(key){
    if (key === current || navigating) return;
    closeMenu();
    if (!animOn) {
      killPageAnims();
      activate(key);
      return;
    }
    navigating = true;
    wipe.classList.add("active");
    var brand = wipe.querySelector(".wipe-brand");
    var tl = gsap.timeline({
      onComplete: function(){
        wipe.classList.remove("active");
        gsap.set([wipe.querySelector(".p1"), wipe.querySelector(".p2")], { scaleY: 0, transformOrigin: "bottom" });
        gsap.set(brand, { opacity: 0 });
        navigating = false;
      }
    });
    tl.set([wipe.querySelector(".p1"), wipe.querySelector(".p2")], { scaleY: 0, transformOrigin: "bottom" })
      .to(wipe.querySelector(".p1"), { scaleY: 1, duration: .42, ease: "power4.inOut" }, 0)
      .to(wipe.querySelector(".p2"), { scaleY: 1, duration: .42, ease: "power4.inOut" }, .09)
      .to(brand, { opacity: 1, duration: .25 }, .32)
      .add(function(){
        killPageAnims();
        activate(key);
      }, .58)
      .to(brand, { opacity: 0, duration: .2 }, .95)
      .set([wipe.querySelector(".p1"), wipe.querySelector(".p2")], { transformOrigin: "top" }, 1.05)
      .to(wipe.querySelector(".p2"), { scaleY: 0, duration: .5, ease: "power4.inOut" }, 1.08)
      .to(wipe.querySelector(".p1"), { scaleY: 0, duration: .5, ease: "power4.inOut" }, 1.17);
  }

  window.addEventListener("hashchange", function(){ go(parseRoute()); });

  /* premier rendu, sans transition */
  activate(parseRoute());
})();
