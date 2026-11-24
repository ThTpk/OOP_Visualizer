# ---------------------------------------------------------------------------
# Lab 10 · SOLID — where every number in this lab comes from.
#
# The six versions of the Order example live in stages.py, as real runnable
# Python following the refactor the chapter walks through in 10.2-10.7.
# Nothing here is estimated. Each number is counted from the code or produced
# by running it:
#
#   reasons      the chapter's own SRP test ("list the reasons this class might
#                need editing"), done mechanically: apply three independent
#                changes and count how many of them modify each class.
#   opened       the blast radius of adding PromptPay: pre-existing classes
#                whose source the change alters, and how many of their lines.
#   required     the most abstract methods any one concrete class is forced to
#                implement (interface segregation).
#   injected     whether a processor is handed its collaborator or makes one.
#   runs         both versions are executed; the totals are compared.
#
#   python measure.py      -> measured.json
# ---------------------------------------------------------------------------
import ast, difflib, io, json, platform, pathlib, tokenize
from stages import STAGES, change_basket, change_pricing, change_payment


def classes(src):
    """{class name: its exact source segment}"""
    tree = ast.parse(src)
    return {n.name: ast.get_source_segment(src, n)
            for n in tree.body if isinstance(n, ast.ClassDef)}


def loc(src):
    """non-blank, non-comment lines that carry code"""
    live = set()
    for tok in tokenize.generate_tokens(io.StringIO(src).readline):
        if tok.type in (tokenize.NL, tokenize.NEWLINE, tokenize.COMMENT,
                        tokenize.INDENT, tokenize.DEDENT, tokenize.ENDMARKER):
            continue
        live.add(tok.start[0])
    return len(live)


def touched(before, after):
    """classes that existed before and whose source the change altered"""
    a, b = classes(before), classes(after)
    return sorted(k for k in a if k in b and a[k] != b[k])


def opened_lines(before, after):
    """lines written INSIDE a class that already existed and was already tested.
    Appending a brand-new class at the end of the file counts as zero."""
    a, b = classes(before), classes(after)
    n = 0
    for k in a:
        if k not in b or a[k] == b[k]:
            continue
        sm = difflib.SequenceMatcher(None, a[k].splitlines(), b[k].splitlines())
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "insert":
                n += j2 - j1
            elif tag in ("replace", "delete"):
                n += max(i2 - i1, j2 - j1)
    return n


def abstract_methods(src):
    """{class: set of methods marked @abstractmethod}"""
    out = {}
    for n in ast.parse(src).body:
        if not isinstance(n, ast.ClassDef):
            continue
        out[n.name] = {m.name for m in n.body
                       if isinstance(m, ast.FunctionDef)
                       and any(getattr(d, "id", "") == "abstractmethod" for d in m.decorator_list)}
    return out


def required_by_class(src):
    """abstract methods each concrete class is forced to implement"""
    tree = ast.parse(src)
    absm = abstract_methods(src)
    bases = {n.name: [b.id for b in n.bases if isinstance(b, ast.Name)]
             for n in tree.body if isinstance(n, ast.ClassDef)}
    out = {}
    for name, parents in bases.items():
        if absm.get(name):           # itself abstract, not a concrete class
            continue
        need, seen, stack = set(), set(), list(parents)
        while stack:                 # walk up the chain
            p = stack.pop()
            if p in seen:
                continue
            seen.add(p)
            need |= absm.get(p, set())
            stack += bases.get(p, [])
        out[name] = len(need)
    return out


def forced_params(src):
    """parameters the abstract pay() demands of every processor, beyond (self, order)"""
    for n in ast.parse(src).body:
        if not isinstance(n, ast.ClassDef) or n.name != "PaymentProcessor":
            continue
        for m in n.body:
            if isinstance(m, ast.FunctionDef) and m.name == "pay":
                return max(0, len(m.args.args) - 2)
        # the pre-abstract version names its methods pay_debit / pay_credit
        return 0
    return 0


