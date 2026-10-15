/* Shared site behaviour: saved light/dark theme, a theme toggle, and a ⌘K search palette.
   Loaded in <head> without defer so the saved theme applies before first paint. */
(function () {
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function toggleTheme() {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  }

  var ITEMS = [
    { group: "Navigation", label: "home", href: "index.html" },
    { group: "Navigation", label: "projects", href: "projects.html" },
    { group: "Navigation", label: "cv", href: "cv.html" },
    { group: "Navigation", label: "cv (pdf)", href: "Dhaneswara_Mandrasa_CV.pdf" },
    { group: "Case studies", label: "LLM features you can trust in a pricing model", hint: "thesis · NYC congestion toll", href: "project-thesis.html" },
    { group: "Case studies", label: "Segmenting 100M+ daily users", hint: "Eureka AI · telco data", href: "project-segmentation.html" },
    { group: "Case studies", label: "Alternative credit score, Gini 0.6", hint: "Eureka AI · credit risk", href: "project-credit.html" },
    { group: "Case studies", label: "A data & AI function from scratch", hint: "Olsera · data platform", href: "project-olsera.html" },
    { group: "Case studies", label: "Personas from Telecom Behaviour", hint: "Eureka AI, Abu Dhabi", href: "project-personas.html" },
    { group: "Case studies", label: "AutoML Credit Scoring", hint: "iZeno, Jakarta", href: "project-credit-automl.html" },
    { group: "Case studies", label: "Root-Cause Diagnosis for Plantation Yield", hint: "iZeno, Jakarta", href: "project-root-cause.html" },
    { group: "Case studies", label: "Choosing Where to Open the Next Store", hint: "Bhumi Varta, Jakarta", href: "project-retail-sites.html" },
    { group: "Case studies", label: "Socio-Economic Status from Satellite Imagery", hint: "Bhumi Varta, Jakarta", href: "project-ses-satellite.html" },
    { group: "Contact", label: "Send email", hint: "dhaneswara.mandrasa@gmail.com", href: "mailto:dhaneswara.mandrasa@gmail.com?subject=Hello%20from%20your%20portfolio" },
    { group: "Contact", label: "LinkedIn", href: "https://www.linkedin.com/in/dhaneswaramandrasa" },
    { group: "Contact", label: "GitHub", href: "https://github.com/dhaneswaramandrasa" },
    { group: "Settings", label: "Toggle dark mode", action: toggleTheme }
  ];

  var CSS = "" +
    ".sk-btn{font:inherit;font-size:13px;color:var(--muted,#666);background:none;border:1px solid var(--line,#ddd);border-radius:6px;padding:2px 9px;cursor:pointer;line-height:1.6}" +
    ".sk-btn:hover{color:var(--link,var(--accent,#3b3fb6));border-color:var(--link,var(--accent,#3b3fb6))}" +
    ".sk-tools{display:inline-flex;gap:8px;align-items:center}" +
    ".sk-veil{position:fixed;inset:0;background:rgba(10,10,20,.35);backdrop-filter:blur(2px);display:none;align-items:flex-start;justify-content:center;padding:12vh 16px 0;z-index:100}" +
    ".sk-veil.open{display:flex}" +
    ".sk-box{width:min(620px,100%);background:var(--bg,#fff);color:var(--fg,#1a1a1a);border:1px solid var(--line,#ddd);border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;font-family:inherit}" +
    ".sk-in{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid var(--line,#ddd);padding:16px 18px;font:inherit;font-size:17px;background:transparent;color:inherit;outline:none}" +
    ".sk-list{max-height:52vh;overflow:auto;padding:6px 0;margin:0;list-style:none}" +
    ".sk-g{font-size:12px;color:var(--muted,#666);padding:10px 18px 4px}" +
    ".sk-it{display:flex;justify-content:space-between;gap:12px;padding:9px 18px;cursor:pointer;border-left:3px solid transparent}" +
    ".sk-it.on{background:var(--hl,var(--accent-soft,#ececf8));border-left-color:var(--link,var(--accent,#3b3fb6))}" +
    ".sk-it small{color:var(--muted,#666);text-align:right}" +
    ".sk-foot{border-top:1px solid var(--line,#ddd);padding:8px 18px;font-size:12px;color:var(--muted,#666)}" +
    ".sk-empty{padding:14px 18px;color:var(--muted,#666)}";

  function build() {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

    // buttons go into every [data-tools] slot on the page
    document.querySelectorAll("[data-tools]").forEach(function (slot) {
      slot.classList.add("sk-tools");
      slot.innerHTML = '<button type="button" class="sk-btn" data-open-search aria-label="Search">' + (mac ? "⌘" : "Ctrl ") + 'K search</button>' +
        '<button type="button" class="sk-btn" data-toggle-theme aria-label="Toggle dark mode">◐</button>';
    });

    var veil = document.createElement("div");
    veil.className = "sk-veil"; veil.setAttribute("role", "dialog"); veil.setAttribute("aria-modal", "true"); veil.setAttribute("aria-label", "Search");
    veil.innerHTML = '<div class="sk-box"><input class="sk-in" type="text" placeholder="Type to search pages, case studies, contact" aria-label="Search"><ul class="sk-list" role="listbox"></ul><div class="sk-foot">↵ open · ↑↓ move · esc close</div></div>';
    document.body.appendChild(veil);
    var input = veil.querySelector(".sk-in"), list = veil.querySelector(".sk-list"), shown = [], cur = 0;

    function render() {
      var q = input.value.trim().toLowerCase();
      shown = ITEMS.filter(function (it) { return !q || (it.label + " " + (it.hint || "") + " " + it.group).toLowerCase().indexOf(q) > -1; });
      cur = Math.min(cur, Math.max(shown.length - 1, 0));
      var html = "", last = "";
      shown.forEach(function (it, i) {
        if (it.group !== last) { html += '<li class="sk-g" role="presentation">' + it.group + "</li>"; last = it.group; }
        html += '<li class="sk-it' + (i === cur ? " on" : "") + '" role="option" data-i="' + i + '"><span>' + it.label + "</span>" + (it.hint ? "<small>" + it.hint + "</small>" : "") + "</li>";
      });
      list.innerHTML = html || '<li class="sk-empty">No matches</li>';
      var on = list.querySelector(".on"); if (on) on.scrollIntoView({ block: "nearest" });
    }
    function open() { veil.classList.add("open"); input.value = ""; cur = 0; render(); input.focus(); }
    function close() { veil.classList.remove("open"); }
    function go(it) { if (!it) return; close(); if (it.action) it.action(); else location.href = it.href; }

    input.addEventListener("input", function () { cur = 0; render(); });
    list.addEventListener("click", function (e) { var li = e.target.closest(".sk-it"); if (li) go(shown[+li.dataset.i]); });
    veil.addEventListener("click", function (e) { if (e.target === veil) close(); });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); veil.classList.contains("open") ? close() : open(); return; }
      if (!veil.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown") { e.preventDefault(); cur = Math.min(cur + 1, shown.length - 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cur = Math.max(cur - 1, 0); render(); }
      else if (e.key === "Enter") { e.preventDefault(); go(shown[cur]); }
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-open-search]")) open();
      if (e.target.closest("[data-toggle-theme]")) toggleTheme();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
