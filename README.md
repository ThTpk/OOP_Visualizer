# OOP Visualizer

An interactive course website for **01276131 Object-Oriented Programming**, Department of Computer
Engineering, KMITL — written in English for the international programme.

The site follows the ten-week lecture plan. Every chapter is built the same way: first a program is
broken *without* the principle, then fixed *with* it, so students learn what skipping it actually costs.

**Live site:** https://thtpk.github.io/OOP_Visualizer/ *(after enabling Pages — see below)*

---

## What's in it

| | |
|---|---|
| **10 chapters** | One per teaching week, from "why objects exist" to the SOLID principles |
| **11 interactive explainers** | Memory diagrams, a GPA corrupter, an MRO diamond toggle, a SOLID refactor stepper, a "which feature should I use?" decision tool |
| **10 auto-marked diagram exercises** | Drag-and-drop UML editor that checks multiplicities, tells aggregation from composition, and explains every mistake |
| **A sequence-diagram player and builder** | Step through worked examples, then build and check your own |
| **A Python playground** | Real CPython via Pyodide, preloaded with the lab skeletons |
| **Lab briefs and a revision sheet** | The five weekly labs with their test cases, plus a one-page quick reference |

Content is derived from the course lecture slides and lab briefs. Where this site differs from the
slides, the slides are the material of record.

---

## Enabling GitHub Pages

The site is served straight from the `docs/` folder — no build step, no Actions workflow.

1. Go to **Settings → Pages**
2. Under *Build and deployment* → *Source*, choose **Deploy from a branch**
3. Branch: **`main`**, folder: **`/docs`**
4. Save. The site appears at `https://thtpk.github.io/OOP_Visualizer/` within a minute or two.

---

## Running it locally

Any static file server works. The repo ships with a launch config for the Claude Code browser pane:

```bash
python -m http.server 4173 --directory docs
```

Then open http://localhost:4173.

> The pages also work by double-clicking `docs/index.html` — everything uses classic scripts and
> relative paths, so there is no `file://` module problem. The only exception is the Python
> playground, which downloads its runtime from a CDN and therefore needs a network connection.

---

## Repository layout

```
docs/                        ← the published site
├── index.html               home
├── syllabus.html            teaching plan, assessment, assignment briefs
├── reference.html           one-page revision sheet
├── chapters/                01 … 10, one per week
├── studio/index.html        UML Studio — all diagram exercises
├── labs/index.html          the five weekly lab briefs
├── sandbox/index.html       Python playground (Pyodide)
└── assets/
    ├── css/site.css         the whole design system
    └── js/
        ├── site.js          nav, theme, TOC, quizzes, Python syntax highlighting, step engine
        ├── viz.js           the chapter interactives
        ├── uml.js           drag-and-drop UML editor + auto-grader
        ├── uml-exercises.js the graded diagram tasks   ← edit this to add exercises
        ├── seq.js           sequence diagram renderer, player and builder
        ├── seq-data.js      worked sequences + graded tasks
        └── snippets.js      starter code for the playground
reference/                   lecture slides and lab briefs (not committed — see below)
```

---

## Editing the content

**Prose and figures** live directly in the chapter HTML. Code samples are plain text inside
`<pre><code>` — the syntax highlighter runs at load time, so no `<span>` markup is needed.
Add `data-hl="4,9-12"` to a `<pre>` to highlight lines.

**A new diagram exercise** is one entry in `docs/assets/js/uml-exercises.js`:

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
`docs/studio/index.html` so it appears in the Studio picker. The grader matches names
case-insensitively and ignores punctuation, and `alias` lets you accept reasonable alternatives.

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

**A new playground example** is one entry in `docs/assets/js/snippets.js`; it is then reachable at
`sandbox/index.html?load=your-key`.

---

## Lecture slides

The `reference/` folder (lecture `.pptx` / `.pdf` and the lab `.docx` files, ~50 MB) is **not
committed**. It is the course material of record and publishing it is a separate decision. To
include it, delete the `reference/` line from `.gitignore` and commit.

---

## Notes

- Student work in the diagram editor, the sequence builder and the playground is saved in
  `localStorage`, per browser. Nothing is uploaded anywhere.
- Dark theme by default, with a light toggle; the choice is remembered.
- The whole site is plain HTML, CSS and classic JavaScript. No framework, no bundler, no dependencies
  other than Pyodide on the playground page.
