/* ============================================================
   seq-data.js — worked sequence diagrams (for the step player)
   and graded build-it-yourself tasks.
   ============================================================ */

window.SEQ_MODELS = {

  /* GPA calculation over the registration class diagram */
  "gpa": {
    lifelines: [
      { id: "staff", label: "Staff", kind: "actor" },
      { id: "school", label: ":School" },
      { id: "enr", label: ":Enrollment" },
      { id: "subj", label: ":Subject" }
    ],
    frags: [{ type: "loop", label: "for each enrollment", start: 2, end: 5 }],
    messages: [
      { from: "staff", to: "school", kind: "sync", text: "get_student_gpa(stu)",
        note: "The actor only ever talks to the <b>controller</b>. Staff has no idea the Enrollment class exists — that is <b>low coupling</b>." },
      { from: "school", to: "school", kind: "sync", text: "search_enrollments(stu)",
        note: "A <b>reflexive message</b>: School calls its own method. The arrow starts and ends on the same lifeline." },
      { from: "school", to: "enr", kind: "sync", text: "get_grade()",
        note: "Inside the loop. School asks each Enrollment for its grade — it does not reach into <code>enr.__grade</code>, because that attribute is private." },
      { from: "enr", to: "school", kind: "return", text: "'A'",
        note: "The dashed return line. For a synchronous call the return is implied, so you may leave it out when the diagram gets crowded." },
      { from: "school", to: "subj", kind: "sync", text: "get_credit()",
        note: "Credits live on Subject, not on Enrollment — the <b>information expert</b> principle decides who you ask." },
      { from: "subj", to: "school", kind: "return", text: "3" },
      { from: "school", to: "staff", kind: "return", text: "3.42",
        note: "One activity, one sequence diagram, one answer handed back. Every method you drew here must now appear in the class diagram." }
    ]
  },

  /* ATM withdrawal, with an alt fragment for the failure path */
  "atm-withdraw": {
    lifelines: [
      { id: "cust", label: "Customer", kind: "actor" },
      { id: "atm", label: ":ATM" },
      { id: "card", label: ":ATMCard" },
      { id: "acct", label: ":Account" }
    ],
    frags: [{ type: "alt", label: "balance >= amount", start: 4, end: 7 }],
    messages: [
      { from: "cust", to: "atm", kind: "sync", text: "insert_card(card, pin)",
        note: "The customer touches only the ATM. Everything else is internal." },
      { from: "atm", to: "card", kind: "sync", text: "verify_pin(pin)",
        note: "The ATM does not hold the PIN — it asks the card. That is why ATM–ATMCard is a <b>dependency</b> and not an association." },
      { from: "card", to: "atm", kind: "return", text: "True" },
      { from: "cust", to: "atm", kind: "sync", text: "withdraw(5000)" },
      { from: "atm", to: "acct", kind: "sync", text: "withdraw(5000)",
        note: "The ATM forwards the request. It never edits a balance itself — the Account is the information expert for money." },
      { from: "acct", to: "acct", kind: "sync", text: "record(Transaction)",
        note: "The Account creates and keeps its own Transaction. This is why Account–Transaction is <b>composition</b>." },
      { from: "acct", to: "atm", kind: "return", text: "True" },
      { from: "atm", to: "cust", kind: "return", text: "dispense 5000",
        note: "The alt frame marks the happy path. The second operand — insufficient funds — returns an error here instead." }
    ]
  },

  /* Login, the alt-fragment example from the slides */
  "login-alt": {
    lifelines: [
      { id: "user", label: "User", kind: "actor" },
      { id: "page", label: ":LoginForm" },
      { id: "auth", label: ":AuthService" }
    ],
    frags: [{ type: "alt", label: "fields incomplete / all filled", start: 2, end: 4 }],
    messages: [
      { from: "user", to: "page", kind: "sync", text: "click_login()" },
      { from: "page", to: "page", kind: "sync", text: "validate_fields()",
        note: "Validation is the form's own job, so it is a reflexive message." },
      { from: "page", to: "user", kind: "return", text: "'fill all fields'",
        note: "First operand of the <b>alt</b> fragment: the guard <code>[fields incomplete]</code> holds, so we stop here." },
      { from: "page", to: "auth", kind: "sync", text: "login(user, pw)",
        note: "Second operand: <code>[all fields filled]</code>. Only one operand of an alt ever runs — it is if/else drawn as a box." },
      { from: "auth", to: "page", kind: "return", text: "session" }
    ]
  },

  /* Synchronous vs asynchronous */
  "async": {
    lifelines: [
      { id: "shop", label: ":Checkout" },
      { id: "pay", label: ":PaymentGateway" },
      { id: "mail", label: ":MailQueue" }
    ],
    messages: [
      { from: "shop", to: "pay", kind: "sync", text: "charge(order)",
        note: "<b>Synchronous</b> — filled arrowhead. Checkout blocks: nothing else can happen until the gateway answers." },
      { from: "pay", to: "shop", kind: "return", text: "receipt" },
      { from: "shop", to: "mail", kind: "async", text: "queue_receipt_email()",
        note: "<b>Asynchronous</b> — open arrowhead. Checkout fires and forgets; the customer should not wait for an email to be sent." }
    ]
  }
};