def injected(src):
    """True when a processor uses a collaborator it was handed in __init__"""
    for n in ast.parse(src).body:
        if not isinstance(n, ast.ClassDef) or "Processor" not in n.name:
            continue
        init = next((m for m in n.body if isinstance(m, ast.FunctionDef) and m.name == "__init__"), None)
        if not init:
            continue
        params = {a.arg for a in init.args.args[1:]}
        for sub in ast.walk(n):      # self.<param>.<something>() anywhere in the class
            if (isinstance(sub, ast.Call) and isinstance(sub.func, ast.Attribute)
                    and isinstance(sub.func.value, ast.Attribute)
                    and sub.func.value.attr in params):
                return True
    return False


def run_order(src):
    """execute the stage and total a basket, so the measurement is of working code"""
    ns = {}
    exec(compile(src, "<stage>", "exec"), ns)       # generated here, not user input
    o = ns["Order"]()
    o.add_item("Keyboard", 1, 500)
    o.add_item("SSD", 1, 800)
    return o.total_price()


out = {"source": "stages.py, following chapters/10-solid.html 10.2-10.7",
       "python": platform.python_version(),
       "changes": ["basket rule: no duplicate items",
                   "pricing rule: 10% off over 1000",
                   "payment rule: add PromptPay, which authenticates by phone"],
       "rows": []}

for tag, src in STAGES:
    variants = [change_basket(src), change_pricing(src), change_payment(src, tag)]
    # the chapter's SRP test, counted: how many of the three changes touch each class
    hits = {}
    for v in variants:
        for c in touched(src, v):
            hits[c] = hits.get(c, 0) + 1
    pay = variants[2]
    # the counterfactual for interface segregation: one fat interface instead of
    # a split one, i.e. auth_sms declared on the base every processor inherits
    fat = (src.replace("""class PaymentProcessorSMS(PaymentProcessor):
    @abstractmethod
    def auth_sms(self, code):
        ...


""", "")
              .replace("""    @abstractmethod
    def pay(self, order):
        ...""", """    @abstractmethod
    def pay(self, order):
        ...

    @abstractmethod
    def auth_sms(self, code):
        ...""")
              .replace("(PaymentProcessorSMS)", "(PaymentProcessor)")) if tag == "I" else None
    out["rows"].append({
        "stage": tag,
        "classes": len(classes(src)),
        "loc": loc(src),
        "loc_by_class": {k: loc(v) for k, v in classes(src).items()},
        "reasons_max": max(hits.values()) if hits else 0,
        "reasons_by_class": hits,
        "opened_classes": touched(src, pay),
        "opened_lines": opened_lines(src, pay),
        "required_by_class": required_by_class(src),
        "forced_params": forced_params(src),
        "required_if_one_fat_interface": required_by_class(fat) if fat else None,
        "injected": injected(src),
        "total_before": run_order(src),
        "total_after_payment_change": run_order(pay),
    })

pathlib.Path("measured.json").write_text(json.dumps(out, indent=1), encoding="utf8")

print(f"{'stage':6} {'classes':>7} {'loc':>4} {'reasons':>8} {'opened':>7} {'lines':>6} {'forced':>6} {'inject':>7}")
for r in out["rows"]:
    print(f"{r['stage']:6} {r['classes']:7} {r['loc']:4} {r['reasons_max']:8} "
          f"{len(r['opened_classes']):7} {r['opened_lines']:6} {r['forced_params']:4} {str(r['injected']):>7}")
print("\nreasons to change, per class, per stage:")
for r in out["rows"]:
    print(" ", r["stage"].ljust(6), r["reasons_by_class"])
print("\nadding PromptPay opens:")
for r in out["rows"]:
    print(" ", r["stage"].ljust(6), r["opened_classes"] or "nothing — it is a new class only")
totals = {r["total_before"] for r in out["rows"]} | {r["total_after_payment_change"] for r in out["rows"]}
print("\nevery stage totals the same basket:", totals)
