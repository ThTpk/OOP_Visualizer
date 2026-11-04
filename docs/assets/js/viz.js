/* ============================================================
   viz.js — the chapter interactives.
   Each widget renders its own markup into <div data-viz="name">,
   so the chapter HTML stays readable.
   ============================================================ */
(function () {
  "use strict";
  var $ = OOP.$, $$ = OOP.$$, el = OOP.el;
  var VIZ = {};

  /* ---------- shared bits ---------- */
  function frame(host, title, chip) {
    host.classList.add("lab");
    var h = el("div", "lab-head");
    h.appendChild(el("h4", null, title));
    if (chip) h.appendChild(el("span", "chip chip-accent", chip));
    var b = el("div", "lab-body");
    host.appendChild(h); host.appendChild(b);
    return b;
  }
  function pre(code, cls) {
    var p = el("pre"), c = el("code");
    c.innerHTML = OOP.highlightPython(code);
    p.appendChild(c);
    if (cls) p.className = cls;
    p.__src = code;
    return p;
  }
  function side(kind, label, code) {
    var w = el("div", "vs-side vs-" + kind);
    var h = el("div", "vs-head", label);
    w.appendChild(h);
    w.appendChild(pre(code));
    return w;
  }
  function btn(label, cls, fn) {
    var b = el("button", "btn btn-s " + (cls || ""), label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  function metric(label, value, tone) {
    var d = el("div", "card");
    d.style.padding = ".7rem .85rem";
    var v = el("div", null, value);
    v.style.fontSize = "1.5rem"; v.style.fontWeight = "750"; v.style.lineHeight = "1.1";
    v.style.color = tone === "bad" ? "var(--bad)" : tone === "ok" ? "var(--ok)" : "var(--accent)";
    d.appendChild(v);
    var l = el("div", "lab-hint", label);
    l.style.fontSize = ".74rem";
    d.appendChild(l);
    return d;
  }
  function term(lines) {
    var p = el("pre"), c = el("code");
    c.innerHTML = lines.map(function (l) {
      if (l.indexOf("!!") === 0) return '<span style="color:#fca5a5">' + l.slice(2) + "</span>";
      if (l.indexOf("##") === 0) return '<span style="color:#86e3b2">' + l.slice(2) + "</span>";
      if (l.indexOf(">>") === 0) return '<span class="t-com">' + l + "</span>";
      return l;
    }).join("\n");
    p.appendChild(c);
    p.setAttribute("data-raw", "1");
    p.style.margin = "0";
    return p;
  }

  /* ==========================================================
     1. Why objects: parallel lists fall out of sync
     ========================================================== */
  VIZ["parallel-lists"] = function (host) {
    var body = frame(host, "What goes wrong without objects", "week 2");
    var chars = [
      { name: "Hero_01", lvl: 1, hp: 100 },
      { name: "Archer_02", lvl: 2, hp: 120 },
      { name: "Mage_03", lvl: 5, hp: 90 }
    ];
    var extras = [];          // attributes added after the fact
    var desync = 0;           // how far the lists have drifted apart
    var nextId = 4;

    var controls = el("div", "controls");
    var panes = el("div", "vs");
    var stats = el("div", "grid grid-4");
    stats.style.marginTop = "1rem";
    var ledger = el("div");

    function fields() { return ["name", "level", "hp"].concat(extras); }

    function procCode() {
      var f = fields();
      var lines = f.map(function (k) {
        var vals = chars.map(function (c, i) {
          if (k === "name") return "'" + c.name + "'";
          if (k === "level") return c.lvl;
          if (k === "hp") return c.hp;
          return "0";
        });
        if (k === "name" && desync) vals = vals.slice(0, Math.max(0, vals.length - desync));
        return k + "s = [" + vals.join(", ") + "]";
      });
      lines.push("");
      lines.push("# every new field = one more list to keep aligned");
      lines.push("print(names[1], levels[1], hps[1])");
      return lines.join("\n");
    }
    function oopCode() {
      var f = fields();
      var init = "    def __init__(self, " + f.join(", ") + "):\n" +
        f.map(function (k) { return "        self." + k + " = " + k; }).join("\n");
      var mk = chars.map(function (c) {
        return "party.append(Character('" + c.name + "', " + c.lvl + ", " + c.hp +
          extras.map(function () { return ", 0"; }).join("") + "))";
      }).join("\n");
      return "class Character:\n" + init + "\n\nparty = []\n" + mk + "\n\nprint(party[1].name, party[1].level, party[1].hp)";
    }

    function draw() {
      panes.innerHTML = "";
      var L = side("bad", "✗ Procedural — parallel lists", procCode());
      var R = side("good", "✓ Object-oriented — one Character", oopCode());
      var ln = el("div", "vs-note");
      ln.innerHTML = desync
        ? "<b style='color:var(--bad)'>names[] is now shorter than the others.</b> <code>names[1]</code> and <code>levels[1]</code> no longer describe the same character."
        : fields().length + " lists must stay the same length, forever, by hand.";
      L.appendChild(ln);
      var rn = el("div", "vs-note");
      rn.innerHTML = "One object holds one character. Nothing can drift apart.";
      R.appendChild(rn);
      panes.appendChild(L); panes.appendChild(R);

      stats.innerHTML = "";
      stats.appendChild(metric("lists to keep in sync", String(fields().length), fields().length > 3 ? "bad" : null));
      stats.appendChild(metric("places to edit to add a field", String(fields().length ? 2 + chars.length : 2), "bad"));
      stats.appendChild(metric("objects to keep in sync", "1", "ok"));
      stats.appendChild(metric("places to edit (OOP)", "1", "ok"));

      ledger.innerHTML = "";
      if (desync) {
        var out = term([
          ">> procedural version",
          "print(names[1], levels[1], hps[1])",
          "!!IndexError: list index out of range   # or worse: silently the wrong character",
          "",
          ">> object version",
          "print(party[1].name, party[1].level, party[1].hp)",
          "##Archer_02 2 120"
        ]);
        var box = el("div", "note note-trap");
        box.innerHTML = "<b>This is the bug class OOP removes.</b> One list was edited and the others were not. " +
          "The program does not crash at the point of the mistake — it crashes, or lies, much later.";
        box.appendChild(out);
        ledger.appendChild(box);
      }
    }

    controls.appendChild(btn("+ Add character", "", function () {
      chars.push({ name: "Unit_0" + nextId++, lvl: 1, hp: 100 }); desync = 0; draw();
    }));
    controls.appendChild(btn("+ Add an attribute (guild)", "", function () {
      var names = ["guild", "mana", "gold", "armor", "exp"];
      if (extras.length < names.length) extras.push(names[extras.length]);
      draw();
    }));
    controls.appendChild(btn("💥 Delete from one list only", "", function () {
      if (chars.length) desync = Math.min(desync + 1, chars.length); draw();
    }));
    controls.appendChild(btn("↺ Reset", "btn-ghost", function () {
      chars = [{ name: "Hero_01", lvl: 1, hp: 100 }, { name: "Archer_02", lvl: 2, hp: 120 }, { name: "Mage_03", lvl: 5, hp: 90 }];
      extras = []; desync = 0; nextId = 4; draw();
    }));

    body.appendChild(controls);
    body.appendChild(panes);
    body.appendChild(stats);
    body.appendChild(ledger);
    draw();
  };

  /* ==========================================================
     2. Instances in memory — step through two constructions
     ========================================================== */
  VIZ["instances"] = function (host) {
    var body = frame(host, "Two instances, two addresses", "week 2");
    var code = "class Student:\n" +
      "    def __init__(self, student_id, name):\n" +
      "        self.student_id = student_id\n" +
      "        self.name = name\n" +
      "\n" +
      "stu1 = Student('001', 'John')\n" +
      "stu2 = Student('002', 'Peter')\n" +
      "stu2.name = 'Pete'\n" +
      "print(stu1.name, stu2.name)";

    var layout = el("div", "grid");
    layout.style.gridTemplateColumns = "minmax(0,1fr) minmax(0,1fr)";
    var left = el("div"), right = el("div");
    var preEl = pre(code);
    left.appendChild(preEl);

    var mem = el("div", "memgrid");
    mem.innerHTML =
      '<div><p class="memcol-title">Names (stack)</p><div class="memzone" data-mem-vars></div></div>' +
      '<div><p class="memcol-title">Objects (heap)</p><div class="memzone" data-mem-objs></div></div>';
    right.appendChild(mem);
    layout.appendChild(left); layout.appendChild(right);

    var bar = el("div", "stepbar");
    bar.style.marginTop = "1rem";
    bar.innerHTML =
      '<button class="btn btn-s" data-step-prev>‹ Back</button>' +
      '<button class="btn btn-s btn-primary" data-step-next>Step ›</button>' +
      '<button class="btn btn-s btn-ghost" data-step-play>▶ Play</button>' +
      '<span class="stepcount" data-step-count></span>' +
      '<span class="sp" style="flex:1"></span>' +
      '<input type="range" data-step-range style="max-width:150px">';
    var narr = el("div", "narrate");

    var A = "0x1a4c", B = "0x2f80";
    var steps = [
      { l: [1, 2, 3, 4], v: [], o: [],
        n: "The <code>class</code> statement only builds a <b>blueprint</b>. No student exists yet — nothing has been allocated." },
      { l: [6], v: [{ name: "stu1", points: A }],
        o: [{ cls: "Student", addr: A, isNew: true, rows: [{ k: "student_id", v: "'001'" }, { k: "name", v: "'John'" }] }],
        n: "<code>Student('001','John')</code> allocates an object at <b>" + A + "</b>, runs <code>__init__</code>, and binds the name <code>stu1</code> to that address." },
      { l: [7], v: [{ name: "stu1", points: A }, { name: "stu2", points: B }],
        o: [{ cls: "Student", addr: A, rows: [{ k: "student_id", v: "'001'" }, { k: "name", v: "'John'" }] },
            { cls: "Student", addr: B, isNew: true, rows: [{ k: "student_id", v: "'002'" }, { k: "name", v: "'Peter'" }] }],
        n: "A second call makes a <b>separate</b> object at " + B + ". Same blueprint, different memory. This is why <code>stu1.student_id</code> is not <code>stu2.student_id</code>." },
      { l: [8], v: [{ name: "stu1", points: A }, { name: "stu2", points: B }],
        o: [{ cls: "Student", addr: A, rows: [{ k: "student_id", v: "'001'" }, { k: "name", v: "'John'" }] },
            { cls: "Student", addr: B, rows: [{ k: "student_id", v: "'002'" }, { k: "name", v: "'Pete'", changed: true }] }],
        n: "Changing <code>stu2.name</code> changes the <b>state of one instance only</b>. The object at " + A + " never hears about it." },
      { l: [9], v: [{ name: "stu1", points: A }, { name: "stu2", points: B }],
        o: [{ cls: "Student", addr: A, rows: [{ k: "student_id", v: "'001'" }, { k: "name", v: "'John'" }] },
            { cls: "Student", addr: B, rows: [{ k: "student_id", v: "'002'" }, { k: "name", v: "'Pete'" }] }],
        n: "<code>John Pete</code>. The <code>self</code> in <code>__init__</code> is simply the address of the instance being built — that is the whole trick." }
    ];

    body.appendChild(layout); body.appendChild(bar); body.appendChild(narr);
    OOP.stepper(host, {
      steps: steps.length,
      render: function (i) {
        var s = steps[i];
        OOP.spotlight(preEl, s.l);
        OOP.renderMemory(right, { vars: s.v, objects: s.o });
        narr.innerHTML = s.n;
      }
    });
  };

  /* ==========================================================
     3. Encapsulation — what a missing setter actually costs
     ========================================================== */
  VIZ["encapsulation"] = function (host) {
    var body = frame(host, "Try to corrupt the object", "week 3");
    var openGpa = 3.50, safeGpa = 3.50, log = [], lastAssigned = "3.50";

    var intro = el("p", "muted");
    intro.innerHTML = "Two versions of the same class. The left one exposes <code>self.gpa</code>; the right one hides " +
      "<code>self.__gpa</code> behind a setter that validates. <b>Assign a value and watch what each one allows.</b>";

    var controls = el("div", "controls");
    var input = el("input");
    input.type = "text"; input.value = "-5"; input.style.width = "90px";
    controls.appendChild(el("span", "lab-hint", "student.gpa ="));
    controls.appendChild(input);
    [["-5", "negative"], ["4.5", "above 4.00"], ["'A'", "wrong type"], ["3.75", "valid"]].forEach(function (p) {
      controls.appendChild(btn(p[0], "btn-xs btn-ghost", function () { input.value = p[0]; assign(); }));
    });
    controls.appendChild(btn("Assign →", "btn-primary", function () { assign(); }));
    controls.appendChild(btn("↺", "btn-ghost btn-xs", function () {
      openGpa = 3.50; safeGpa = 3.50; log = []; lastAssigned = "3.50"; draw();
    }));

    var panes = el("div", "vs");
    var outBox = el("div");
    outBox.style.marginTop = "1rem";

    function parse(raw) {
      raw = raw.trim();
      if (/^['"].*['"]$/.test(raw)) return { kind: "str", v: raw };
      var n = parseFloat(raw);
      if (isNaN(n)) return { kind: "bad", v: raw };
      return { kind: "num", v: n };
    }

    function assign() {
      var raw = input.value.trim();
      var p = parse(raw);
      var shown = p.kind === "num" ? p.v : p.v;
      // unguarded version: anything sticks
      openGpa = p.v;
      lastAssigned = raw;
      // guarded version
      var ok = p.kind === "num" && p.v >= 0 && p.v <= 4;
      if (ok) { safeGpa = p.v; log = [">> student.gpa = " + shown, "##accepted — state is still valid"]; }
      else {
        log = [">> student.gpa = " + shown,
          "!!ValueError: gpa must be a number between 0.00 and 4.00",
          "   __gpa is unchanged: " + safeGpa.toFixed(2)];
      }
      draw();
    }

    function draw() {
      panes.innerHTML = "";
      var openCode =
        "class Student:\n" +
        "    def __init__(self, name, gpa):\n" +
        "        self.name = name\n" +
        "        self.gpa = gpa          # public\n" +
        "\n" +
        "s = Student('John', 3.50)\n" +
        "s.gpa = " + lastAssigned + "            # nothing stops this";
      var safeCode =
        "class Student:\n" +
        "    def __init__(self, name, gpa):\n" +
        "        self.__name = name\n" +
        "        self.set_gpa(gpa)       # private + setter\n" +
        "\n" +
        "    def set_gpa(self, value):\n" +
        "        if not isinstance(value, (int, float)):\n" +
        "            raise ValueError('gpa must be a number')\n" +
        "        if not 0 <= value <= 4:\n" +
        "            raise ValueError('gpa out of range')\n" +
        "        self.__gpa = value\n" +
        "\n" +
        "    def get_gpa(self):\n" +
        "        return self.__gpa";

      var L = side("bad", "✗ public attribute", openCode);
      var R = side("good", "✓ private + validating setter", safeCode);

      var badVal = !(typeof openGpa === "number" && openGpa >= 0 && openGpa <= 4);
      var ln = el("div", "vs-note");
      ln.innerHTML = "object state now: <code>gpa = " + (typeof openGpa === "number" ? openGpa : openGpa) + "</code> " +
        (badVal ? '<span class="chip chip-bad">invalid state</span>' : '<span class="chip chip-ok">valid</span>');
      L.appendChild(ln);
      var rn = el("div", "vs-note");
      rn.innerHTML = "object state now: <code>__gpa = " + safeGpa.toFixed(2) + "</code> " +
        '<span class="chip chip-ok">always valid</span>';
      R.appendChild(rn);
      panes.appendChild(L); panes.appendChild(R);

      outBox.innerHTML = "";
      if (log.length) outBox.appendChild(term(log));

      if (badVal) {
        var dmg = el("div", "note note-trap");
        dmg.style.marginTop = "1rem";
        dmg.innerHTML =
          "<b>The damage is downstream, not here.</b> The assignment succeeded, so nothing looked wrong at the time. " +
          "Later, something else reads that attribute:" +
          "<ul class='breaks'>" +
          "<li><b>Transcript printing</b> — reports a GPA of " + (typeof openGpa === "number" ? openGpa : openGpa) + " to the registrar</li>" +
          "<li><b>Scholarship check</b> — <code>if s.gpa >= 3.5</code> " +
          (typeof openGpa === "number" && openGpa > 4 ? "awards a scholarship that does not exist" : "silently excludes a student, or crashes on a string comparison") + "</li>" +
          "<li><b>Debugging</b> — you now search the whole program for whoever wrote that value, because <i>any</i> line could have</li>" +
          "</ul>" +
          "With the setter, the program fails <b>at the line that is wrong</b>, with a message naming the rule.";
        outBox.appendChild(dmg);
      }
    }

    body.appendChild(intro); body.appendChild(controls); body.appendChild(panes); body.appendChild(outBox);
    draw();
  };

  /* ==========================================================
     4. Python's three access levels, and what they really do
     ========================================================== */
  VIZ["access"] = function (host) {
    var body = frame(host, "Public, protected, private — what Python actually enforces", "week 3");
    var pick = "name";

    var seg = el("div", "seg");
    [["name", "name"], ["_name", "_name"], ["__name", "__name"]].forEach(function (p) {
      var b = el("button", null, p[1]);
      b.type = "button";
      b.setAttribute("aria-pressed", p[0] === pick ? "true" : "false");
      b.addEventListener("click", function () { pick = p[0]; draw(); });
      seg.appendChild(b);
    });

    var out = el("div");
    out.style.marginTop = "1rem";

    function draw() {
      $$("button", seg).forEach(function (b) { b.setAttribute("aria-pressed", b.textContent === pick ? "true" : "false"); });
      out.innerHTML = "";

      var meta = {
        "name":   { level: "Public", from: "✓ works", sub: "✓ works", mangled: "name", chip: "chip-ok",
                    when: "Data you are happy for anyone to read <i>and</i> write with no checking. In practice: almost nothing." },
        "_name":  { level: "Protected (by convention)", from: "⚠ still works", sub: "✓ works", mangled: "_name", chip: "chip",
                    when: "“Subclasses may touch this; outsiders please don't.” Python does <b>not</b> stop them — it is a signed agreement, not a lock." },
        "__name": { level: "Private (name-mangled)", from: "✗ AttributeError", sub: "✗ AttributeError", mangled: "_Student__name", chip: "chip-bad",
                    when: "The default for attributes in this course. Expose only what a getter or setter chooses to expose." }
      }[pick];

      var cls = "class Student:\n" +
        "    def __init__(self):\n" +
        "        self." + pick + " = 'John'\n" +
        "\n" +
        "    def show(self):\n" +
        "        return self." + pick + "      # inside the class: always fine\n" +
        "\n" +
        "class Freshman(Student):\n" +
        "    def greet(self):\n" +
        "        return 'Hi ' + self." + pick + "   # inside a subclass\n" +
        "\n" +
        "s = Student()\n" +
        "print(s." + pick + ")                    # from outside";
      var g = el("div", "grid");
      g.style.gridTemplateColumns = "minmax(0,1.1fr) minmax(0,1fr)";
      g.appendChild(pre(cls));

      var right = el("div");
      var dl = el("div", "card");
      dl.innerHTML =
        '<p style="margin:0 0 .6rem"><span class="chip ' + meta.chip + '">' + meta.level + '</span></p>' +
        '<dl class="kv">' +
        "<dt>inside the class</dt><dd>✓ works</dd>" +
        "<dt>inside a subclass</dt><dd>" + meta.sub + "</dd>" +
        "<dt>from outside</dt><dd>" + meta.from + "</dd>" +
        "<dt>real attribute name</dt><dd><code>" + meta.mangled + "</code></dd>" +
        "</dl>";
      right.appendChild(dl);

      var t = pick === "__name"
        ? term([">> print(s.__name)", "!!AttributeError: 'Student' object has no attribute '__name'", "",
                ">> print(s._Student__name)", "##John   # the mangled name is still reachable if you insist"])
        : pick === "_name"
          ? term([">> print(s._name)", "##John   # Python allowed it — only the leading _ warned you not to"])
          : term([">> print(s.name)", "##John", ">> s.name = 42", "##no error, no validation, no record of who did it"]);
      t.style.marginTop = ".7rem";
      right.appendChild(t);
      g.appendChild(right);
      out.appendChild(g);

      var w = el("div", "note" + (pick === "__name" ? " note-good" : pick === "name" ? " note-trap" : " note-tip"));
      w.innerHTML = "<b>Use it when:</b> " + meta.when;
      out.appendChild(w);

      if (pick === "__name") {
        var n2 = el("div", "note note-exam");
        n2.innerHTML = "<b>Exam point.</b> Python has no <code>private</code> keyword. " +
          "<code>__name</code> is rewritten by the interpreter to <code>_Student__name</code> — that is <i>name mangling</i>. " +
          "It blocks accidents and subclass collisions; it is not security.";
        out.appendChild(n2);
      }
    }

    body.appendChild(seg); body.appendChild(out);
    draw();
  };

  /* ==========================================================
     5. Inheritance — the cost of duplication, measured
     ========================================================== */
  VIZ["duplication"] = function (host) {
    var body = frame(host, "Count the edits", "week 5");
    var types = 3, shared = 6;

    var ctr = el("div", "stack-s");
    function slider(label, min, max, get, set) {
      var row = el("div", "rangerow");
      var lab = el("span", null, label);
      lab.style.minWidth = "190px";
      var r = el("input"); r.type = "range"; r.min = min; r.max = max; r.value = get();
      var val = el("b", null, String(get()));
      val.style.minWidth = "2ch";
      r.addEventListener("input", function () { set(+r.value); val.textContent = r.value; draw(); });
      row.appendChild(lab); row.appendChild(r); row.appendChild(val);
      return row;
    }
    ctr.appendChild(slider("Employee subtypes", 2, 8, function () { return types; }, function (v) { types = v; }));
    ctr.appendChild(slider("Fields they all share", 2, 10, function () { return shared; }, function (v) { shared = v; }));

    var stats = el("div", "grid grid-4");
    stats.style.margin = "1rem 0";
    var panes = el("div", "vs");
    var concl = el("div");

    function draw() {
      var dupLines = types * (shared + 2);
      var inhLines = (shared + 2) + types * 3;
      var dupEdits = types, inhEdits = 1;

      stats.innerHTML = "";
      stats.appendChild(metric("lines, copy-paste", String(dupLines), "bad"));
      stats.appendChild(metric("lines, inheritance", String(inhLines), "ok"));
      stats.appendChild(metric("classes to edit to add a field", String(dupEdits), "bad"));
      stats.appendChild(metric("with inheritance", String(inhEdits), "ok"));

      var names = ["Manager", "Engineer", "Intern", "Designer", "Analyst", "Sales", "Support", "Director"];
      var fieldNames = ["emp_id", "name", "email", "phone", "address", "hire_date", "salary", "department", "tax_id", "bank_acc"].slice(0, shared);

      var dup = names.slice(0, types).map(function (n) {
        return "class " + n + ":\n    def __init__(self, " + fieldNames.join(", ") + ", extra):\n" +
          fieldNames.map(function (f) { return "        self._" + f + " = " + f; }).join("\n");
      }).join("\n\n");

      var inh = "class Employee:\n    def __init__(self, " + fieldNames.join(", ") + "):\n" +
        fieldNames.map(function (f) { return "        self._" + f + " = " + f; }).join("\n") + "\n\n" +
        names.slice(0, types).map(function (n) {
          return "class " + n + "(Employee):\n    def __init__(self, extra, **kw):\n        super().__init__(**kw)\n        self._extra = extra";
        }).join("\n\n");

      panes.innerHTML = "";
      var L = side("bad", "✗ " + types + " independent classes", dup);
      var R = side("good", "✓ one superclass + " + types + " subclasses", inh);
      var ln = el("div", "vs-note");
      ln.innerHTML = "Add one field and you touch <b>" + dupEdits + " classes</b>. Miss one and that subtype quietly lacks the field.";
      L.appendChild(ln);
      var rn = el("div", "vs-note");
      rn.innerHTML = "Add one field and you touch <b>Employee only</b>. All " + types + " subtypes get it.";
      R.appendChild(rn);
      panes.appendChild(L); panes.appendChild(R);

      concl.innerHTML = "";
      var c = el("div", "note note-why");
      c.innerHTML = "<b>Why inheritance exists.</b> It is not about taxonomy for its own sake — it is about having " +
        "<b>one</b> place to change a shared rule. At " + types + " subtypes and " + shared + " shared fields, " +
        "copy-paste costs you <b>" + (dupLines - inhLines) + " extra lines</b> and <b>" + (dupEdits - inhEdits) +
        " extra edit sites</b> every single time the shared part changes. " +
        "That gap is where bugs live: the file somebody forgot to update.";
      concl.appendChild(c);
      if (types >= 6) {
        var warn = el("div", "note note-tip");
        warn.innerHTML = "<b>But do not over-reach.</b> Inheritance is only correct when every subtype genuinely <b>is-a</b> Employee. " +
          "A <code>Payslip</code> is <i>not</i> an employee, however many fields they share — that would be composition.";
        concl.appendChild(warn);
      }
    }

    body.appendChild(ctr); body.appendChild(stats); body.appendChild(panes); body.appendChild(concl);
    draw();
  };

  /* ==========================================================
     6. Polymorphism — one loop vs a growing if/elif chain
     ========================================================== */
  VIZ["dispatch"] = function (host) {
    var body = frame(host, "One call, many behaviours", "week 6");
    var roster = [
      { cls: "Warrior", act: "swings a sword — 18 melee damage", res: "rage −20" },
      { cls: "Archer", act: "fires an arrow — 12 ranged damage", res: "arrows −3" },
      { cls: "Mage", act: "casts fireball — 25 magic damage", res: "mana −50" }
    ];
    var pool = [
      { cls: "Priest", act: "heals the party for 30 hp", res: "faith −25" },
      { cls: "Rogue", act: "backstabs — 34 damage", res: "energy −40" },
      { cls: "Druid", act: "summons vines — 15 damage", res: "nature −30" }
    ];
    var ran = -1;

    var controls = el("div", "controls");
    controls.appendChild(btn("▶ Run the game loop", "btn-primary", function () { ran = 0; tickRun(); }));
    controls.appendChild(btn("+ Add a new class", "", function () {
      if (pool.length) roster.push(pool.shift());
      ran = -1; draw();
    }));
    controls.appendChild(btn("↺ Reset", "btn-ghost", function () {
      pool = roster.slice(3).concat(pool); roster = roster.slice(0, 3); ran = -1; draw();
    }));

    var panes = el("div", "vs");
    var runout = el("div");
    runout.style.marginTop = "1rem";
    var timer = null;

    function tickRun() {
      if (timer) clearInterval(timer);
      draw();
      timer = setInterval(function () {
        ran++;
        if (ran >= roster.length) { clearInterval(timer); timer = null; ran = roster.length; }
        draw();
      }, 700);
    }

    function draw() {
      var ifCode = "def take_turn(char):\n" +
        roster.map(function (r, i) {
          return "    " + (i ? "elif" : "if") + " char.kind == '" + r.cls.toLowerCase() + "':\n" +
            "        " + r.cls.toLowerCase() + "_attack(char)";
        }).join("\n") +
        "\n    else:\n        raise ValueError('unknown kind')\n\n" +
        "for c in party:\n    take_turn(c)";

      var polyCode = "class GameCharacter:\n" +
        "    def attack(self):\n" +
        "        raise NotImplementedError\n\n" +
        roster.map(function (r) {
          return "class " + r.cls + "(GameCharacter):\n    def attack(self):\n        ...  # " + r.act;
        }).join("\n\n") +
        "\n\nfor c in party:\n    c.attack()       # never changes";

      panes.innerHTML = "";
      var L = side("bad", "✗ if / elif on a type tag", ifCode);
      var R = side("good", "✓ override attack() and call it", polyCode);
      var ln = el("div", "vs-note");
      ln.innerHTML = "<b>" + (roster.length * 2 + 2) + " lines</b> in <code>take_turn</code>, and it must be <b>edited</b> for every new class. " +
        "The same chain reappears in <code>move()</code>, <code>use_skill()</code>, <code>draw()</code>…";
      L.appendChild(ln);
      var rn = el("div", "vs-note");
      rn.innerHTML = "The loop is <b>2 lines</b> and has not changed since the first class. " +
        "A new character type is a new file — <b>nothing existing is touched</b> (Open–Closed).";
      R.appendChild(rn);
      panes.appendChild(L); panes.appendChild(R);

      runout.innerHTML = "";
      if (ran >= 0) {
        var lines = ['>> for c in party: c.attack()'];
        roster.forEach(function (r, i) {
          if (i < ran) lines.push("##" + r.cls.padEnd(9) + "→ " + r.act + "   (" + r.res + ")");
          else if (i === ran) lines.push("   " + r.cls.padEnd(9) + "→ dispatching…");
        });
        if (ran >= roster.length) {
          lines.push("");
          lines.push(">> same loop, " + roster.length + " different methods ran. That is polymorphism.");
        }
        runout.appendChild(term(lines));
      }

      var n = el("div", "note note-why");
      n.style.marginTop = "1rem";
      n.innerHTML = "<b>Polymorphism needs inheritance.</b> The loop can write <code>c.attack()</code> only because every " +
        "character <i>is-a</i> <code>GameCharacter</code> and promises that method. Shared interface first, different bodies second.";
      runout.appendChild(n);
    }

    body.appendChild(controls); body.appendChild(panes); body.appendChild(runout);
    draw();
  };

  /* ==========================================================
     7. Abstract base class — the promise Python enforces
     ========================================================== */
  VIZ["abc"] = function (host) {
    var body = frame(host, "What an abstract base class buys you", "week 6");
    var mode = "missing";

    var seg = el("div", "seg");
    [["missing", "Subclass forgot play()"], ["complete", "Subclass implements play()"], ["direct", "Instantiate Media itself"]]
      .forEach(function (p) {
        var b = el("button", null, p[1]); b.type = "button";
        b.setAttribute("data-k", p[0]);
        b.addEventListener("click", function () { mode = p[0]; draw(); });
        seg.appendChild(b);
      });

    var out = el("div");
    out.style.marginTop = "1rem";

    function draw() {
      $$("button", seg).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-k") === mode ? "true" : "false"); });
      out.innerHTML = "";

      var base = "from abc import ABC, abstractmethod\n\n" +
        "class Media(ABC):\n" +
        "    def __init__(self, filename):\n" +
        "        self.filename = filename\n\n" +
        "    @abstractmethod\n" +
        "    def play(self):\n" +
        "        ...\n\n";
      var tail, res;

      if (mode === "missing") {
        tail = "class FlacFile(Media):\n    def decode(self):\n        ...     # play() never written\n\nf = FlacFile('song.flac')";
        res = term([">> f = FlacFile('song.flac')",
          "!!TypeError: Can't instantiate abstract class FlacFile",
          "!!  with abstract method play",
          "",
          ">> caught the moment you create the object — not three weeks later in the player loop"]);
      } else if (mode === "complete") {
        tail = "class FlacFile(Media):\n    def play(self):\n        print('decoding FLAC…')\n\nf = FlacFile('song.flac')\nf.play()";
        res = term([">> f = FlacFile('song.flac')", ">> f.play()", "##decoding FLAC…",
          "", ">> the promise is kept, so the player can hold any Media and call play()"]);
      } else {
        tail = "m = Media('mystery.bin')\nm.play()";
        res = term([">> m = Media('mystery.bin')",
          "!!TypeError: Can't instantiate abstract class Media with abstract method play",
          "",
          ">> correct: Media is a prototype, not a thing. There is no such file as “a media”."]);
      }

      var g = el("div", "grid");
      g.style.gridTemplateColumns = "minmax(0,1.15fr) minmax(0,1fr)";
      g.appendChild(pre(base + tail));
      g.appendChild(res);
      out.appendChild(g);

      var n = el("div", "note " + (mode === "complete" ? "note-good" : "note-why"));
      n.innerHTML = mode === "complete"
        ? "<b>Why it matters.</b> Every subclass is now <i>guaranteed</i> to have <code>play()</code>. " +
          "The player loop needs no <code>hasattr</code> checks and no <code>try/except AttributeError</code>."
        : "<b>Fail early, fail loudly.</b> Without <code>@abstractmethod</code> this class would be created happily and " +
          "explode later with <code>AttributeError: 'FlacFile' object has no attribute 'play'</code> — " +
          "somewhere far from the mistake, probably in front of a user.";
      out.appendChild(n);
    }

    body.appendChild(seg); body.appendChild(out);
    draw();
  };

  /* ==========================================================
     8. MRO & the diamond problem
     ========================================================== */
  VIZ["mro"] = function (host) {
    var body = frame(host, "Who runs first? MRO and the diamond", "week 9");
    var useSuper = true;

    var seg = el("div", "seg");
    [["super", "super().call_me()"], ["explicit", "BaseClass.call_me(self)"]].forEach(function (p) {
      var b = el("button", null, p[1]); b.type = "button"; b.setAttribute("data-k", p[0]);
      b.addEventListener("click", function () { useSuper = p[0] === "super"; draw(); });
      seg.appendChild(b);
    });

    var fig = el("figure", "figframe");
    fig.innerHTML =
      '<svg viewBox="0 0 420 230" role="img" aria-label="Diamond inheritance: Subclass inherits from Left and Right, both inherit from BaseClass">' +
      '<g font-size="12" text-anchor="middle">' +
      '<rect x="150" y="6"  width="120" height="34" rx="4" class="svg-surf"/><text x="210" y="28" class="svg-ink">BaseClass</text>' +
      '<rect x="30"  y="92" width="120" height="34" rx="4" class="svg-surf"/><text x="90"  y="114" class="svg-ink">LeftSubclass</text>' +
      '<rect x="270" y="92" width="120" height="34" rx="4" class="svg-surf"/><text x="330" y="114" class="svg-ink">RightSubclass</text>' +
      '<rect x="150" y="186" width="120" height="34" rx="4" class="svg-surf"/><text x="210" y="208" class="svg-ink">Subclass</text>' +
      '<path d="M90 92 L185 46"  class="svg-line"/><path d="M185 46 l-10 2 l4 -9z" class="svg-ink2" stroke="none"/>' +
      '<path d="M330 92 L235 46" class="svg-line"/><path d="M235 46 l10 2 l-4 -9z" class="svg-ink2" stroke="none"/>' +
      '<path d="M185 186 L95 132" class="svg-line"/><path d="M95 132 l10 2 l-3 -9z" class="svg-ink2" stroke="none"/>' +
      '<path d="M235 186 L325 132" class="svg-line"/><path d="M325 132 l-10 2 l3 -9z" class="svg-ink2" stroke="none"/>' +
      "</g></svg>";
    fig.appendChild((function () { var c = el("figcaption"); c.innerHTML = "Two parents, one shared grandparent — the <b>diamond</b>."; return c; })());

    var out = el("div");

    function draw() {
      $$("button", seg).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-k") === (useSuper ? "super" : "explicit") ? "true" : "false"); });
      out.innerHTML = "";

      var code = "class BaseClass:\n" +
        "    num_base_calls = 0\n" +
        "    def call_me(self):\n" +
        "        print('BaseClass.call_me')\n" +
        "        BaseClass.num_base_calls += 1\n\n" +
        (useSuper
          ? "class LeftSubclass(BaseClass):\n    def call_me(self):\n        super().call_me()\n        print('LeftSubclass.call_me')\n\n" +
            "class RightSubclass(BaseClass):\n    def call_me(self):\n        super().call_me()\n        print('RightSubclass.call_me')\n\n" +
            "class Subclass(LeftSubclass, RightSubclass):\n    def call_me(self):\n        super().call_me()\n        print('Subclass.call_me')"
          : "class LeftSubclass(BaseClass):\n    def call_me(self):\n        BaseClass.call_me(self)\n        print('LeftSubclass.call_me')\n\n" +
            "class RightSubclass(BaseClass):\n    def call_me(self):\n        BaseClass.call_me(self)\n        print('RightSubclass.call_me')\n\n" +
            "class Subclass(LeftSubclass, RightSubclass):\n    def call_me(self):\n        LeftSubclass.call_me(self)\n        RightSubclass.call_me(self)\n        print('Subclass.call_me')") +
        "\n\nSubclass().call_me()\nprint(BaseClass.num_base_calls)";

      var trace = useSuper
        ? [">> Subclass().call_me()",
           "##BaseClass.call_me",
           "##RightSubclass.call_me",
           "##LeftSubclass.call_me",
           "##Subclass.call_me",
           ">> print(BaseClass.num_base_calls)",
           "##1          ← the base ran ONCE"]
        : [">> Subclass().call_me()",
           "##BaseClass.call_me",
           "##LeftSubclass.call_me",
           "!!BaseClass.call_me      ← again!",
           "##RightSubclass.call_me",
           "##Subclass.call_me",
           ">> print(BaseClass.num_base_calls)",
           "!!2          ← the base ran TWICE"];

      var g = el("div", "grid");
      g.style.gridTemplateColumns = "minmax(0,1.1fr) minmax(0,1fr)";
      g.appendChild(pre(code));
      var r = el("div");
      r.appendChild(term(trace));
      var mroBox = el("div", "card");
      mroBox.style.marginTop = ".7rem";
      mroBox.innerHTML = "<p class='studio-sect' style='margin:0 0 .4rem'>Subclass.__mro__</p>" +
        "<p style='margin:0;font-family:var(--mono);font-size:.78rem;line-height:1.9'>" +
        "<code>Subclass</code> → <code>LeftSubclass</code> → <code>RightSubclass</code> → <code>BaseClass</code> → <code>object</code></p>" +
        "<p class='lab-hint' style='margin:.5rem 0 0'>Python linearises the diamond: depth-first, left to right, " +
        "but a shared ancestor is pushed to the <b>back</b> so it appears only once.</p>";
      r.appendChild(mroBox);
      g.appendChild(r);
      out.appendChild(g);

      var n = el("div", "note " + (useSuper ? "note-good" : "note-trap"));
      n.innerHTML = useSuper
        ? "<b>super() follows the MRO, not the class you wrote it in.</b> Look at the order: " +
          "<code>LeftSubclass.super()</code> did not go to <code>BaseClass</code> — it went to <code>RightSubclass</code>, " +
          "because that is what comes next in <i>Subclass</i>'s MRO. Each class runs exactly once."
        : "<b>Calling by class name walks the tree twice.</b> <code>BaseClass.__init__</code> running two times " +
          "means counters double, lists get two copies of the same item, and connections are opened twice. " +
          "This is the diamond problem, and <code>super()</code> is the fix.";
      out.appendChild(n);

      if (!useSuper) {
        var n2 = el("div", "note note-exam");
        n2.innerHTML = "<b>Exam point.</b> With multiple inheritance, always use <code>super().__init__(**kwargs)</code> " +
          "and have every class accept <code>**kwargs</code>. Mixing explicit class-name calls with <code>super()</code> " +
          "in the same hierarchy is how you get an argument error you cannot read.";
        out.appendChild(n2);
      }
    }

    body.appendChild(seg); body.appendChild(fig); body.appendChild(out);
    draw();
  };

  /* ==========================================================
     9. SOLID — refactor the god class, one principle at a time
     ========================================================== */
  VIZ["solid"] = function (host) {
    var body = frame(host, "Refactor the Order class, one principle at a time", "week 10");

    var stages = [
      {
        tag: "Start", chip: "chip-bad",
        title: "One class does everything",
        code:
          "class Order:\n" +
          "    def __init__(self):\n" +
          "        self.items, self.quantities, self.prices = [], [], []\n" +
          "        self.status = 'open'\n\n" +
          "    def add_item(self, name, qty, price): ...\n\n" +
          "    def total_price(self): ...\n\n" +
          "    def pay(self, payment_type, security_code):\n" +
          "        if payment_type == 'debit':\n" +
          "            ...\n" +
          "        elif payment_type == 'credit':\n" +
          "            ...\n" +
          "        else:\n" +
          "            raise Exception('Unknown payment type')",
        hl: [10, 11, 12, 13, 14, 15, 16],
        why: "<b>Order has three reasons to change:</b> the basket rules, the pricing rules, and the payment rules. " +
             "A change to any one of them risks breaking the other two.",
        breaks: [
          "Adding PromptPay means <b>editing a tested class</b>",
          "You cannot unit-test totalling without dragging payment code along",
          "Two developers touching payments and discounts collide in the same file"
        ]
      },
      {
        tag: "S", chip: "chip-accent",
        title: "Single Responsibility — move payment out",
        code:
          "class Order:\n" +
          "    def add_item(self, name, qty, price): ...\n" +
          "    def total_price(self): ...\n\n" +
          "class PaymentProcessor:\n" +
          "    def pay_debit(self, order, security_code): ...\n" +
          "    def pay_credit(self, order, security_code): ...",
        hl: [5, 6, 7],
        why: "Order now has <b>one</b> reason to change. Payment has its own. " +
             "“A class should have one and only one reason to change.”",
        breaks: ["Still broken: adding PromptPay means <b>editing PaymentProcessor</b>"]
      },
      {
        tag: "O", chip: "chip-accent",
        title: "Open–Closed — subclass instead of editing",
        code:
          "from abc import ABC, abstractmethod\n\n" +
          "class PaymentProcessor(ABC):\n" +
          "    @abstractmethod\n" +
          "    def pay(self, order, security_code): ...\n\n" +
          "class DebitPaymentProcessor(PaymentProcessor):\n" +
          "    def pay(self, order, security_code): ...\n\n" +
          "class CreditPaymentProcessor(PaymentProcessor):\n" +
          "    def pay(self, order, security_code): ...\n\n" +
          "# new payment type = new class, nothing above is touched\n" +
          "class PromptPayProcessor(PaymentProcessor):\n" +
          "    def pay(self, order, security_code): ...",
        hl: [13, 14, 15],
        why: "<b>Closed for modification, open for extension.</b> PromptPay arrived as a new file. " +
             "Not one existing line changed, so not one existing test can break.",
        breaks: ["Still broken: PromptPay has no security code — it uses a phone number, but the base class demands one"]
      },
      {
        tag: "L", chip: "chip-accent",
        title: "Liskov Substitution — the subclass must honour the contract",
        code:
          "class PaymentProcessor(ABC):\n" +
          "    @abstractmethod\n" +
          "    def pay(self, order): ...        # security_code removed\n\n" +
          "class DebitPaymentProcessor(PaymentProcessor):\n" +
          "    def __init__(self, security_code):\n" +
          "        self.security_code = security_code\n" +
          "    def pay(self, order): ...\n\n" +
          "class PromptPayProcessor(PaymentProcessor):\n" +
          "    def __init__(self, phone):\n" +
          "        self.phone = phone\n" +
          "    def pay(self, order): ...",
        hl: [3, 6, 7, 11, 12],
        why: "Anything a <code>PaymentProcessor</code> is handed must work where the base class works. " +
             "Per-method credentials belong in each subclass's <code>__init__</code>, " +
             "so <code>pay(order)</code> means the same thing everywhere.",
        breaks: ["Still broken: adding SMS auth to the base would force credit cards to implement a method they never use"]
      },
      {
        tag: "I", chip: "chip-accent",
        title: "Interface Segregation — don't force unused methods",
        code:
          "class PaymentProcessor(ABC):\n" +
          "    @abstractmethod\n" +
          "    def pay(self, order): ...\n\n" +
          "class PaymentProcessorSMS(PaymentProcessor):\n" +
          "    @abstractmethod\n" +
          "    def auth_sms(self, code): ...\n\n" +
          "class CreditPaymentProcessor(PaymentProcessor):      # no SMS\n" +
          "    def pay(self, order): ...\n\n" +
          "class DebitPaymentProcessor(PaymentProcessorSMS):    # with SMS\n" +
          "    def auth_sms(self, code): ...\n" +
          "    def pay(self, order): ...",
        hl: [5, 6, 7, 9],
        why: "Credit cards no longer have to write <code>auth_sms()</code> only to <code>raise Exception</code> inside it. " +
             "Split the interface so every class implements only what it really does.",
        breaks: ["Workable, but the hierarchy grows a branch for every combination of features"]
      },
      {
        tag: "D", chip: "chip-ok",
        title: "Dependency Inversion — inject the collaborator",
        code:
          "class SMSAuthorizer:\n" +
          "    def __init__(self): self.authorized = False\n" +
          "    def verify_code(self, code): self.authorized = True\n" +
          "    def is_authorized(self): return self.authorized\n\n" +
          "class DebitPaymentProcessor(PaymentProcessor):\n" +
          "    def __init__(self, security_code, authorizer: SMSAuthorizer):\n" +
          "        self.security_code = security_code\n" +
          "        self.authorizer = authorizer       # handed in, not built here\n" +
          "    def pay(self, order):\n" +
          "        if not self.authorizer.is_authorized():\n" +
          "            raise Exception('Not authorized')\n" +
          "        ...",
        hl: [7, 8, 9],
        why: "The processor no longer <i>creates</i> its authoriser, so it does not depend on which one. " +
             "Swap in a <code>RobotAuthorizer</code>, an <code>EmailAuthorizer</code>, or a fake for testing — " +
             "composition replaces a branch of the inheritance tree.",
        breaks: []
      }
    ];

    var bar = el("div", "stepbar");
    bar.innerHTML =
      '<button class="btn btn-s" data-step-prev>‹ Back</button>' +
      '<button class="btn btn-s btn-primary" data-step-next>Next principle ›</button>' +
      '<button class="btn btn-s btn-ghost" data-step-reset>↺</button>' +
      '<span class="stepcount" data-step-count></span>';
    var dots = el("div", "pill-row");
    var g = el("div", "grid");
    g.style.gridTemplateColumns = "minmax(0,1.1fr) minmax(0,1fr)";
    var codeCol = el("div"), noteCol = el("div");
    g.appendChild(codeCol); g.appendChild(noteCol);

    body.appendChild(bar); body.appendChild(dots); body.appendChild(g);

    OOP.stepper(host, {
      steps: stages.length, autoMs: 3200,
      render: function (i) {
        var s = stages[i];
        dots.innerHTML = "";
        stages.forEach(function (x, j) {
          var c = el("span", "chip " + (j === i ? x.chip : ""), x.tag);
          if (j !== i) c.style.opacity = ".45";
          dots.appendChild(c);
        });
        codeCol.innerHTML = "";
        var p = pre(s.code);
        p.setAttribute("data-hl", s.hl.join(","));
        var code = $("code", p);
        var lines = OOP.highlightPython(s.code).split("\n");
        var hl = {}; s.hl.forEach(function (n) { hl[n] = 1; });
        code.innerHTML = lines.map(function (ln, k) {
          return hl[k + 1] ? '<span class="hl">' + (ln || " ") + "</span>" : ln;
        }).join("\n");
        codeCol.appendChild(p);

        noteCol.innerHTML = "";
        var h = el("h4", null, s.title);
        h.style.marginTop = "0";
        noteCol.appendChild(h);
        var w = el("p", "muted");
        w.innerHTML = s.why;
        noteCol.appendChild(w);
        if (s.breaks.length) {
          var ul = el("ul", "breaks");
          s.breaks.forEach(function (b) { var li = el("li"); li.innerHTML = b; ul.appendChild(li); });
          noteCol.appendChild(ul);
        } else {
          var ok = el("div", "note note-good");
          ok.innerHTML = "<b>All five applied.</b> Order knows about a basket. Each processor knows about one payment method. " +
            "Nothing knows more than it needs to — and a new requirement is a new class, not a risky edit.";
          noteCol.appendChild(ok);
        }
      }
    });
  };

  /* ==========================================================
     10. Decision tool — which feature should I reach for?
     ========================================================== */
  VIZ["chooser"] = function (host) {
    var body = frame(host, "Which OOP feature does this problem need?", "all weeks");
    var intro = el("p", "muted");
    intro.innerHTML = "The commonest design mistake in this course is reaching for inheritance when the answer is composition. " +
      "Answer three questions about your situation.";

    var qs = [
      {
        q: "What is the relationship between the two things?",
        opts: [
          ["isa", "B <b>is a kind of</b> A — a Truck is a Car"],
          ["hasa", "A <b>has a</b> B — a Car has an Engine"],
          ["uses", "A <b>uses</b> B briefly — a Printer prints a Book"],
          ["none", "They just happen to share some fields"]
        ]
      },
      {
        q: "Does B make sense on its own if A is deleted?",
        opts: [["yes", "Yes — it still exists elsewhere"], ["no", "No — it only exists as part of A"], ["na", "Not applicable"]]
      },
      {
        q: "Do several types need to answer the same call differently?",
        opts: [["yes2", "Yes — one loop should drive all of them"], ["no2", "No — only one implementation exists"]]
      }
    ];
    var ans = [null, null, null];

    var wrap = el("div");
    var result = el("div");
    result.style.marginTop = "1rem";

    function draw() {
      wrap.innerHTML = "";
      qs.forEach(function (q, i) {
        var box = el("div");
        box.style.marginBottom = "1rem";
        var h = el("p", "quiz-q");
        h.innerHTML = (i + 1) + ". " + q.q;
        box.appendChild(h);
        var row = el("div", "pill-row");
        q.opts.forEach(function (o) {
          var b = el("button", "quiz-opt", "");
          b.type = "button";
          b.style.width = "auto";
          b.innerHTML = o[1];
          if (ans[i] === o[0]) b.classList.add("correct");
          b.addEventListener("click", function () { ans[i] = o[0]; draw(); });
          row.appendChild(b);
        });
        box.appendChild(row);
        wrap.appendChild(box);
      });
      verdict();
    }

    function verdict() {
      result.innerHTML = "";
      if (ans.indexOf(null) >= 0) {
        result.innerHTML = '<p class="lab-hint">Answer all three to get a recommendation.</p>';
        return;
      }
      var r;
      if (ans[0] === "isa") {
        r = ans[2] === "yes2"
          ? { t: "Inheritance + an abstract base class", c: "chip-ok",
              d: "Declare the shared method <code>@abstractmethod</code> on the parent and override it in each subclass. " +
                 "Your loop then calls one method name on everything. This is the inheritance + polymorphism pair from weeks 5–6.",
              code: "class MenuItem(ABC):\n    @abstractmethod\n    def calculate_price(self): ...\n\nclass Beverage(MenuItem):\n    def calculate_price(self):\n        return self.base + self.size_fee + self.topping_fee" }
          : { t: "Plain inheritance", c: "chip-ok",
              d: "A subclass that adds specifics to a general parent. Keep the shared fields in the parent so there is one place to change them. " +
                 "Do not add an abstract method yet — you have nothing to vary.",
              code: "class Employee:\n    def __init__(self, emp_id, name): ...\n\nclass Manager(Employee):\n    def __init__(self, emp_id, name, team_size):\n        super().__init__(emp_id, name)\n        self.__team_size = team_size" };
      } else if (ans[0] === "hasa") {
        r = ans[1] === "no"
          ? { t: "Composition — filled diamond ◆", c: "chip-ok",
              d: "A owns B and is responsible for creating and destroying it. In the class diagram use a <b>solid</b> diamond at A. " +
                 "In code, A builds B inside its own <code>__init__</code>.",
              code: "class Account:\n    def __init__(self, number):\n        self.__number = number\n        self.__transactions = []   # born and dies with the account\n\n    def deposit(self, amount):\n        self.__transactions.append(Transaction('D', amount))" }
          : { t: "Aggregation — hollow diamond ◇", c: "chip-ok",
              d: "A holds a reference to a B that lives its own life. Use a <b>hollow</b> diamond. " +
                 "A must not delete B when A goes away.",
              code: "class Playlist:\n    def __init__(self, name):\n        self.__name = name\n        self.__songs = []        # songs exist without this playlist\n\n    def add_song(self, song):\n        self.__songs.append(song)" };
      } else if (ans[0] === "uses") {
        r = { t: "Dependency — dashed arrow ⇢", c: "chip-vio",
              d: "Pass B in as a <b>parameter</b> and do not store it. In the diagram this is a dashed arrow, not a solid line. " +
                 "This is exactly the ATM–ATMCard case in Lab 3.",
              code: "class ATM:\n    def __init__(self, atm_id, cash):\n        self.__atm_id = atm_id\n        self.__cash = cash       # the only state it owns\n\n    def withdraw(self, card, amount):   # card arrives, is used, is forgotten\n        return card.account().withdraw(amount)" };
      } else {
        r = ans[2] === "yes2"
          ? { t: "A mixin, or a shared interface — not inheritance", c: "chip-vio",
              d: "Shared <i>fields</i> are not an is-a relationship. If you only need to graft behaviour onto some classes, " +
                 "write a mixin and list it among the bases. Keep the real hierarchy meaningful.",
              code: "class DictMixin:\n    def to_dict(self):\n        return dict(self.__dict__)\n\nclass Employee(DictMixin, Person):\n    ...      # Employee is-a Person; DictMixin only lends a method" }
          : { t: "Don't use inheritance here", c: "chip-bad",
              d: "Coincidental overlap is the classic bad reason to inherit. You will be forced to pull unrelated " +
                 "fields up into a parent that means nothing, and every subclass will carry data it does not use " +
                 "(that is the Interface Segregation smell). Keep the classes separate, or extract a small shared value object.",
              code: "# Payslip is NOT an Employee, however many fields they share.\nclass Payslip:\n    def __init__(self, employee, month, gross):\n        self.__employee = employee   # association, not inheritance\n        self.__month = month\n        self.__gross = gross" };
      }

      var card = el("div", "panel");
      card.style.margin = "0";
      card.innerHTML = '<p class="panel-title">Recommendation</p>' +
        '<p style="margin:0 0 .6rem"><span class="chip ' + r.c + '">' + r.t + "</span></p>" +
        "<p>" + r.d + "</p>";
      card.appendChild(pre(r.code));
      result.appendChild(card);
    }

    body.appendChild(intro); body.appendChild(wrap); body.appendChild(result);
    draw();
  };

  /* ==========================================================
     11. Property / getter-setter trace
     ========================================================== */
  VIZ["property"] = function (host) {
    var body = frame(host, "@property — attribute syntax, method safety", "week 3");
    var code =
      "class Dog:\n" +
      "    def __init__(self, age):\n" +
      "        self.age = age          # goes through the setter!\n" +
      "\n" +
      "    @property\n" +
      "    def age(self):\n" +
      "        return self.__age\n" +
      "\n" +
      "    @age.setter\n" +
      "    def age(self, new_age):\n" +
      "        if isinstance(new_age, int) and 0 < new_age < 30:\n" +
      "            self.__age = new_age\n" +
      "        else:\n" +
      "            raise ValueError('invalid age')\n" +
      "\n" +
      "d = Dog(8)\n" +
      "print(d.age)      # reads  -> getter runs\n" +
      "d.age += 1        # writes -> getter, then setter\n" +
      "d.age = 99        # rejected";

    var steps = [
      { l: [16, 2, 3], n: "<code>Dog(8)</code> → <code>__init__</code> assigns <code>self.age = 8</code>. " +
        "Because <code>age</code> is a property, this is <b>not</b> a plain assignment — it calls the setter, so even the constructor is validated.", v: "8" },
      { l: [10, 11, 12], n: "Inside the setter: <code>8</code> is an int and <code>0 &lt; 8 &lt; 30</code>, so the real attribute " +
        "<code>self.__age</code> is written. Note the name is different — the property is <code>age</code>, the storage is <code>__age</code>.", v: "8" },
      { l: [17, 5, 6, 7], n: "<code>print(d.age)</code> looks like reading an attribute. Python sees a property and runs the " +
        "<b>getter</b>, which returns <code>self.__age</code>. No parentheses, no <code>get_age()</code> — this is the payoff.", v: "8" },
      { l: [18], n: "<code>d.age += 1</code> is read-then-write: the <b>getter</b> gives 8, Python adds 1, then the " +
        "<b>setter</b> validates 9 and stores it. One line, two property calls.", v: "9" },
      { l: [19, 13, 14], n: "<code>d.age = 99</code> fails <code>0 &lt; 99 &lt; 30</code>, so the setter raises. " +
        "<code>__age</code> stays 9. <b>The object was never allowed into an invalid state.</b>", v: "9", bad: true }
    ];

    var g = el("div", "grid");
    g.style.gridTemplateColumns = "minmax(0,1.2fr) minmax(0,.8fr)";
    var preEl = pre(code);
    var right = el("div");
    g.appendChild(preEl); g.appendChild(right);

    var bar = el("div", "stepbar");
    bar.style.marginTop = "1rem";
    bar.innerHTML = '<button class="btn btn-s" data-step-prev>‹ Back</button>' +
      '<button class="btn btn-s btn-primary" data-step-next>Step ›</button>' +
      '<button class="btn btn-s btn-ghost" data-step-play>▶ Play</button>' +
      '<span class="stepcount" data-step-count></span>';
    var narr = el("div", "narrate");

    body.appendChild(g); body.appendChild(bar); body.appendChild(narr);

    OOP.stepper(host, {
      steps: steps.length, autoMs: 2400,
      render: function (i) {
        var s = steps[i];
        OOP.spotlight(preEl, s.l);
        right.innerHTML = "";
        var box = el("div", "objbox");
        box.innerHTML = '<div class="objbox-head"><span class="cls">Dog</span><span class="adr">0x3b1</span></div>' +
          '<div class="objbox-row' + (s.bad ? "" : " changed") + '"><span class="k">🔒 _Dog__age</span><span class="v">' + s.v + "</span></div>";
        right.appendChild(box);
        var note = el("div", "card");
        note.style.marginTop = ".7rem";
        note.innerHTML = s.bad
          ? '<span class="chip chip-bad">ValueError raised</span><p class="lab-hint" style="margin:.5rem 0 0">state unchanged</p>'
          : '<span class="chip chip-ok">valid state</span><p class="lab-hint" style="margin:.5rem 0 0">0 &lt; age &lt; 30 holds</p>';
        right.appendChild(note);
        narr.innerHTML = s.n;
      }
    });
  };

  /* ---------- boot ---------- */
  document.addEventListener("oop:ready", function () {
    $$("[data-viz]").forEach(function (host) {
      var name = host.getAttribute("data-viz");
      if (VIZ[name]) {
        try { VIZ[name](host); }
        catch (e) { console.error("viz " + name + " failed", e); host.innerHTML = '<p class="lab-hint">This interactive failed to load.</p>'; }
      } else console.warn("Unknown viz:", name);
    });
  });
  OOP.VIZ = VIZ;
})();