window.SEQ_EXERCISES = {

  "seq-gpa": {
    title: "Build it: calculate a student's GPA",
    lifelines: [
      { id: "staff", label: "Staff", kind: "actor" },
      { id: "school", label: ":School" },
      { id: "enr", label: ":Enrollment" },
      { id: "subj", label: ":Subject" }
    ],
    answer: [
      { from: "staff", to: "school", kind: "sync", text: "get_student_gpa", alias: ["getstudentgpa", "getgpa", "calculategpa", "studentgpa", "gpa"],
        why: "the actor asks the controller, never an Enrollment directly" },
      { from: "school", to: "enr", kind: "sync", text: "get_grade", alias: ["getgrade", "grade"],
        why: "School must ask each Enrollment for its grade" },
      { from: "school", to: "subj", kind: "sync", text: "get_credit", alias: ["getcredit", "credit", "getcredits"],
        why: "credits belong to Subject — ask the information expert" },
      { from: "school", to: "staff", kind: "return", text: "gpa", alias: ["gpa", "result", "3.42"],
        why: "hand the answer back to whoever asked" }
    ],
    forbid: [
      { from: "staff", to: "enr", why: "the actor must not reach past the controller into an Enrollment" },
      { from: "staff", to: "subj", why: "the actor must not reach past the controller into a Subject" }
    ]
  },

  "seq-withdraw": {
    title: "Build it: withdraw cash from an ATM",
    lifelines: [
      { id: "cust", label: "Customer", kind: "actor" },
      { id: "atm", label: ":ATM" },
      { id: "card", label: ":ATMCard" },
      { id: "acct", label: ":Account" }
    ],
    answer: [
      { from: "cust", to: "atm", kind: "sync", text: "insert_card", alias: ["insertcard", "inserted", "card"],
        why: "the customer only ever touches the machine" },
      { from: "atm", to: "card", kind: "sync", text: "verify_pin", alias: ["verifypin", "checkpin", "pin", "validatepin"],
        why: "the ATM holds no PIN; it asks the card" },
      { from: "cust", to: "atm", kind: "sync", text: "withdraw", alias: ["withdraw", "withdrawal", "getcash"] },
      { from: "atm", to: "acct", kind: "sync", text: "withdraw", alias: ["withdraw", "debit", "deduct"],
        why: "the ATM forwards the amount; the Account is the one that owns the balance" },
      { from: "acct", to: "atm", kind: "return", text: "ok", alias: ["true", "ok", "success", "balance", "newbalance"] }
    ],
    forbid: [
      { from: "atm", to: "atm", why: "the ATM has no balance of its own to check — do not give it one" },
      { from: "cust", to: "acct", why: "“Activities with the bank must be done through ATM machines only” (Lab 3)" }
    ]
  }
};
