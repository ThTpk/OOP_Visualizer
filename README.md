# 01276131 — Object-Oriented Programming

**Department of Computer Engineering · Faculty of Engineering · King Mongkut's Institute of Technology Ladkrabang**
International Programme · taught in English

### ▶ **[Open the course site](https://thtpk.github.io/OOP_Visualizer/)**

Ten chapters, one per teaching week. Every chapter is built the same way: first a program is broken
*without* the principle, then fixed *with* it — so you learn not just how encapsulation or
polymorphism works, but what it costs you to skip it.

---

## Course content

| Week | Chapter | What it covers |
|:---:|---|---|
| 1 | **[Introduction](https://thtpk.github.io/OOP_Visualizer/chapters/01-introduction.html)** | Why OOP exists, the four pillars, where each diagram fits in the development process, and when *not* to use OOP |
| 2 | **[Objects, classes and instances](https://thtpk.github.io/OOP_Visualizer/chapters/02-object-and-class.html)** | Blueprint vs thing, `__init__`, `self`, dot notation, objects inside objects |
| 3 | **[Encapsulation and methods](https://thtpk.github.io/OOP_Visualizer/chapters/03-encapsulation.html)** | Public / protected / private, validating setters, methods, `__str__`, closures, decorators, `@property` |
| 4 | **[Class diagrams](https://thtpk.github.io/OOP_Visualizer/chapters/04-class-diagram.html)** | Association, dependency, aggregation, composition, multiplicity, class attributes, and a five-step design method |
| 5 | **[Inheritance](https://thtpk.github.io/OOP_Visualizer/chapters/05-inheritance.html)** | The is-a test, `super()`, method overriding, the Open–Closed Principle |
| 6 | **[Abstraction and polymorphism](https://thtpk.github.io/OOP_Visualizer/chapters/06-polymorphism.html)** | Abstract base classes, duck typing, magic methods, composition over inheritance |
| 7 | **[Use case diagrams](https://thtpk.github.io/OOP_Visualizer/chapters/07-use-case-diagram.html)** | Personas, user stories, domain storytelling, actors, «include» vs «extend» |
| 8 | **[Sequence diagrams](https://thtpk.github.io/OOP_Visualizer/chapters/08-sequence-diagram.html)** | Lifelines, activation bars, sync vs async messages, `alt` / `opt` / `loop` fragments |
| 9 | **[Multiple inheritance and mixins](https://thtpk.github.io/OOP_Visualizer/chapters/09-multiple-inheritance.html)** | MRO, the diamond problem, `**kwargs` across a hierarchy, custom exceptions |
| 10 | **[The SOLID principles](https://thtpk.github.io/OOP_Visualizer/chapters/10-solid.html)** | Five refactors of one god class, each driven by a principle and a concrete failure |
| 11–15 | Mini-projects | Group work and presentations |

## Tools on the site

| | |
|---|---|
| **[UML Studio](https://thtpk.github.io/OOP_Visualizer/studio/)** | Draw class and use case diagrams by dragging, then press **Check**. It marks your multiplicities, tells aggregation from composition, and explains every mistake. 10 exercises taken from the slides and labs, including the Lab 3 ATM diagram. |
| **[Weekly labs](https://thtpk.github.io/OOP_Visualizer/labs/)** | The five lab briefs, the test cases the staff will run, and the standing rules that decide your mark. |
| **[Python playground](https://thtpk.github.io/OOP_Visualizer/sandbox/)** | Real Python 3.12 running in the browser — nothing to install. Preloaded with the lab skeletons and every chapter example. |
| **[Quick reference](https://thtpk.github.io/OOP_Visualizer/reference.html)** | One page for revision: the relationship decision table, syntax, UML notation, SOLID, and a design review checklist. |
| **[Syllabus](https://thtpk.github.io/OOP_Visualizer/syllabus.html)** | Teaching plan, assessment breakdown, and the three assignment briefs. |

## How to use it

1. **Read the "What breaks" box first.** Each chapter opens with a program that works today and will
   hurt you later. If you cannot see the pain, the principle will feel like bureaucracy.
2. **Break the interactives on purpose.** Assign a negative GPA, delete half a list, add a seventh
   subclass. The failure messages are the lesson.
3. **Draw before you code.** Every lab from week 3 onward is marked on the diagram first. Use the
   UML Studio until **Check** comes back all green, then write the class skeletons from it.
4. **Answer the "choose correctly" questions.** Knowing *that* composition exists is worth nothing in
   the exam; knowing *when* to pick it over inheritance is most of the marks.

## Official channels

- **Course site (slides, lab briefs, skeleton code, answer sheets):**
  <https://sites.google.com/kmitl.ac.th/object-oriented-programming/home>
- **Google Classroom:** <https://classroom.google.com> — class *Object Oriented Programming*;
  the join code is in the week 1 slides

This site is a visual companion to the lecture slides. Where the two differ, the slides are the
material of record.

---

<details>
<summary><b>Maintaining this site</b> — layout, local preview, and how to add content</summary>

### Layout

Plain HTML, CSS and classic JavaScript at the repository root. No build step, no bundler, and no
dependencies other than Pyodide on the playground page. GitHub Pages serves it from
**`main` / `(root)`**.

```
index.html              home
syllabus.html           teaching plan, assessment, assignment briefs
reference.html          one-page revision sheet
chapters/               01 … 10, one per week
studio/index.html       UML Studio — all diagram exercises
labs/index.html         the five weekly lab briefs
sandbox/index.html      Python playground (Pyodide)
assets/
├── css/site.css        the whole design system
└── js/
    ├── site.js         nav, theme, TOC, quizzes, Python syntax highlighting, step engine
    ├── viz.js          the chapter interactives
    ├── uml.js          drag-and-drop UML editor + auto-grader
    ├── uml-exercises.js   the graded diagram tasks
    ├── seq.js          sequence diagram renderer, player and builder
    ├── seq-data.js     worked sequences + graded tasks
    └── snippets.js     starter code for the playground
reference/              lecture slides and lab briefs (gitignored — see below)
```

### Previewing locally

```bash
python -m http.server 4173
```

Then open <http://localhost:4173>. The pages also work by double-clicking `index.html`, because
everything uses classic scripts and relative paths — the one exception is the playground, which
downloads its runtime from a CDN and needs a network connection.

### Editing content

**Prose and figures** live directly in the chapter HTML. Code samples are plain text inside
`<pre><code>` — the syntax highlighter runs at load time, so no `<span>` markup is needed. Add
`data-hl="4,9-12"` to a `<pre>` to highlight lines.

**A new diagram exercise** is one entry in `assets/js/uml-exercises.js`:

```js
"my-exercise": {
  mode: "class",                  // or "usecase"
  title: "...",
  brief: "shown in the task panel",
  seed:  [ { name: "Student", x: 60, y: 60, attrs: ["- id: str"] } ],
  nodes: [ { name: "Enrollment", alias: ["Enrol"], attrs: [{ name: "grade" }] } ],
  edges: [ { from: "Enrollment", to: "Student", kind: "assoc",
             fromMult: "0..*", toMult: "1", why: "explained when wrong" } ],
  forbidEdges: [ { from: "Student", to: "Subject", why: "..." } ]
}
```

Then reference it from a page with `data-uml="my-exercise"`, or add it to the `ORDER` list in
`studio/index.html` so it appears in the Studio picker. The grader matches names case-insensitively
and ignores punctuation; `alias` accepts reasonable alternatives.

**A new quiz** needs no JavaScript:

```html
<div class="quiz" data-quiz>
  <p class="quiz-q">Question?</p>
  <ul class="quiz-opts">
    <li><button data-why="why this is wrong">Option A</button></li>
    <li><button data-correct data-why="why this is right">Option B</button></li>
  </ul>
</div>
```

**A new playground example** is one entry in `assets/js/snippets.js`; it is then reachable at
`sandbox/?load=your-key`.

### Lecture slides

The `reference/` folder (lecture `.pptx` / `.pdf` and the lab `.docx` files, ~50 MB) is **not
committed** — publishing the course material is a separate decision. To include it, delete the
`reference/` line from `.gitignore` and commit.

### Notes

- Student work in the diagram editor, the sequence builder and the playground is saved in
  `localStorage`, per browser. Nothing is uploaded anywhere.
- Dark theme by default with a light toggle; the choice is remembered.

</details>
