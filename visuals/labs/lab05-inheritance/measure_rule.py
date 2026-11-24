# ---------------------------------------------------------------------------
# Lab 05 · part 2 — the SILENT failure.
#
# Adding a field breaks loudly (measure.py: TypeError at the call site).
# Tightening a shared RULE does not. Same generator shape, but the shared thing
# is a validating setter, as in chapter 3. Measured by executing both variants.
#
#   python measure_rule.py     -> measured_rule.json
# ---------------------------------------------------------------------------
import ast, json, pathlib, platform

NAMES = ["Manager", "Engineer", "Intern", "Designer", "Analyst", "Sales", "Support", "Director"]

SETTER_OLD = ('    def set_email(self, v):\n'
              '        if "@" not in v:\n'
              '            raise ValueError("email must contain @")\n'
              '        self._email = v')
# the rule tightens: addresses are stored lower-case so lookups match
SETTER_NEW = ('    def set_email(self, v):\n'
              '        if "@" not in v:\n'
              '            raise ValueError("email must contain @")\n'
              '        self._email = v.lower()')

def dup(n, setter, skip_last=False):
    out = []
    for i, name in enumerate(NAMES[:n]):
        s = SETTER_OLD if (skip_last and i == n - 1) else setter
        out.append(f"class {name}:\n    def __init__(self, email):\n        self.set_email(email)\n{s}")
    return "\n\n".join(out) + "\n"

def inh(n, setter, skip_last=False):
    base = f"class Employee:\n    def __init__(self, email):\n        self.set_email(email)\n{setter}"
    subs = "\n\n".join(f"class {name}(Employee):\n    pass" for name in NAMES[:n])
    return base + "\n\n" + subs + "\n"

def probe(src, n):
    """Store a mixed-case address in every subtype; report what each one kept."""
    ns = {}
    exec(compile(src, "<generated>", "exec"), ns)
    normalised, kept_raw, raised = [], [], []
    for name in NAMES[:n]:
        try:
            obj = ns[name]("Boss@KMITL.AC.TH")
            (normalised if obj._email == "boss@kmitl.ac.th" else kept_raw).append(name)
        except Exception as e:
            raised.append(f"{name}: {type(e).__name__}")
    return {"normalised": normalised, "kept_raw": kept_raw, "raised": raised}

out = {"rule": "a shared validating setter is tightened (store the address lower-case)",
       "python": platform.python_version(), "rows": []}
for n in range(2, 9):
    edited_dup = [c.name for c in ast.parse(dup(n, SETTER_NEW)).body]      # every class changed
    out["rows"].append({
        "subtypes": n,
        "edits_dup": len(edited_dup), "edits_inh": 1,
        "dup_all_updated": probe(dup(n, SETTER_NEW), n),
        "dup_missed_one": probe(dup(n, SETTER_NEW, skip_last=True), n),
        "inh_one_edit": probe(inh(n, SETTER_NEW), n),
    })
pathlib.Path("measured_rule.json").write_text(json.dumps(out, indent=1), encoding="utf8")

for r in out["rows"]:
    m = r["dup_missed_one"]
    print(f"N={r['subtypes']}  copy-paste, {r['edits_dup']-1} of {r['edits_dup']} classes updated -> "
          f"{len(m['normalised'])} normalised, {len(m['kept_raw'])} kept raw, "
          f"{len(m['raised'])} raised  | inheritance: 1 edit -> "
          f"{len(r['inh_one_edit']['normalised'])}/{r['subtypes']} normalised")
last = out["rows"][-1]["dup_missed_one"]
print("\nN=8, the class nobody updated:", last["kept_raw"], "still stores 'Boss@KMITL.AC.TH'")
print("exceptions raised:", last["raised"] or "none - nothing complained")
