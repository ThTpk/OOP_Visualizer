/* ============================================================
   seq.js — sequence diagrams: renderer, step player, and a
   form-driven builder with auto-checking.
   ============================================================ */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var $ = OOP.$, $$ = OOP.$$, el = OOP.el;

  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }
  function tx(x, y, s, cls, anchor) {
    var t = svg("text", { x: x, y: y, class: cls, "text-anchor": anchor || "start" });
    t.textContent = s;
    return t;
  }

  var LANE = 158, TOP = 86, GAP = 46, PAD = 26;

  /* ----------------------------------------------------------
     render(target, model, upto)
     model = { lifelines:[{id,label,kind}], messages:[{from,to,text,kind}],
               frags:[{type,label,start,end}] }
     upto  = highlight message index (null = show all plain)
     ---------------------------------------------------------- */
  function render(target, model, upto) {
    var lls = model.lifelines || [], ms = model.messages || [], frags = model.frags || [];
    var W = PAD * 2 + Math.max(1, lls.length) * LANE;
    var H = TOP + Math.max(1, ms.length) * GAP + 46;

    target.setAttribute("viewBox", "0 0 " + W + " " + H);
    // fixed pixel size: the diagram never distorts; the wrapper scrolls instead
    target.setAttribute("width", W);
    target.setAttribute("height", H);
    target.style.width = W + "px";
    target.style.height = H + "px";
    target.innerHTML = "";

    var xOf = {};
    lls.forEach(function (l, i) { xOf[l.id] = PAD + LANE * i + LANE / 2; });

    /* fragments behind everything */
    frags.forEach(function (f) {
      var y1 = TOP + f.start * GAP - 34, y2 = TOP + (f.end + 1) * GAP - 20;
      var xs = [];
      ms.slice(f.start, f.end + 1).forEach(function (m) {
        xs.push(xOf[m.from], xOf[m.to]);
      });
      var lo = Math.min.apply(null, xs) - 46, hi = Math.max.apply(null, xs) + 46;
      var tabW = Math.max(34, f.type.length * 6.2 + 16);
      var g = svg("g");
      g.appendChild(svg("rect", { x: lo, y: y1, width: hi - lo, height: y2 - y1, rx: 3, class: "seq-frag" }));
      g.appendChild(svg("path", {
        d: "M" + lo + " " + y1 + "h" + tabW + "l10 15v0H" + lo + "z",
        class: "seq-frag", fill: "var(--bg-3)"
      }));
      g.appendChild(tx(lo + 7, y1 + 12, f.type, "seq-frag-lbl"));
      if (f.label) g.appendChild(tx(lo + tabW + 18, y1 + 13, "[" + f.label + "]", "seq-frag-lbl"));
      target.appendChild(g);
    });

    /* lifelines */
    lls.forEach(function (l) {
      var x = xOf[l.id];
      var g = svg("g", { class: "seq-box" });
      if (l.kind === "actor") {
        g.appendChild(svg("circle", { cx: x, cy: 12, r: 7, fill: "var(--surface)", stroke: "var(--line-2)", "stroke-width": 1.4 }));
        g.appendChild(svg("path", { d: "M" + x + " 19v13M" + (x - 9) + " 24h18M" + x + " 32l-7 10M" + x + " 32l7 10",
          stroke: "var(--line-2)", "stroke-width": 1.4, fill: "none" }));
        g.appendChild(tx(x, 56, l.label, "", "middle"));
      } else {
        var w = Math.max(96, l.label.length * 6.4 + 18);
        g.appendChild(svg("rect", { x: x - w / 2, y: 16, width: w, height: 28, rx: 3 }));
        g.appendChild(tx(x, 34, l.label, "", "middle"));
      }
      target.appendChild(g);
      target.appendChild(svg("line", { x1: x, y1: 46, x2: x, y2: H - 20, class: "seq-life" }));
    });

    /* activation bars: a bar on the receiver until control returns */
    var open = {};
    ms.forEach(function (m, i) {
      if (m.kind === "return") {
        var o = open[m.from];
        if (o != null) {
          var y1 = TOP + o * GAP - 7, y2 = TOP + i * GAP + 7;
          target.appendChild(svg("rect", { x: xOf[m.from] - 5, y: y1, width: 10, height: Math.max(12, y2 - y1), class: "seq-act" }));
          delete open[m.from];
        }
        return;
      }
      if (open[m.to] == null) open[m.to] = i;
    });
    Object.keys(open).forEach(function (id) {
      var o = open[id];
      var y1 = TOP + o * GAP - 7;
      target.appendChild(svg("rect", { x: xOf[id] - 5, y: y1, width: 10, height: Math.max(16, (ms.length - o) * GAP - GAP + 20), class: "seq-act" }));
    });

    /* messages */
    ms.forEach(function (m, i) {
      var y = TOP + i * GAP;
      var x1 = xOf[m.from], x2 = xOf[m.to];
      var on = upto != null && i === upto;
      var dim = upto != null && i > upto;
      var g = svg("g", { class: dim ? "seq-dim" : "" });

      if (m.from === m.to) {
        // reflexive / self call
        var r = 26;
        g.appendChild(svg("path", {
          d: "M" + x1 + " " + y + "h" + r + "v18h" + (-r + 8),
          class: "seq-msg" + (on ? " on" : ""), fill: "none"
        }));
        g.appendChild(svg("path", { d: "M" + (x1 + 8) + " " + (y + 18) + "l8 -4M" + (x1 + 8) + " " + (y + 18) + "l8 4",
          class: "seq-msg" + (on ? " on" : ""), fill: "none" }));
        g.appendChild(tx(x1 + r + 8, y + 4, m.text, "seq-txt" + (on ? " on" : "")));
      } else {
        var dir = x2 > x1 ? 1 : -1;
        var cls = m.kind === "return" ? "seq-ret" : "seq-msg" + (on ? " on" : "");
        g.appendChild(svg("line", { x1: x1 + 5 * dir, y1: y, x2: x2 - 6 * dir, y2: y, class: cls }));
        if (m.kind === "return" || m.kind === "async") {
          g.appendChild(svg("path", {
            d: "M" + (x2 - 6 * dir) + " " + y + "l" + (8 * dir) + " -4M" + (x2 - 6 * dir) + " " + y + "l" + (8 * dir) + " 4",
            class: cls, fill: "none"
          }));
        } else {
          g.appendChild(svg("path", {
            d: "M" + (x2 - 6 * dir) + " " + y + "l" + (9 * dir) + " -4.5l0 9z",
            fill: on ? "var(--accent)" : "var(--ink-2)", stroke: "none"
          }));
        }
        var lx = (x1 + x2) / 2;
        var label = (m.kind === "create" ? "«create» " : "") + m.text;
        g.appendChild(tx(lx, y - 7, label, "seq-txt" + (on ? " on" : "") + (m.kind === "return" ? " dim" : ""), "middle"));
      }
      target.appendChild(g);
    });

    if (!ms.length) {
      target.appendChild(tx(W / 2, TOP + 30, "no messages yet", "seq-txt", "middle"));
    }
  }
  OOP.seqRender = render;

  /* ----------------------------------------------------------
     Step player for teaching (read-only)
     <div data-seq-player="MODEL_NAME"> … controls … <svg></svg>
     ---------------------------------------------------------- */
  function bootPlayers() {
    $$("[data-seq-player]").forEach(function (root) {
      var name = root.getAttribute("data-seq-player");
      var model = (window.SEQ_MODELS || {})[name];
      if (!model) { console.warn("No sequence model", name); return; }
      var target = $("svg", root);
      var narr = $("[data-seq-narrate]", root);
      OOP.stepper(root, {
        steps: model.messages.length,
        autoMs: 1500,
        render: function (i) {
          render(target, model, i);
          if (narr) {
            var m = model.messages[i];
            narr.innerHTML = m.note || ("<b>" + (m.kind === "return" ? "returns" : "calls") + "</b> <code>" + m.text + "</code>");
          }
        }
      });
    });
  }

  /* ----------------------------------------------------------
     Builder: pick sender, receiver, type, text → append.
     Graded against exercise.answer (ordered message list).
     ---------------------------------------------------------- */
  function Builder(root, ex) {
    var self = this;
    this.root = root; this.ex = ex;
    this.model = { lifelines: (ex.lifelines || []).slice(), messages: [], frags: [] };
    this.target = $("svg", root);
    this.list = $("[data-seq-list]", root);
    this.out = $("[data-seq-check]", root);

    this.restore();
    this.buildForm();
    this.draw();

    var run = $("[data-seq-run]", root);
    if (run) run.addEventListener("click", function () { self.check(); });
    var clr = $("[data-seq-clear]", root);
    if (clr) clr.addEventListener("click", function () {
      if (!confirm("Remove all messages?")) return;
      self.model.messages = []; self.draw(); self.save();
      if (self.out) self.out.innerHTML = "";
    });
  }

  Builder.prototype.key = function () { return "oop-seq-" + (this.ex.id || "x"); };
  Builder.prototype.save = function () {
    try { localStorage.setItem(this.key(), JSON.stringify(this.model.messages)); } catch (e) {}
  };
  Builder.prototype.restore = function () {
    try {
      var raw = localStorage.getItem(this.key());
      if (raw) this.model.messages = JSON.parse(raw) || [];
    } catch (e) {}
  };

  Builder.prototype.buildForm = function () {
    var self = this, form = $("[data-seq-form]", this.root);
    if (!form) return;
    form.innerHTML = "";

    function lineSel(ph) {
      var s = el("select");
      self.model.lifelines.forEach(function (l) {
        var o = el("option", null, l.label); o.value = l.id; s.appendChild(o);
      });
      s.setAttribute("aria-label", ph);
      return s;
    }
    var from = lineSel("sender"), to = lineSel("receiver");
    if (self.model.lifelines[1]) to.value = self.model.lifelines[1].id;

    var kind = el("select");
    [["sync", "calls (solid)"], ["async", "async (open arrow)"], ["return", "returns (dashed)"], ["create", "«create»"]]
      .forEach(function (p) { var o = el("option", null, p[1]); o.value = p[0]; kind.appendChild(o); });

    var text = el("input");
    text.type = "text"; text.placeholder = "method name, e.g. get_grade()"; text.style.minWidth = "190px"; text.style.flex = "1";

    var add = el("button", "btn btn-s btn-primary", "+ Add message");
    add.type = "button";
    function submit() {
      if (!text.value.trim()) { text.focus(); return; }
      self.model.messages.push({ from: from.value, to: to.value, kind: kind.value, text: text.value.trim() });
      text.value = ""; self.draw(); self.save(); text.focus();
    }
    add.addEventListener("click", submit);
    text.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });

    var r1 = el("div", "controls");
    [from, el("span", "lab-hint", "→"), to, kind].forEach(function (n) { r1.appendChild(n); });
    var r2 = el("div", "controls");
    r2.style.marginTop = ".5rem";
    r2.appendChild(text); r2.appendChild(add);
    form.appendChild(r1); form.appendChild(r2);
  };

  Builder.prototype.draw = function () {
    var self = this;
    render(this.target, this.model, null);
    if (!this.list) return;
    this.list.innerHTML = "";
    if (!this.model.messages.length) {
      this.list.appendChild(el("p", "lab-hint", "No messages yet. Add the first call the actor makes."));
      return;
    }
    function label(id) {
      for (var i = 0; i < self.model.lifelines.length; i++) if (self.model.lifelines[i].id === id) return self.model.lifelines[i].label;
      return id;
    }
    this.model.messages.forEach(function (m, i) {
      var row = el("div", "varbox");
      row.style.marginBottom = ".3rem";
      var nm = el("span", "nm", (i + 1) + ". " + label(m.from) + " → " + label(m.to) + "  " + m.text);
      nm.style.fontSize = ".76rem";
      row.appendChild(nm);
      var tools = el("span", "row");
      tools.style.gap = ".2rem";
      [["↑", -1], ["↓", 1]].forEach(function (p) {
        var b = el("button", "btn btn-xs", p[0]); b.type = "button";
        b.addEventListener("click", function () {
          var j = i + p[1];
          if (j < 0 || j >= self.model.messages.length) return;
          var t = self.model.messages[i]; self.model.messages[i] = self.model.messages[j]; self.model.messages[j] = t;
          self.draw(); self.save();
        });
        tools.appendChild(b);
      });
      var d = el("button", "btn btn-xs", "✕"); d.type = "button";
      d.addEventListener("click", function () { self.model.messages.splice(i, 1); self.draw(); self.save(); });
      tools.appendChild(d);
      row.appendChild(tools);
      self.list.appendChild(row);
    });
  };

  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

  Builder.prototype.check = function () {
    var self = this, want = this.ex.answer || [], got = this.model.messages, res = [];

    function labelOf(id) {
      for (var i = 0; i < self.model.lifelines.length; i++) if (self.model.lifelines[i].id === id) return self.model.lifelines[i].label;
      return id;
    }
    function matches(g, w) {
      if (g.from !== w.from || g.to !== w.to) return false;
      var names = [w.text].concat(w.alias || []).map(norm);
      var gn = norm(g.text);
      return names.some(function (n) { return gn.indexOf(n) >= 0 || n.indexOf(gn) >= 0; });
    }

    // every required call present, and in the right relative order
    var lastIdx = -1, orderOk = true;
    want.forEach(function (w) {
      var at = -1;
      for (var i = 0; i < got.length; i++) if (matches(got[i], w)) { at = i; break; }
      if (at < 0) {
        res.push({ ok: false, msg: "Missing: <b>" + labelOf(w.from) + " → " + labelOf(w.to) + "</b> <code>" + w.text + "</code>" + (w.why ? " — " + w.why : "") });
        return;
      }
      res.push({ ok: true, msg: "<b>" + labelOf(w.from) + " → " + labelOf(w.to) + "</b> <code>" + got[at].text + "</code>" });
      if (w.kind && got[at].kind !== w.kind) {
        res.push({ ok: false, msg: "&nbsp;&nbsp;should be a <i>" + w.kind + "</i> message, not <i>" + got[at].kind + "</i>" + (w.whyKind ? " — " + w.whyKind : "") });
      }
      if (at < lastIdx) orderOk = false;
      lastIdx = Math.max(lastIdx, at);
    });
    if (want.length > 1) {
      res.push({ ok: orderOk, msg: orderOk ? "Messages are in the right order" : "The calls are out of order — read your own diagram top to bottom and check it tells the story in sequence" });
    }
    (this.ex.forbid || []).forEach(function (f) {
      var bad = got.some(function (g) { return g.from === f.from && g.to === f.to; });
      if (bad) res.push({ ok: false, msg: "Remove <b>" + labelOf(f.from) + " → " + labelOf(f.to) + "</b> — " + (f.why || "that object should not be called directly here") });
    });

    this.report(res);
  };

  Builder.prototype.report = function (res) {
    if (!this.out) return;
    var pass = res.filter(function (r) { return r.ok; }).length, total = res.length || 1;
    var pct = Math.round(pass / total * 100);
    this.out.innerHTML = "";
    this.out.appendChild(el("p", "studio-sect", "Check — " + pass + " / " + total));
    var bar = el("div", "scorebar"), fill = el("i");
    fill.style.background = pct === 100 ? "var(--ok)" : pct > 55 ? "var(--warn)" : "var(--bad)";
    bar.appendChild(fill); this.out.appendChild(bar);
    requestAnimationFrame(function () { fill.style.width = pct + "%"; });
    var ul = el("ul");
    res.slice().sort(function (a, b) { return (a.ok ? 1 : 0) - (b.ok ? 1 : 0); }).forEach(function (r) {
      var li = el("li", r.ok ? "pass" : "fail"); li.innerHTML = r.msg; ul.appendChild(li);
    });
    var box = el("div", "checkout"); box.appendChild(ul); this.out.appendChild(box);
  };

  document.addEventListener("oop:ready", function () {
    bootPlayers();
    $$("[data-seq-build]").forEach(function (root) {
      var id = root.getAttribute("data-seq-build");
      var ex = (window.SEQ_EXERCISES || {})[id];
      if (!ex) { console.warn("No sequence exercise", id); return; }
      ex.id = id;
      new Builder(root, ex);
    });
  });
  OOP.SeqBuilder = Builder;
})();
