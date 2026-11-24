/* ============================================================
   site.js — shared chrome + small interaction engines.
   Classic script (no modules) so the site also works from file://
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  window.OOP = window.OOP || {};
  OOP.$ = $; OOP.$$ = $$; OOP.el = el;

  /* ---------- 1. theme ---------- */
  var THEME_KEY = "oop-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    $$("[data-theme-toggle]").forEach(function (b) {
      b.textContent = t === "dark" ? "☀" : "☾";
      b.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    applyTheme(saved);
  })();

  /* ---------- 2. chrome: nav toggle, theme button, progress ---------- */
  function initChrome() {
    $$("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
      });
    });
    var tog = $("[data-nav-toggle]"), links = $(".navlinks");
    if (tog && links) {
      tog.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        tog.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    // mark current page in nav
    var here = location.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "/");
    $$(".navlinks a").forEach(function (a) {
      var p = a.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "/");
      if (p === here) a.setAttribute("aria-current", "page");
    });

    var bar = $(".progressbar");
    if (bar) {
      var tick = function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      };
      addEventListener("scroll", tick, { passive: true });
      addEventListener("resize", tick);
      tick();
    }
  }

  /* ---------- 3. auto table of contents ---------- */
  function initToc() {
    var holder = $("[data-toc]");
    if (!holder) return;
    var scope = $(holder.getAttribute("data-toc") || "main") || document;
    var heads = $$("h2[id], h3[id]", scope);
    if (!heads.length) { holder.style.display = "none"; return; }

    var ol = el("ol");
    heads.forEach(function (h) {
      var li = el("li", h.tagName === "H3" ? "lvl3" : "lvl2");
      var a = el("a", null, h.getAttribute("data-short") || h.textContent.replace(/\s*[#¶]\s*$/, ""));
      a.href = "#" + h.id;
      li.appendChild(a);
      ol.appendChild(li);
    });
    holder.appendChild(ol);

    var map = {};
    $$("a", ol).forEach(function (a) { map[a.hash.slice(1)] = a; });
    var active = null;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = map[e.target.id];
        if (!a || a === active) return;
        if (active) active.classList.remove("active");
        a.classList.add("active");
        active = a;
      });
    }, { rootMargin: "-88px 0px -68% 0px", threshold: 0 });
    heads.forEach(function (h) { obs.observe(h); });
  }

  /* ---------- 4. Python syntax highlighting ----------
     Lightweight tokenizer: good enough for teaching snippets, and it means
     chapter authors write plain code in the HTML with no <span> soup.     */
  var PY_KW = ("False None True and as assert async await break class continue def del elif else " +
    "except finally for from global if import in is lambda nonlocal not or pass raise return try " +
    "while with yield match case").split(" ");
  var PY_BUILTIN = ("print len range isinstance str int float bool list dict set tuple super property " +
    "staticmethod classmethod abstractmethod ABC Exception ValueError TypeError enumerate zip sum " +
    "min max abs round sorted hasattr getattr setattr type object repr format map filter any all " +
    "datetime Optional List Dict").split(" ");
  var KWSET = {}, BISET = {};
  PY_KW.forEach(function (k) { KWSET[k] = 1; });
  PY_BUILTIN.forEach(function (k) { BISET[k] = 1; });

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightPython(src) {
    var out = "", i = 0, n = src.length;
    function isIdStart(c) { return /[A-Za-z_]/.test(c); }
    function isId(c) { return /[A-Za-z0-9_]/.test(c); }

    while (i < n) {
      var c = src[i];

      // comment
      if (c === "#") {
        var j = src.indexOf("\n", i); if (j < 0) j = n;
        out += '<span class="t-com">' + esc(src.slice(i, j)) + "</span>"; i = j; continue;
      }
      // decorator at line start
      if (c === "@" && (i === 0 || src[i - 1] === "\n" || /^\s+$/.test(src.slice(src.lastIndexOf("\n", i - 1) + 1, i)))) {
        var k = i + 1; while (k < n && (isId(src[k]) || src[k] === ".")) k++;
        out += '<span class="t-dec">' + esc(src.slice(i, k)) + "</span>"; i = k; continue;
      }
      // triple-quoted string
      if (src.substr(i, 3) === '"""' || src.substr(i, 3) === "'''") {
        var q3 = src.substr(i, 3), e3 = src.indexOf(q3, i + 3);
        e3 = e3 < 0 ? n : e3 + 3;
        out += '<span class="t-str">' + esc(src.slice(i, e3)) + "</span>"; i = e3; continue;
      }
      // f-string / string
      if (c === '"' || c === "'") {
        var q = c, k2 = i + 1;
        while (k2 < n && src[k2] !== q) { if (src[k2] === "\\") k2++; k2++; }
        k2 = Math.min(k2 + 1, n);
        out += '<span class="t-str">' + esc(src.slice(i, k2)) + "</span>"; i = k2; continue;
      }
      // number
      if (/[0-9]/.test(c) && (i === 0 || !isId(src[i - 1]))) {
        var k3 = i; while (k3 < n && /[0-9_.xXa-fA-F]/.test(src[k3])) k3++;
        out += '<span class="t-num">' + esc(src.slice(i, k3)) + "</span>"; i = k3; continue;
      }
      // identifier / keyword
      if (isIdStart(c)) {
        var k4 = i; while (k4 < n && isId(src[k4])) k4++;
        var w = src.slice(i, k4);
        var after = src.slice(k4).match(/^\s*/)[0].length + k4;
        var prevWord = (out.match(/<span class="t-kw">(\w+)<\/span>\s*$/) || [])[1];

        if (KWSET[w]) out += '<span class="t-kw">' + w + "</span>";
        else if (w === "self" || w === "cls") out += '<span class="t-self">' + w + "</span>";
        else if (prevWord === "class") out += '<span class="t-cls">' + w + "</span>";
        else if (prevWord === "def") out += '<span class="t-def">' + w + "</span>";
        else if (src[after] === "(" && BISET[w]) out += '<span class="t-fn">' + w + "</span>";
        else if (BISET[w]) out += '<span class="t-fn">' + w + "</span>";
        else if (/^[A-Z]/.test(w) && src[after] === "(") out += '<span class="t-cls">' + w + "</span>";
        else out += esc(w);
        i = k4; continue;
      }
      // operator
      if ("+-*/%=<>!&|^~".indexOf(c) >= 0) {
        out += '<span class="t-op">' + esc(c) + "</span>"; i++; continue;
      }
      out += esc(c); i++;
    }
    return out;
  }
  OOP.highlightPython = highlightPython;

  /* Reads `data-hl="2,5-7"` to mark lines, `data-fade="1-3"` to dim them. */
  function parseRanges(spec) {
    var set = {};
    if (!spec) return set;
    spec.split(",").forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) { for (var i = +m[1]; i <= +m[2]; i++) set[i] = 1; }
      else if (/^\d+$/.test(part)) set[+part] = 1;
    });
    return set;
  }

  function initCode() {
    $$("pre > code").forEach(function (code) {
      var pre = code.parentNode;
      if (pre.hasAttribute("data-raw")) return;

      var src = code.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      var hl = parseRanges(pre.getAttribute("data-hl"));
      var fade = parseRanges(pre.getAttribute("data-fade"));
      var lines = highlightPython(src).split("\n");

      if (Object.keys(hl).length || Object.keys(fade).length) {
        code.innerHTML = lines.map(function (ln, idx) {
          var no = idx + 1;
          var cls = hl[no] ? "hl" : (fade[no] ? "fade" : "");
          return cls ? '<span class="' + cls + '">' + (ln || " ") + "</span>" : ln;
        }).join("\n");
      } else {
        code.innerHTML = lines.join("\n");
      }
    });

    // copy buttons on .codeblock
    $$(".codeblock").forEach(function (b) {
      var head = $(".codehead", b), pre = $("pre", b);
      if (!head || !pre || $(".copybtn", head)) return;
      var btn = el("button", "copybtn", "copy");
      btn.type = "button";
      btn.addEventListener("click", function () {
        var t = $("code", pre).textContent;
        var done = function () { btn.textContent = "copied"; setTimeout(function () { btn.textContent = "copy"; }, 1400); };
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, done);
        else {
          var ta = el("textarea"); ta.value = t; document.body.appendChild(ta);
          ta.select(); try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
      head.appendChild(btn);
    });
  }

  /* ---------- 5. quiz ----------
     <div class="quiz" data-quiz>
       <p class="quiz-q">…</p>
       <ul class="quiz-opts">
         <li><button data-why="…">text</button></li>
         <li><button data-correct data-why="…">text</button></li>
       </ul>
     </div>                                                        */
  function initQuiz() {
    $$("[data-quiz]").forEach(function (q) {
      var opts = $$(".quiz-opts button", q);
      var why = $(".quiz-why", q);
      if (!why) { why = el("div", "quiz-why"); why.hidden = true; q.appendChild(why); }

      opts.forEach(function (b, idx) {
        b.type = "button";
        b.classList.add("quiz-opt");
        if (!$(".mk", b)) {
          var mk = el("span", "mk", String.fromCharCode(65 + idx));
          b.insertBefore(mk, b.firstChild);
          var rest = el("span"); // wrap existing label
          while (b.childNodes.length > 1) rest.appendChild(b.childNodes[1]);
          b.appendChild(rest);
        }
        b.addEventListener("click", function () {
          var right = b.hasAttribute("data-correct");
          b.classList.add(right ? "correct" : "wrong");
          $(".mk", b).textContent = right ? "✓" : "✕";
          if (right) {
            opts.forEach(function (o) { o.disabled = true; });
          } else {
            b.disabled = true;
            // reveal the right one once they've tried twice
            if ($$(".quiz-opt.wrong", q).length >= 2) {
              opts.forEach(function (o) {
                if (o.hasAttribute("data-correct")) { o.classList.add("correct"); $(".mk", o).textContent = "✓"; }
                o.disabled = true;
              });
            }
          }
          var text = b.getAttribute("data-why");
          if (text) { why.innerHTML = (right ? "<b>Correct. </b>" : "<b>Not quite. </b>") + text; why.hidden = false; }
        });
      });
    });
  }

  /* ---------- 6. reveal on scroll ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("in"); }); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .06 });
    items.forEach(function (i) { o.observe(i); });
  }

  /* ---------- 7. stepper engine ----------
     OOP.stepper(root, { steps: n, render: fn(i), autoMs: 1200 })
     Expects markup: [data-step-prev] [data-step-next] [data-step-play]
                     [data-step-count] [data-step-range]                 */
  OOP.stepper = function (root, cfg) {
    var i = 0, timer = null, n = cfg.steps;
    var prev = $("[data-step-prev]", root), next = $("[data-step-next]", root);
    var play = $("[data-step-play]", root), reset = $("[data-step-reset]", root);
    var count = $("[data-step-count]", root), range = $("[data-step-range]", root);

    if (range) { range.min = 0; range.max = n - 1; range.step = 1; }

    function draw() {
      if (count) count.textContent = "Step " + (i + 1) + " / " + n;
      if (range) range.value = i;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === n - 1;
      cfg.render(i);
    }
    function go(k) { i = Math.max(0, Math.min(n - 1, k)); draw(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } if (play) play.textContent = "▶ Play"; }
    function start() {
      if (i === n - 1) i = 0;
      timer = setInterval(function () {
        if (i >= n - 1) { stop(); return; }
        go(i + 1);
      }, cfg.autoMs || 1300);
      if (play) play.textContent = "❙❙ Pause";
    }

    if (prev) prev.addEventListener("click", function () { stop(); go(i - 1); });
    if (next) next.addEventListener("click", function () { stop(); go(i + 1); });
    if (reset) reset.addEventListener("click", function () { stop(); go(0); });
    if (range) range.addEventListener("input", function () { stop(); go(+range.value); });
    if (play) play.addEventListener("click", function () { timer ? stop() : start(); });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stop(); go(i + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { stop(); go(i - 1); e.preventDefault(); }
    });

    draw();
    return { go: go, stop: stop, get index() { return i; } };
  };

  /* ---------- 8. memory diagram renderer ----------
     OOP.renderMemory(container, {
       vars:    [{ name:'stu1', points:'0x1a4' } | { name:'n', value:'3' }],
       objects: [{ cls:'Student', addr:'0x1a4', isNew:true, dead:false,
                   rows:[{ k:'__id', v:"'001'", changed:true, private:true }] }]
     })                                                                  */
  OOP.renderMemory = function (box, state) {
    var vz = $("[data-mem-vars]", box), oz = $("[data-mem-objs]", box);
    if (vz) {
      vz.innerHTML = "";
      (state.vars || []).forEach(function (v) {
        var b = el("div", "varbox");
        b.appendChild(el("span", "nm", v.name));
        b.appendChild(el("span", "pt", v.points ? "→ " + v.points : (v.value != null ? v.value : "None")));
        vz.appendChild(b);
      });
      if (!(state.vars || []).length) vz.appendChild(el("div", "lab-hint", "no names bound yet"));
    }
    if (oz) {
      oz.innerHTML = "";
      (state.objects || []).forEach(function (o) {
        var b = el("div", "objbox" + (o.isNew ? " is-new" : "") + (o.dead ? " is-dead" : ""));
        var h = el("div", "objbox-head");
        h.appendChild(el("span", "cls", o.cls));
        if (o.note) h.appendChild(el("span", "lab-hint", o.note));
        h.appendChild(el("span", "adr", o.addr || ""));
        b.appendChild(h);
        (o.rows || []).forEach(function (r) {
          var row = el("div", "objbox-row" + (r.changed ? " changed" : ""));
          var k = el("span", "k", r.k);
          if (r.private) { var l = el("span", "lock", "🔒 "); k.insertBefore(l, k.firstChild); }
          row.appendChild(k);
          row.appendChild(el("span", "v", r.v));
          b.appendChild(row);
        });
        oz.appendChild(b);
      });
      if (!(state.objects || []).length) oz.appendChild(el("div", "lab-hint", "heap is empty"));
    }
  };

  /* ---------- 9. code line spotlight ----------
     OOP.spotlight(preEl, [lineNumbers])   (1-based)                    */
  OOP.spotlight = function (pre, lines) {
    var code = $("code", pre);
    if (!code) return;
    if (!code.__src) code.__src = code.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    var set = {};
    (lines || []).forEach(function (l) { set[l] = 1; });
    var html = highlightPython(code.__src).split("\n");
    code.innerHTML = html.map(function (ln, idx) {
      return set[idx + 1] ? '<span class="hl">' + (ln || " ") + "</span>" : ln;
    }).join("\n");
  };

  /* ---------- 10. simulab embeds ----------
     <figure class="labembed" data-lab="lab05-inheritance"
             data-lab-title="..." data-lab-note="...">
     A lab is one self-contained offline page (~0.5 MB), so it loads only when
     it scrolls into view, and on narrow screens only when asked for.         */
  function initLab() {
    var hosts = $$("[data-lab]");
    if (!hosts.length) return;
    var link = $('link[rel="stylesheet"]');
    var base = link ? link.getAttribute("href").split("css/site.css")[0] : "assets/";

    hosts.forEach(function (host) {
      var title = host.getAttribute("data-lab-title") || "Interactive lab";
      var src = base + "figures/" + host.getAttribute("data-lab") + ".html";

      var head = el("div", "labembed-head");
      var h = el("b", null, title);
      var out = el("a", "labembed-out", "Open full screen ↗");
      out.href = src; out.target = "_blank"; out.rel = "noopener";
      head.appendChild(h); head.appendChild(out);

      var stage = el("div", "labembed-stage");
      var loaded = false;
      function load() {
        if (loaded) return;
        loaded = true;
        stage.innerHTML = "";
        stage.classList.add("is-loaded");
        var fr = document.createElement("iframe");
        fr.src = src;
        fr.title = title;
        fr.loading = "lazy";

        /* the lab lays itself out, so let it say how tall it needs to be */
        function fit() {
          try {
            var d = fr.contentDocument;
            if (!d || !d.body) return;
            var h = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
            if (h > 120) stage.style.height = h + "px";
          } catch (e) { /* cross-origin: the CSS aspect ratio stands */ }
        }
        fr.addEventListener("load", function () { fit(); setTimeout(fit, 500); });
        var tid = 0;
        window.addEventListener("resize", function () {
          clearTimeout(tid);
          tid = setTimeout(fit, 160);
        });
        stage.appendChild(fr);
      }
      var btn = el("button", "btn labembed-load", "▶ Load the lab");
      btn.addEventListener("click", load);
      stage.appendChild(btn);

      host.appendChild(head);
      host.appendChild(stage);
      var note = host.getAttribute("data-lab-note");
      if (note) host.appendChild(el("div", "labembed-note", note));

      /* Wide screens load it on approach; narrow ones wait to be asked.
         The width is read when the figure comes into view, not at boot — at
         boot the viewport may not have settled, and the reader may since have
         turned the phone or widened the window. */
      if ("IntersectionObserver" in window) {
        var o = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            if (window.innerWidth >= 720) { load(); o.unobserve(e.target); }
          });
        }, { rootMargin: "320px 0px", threshold: 0 });
        o.observe(host);
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initChrome(); initCode(); initToc(); initQuiz(); initReveal(); initLab();
    document.dispatchEvent(new CustomEvent("oop:ready"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
