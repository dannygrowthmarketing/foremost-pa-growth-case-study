/* =================================================================
   FOREMOST PA — GROWTH INTELLIGENCE REPORT
   Vanilla JS · no dependencies · responsive SVG charts + live model
   ================================================================= */
(function () {
  "use strict";
  var SVG = "http://www.w3.org/2000/svg";
  var PALETTE = {
    navy: "#0B1F3A", navyMid: "#142E52", navySoft: "#1E3F6F",
    gold: "#C9A84C", goldDeep: "#A8842F", goldPale: "#F4ECD4",
    green: "#1A7F4E", red: "#B91C1C", amber: "#C77B12", teal: "#0F766E",
    line: "#E7E2D5", muted: "#6E7480", ink: "#0B1F3A"
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny SVG helpers ---------- */
  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVG, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function frame(w, h) {
    var s = svgEl("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "xMidYMid meet", role: "presentation" });
    return s;
  }
  function txt(s, x, y, attrs) {
    var t = svgEl("text", Object.assign({ x: x, y: y, "font-family": "ui-monospace, Menlo, monospace" }, attrs || {}));
    t.textContent = s;
    return t;
  }
  function mount(node, svg) { node.innerHTML = ""; node.appendChild(svg); }

  /* ---------- horizontal bar chart ---------- */
  function hbars(node, items, opts) {
    opts = opts || {};
    var W = 560, rowH = 46, padTop = 8, padBottom = 6, labelW = 0;
    var H = padTop + padBottom + items.length * rowH;
    var max = opts.max || Math.max.apply(null, items.map(function (i) { return i.value; }));
    var barX = 4, barMaxW = W - 8;
    var svg = frame(W, H);
    items.forEach(function (it, i) {
      var y = padTop + i * rowH;
      var bw = Math.max(2, (it.value / max) * barMaxW);
      // label
      var lab = txt(it.label, barX, y + 14, { "font-size": 13, "font-weight": 600, fill: PALETTE.ink, "font-family": "-apple-system,Segoe UI,Roboto,sans-serif" });
      svg.appendChild(lab);
      // value
      var vstr = opts.fmt ? opts.fmt(it.value) : it.value;
      svg.appendChild(txt(vstr + (it.note ? "  ·  " + it.note : ""), W - 4, y + 14, { "font-size": 12, "text-anchor": "end", fill: it.highlight ? PALETTE.goldDeep : PALETTE.muted, "font-weight": it.highlight ? 700 : 500 }));
      // track
      svg.appendChild(svgEl("rect", { x: barX, y: y + 22, width: barMaxW, height: 9, rx: 4.5, fill: "#EEE9DC" }));
      // fill
      var rect = svgEl("rect", { x: barX, y: y + 22, width: reduceMotion ? bw : 0, height: 9, rx: 4.5, fill: it.color || PALETTE.navy });
      svg.appendChild(rect);
      if (!reduceMotion) {
        requestAnimationFrame(function () {
          rect.style.transition = "width .8s cubic-bezier(.2,.7,.2,1) " + (i * 0.06) + "s";
          rect.setAttribute("width", bw);
        });
      }
    });
    mount(node, svg);
  }

  /* ---------- line chart (single series, optional area) ---------- */
  function lineChart(node, cfg) {
    var W = 560, H = 260, mL = 44, mR = 16, mT = 22, mB = 34;
    var pts = cfg.points, labels = cfg.labels;
    var min = cfg.min != null ? cfg.min : Math.min.apply(null, pts);
    var max = cfg.max != null ? cfg.max : Math.max.apply(null, pts);
    var pad = (max - min) * 0.15 || 1; min -= pad; max += pad;
    var plotW = W - mL - mR, plotH = H - mT - mB;
    var x = function (i) { return mL + (pts.length === 1 ? plotW / 2 : (i / (pts.length - 1)) * plotW); };
    var y = function (v) { return mT + plotH - ((v - min) / (max - min)) * plotH; };
    var svg = frame(W, H);
    var dark = cfg.dark;
    var gridC = dark ? "rgba(255,255,255,.12)" : PALETTE.line;
    var axisC = dark ? "#8294AE" : PALETTE.muted;
    // gridlines
    for (var g = 0; g <= 3; g++) {
      var gy = mT + (g / 3) * plotH;
      svg.appendChild(svgEl("line", { x1: mL, y1: gy, x2: W - mR, y2: gy, stroke: gridC, "stroke-width": 1 }));
      var gv = max - (g / 3) * (max - min);
      svg.appendChild(txt(cfg.yfmt ? cfg.yfmt(gv) : Math.round(gv), mL - 8, gy + 4, { "font-size": 10, "text-anchor": "end", fill: axisC }));
    }
    // area
    if (cfg.area) {
      var d = "M" + x(0) + "," + y(pts[0]);
      pts.forEach(function (p, i) { if (i) d += " L" + x(i) + "," + y(p); });
      d += " L" + x(pts.length - 1) + "," + (mT + plotH) + " L" + x(0) + "," + (mT + plotH) + " Z";
      var grad = svgEl("linearGradient", { id: "ag_" + cfg.id, x1: 0, y1: 0, x2: 0, y2: 1 });
      grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": cfg.color, "stop-opacity": ".22" }));
      grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": cfg.color, "stop-opacity": "0" }));
      svg.appendChild(grad);
      svg.appendChild(svgEl("path", { d: d, fill: "url(#ag_" + cfg.id + ")" }));
    }
    // line
    var ld = "M" + x(0) + "," + y(pts[0]);
    pts.forEach(function (p, i) { if (i) ld += " L" + x(i) + "," + y(p); });
    var path = svgEl("path", { d: ld, fill: "none", stroke: cfg.color, "stroke-width": 2.6, "stroke-linejoin": "round", "stroke-linecap": "round" });
    svg.appendChild(path);
    if (!reduceMotion) {
      var len = path.getTotalLength ? 1200 : 0;
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      requestAnimationFrame(function () { path.style.transition = "stroke-dashoffset 1s ease"; path.style.strokeDashoffset = 0; });
    }
    // points + labels
    pts.forEach(function (p, i) {
      var hl = cfg.highlight && cfg.highlight.indexOf(i) > -1;
      svg.appendChild(svgEl("circle", { cx: x(i), cy: y(p), r: hl ? 5.5 : 3.8, fill: hl ? PALETTE.gold : (dark ? "#fff" : cfg.color), stroke: dark ? PALETTE.navy : "#fff", "stroke-width": 2 }));
      if (cfg.showVals) svg.appendChild(txt(cfg.vfmt ? cfg.vfmt(p) : p, x(i), y(p) - 12, { "font-size": 11, "text-anchor": "middle", fill: hl ? PALETTE.goldDeep : axisC, "font-weight": hl ? 700 : 500 }));
      if (labels) svg.appendChild(txt(labels[i], x(i), H - 10, { "font-size": 11, "text-anchor": "middle", fill: axisC, "font-weight": 600 }));
    });
    mount(node, svg);
  }

  /* ---------- combo: bars (leads) + line (cvr) ---------- */
  function comboChart(node, cfg) {
    var W = 560, H = 270, mL = 30, mR = 38, mT = 24, mB = 34;
    var plotW = W - mL - mR, plotH = H - mT - mB;
    var bars = cfg.bars, line = cfg.line, labels = cfg.labels;
    var bMax = Math.max.apply(null, bars) * 1.2;
    var lMax = Math.max.apply(null, line) * 1.25;
    var n = bars.length, slot = plotW / n, bw = slot * 0.5;
    var svg = frame(W, H);
    for (var g = 0; g <= 3; g++) {
      var gy = mT + (g / 3) * plotH;
      svg.appendChild(svgEl("line", { x1: mL, y1: gy, x2: W - mR, y2: gy, stroke: PALETTE.line, "stroke-width": 1 }));
    }
    // bars
    bars.forEach(function (v, i) {
      var bx = mL + i * slot + (slot - bw) / 2;
      var bh = (v / bMax) * plotH;
      var hl = cfg.highlight === i;
      var r = svgEl("rect", { x: bx, y: mT + plotH - bh, width: bw, height: reduceMotion ? bh : 0, rx: 5, fill: hl ? PALETTE.gold : PALETTE.navySoft });
      svg.appendChild(r);
      if (!reduceMotion) requestAnimationFrame(function () { r.style.transition = "height .7s cubic-bezier(.2,.7,.2,1) " + (i * .06) + "s, y .7s cubic-bezier(.2,.7,.2,1) " + (i * .06) + "s"; r.setAttribute("height", bh); r.setAttribute("y", mT + plotH - bh); });
      svg.appendChild(txt(v, bx + bw / 2, mT + plotH - bh - 7, { "font-size": 12, "text-anchor": "middle", fill: hl ? PALETTE.goldDeep : PALETTE.ink, "font-weight": 700 }));
      svg.appendChild(txt(labels[i], bx + bw / 2, H - 10, { "font-size": 11, "text-anchor": "middle", fill: PALETTE.muted, "font-weight": 600 }));
    });
    // line (cvr)
    var lx = function (i) { return mL + i * slot + slot / 2; };
    var ly = function (v) { return mT + plotH - (v / lMax) * plotH; };
    var d = "M" + lx(0) + "," + ly(line[0]);
    line.forEach(function (v, i) { if (i) d += " L" + lx(i) + "," + ly(v); });
    var p = svgEl("path", { d: d, fill: "none", stroke: PALETTE.gold, "stroke-width": 2.6, "stroke-linejoin": "round" });
    svg.appendChild(p);
    if (!reduceMotion) { p.style.strokeDasharray = 1200; p.style.strokeDashoffset = 1200; requestAnimationFrame(function () { p.style.transition = "stroke-dashoffset 1s ease .3s"; p.style.strokeDashoffset = 0; }); }
    line.forEach(function (v, i) {
      svg.appendChild(svgEl("circle", { cx: lx(i), cy: ly(v), r: 3.8, fill: PALETTE.gold, stroke: "#fff", "stroke-width": 2 }));
      svg.appendChild(txt(v.toFixed(2) + "%", lx(i), ly(v) - 11, { "font-size": 10, "text-anchor": "middle", fill: PALETTE.goldDeep, "font-weight": 600 }));
    });
    mount(node, svg);
  }

  /* ---------- chart data + dispatch ---------- */
  var CHARTS = {
    serviceShare: function (node) {
      hbars(node, [
        { label: "Public Adjuster / Claim Help", value: 35, color: PALETTE.navy },
        { label: "Water Damage", value: 25, color: PALETTE.navySoft },
        { label: "Roof Damage", value: 15, color: PALETTE.teal },
        { label: "Hurricane / Storm", value: 15, color: PALETTE.teal },
        { label: "Denied Claims", value: 5, color: PALETTE.muted },
        { label: "Fire Damage", value: 5, color: PALETTE.muted }
      ], { max: 35, fmt: function (v) { return v + "%"; } });
    },
    geoCpl: function (node) {
      hbars(node, [
        { label: "Broward County", value: 68.67, color: PALETTE.green, note: "best", highlight: true },
        { label: "Orlando", value: 73.25, color: PALETTE.green },
        { label: "Palm Beach", value: 142.94, color: PALETTE.navySoft },
        { label: "Miami-Dade", value: 164.38, color: PALETTE.navy },
        { label: "Tampa", value: 334.56, color: PALETTE.red, note: "reduce" }
      ], { fmt: function (v) { return "$" + v.toFixed(0); } });
    },
    competitorTop: function (node) {
      hbars(node, [
        { label: "stellaradjusting.com", value: 86.35, color: PALETTE.navy },
        { label: "recovery-claim.com", value: 81.49, color: PALETTE.red, note: "watch" },
        { label: "fightforyourclaim.com", value: 73.60, color: PALETTE.navySoft },
        { label: "alphapia.com", value: 68.02, color: PALETTE.navySoft },
        { label: "yourinsuranceattorney.com", value: 65.97, color: PALETTE.muted },
        { label: "Foremost PA (You)", value: 62.04, color: PALETTE.gold, highlight: true }
      ], { max: 100, fmt: function (v) { return v.toFixed(1) + "%"; } });
    },
    cplTrend: function (node) {
      lineChart(node, {
        id: "cpl", color: PALETTE.navy, area: true, showVals: true,
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        points: [190, 208.57, 132.31, 114, 143.33],
        highlight: [3], min: 90, max: 230,
        yfmt: function (v) { return "$" + Math.round(v); },
        vfmt: function (v) { return "$" + Math.round(v); }
      });
    },
    leadsCvr: function (node) {
      comboChart(node, {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        bars: [9, 7, 13, 15, 12], line: [5.66, 4.46, 8.13, 10.27, 7.50], highlight: 3
      });
    },
    seoPages: function (node) {
      hbars(node, [
        { label: "/ (Homepage)", value: 160, color: PALETTE.navy, note: "pos 14" },
        { label: "/miami/", value: 49, color: PALETTE.amber, note: "pos 49 ▲" },
        { label: "/pipe-burst/", value: 30, color: PALETTE.amber, note: "pos 50 ▲" },
        { label: "/coral-gables/", value: 28, color: PALETTE.teal, note: "pos 10" },
        { label: "/roof-leaks/", value: 16, color: PALETTE.amber, note: "pos 38 ▲" },
        { label: "/residential-claims/", value: 16, color: PALETTE.amber, note: "pos 40 ▲" }
      ], { fmt: function (v) { return v + " impr"; } });
    },
    sensitivity: function (node) { renderSensitivity(node); }
  };

  function renderAllCharts() {
    document.querySelectorAll("[data-chart]").forEach(function (node) {
      var fn = CHARTS[node.getAttribute("data-chart")];
      if (fn) try { fn(node); } catch (e) { /* fail silent */ }
    });
  }

  /* =================================================================
     INTERACTIVE PROJECTION MODEL
     ================================================================= */
  var model = { budget: 2700, cpl: 122, mobile: 95, close: 25, fee: 2500 };
  var SCENARIOS = {
    conservative: { budget: 1500, cpl: 165, mobile: 85, close: 15 },
    baseline: { budget: 2700, cpl: 122, mobile: 95, close: 25 },
    optimized: { budget: 6000, cpl: 95, mobile: 97, close: 35 }
  };
  var CAMPAIGNS = [
    { name: "Public Adjuster & Claim Help", sub: "Search · Highest Intent", share: 0.50 },
    { name: "Property Damage Claims", sub: "Search · Service Intent", share: 0.222 },
    { name: "All Services Expansion", sub: "PMax · Demand Capture", share: 0.278 }
  ];
  var $ = function (id) { return document.getElementById(id); };
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

  function compute() {
    // integer chain so outputs reconcile exactly (signed x fee = revenue shown)
    var leads = Math.round(model.budget / model.cpl);
    var mobileLeads = Math.round(leads * model.mobile / 100);
    var signed = Math.round(leads * model.close / 100);
    var revenue = signed * model.fee;
    return { leads: leads, mobileLeads: mobileLeads, signed: signed, revenue: revenue };
  }

  function renderModel() {
    var r = compute();
    if ($("budgetOut")) $("budgetOut").textContent = money(model.budget);
    if ($("cplOut")) $("cplOut").textContent = "$" + model.cpl;
    if ($("mobileOut")) $("mobileOut").textContent = model.mobile + "%";
    if ($("closeOut")) $("closeOut").textContent = model.close + "%";
    if ($("feeOut")) $("feeOut").textContent = money(model.fee);

    if ($("outLeads")) $("outLeads").textContent = r.leads;
    if ($("outCpl")) $("outCpl").textContent = "$" + model.cpl;
    if ($("outMobile")) $("outMobile").textContent = r.mobileLeads;
    if ($("outMobilePct")) $("outMobilePct").textContent = model.mobile + "% of total";
    if ($("outSigned")) $("outSigned").textContent = r.signed;
    if ($("outCloseSub")) $("outCloseSub").textContent = "at " + model.close + "% close";
    if ($("outRev")) $("outRev").textContent = money(r.revenue);
    if ($("outAnnual")) $("outAnnual").textContent = "\u2248 " + money(r.revenue * 12) + " / yr";

    renderSplit();
    var sens = document.querySelector('[data-chart="sensitivity"]');
    if (sens) renderSensitivity(sens);
  }

  function renderSplit() {
    var box = $("splitBars"); if (!box) return;
    var dayTotal = model.budget / 30;
    box.innerHTML = "";
    CAMPAIGNS.forEach(function (c) {
      var camLeads = Math.round((model.budget * c.share) / model.cpl);
      var perDay = dayTotal * c.share;
      var row = document.createElement("div");
      row.className = "splitrow";
      row.innerHTML =
        '<div class="splitrow__top"><span class="splitrow__name">' + c.name + '<span>' + c.sub + '</span></span>' +
        '<span class="splitrow__val">$' + perDay.toFixed(0) + '/day · ' + camLeads + ' leads/mo</span></div>' +
        '<div class="splitrow__bar"><span class="splitrow__fill" style="width:' + Math.round(c.share * 100) + '%"></span></div>';
      box.appendChild(row);
    });
  }

  function renderSensitivity(node, light) {
    var min = 1500, max = 6000, steps = 10, pts = [], labels = [];
    for (var i = 0; i <= steps; i++) {
      var b = min + (i / steps) * (max - min);
      pts.push(Math.round(b / model.cpl));
      labels.push(i % 2 === 0 ? "$" + Math.round(b / 1000) + "k" : "");
    }
    lineChart(node, {
      id: "sens", color: PALETTE.gold, area: true, dark: !light, labels: labels, points: pts,
      yfmt: function (v) { return Math.round(v); }
    });
  }

  function bindModel() {
    [["budget", "budget"], ["cpl", "cpl"], ["mobile", "mobile"], ["close", "close"], ["fee", "fee"]].forEach(function (p) {
      var input = $(p[0]); if (!input) return;
      input.addEventListener("input", function () {
        model[p[1]] = parseFloat(input.value);
        document.querySelectorAll(".scn").forEach(function (b) { b.classList.remove("is-active"); });
        renderModel();
      });
    });
    document.querySelectorAll(".scn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var s = SCENARIOS[btn.getAttribute("data-scn")]; if (!s) return;
        for (var k in s) { model[k] = s[k]; var el = $(k); if (el) el.value = s[k]; }
        document.querySelectorAll(".scn").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        renderModel();
      });
    });
  }

  /* =================================================================
     NAV · SCROLLSPY · PROGRESS · REVEAL · TOTOP
     ================================================================= */
  function bindNav() {
    var toggle = $("navToggle"), menu = $("navMenu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Close section menu" : "Open section menu");
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function bindScroll() {
    var prog = $("scrollProgress"), toTop = $("toTop");
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('#navMenu a[href^="#"]'));
    var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    function onScroll() {
      var st = window.pageYOffset || document.documentElement.scrollTop;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.width = (docH > 0 ? (st / docH) * 100 : 0) + "%";
      if (toTop) toTop.classList.toggle("is-visible", st > 700);
      var idx = -1, mid = st + window.innerHeight * 0.32;
      sections.forEach(function (sec, i) { if (sec && sec.offsetTop <= mid) idx = i; });
      navLinks.forEach(function (a, i) { a.classList.toggle("is-current", i === idx); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function bindReveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("is-in"); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* re-render bar/line charts on meaningful resize (debounced) */
  function bindResize() {
    var t, lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (Math.abs(window.innerWidth - lastW) < 60) return;
        lastW = window.innerWidth; renderAllCharts(); renderSplit();
      }, 220);
    });
  }

  /* ---------- investor cover + PDF export ---------- */
  function bindCover() {
    if (/cover|investor/i.test(location.search + location.hash)) document.body.classList.add("show-cover");
    var enter = document.getElementById("enterReport");
    function exitCover() {
      document.body.classList.remove("show-cover");
      window.scrollTo(0, 0);
      if (history.replaceState) history.replaceState(null, "", location.pathname);
    }
    if (enter) enter.addEventListener("click", exitCover);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("show-cover")) exitCover();
    });
  }
  function bindPdf() {
    var btn = document.getElementById("savePdf");
    if (btn) btn.addEventListener("click", function () { window.print(); });
    var sens = document.querySelector('[data-chart="sensitivity"]');
    window.addEventListener("beforeprint", function () { if (sens) renderSensitivity(sens, true); });
    window.addEventListener("afterprint", function () { if (sens) renderSensitivity(sens, false); });
  }

  /* ---------- init ---------- */
  function init() {
    if (!Object.assign) { Object.assign = function (t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; for (var k in s) if (s.hasOwnProperty(k)) t[k] = s[k]; } return t; }; }
    bindNav(); bindScroll(); bindReveal(); bindModel(); bindResize(); bindCover(); bindPdf();
    renderAllCharts(); renderModel();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
