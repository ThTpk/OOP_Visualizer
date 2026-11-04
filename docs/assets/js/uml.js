/* ============================================================
   uml.js — drag-and-drop UML editor + auto-grader.
   Handles class diagrams and use-case diagrams on one engine.
   Sequence diagrams use the separate builder in seq.js.
   ============================================================ */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var $ = OOP.$, $$ = OOP.$$, el = OOP.el;

  /* ---------- geometry helpers ---------- */
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }
  function textW(s, px) { return (s || "").length * (px || 12) * 0.56; }

  /* Clip the segment c1->c2 to the border of the rect around c1. */
  function clipRect(cx, cy, w, h, tx, ty) {
    var dx = tx - cx, dy = ty - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    var hw = w / 2, hh = h / 2;
    var sx = dx === 0 ? Infinity : hw / Math.abs(dx);
    var sy = dy === 0 ? Infinity : hh / Math.abs(dy);
    var s = Math.min(sx, sy);
    return { x: cx + dx * s, y: cy + dy * s };
  }
  function clipEllipse(cx, cy, rx, ry, tx, ty) {
    var dx = tx - cx, dy = ty - cy;
    var d = Math.hypot(dx / rx, dy / ry);
    if (!d) return { x: cx, y: cy };
    return { x: cx + dx / d, y: cy + dy / d };
  }

  /* ---------- edge kinds ---------- */
  var KINDS = {
    assoc:  { label: "Association",            dash: null,    srcDeco: null,      tgtDeco: "arrow",    nav: true },
    biassoc:{ label: "Association (two-way)",  dash: null,    srcDeco: null,      tgtDeco: null,       nav: false },
    depend: { label: "Dependency",             dash: "6 4",   srcDeco: null,      tgtDeco: "arrow",    nav: true },
    aggreg: { label: "Aggregation",            dash: null,    srcDeco: "diamondO",tgtDeco: null,       nav: false },
    compos: { label: "Composition",            dash: null,    srcDeco: "diamondF",tgtDeco: null,       nav: false },
    inherit:{ label: "Generalization",         dash: null,    srcDeco: null,      tgtDeco: "triangle", nav: false },
    include:{ label: "«include»",              dash: "6 4",   srcDeco: null,      tgtDeco: "arrow",    stereo: "«include»" },
    extend: { label: "«extend»",               dash: "6 4",   srcDeco: null,      tgtDeco: "arrow",    stereo: "«extend»" },
    ucassoc:{ label: "Actor link",             dash: null,    srcDeco: null,      tgtDeco: null,       nav: false }
  };
  var SYN = { aggregation: "aggreg", composition: "compos", generalization: "inherit", association: "assoc", dependency: "depend" };

  /* ---------- the editor ---------- */
  function Studio(root, exercise) {
    var self = this;
    this.root = root;
    this.ex = exercise;
    this.model = { nodes: [], edges: [] };
    this.seq = 1;
    this.tool = null;          // active palette tool
    this.sel = null;           // { type:'node'|'edge', id }
    this.linkFrom = null;      // node id while drawing an edge
    this.drag = null;

    this.canvas = $("[data-uml-canvas]", root);
    this.palette = $("[data-uml-palette]", root);
    this.side = $("[data-uml-side]", root);
    this.out = $("[data-uml-check]", root);

    this.gEdges = svg("g"); this.gNodes = svg("g"); this.gTemp = svg("g");
    this.canvas.appendChild(this.gEdges);
    this.canvas.appendChild(this.gNodes);
    this.canvas.appendChild(this.gTemp);

    this.buildPalette();
    this.bind();
    if (!this.restore()) this.seed();
    this.render();
  }

  Studio.prototype.key = function () { return "oop-uml-" + (this.ex.id || "x"); };

  /* ----- palette ----- */
  Studio.prototype.buildPalette = function () {
    var self = this;
    if (!this.palette) return;
    this.palette.innerHTML = "";

    function section(t) { var h = el("p", "studio-sect", t); self.palette.appendChild(h); }
    function tool(id, label, glyph) {
      var b = el("button", "palitem");
      b.type = "button";
      b.setAttribute("data-tool", id);
      b.setAttribute("aria-pressed", "false");
      var g = el("span", "gl"); g.innerHTML = glyph; b.appendChild(g);
      b.appendChild(el("span", null, label));
      b.addEventListener("click", function () { self.setTool(id); });
      self.palette.appendChild(b);
      return b;
    }

    var mode = this.ex.mode || "class";
    section("Nodes");
    if (mode === "usecase") {
      tool("n:actor", "Actor", '<svg viewBox="0 0 24 16"><circle cx="12" cy="4" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 6.6v5M8.5 8.5h7M12 11.6l-2.6 3.4M12 11.6l2.6 3.4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>');
      tool("n:usecase", "Use case", '<svg viewBox="0 0 24 16"><ellipse cx="12" cy="8" rx="10.5" ry="5.6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>');
    } else {
      tool("n:class", "Class", '<svg viewBox="0 0 24 16"><rect x="2" y="1.5" width="20" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 6h20" stroke="currentColor" stroke-width="1.2"/></svg>');
    }

    section("Relationships");
    var line = function (extra, dash) {
      return '<svg viewBox="0 0 24 16"><path d="M1 8h22" stroke="currentColor" stroke-width="1.5" fill="none"' + (dash ? ' stroke-dasharray="4 3"' : "") + "/>" + (extra || "") + "</svg>";
    };
    var arrow = '<path d="M23 8l-5-3.4M23 8l-5 3.4" stroke="currentColor" stroke-width="1.5" fill="none"/>';
    var tri = '<path d="M23 8l-6-4v8z" fill="none" stroke="currentColor" stroke-width="1.5"/>';
    var dOpen = '<path d="M1 8l4-3 4 3-4 3z" fill="none" stroke="currentColor" stroke-width="1.4"/>';
    var dFill = '<path d="M1 8l4-3 4 3-4 3z" fill="currentColor"/>';

    if (mode === "usecase") {
      tool("e:ucassoc", "Actor link", line());
      tool("e:include", "«include»", line(arrow, true));
      tool("e:extend", "«extend»", line(arrow, true));
      tool("e:inherit", "Generalization", line(tri));
    } else {
      tool("e:assoc", "Association →", line(arrow));
      tool("e:biassoc", "Association —", line());
      tool("e:aggreg", "Aggregation ◇", line(dOpen));
      tool("e:compos", "Composition ◆", line(dFill));
      tool("e:inherit", "Inheritance △", line(tri));
      tool("e:depend", "Dependency ⇢", line(arrow, true));
    }

    section("Canvas");
    var del = el("button", "palitem"); del.type = "button";
    del.appendChild(el("span", "gl", "⌫"));
    del.appendChild(el("span", null, "Delete selected"));
    del.addEventListener("click", function () { self.deleteSel(); });
    this.palette.appendChild(del);

    var clr = el("button", "palitem"); clr.type = "button";
    clr.appendChild(el("span", "gl", "↺"));
    clr.appendChild(el("span", null, "Reset exercise"));
    clr.addEventListener("click", function () {
      if (!confirm("Clear your diagram and start over?")) return;
      self.model = { nodes: [], edges: [] }; self.seq = 1; self.sel = null;
      self.seed(); self.render(); self.save();
      if (self.out) self.out.innerHTML = "";
    });
    this.palette.appendChild(clr);

    var exp = el("button", "palitem"); exp.type = "button";
    exp.appendChild(el("span", "gl", "⇩"));
    exp.appendChild(el("span", null, "Export SVG"));
    exp.addEventListener("click", function () { self.exportSVG(); });
    this.palette.appendChild(exp);
  };

  Studio.prototype.setTool = function (id) {
    this.tool = this.tool === id ? null : id;
    this.linkFrom = null;
    this.gTemp.innerHTML = "";
    $$("[data-tool]", this.palette).forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-tool") === this.tool ? "true" : "false");
    }, this);
    this.canvas.classList.toggle("placing", !!this.tool && this.tool.charAt(0) === "n");
    this.canvas.classList.toggle("linking", !!this.tool && this.tool.charAt(0) === "e");
  };

  /* ----- model ops ----- */
  Studio.prototype.addNode = function (kind, x, y, name) {
    var n = {
      id: "n" + this.seq++, kind: kind, name: name || (kind === "actor" ? "Actor" : kind === "usecase" ? "Do something" : "NewClass"),
      attrs: [], methods: [], x: Math.round(x), y: Math.round(y)
    };
    this.model.nodes.push(n);
    return n;
  };
  Studio.prototype.node = function (id) {
    for (var i = 0; i < this.model.nodes.length; i++) if (this.model.nodes[i].id === id) return this.model.nodes[i];
    return null;
  };
  Studio.prototype.addEdge = function (kind, from, to) {
    var e = { id: "e" + this.seq++, kind: kind, from: from, to: to, fromMult: "", toMult: "", label: "" };
    this.model.edges.push(e);
    return e;
  };
  Studio.prototype.deleteSel = function () {
    if (!this.sel) return;
    var id = this.sel.id;
    if (this.sel.type === "node") {
      this.model.nodes = this.model.nodes.filter(function (n) { return n.id !== id; });
      this.model.edges = this.model.edges.filter(function (e) { return e.from !== id && e.to !== id; });
    } else {
      this.model.edges = this.model.edges.filter(function (e) { return e.id !== id; });
    }
    this.sel = null; this.render(); this.save();
  };

  /* ----- sizing ----- */
  Studio.prototype.size = function (n) {
    if (n.kind === "actor") return { w: 46, h: 68 };
    if (n.kind === "usecase") {
      var w = Math.max(104, textW(n.name, 11) + 34);
      return { w: w, h: 46 };
    }
    var rows = n.attrs.concat(n.methods);
    var maxw = textW(n.name, 12.5) + 24;
    rows.forEach(function (r) { maxw = Math.max(maxw, textW(r, 10.5) + 22); });
    var h = 24 + 6;
    if (n.attrs.length) h += n.attrs.length * 15 + 5; else h += 10;
    if (n.methods.length) h += n.methods.length * 15 + 5; else h += 10;
    return { w: Math.max(126, Math.min(260, Math.round(maxw))), h: Math.round(h) };
  };

  /* ----- render ----- */
  Studio.prototype.render = function () {
    var self = this;
    this.gNodes.innerHTML = ""; this.gEdges.innerHTML = "";

    this.model.nodes.forEach(function (n) { self.drawNode(n); });
    this.model.edges.forEach(function (e) { self.drawEdge(e); });
    this.drawSide();
  };

  Studio.prototype.drawNode = function (n) {
    var self = this, s = this.size(n);
    var g = svg("g", { class: "uml-node" + (this.sel && this.sel.id === n.id ? " sel" : ""), transform: "translate(" + n.x + "," + n.y + ")" });
    g.setAttribute("data-id", n.id);
    n._w = s.w; n._h = s.h;

    if (n.kind === "actor") {
      g.appendChild(svg("circle", { cx: 23, cy: 11, r: 9, fill: "var(--surface)", stroke: "var(--line-2)", "stroke-width": 1.6 }));
      g.appendChild(svg("path", { d: "M23 20v18M10 26h26M23 38l-10 14M23 38l10 14", stroke: "var(--line-2)", "stroke-width": 1.6, fill: "none" }));
      var t = svg("text", { x: 23, y: 66, "text-anchor": "middle", class: "cname" });
      t.textContent = n.name; g.appendChild(t);
    } else if (n.kind === "usecase") {
      g.appendChild(svg("ellipse", { cx: s.w / 2, cy: s.h / 2, rx: s.w / 2, ry: s.h / 2, fill: "var(--surface)", stroke: "var(--line-2)", "stroke-width": 1.5 }));
      var t2 = svg("text", { x: s.w / 2, y: s.h / 2 + 4, "text-anchor": "middle", class: "cname" });
      t2.textContent = n.name; g.appendChild(t2);
    } else {
      g.appendChild(svg("rect", { x: 0, y: 0, width: s.w, height: s.h, rx: 3 }));
      var ty = 16;
      var ct = svg("text", { x: s.w / 2, y: ty, "text-anchor": "middle", class: "cname" });
      ct.textContent = n.name; g.appendChild(ct);
      var y = 24;
      g.appendChild(svg("line", { x1: 0, y1: y, x2: s.w, y2: y, class: "divider" }));
      y += 13;
      n.attrs.forEach(function (a) {
        var e = svg("text", { x: 8, y: y, class: "member" }); e.textContent = a; g.appendChild(e); y += 15;
      });
      if (!n.attrs.length) y += 0;
      var divY = n.attrs.length ? y - 10 : y - 3;
      g.appendChild(svg("line", { x1: 0, y1: divY, x2: s.w, y2: divY, class: "divider" }));
      y = divY + 13;
      n.methods.forEach(function (m) {
        var e = svg("text", { x: 8, y: y, class: "member" }); e.textContent = m; g.appendChild(e); y += 15;
      });
    }

    g.addEventListener("pointerdown", function (ev) { self.onNodeDown(ev, n); });
    this.gNodes.appendChild(g);
  };

  Studio.prototype.anchor = function (n, tx, ty) {
    var s = { w: n._w || this.size(n).w, h: n._h || this.size(n).h };
    if (n.kind === "usecase") return clipEllipse(n.x + s.w / 2, n.y + s.h / 2, s.w / 2, s.h / 2, tx, ty);
    return clipRect(n.x + s.w / 2, n.y + s.h / 2, s.w, s.h, tx, ty);
  };

  Studio.prototype.drawEdge = function (e) {
    var self = this;
    var a = this.node(e.from), b = this.node(e.to);
    if (!a || !b) return;
    var K = KINDS[e.kind] || KINDS.assoc;
    var g = svg("g");
    g.setAttribute("data-id", e.id);

    var sa = { w: a._w || this.size(a).w, h: a._h || this.size(a).h };
    var sb = { w: b._w || this.size(b).w, h: b._h || this.size(b).h };
    var ac = { x: a.x + sa.w / 2, y: a.y + sa.h / 2 };
    var bc = { x: b.x + sb.w / 2, y: b.y + sb.h / 2 };

    var p1, p2, path;
    if (a.id === b.id) {
      // self-association loop
      p1 = { x: a.x + sa.w, y: a.y + 12 };
      p2 = { x: a.x + sa.w - 22, y: a.y };
      path = "M" + p1.x + " " + p1.y + " C" + (p1.x + 48) + " " + (p1.y - 26) + "," + (p2.x + 30) + " " + (p2.y - 44) + "," + p2.x + " " + p2.y;
    } else {
      p1 = this.anchor(a, bc.x, bc.y);
      p2 = this.anchor(b, ac.x, ac.y);
      path = "M" + p1.x + " " + p1.y + "L" + p2.x + " " + p2.y;
    }

    var cls = "uml-edge" + (this.sel && this.sel.id === e.id ? " sel" : "");
    g.appendChild(svg("path", { d: path, class: cls, "stroke-dasharray": K.dash }));
    g.appendChild(svg("path", { d: path, class: "uml-edge-hit" }));

    // decorations
    if (K.tgtDeco) this.deco(g, K.tgtDeco, p2, Math.atan2(p2.y - p1.y, p2.x - p1.x));
    if (K.srcDeco) this.deco(g, K.srcDeco, p1, Math.atan2(p1.y - p2.y, p1.x - p2.x));

    // multiplicities and label
    var mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    function lerp(p, q, t) { return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; }
    if (e.fromMult) {
      var m1 = lerp(p1, p2, .13), t1 = svg("text", { x: m1.x, y: m1.y - 6, class: "uml-mult", "text-anchor": "middle" });
      t1.textContent = e.fromMult; g.appendChild(t1);
    }
    if (e.toMult) {
      var m2 = lerp(p1, p2, .87), t2 = svg("text", { x: m2.x, y: m2.y - 6, class: "uml-mult", "text-anchor": "middle" });
      t2.textContent = e.toMult; g.appendChild(t2);
    }
    var lbl = K.stereo || e.label;
    if (lbl) {
      var tl = svg("text", { x: mid.x, y: mid.y - 7, class: "uml-lbl", "text-anchor": "middle" });
      tl.textContent = lbl; g.appendChild(tl);
    }

    g.addEventListener("pointerdown", function (ev) {
      ev.stopPropagation();
      self.sel = { type: "edge", id: e.id };
      self.render();
    });
    this.gEdges.appendChild(g);
  };

  Studio.prototype.deco = function (g, type, p, ang) {
    var deg = ang * 180 / Math.PI;
    var tr = "translate(" + p.x + "," + p.y + ") rotate(" + deg + ")";
    if (type === "arrow") {
      g.appendChild(svg("path", { d: "M0 0 L-9 -5 M0 0 L-9 5", transform: tr, class: "uml-edge", fill: "none" }));
    } else if (type === "triangle") {
      g.appendChild(svg("path", { d: "M0 0 L-12 -7 L-12 7 Z", transform: tr, fill: "var(--bg-code)", stroke: "var(--ink-2)", "stroke-width": 1.6 }));
    } else if (type === "diamondO") {
      g.appendChild(svg("path", { d: "M0 0 L-8 -5 L-16 0 L-8 5 Z", transform: tr, fill: "var(--bg-code)", stroke: "var(--ink-2)", "stroke-width": 1.6 }));
    } else if (type === "diamondF") {
      g.appendChild(svg("path", { d: "M0 0 L-8 -5 L-16 0 L-8 5 Z", transform: tr, fill: "var(--ink-2)", stroke: "var(--ink-2)", "stroke-width": 1.6 }));
    }
  };

  /* ----- interaction ----- */
  /* The canvas uses CSS pixels as its own coordinate system (no viewBox),
     so a click maps 1:1 and nothing is letterboxed. */
  Studio.prototype.pt = function (ev) {
    var r = this.canvas.getBoundingClientRect();
    var vb = this.canvas.getAttribute("viewBox");
    if (!vb) return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    var n = vb.split(/\s+/).map(Number);
    return {
      x: (ev.clientX - r.left) / r.width * n[2] + n[0],
      y: (ev.clientY - r.top) / r.height * n[3] + n[1]
    };
  };

  Studio.prototype.bind = function () {
    var self = this;

    this.canvas.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest && ev.target.closest(".uml-node")) return;
      if (ev.target.classList && ev.target.classList.contains("uml-edge-hit")) return;
      var p = self.pt(ev);
      if (self.tool && self.tool.charAt(0) === "n") {
        var kind = self.tool.slice(2);
        var n = self.addNode(kind, p.x - 60, p.y - 24);
        self.sel = { type: "node", id: n.id };
        self.setTool(null);
        self.render(); self.save();
        var f = $("[data-f-name]", self.side); if (f) { f.focus(); f.select(); }
        return;
      }
      self.sel = null; self.linkFrom = null; self.gTemp.innerHTML = ""; self.render();
    });

    this.canvas.addEventListener("pointermove", function (ev) {
      var p = self.pt(ev);
      if (self.drag) {
        var n = self.node(self.drag.id);
        if (n) { n.x = Math.round(p.x - self.drag.dx); n.y = Math.round(p.y - self.drag.dy); self.render(); }
        return;
      }
      if (self.linkFrom) {
        var a = self.node(self.linkFrom);
        if (!a) return;
        var s = { w: a._w || 120, h: a._h || 60 };
        var q = self.anchor(a, p.x, p.y);
        self.gTemp.innerHTML = "";
        self.gTemp.appendChild(svg("path", { d: "M" + q.x + " " + q.y + "L" + p.x + " " + p.y, stroke: "var(--accent)", "stroke-width": 1.8, "stroke-dasharray": "5 4", fill: "none" }));
      }
    });

    addEventListener("pointerup", function () {
      if (self.drag) { self.drag = null; self.save(); }
    });

    document.addEventListener("keydown", function (ev) {
      if (!self.sel) return;
      var tag = (ev.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); self.deleteSel(); }
      if (ev.key === "Escape") { self.sel = null; self.setTool(null); self.render(); }
    });

    var chk = $("[data-uml-run]", this.root);
    if (chk) chk.addEventListener("click", function () { self.check(); });
  };

  Studio.prototype.onNodeDown = function (ev, n) {
    ev.stopPropagation();
    var self = this;
    if (this.tool && this.tool.charAt(0) === "e") {
      if (!this.linkFrom) {
        this.linkFrom = n.id;
        this.sel = { type: "node", id: n.id };
        this.render();
      } else {
        var kind = this.tool.slice(2);
        var e = this.addEdge(kind, this.linkFrom, n.id);
        this.linkFrom = null; this.gTemp.innerHTML = "";
        this.sel = { type: "edge", id: e.id };
        this.setTool(null);
        this.render(); this.save();
      }
      return;
    }
    var p = this.pt(ev);
    this.drag = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
    this.sel = { type: "node", id: n.id };
    this.render();
  };

  /* ----- inspector ----- */
  Studio.prototype.drawSide = function () {
    var self = this;
    if (!this.side) return;
    this.side.innerHTML = "";

    var head = el("p", "studio-sect", "Inspector");
    this.side.appendChild(head);

    if (!this.sel) {
      this.side.appendChild(el("p", "lab-hint",
        "Pick a tool on the left, then click the canvas to place a node. " +
        "To draw a relationship, choose its tool and click the two nodes in order. " +
        "Drag nodes to move them."));
      this.sideBrief();
      return;
    }

    function field(label, value, oninput, hint) {
      var w = el("label", null);
      w.style.display = "block"; w.style.marginBottom = ".6rem";
      var s = el("span", "lab-hint", label);
      s.style.display = "block"; s.style.marginBottom = ".18rem";
      w.appendChild(s);
      var inp = el("input"); inp.type = "text"; inp.value = value || ""; inp.style.width = "100%";
      inp.addEventListener("input", function () { oninput(inp.value); });
      w.appendChild(inp);
      if (hint) { var h = el("span", "lab-hint", hint); h.style.fontSize = ".72rem"; w.appendChild(h); }
      self.side.appendChild(w);
      return inp;
    }
    function area(label, value, oninput, hint) {
      var w = el("label", null);
      w.style.display = "block"; w.style.marginBottom = ".6rem";
      var s = el("span", "lab-hint", label);
      s.style.display = "block"; s.style.marginBottom = ".18rem";
      w.appendChild(s);
      var ta = el("textarea"); ta.rows = 3; ta.value = value || "";
      ta.addEventListener("input", function () { oninput(ta.value); });
      w.appendChild(ta);
      if (hint) { var h = el("span", "lab-hint", hint); h.style.fontSize = ".72rem"; w.appendChild(h); }
      self.side.appendChild(w);
    }

    if (this.sel.type === "node") {
      var n = this.node(this.sel.id);
      if (!n) { this.sel = null; return this.drawSide(); }
      var inp = field(n.kind === "class" ? "Class name" : n.kind === "actor" ? "Actor name" : "Use case name",
        n.name, function (v) { n.name = v; self.render(); self.save(); });
      inp.setAttribute("data-f-name", "1");
      if (n.kind === "class") {
        area("Attributes (one per line)", n.attrs.join("\n"), function (v) {
          n.attrs = v.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
          self.render(); self.save();
        }, "Use − for private, + for public, # for protected. e.g. − balance: float");
        area("Methods (one per line)", n.methods.join("\n"), function (v) {
          n.methods = v.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
          self.render(); self.save();
        }, "e.g. + deposit(amount): bool");
      }
    } else {
      var e = null;
      for (var i = 0; i < this.model.edges.length; i++) if (this.model.edges[i].id === this.sel.id) e = this.model.edges[i];
      if (!e) { this.sel = null; return this.drawSide(); }
      var a = this.node(e.from), b = this.node(e.to);

      var kw = el("label"); kw.style.display = "block"; kw.style.marginBottom = ".6rem";
      var ks = el("span", "lab-hint", "Relationship type"); ks.style.display = "block"; ks.style.marginBottom = ".18rem";
      kw.appendChild(ks);
      var sel = el("select"); sel.style.width = "100%";
      var allowed = (this.ex.mode === "usecase") ? ["ucassoc", "include", "extend", "inherit"]
                                                 : ["assoc", "biassoc", "aggreg", "compos", "inherit", "depend"];
      allowed.forEach(function (k) {
        var o = el("option", null, KINDS[k].label); o.value = k;
        if (k === e.kind) o.selected = true; sel.appendChild(o);
      });
      sel.addEventListener("change", function () { e.kind = sel.value; self.render(); self.save(); });
      kw.appendChild(sel); this.side.appendChild(kw);

      var dirn = el("p", "lab-hint", (a ? a.name : "?") + "  →  " + (b ? b.name : "?"));
      dirn.style.margin = ".1rem 0 .6rem"; this.side.appendChild(dirn);

      var flip = el("button", "btn btn-xs", "⇄ Swap direction");
      flip.type = "button";
      flip.addEventListener("click", function () {
        var t = e.from; e.from = e.to; e.to = t;
        var m = e.fromMult; e.fromMult = e.toMult; e.toMult = m;
        self.render(); self.save();
      });
      flip.style.marginBottom = ".7rem";
      this.side.appendChild(flip);

      if (this.ex.mode !== "usecase") {
        field("Multiplicity at " + (a ? a.name : "source"), e.fromMult, function (v) { e.fromMult = v.trim(); self.render(); self.save(); }, "1   0..1   1..*   0..*   *");
        field("Multiplicity at " + (b ? b.name : "target"), e.toMult, function (v) { e.toMult = v.trim(); self.render(); self.save(); });
        field("Label (verb)", e.label, function (v) { e.label = v.trim(); self.render(); self.save(); }, "e.g. enrolls in, teaches");
      }
    }

    var d = el("button", "btn btn-xs", "⌫ Delete this");
    d.type = "button";
    d.addEventListener("click", function () { self.deleteSel(); });
    this.side.appendChild(d);
    this.sideBrief();
  };

  Studio.prototype.sideBrief = function () {
    if (!this.ex.brief) return;
    var h = el("p", "studio-sect", "Task");
    h.style.marginTop = "1.2rem";
    this.side.appendChild(h);
    var p = el("div", "lab-hint");
    p.innerHTML = this.ex.brief;
    this.side.appendChild(p);
  };

  /* ----- persistence ----- */
  Studio.prototype.save = function () {
    try { localStorage.setItem(this.key(), JSON.stringify({ m: this.model, s: this.seq })); } catch (e) {}
  };
  Studio.prototype.restore = function () {
    try {
      var raw = localStorage.getItem(this.key());
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || !d.m || !d.m.nodes) return false;
      this.model = d.m; this.seq = d.s || 50;
      return true;
    } catch (e) { return false; }
  };
  Studio.prototype.seed = function () {
    var self = this;
    (this.ex.seed || []).forEach(function (s) {
      var n = self.addNode(s.kind || (self.ex.mode === "usecase" ? "usecase" : "class"), s.x, s.y, s.name);
      if (s.attrs) n.attrs = s.attrs.slice();
      if (s.methods) n.methods = s.methods.slice();
      if (s.locked) n.locked = true;
    });
    (this.ex.seedEdges || []).forEach(function (se) {
      var a = self.byName(se.from), b = self.byName(se.to);
      if (a && b) {
        var e = self.addEdge(se.kind, a.id, b.id);
        e.fromMult = se.fromMult || ""; e.toMult = se.toMult || ""; e.label = se.label || "";
      }
    });
  };
  Studio.prototype.byName = function (name) {
    var t = norm(name);
    for (var i = 0; i < this.model.nodes.length; i++) if (norm(this.model.nodes[i].name) === t) return this.model.nodes[i];
    return null;
  };

  Studio.prototype.exportSVG = function () {
    var clone = this.canvas.cloneNode(true);
    clone.setAttribute("xmlns", NS);
    // crop to the drawing so the exported file has no huge empty margin
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    this.model.nodes.forEach(function (n) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n._w || 140)); maxY = Math.max(maxY, n.y + (n._h || 70));
    });
    if (minX < 1e9) {
      var pad = 30;
      clone.setAttribute("viewBox", (minX - pad) + " " + (minY - pad) + " " +
        (maxX - minX + pad * 2) + " " + (maxY - minY + pad * 2));
      clone.setAttribute("width", maxX - minX + pad * 2);
      clone.setAttribute("height", maxY - minY + pad * 2);
    }
    // inline the few custom-property colours so the file stands alone
    var cs = getComputedStyle(document.documentElement);
    var css = "text{font-family:system-ui,sans-serif}.uml-node rect{fill:#fff;stroke:#555;stroke-width:1.5}" +
      ".uml-node .cname{font-weight:700;font-size:12.5px;fill:#111}.uml-node .member{font-family:monospace;font-size:10.5px;fill:#444}" +
      ".uml-node .divider{stroke:#888}.uml-edge{stroke:#333;stroke-width:1.6;fill:none}.uml-edge-hit{display:none}" +
      ".uml-mult{font-family:monospace;font-size:10px;fill:#333}.uml-lbl{font-size:10.5px;fill:#666;font-style:italic}";
    var st = document.createElementNS(NS, "style");
    st.textContent = css;
    clone.insertBefore(st, clone.firstChild);
    clone.querySelectorAll("[fill^='var'],[stroke^='var']").forEach(function (n) {
      if ((n.getAttribute("fill") || "").indexOf("var") === 0) n.setAttribute("fill", n.getAttribute("fill").indexOf("ink") > 0 ? "#333" : "#fff");
      if ((n.getAttribute("stroke") || "").indexOf("var") === 0) n.setAttribute("stroke", "#333");
    });
    var blob = new Blob(['<?xml version="1.0"?>\n' + clone.outerHTML], { type: "image/svg+xml" });
    var a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = (this.ex.id || "diagram") + ".svg";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ---------- the grader ---------- */
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function multNorm(s) {
    s = String(s || "").trim().replace(/\s/g, "");
    if (s === "*") return "0..*";
    if (s === "1..1") return "1";
    if (s === "0..1") return "0..1";
    return s;
  }

  Studio.prototype.check = function () {
    var self = this, ex = this.ex, res = [];
    var nodes = this.model.nodes, edges = this.model.edges;

    function find(spec) {
      var names = [spec.name].concat(spec.alias || []).map(norm);
      for (var i = 0; i < nodes.length; i++) {
        if (names.indexOf(norm(nodes[i].name)) >= 0) return nodes[i];
      }
      return null;
    }
    function nameOf(id) { var n = self.node(id); return n ? n.name : "?"; }

    /* 1. required nodes */
    var found = {};
    (ex.nodes || []).forEach(function (spec) {
      var n = find(spec);
      found[spec.name] = n;
      if (!n) {
        res.push({ ok: false, msg: "Missing <b>" + spec.name + "</b>" + (spec.why ? " — " + spec.why : "") });
        return;
      }
      res.push({ ok: true, msg: "<b>" + spec.name + "</b> present" });

      // attributes the class must own
      (spec.attrs || []).forEach(function (a) {
        var want = [a.name].concat(a.alias || []).map(norm);
        var hit = n.attrs.some(function (x) {
          var cleaned = norm(x.replace(/[:(].*$/, ""));
          return want.some(function (w) { return cleaned.indexOf(w) >= 0; });
        });
        res.push({ ok: hit, msg: (hit ? "" : "Missing ") + "<b>" + spec.name + "</b> attribute <code>" + a.name + "</code>" + (!hit && a.why ? " — " + a.why : "") });
      });
      (spec.methods || []).forEach(function (m) {
        var want = [m.name].concat(m.alias || []).map(norm);
        var hit = n.methods.some(function (x) {
          var cleaned = norm(x.replace(/[(:].*$/, ""));
          return want.some(function (w) { return cleaned.indexOf(w) >= 0; });
        });
        res.push({ ok: hit, msg: (hit ? "" : "Missing ") + "<b>" + spec.name + "</b> method <code>" + m.name + "()</code>" + (!hit && m.why ? " — " + m.why : "") });
      });
      // attributes that must NOT be here (wrong information expert)
      (spec.notAttrs || []).forEach(function (a) {
        var bad = n.attrs.some(function (x) { return norm(x.replace(/[:(].*$/, "")).indexOf(norm(a.name)) >= 0; });
        res.push({ ok: !bad, msg: bad ? "<b>" + spec.name + "</b> should not store <code>" + a.name + "</code> — " + (a.why || "it belongs to another class") : "<b>" + spec.name + "</b> keeps out data it does not own" });
      });
    });

    /* 2. required edges */
    (ex.edges || []).forEach(function (spec) {
      var a = found[spec.from] || find({ name: spec.from }), b = found[spec.to] || find({ name: spec.to });
      if (!a || !b) {
        res.push({ ok: false, msg: "Cannot check <b>" + spec.from + " – " + spec.to + "</b> yet (place both nodes first)" });
        return;
      }
      var wantKinds = (spec.kind || "").split("|").map(function (k) { return SYN[k] || k; });
      var hits = edges.filter(function (e) {
        var fwd = e.from === a.id && e.to === b.id;
        var rev = e.from === b.id && e.to === a.id;
        return fwd || rev;
      });
      if (!hits.length) {
        res.push({ ok: false, msg: "Missing relationship <b>" + spec.from + " – " + spec.to + "</b>" + (spec.why ? " — " + spec.why : "") });
        return;
      }
      var kindHit = hits.filter(function (e) { return wantKinds.indexOf(e.kind) >= 0; });
      if (!kindHit.length) {
        res.push({
          ok: false,
          msg: "<b>" + spec.from + " – " + spec.to + "</b> is drawn as <i>" +
            (KINDS[hits[0].kind] || {}).label + "</i>, expected <i>" + (KINDS[wantKinds[0]] || {}).label + "</i>" +
            (spec.whyKind ? " — " + spec.whyKind : "")
        });
        return;
      }
      var e = kindHit[0];
      res.push({ ok: true, msg: "<b>" + spec.from + " – " + spec.to + "</b> " + (KINDS[e.kind] || {}).label });

      // direction matters for inheritance / aggregation / composition / include / extend
      if (spec.directed !== false && ["inherit", "aggreg", "compos", "include", "extend", "depend"].indexOf(e.kind) >= 0) {
        var okDir = e.from === a.id && e.to === b.id;
        res.push({
          ok: okDir,
          msg: okDir ? "&nbsp;&nbsp;direction correct"
                     : "&nbsp;&nbsp;direction is backwards: " + nameOf(e.from) + " → " + nameOf(e.to) +
                       ", should be " + spec.from + " → " + spec.to + (spec.whyDir ? " (" + spec.whyDir + ")" : "")
        });
      }
      // multiplicities
      if (spec.fromMult || spec.toMult) {
        var fwd = e.from === a.id;
        var gotF = multNorm(fwd ? e.fromMult : e.toMult);
        var gotT = multNorm(fwd ? e.toMult : e.fromMult);
        if (spec.fromMult) {
          var wF = spec.fromMult.split("|").map(multNorm);
          var okF = wF.indexOf(gotF) >= 0;
          res.push({ ok: okF, msg: "&nbsp;&nbsp;multiplicity at <b>" + spec.from + "</b> " + (okF ? "= " + gotF : "is “" + (gotF || "blank") + "”, expected " + spec.fromMult) });
        }
        if (spec.toMult) {
          var wT = spec.toMult.split("|").map(multNorm);
          var okT = wT.indexOf(gotT) >= 0;
          res.push({ ok: okT, msg: "&nbsp;&nbsp;multiplicity at <b>" + spec.to + "</b> " + (okT ? "= " + gotT : "is “" + (gotT || "blank") + "”, expected " + spec.toMult) });
        }
      }
    });

    /* 3. forbidden edges */
    (ex.forbidEdges || []).forEach(function (spec) {
      var a = find({ name: spec.from }), b = find({ name: spec.to });
      if (!a || !b) return;
      var bad = edges.some(function (e) {
        var pair = (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id);
        if (!pair) return false;
        return !spec.kind || (SYN[spec.kind] || spec.kind) === e.kind;
      });
      if (bad) res.push({ ok: false, msg: "Remove <b>" + spec.from + " – " + spec.to + "</b> — " + (spec.why || "that relationship does not exist here") });
    });

    this.report(res);
  };

  Studio.prototype.report = function (res) {
    if (!this.out) return;
    var pass = res.filter(function (r) { return r.ok; }).length;
    var total = res.length || 1;
    var pct = Math.round(pass / total * 100);

    this.out.innerHTML = "";
    var head = el("p", "studio-sect", "Check — " + pass + " / " + total + " correct");
    this.out.appendChild(head);
    var bar = el("div", "scorebar"); var fill = el("i");
    fill.style.background = pct === 100 ? "var(--ok)" : pct > 55 ? "var(--warn)" : "var(--bad)";
    bar.appendChild(fill); this.out.appendChild(bar);
    requestAnimationFrame(function () { fill.style.width = pct + "%"; });

    var ul = el("ul");
    // failures first — that is what the student needs to act on
    res.slice().sort(function (a, b) { return (a.ok ? 1 : 0) - (b.ok ? 1 : 0); }).forEach(function (r) {
      var li = el("li", r.ok ? "pass" : "fail");
      li.innerHTML = r.msg;
      ul.appendChild(li);
    });
    var box = el("div", "checkout"); box.appendChild(ul);
    this.out.appendChild(box);

    if (pct === 100) {
      var done = el("p", null);
      done.style.marginTop = ".8rem";
      done.innerHTML = '<span class="chip chip-ok">✓ Diagram matches the model answer</span>';
      this.out.appendChild(done);
    }
  };

  /* ---------- auto-boot every [data-uml] on the page ---------- */
  OOP.Studio = Studio;
  OOP.studios = {};
  document.addEventListener("oop:ready", function () {
    OOP.$$("[data-uml]").forEach(function (root) {
      var id = root.getAttribute("data-uml");
      var ex = (window.UML_EXERCISES || {})[id];
      if (!ex) { console.warn("No UML exercise named", id); return; }
      ex.id = id;
      OOP.studios[id] = new Studio(root, ex);
    });
  });
})();
