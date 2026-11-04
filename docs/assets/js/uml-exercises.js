/* ============================================================
   uml-exercises.js — graded diagram tasks.
   Every exercise is drawn from the course slides or the weekly labs,
   so what the grader expects is what the staff expects.
   ============================================================ */
window.UML_EXERCISES = {

  /* ---------------------------------------------------------- *
   * 1. Registration — the running example from weeks 2-4        *
   * ---------------------------------------------------------- */
  "registration": {
    mode: "class",
    title: "Student registration",
    brief: "Four classes. A student enrols in subjects; a teacher teaches a subject. " +
           "The grade belongs to neither the student nor the subject — find the right home for it.",
    seed: [
      { name: "Student", x: 60,  y: 60,  attrs: ["- student_id: str", "- student_name: str"] },
      { name: "Teacher", x: 620, y: 300, attrs: ["- teacher_id: str", "- teacher_name: str"] }
    ],
    nodes: [
      { name: "Student", attrs: [{ name: "student_id" }, { name: "student_name" }] },
      { name: "Subject", attrs: [{ name: "subject_id" }, { name: "subject_name" }, { name: "credit" }],
        why: "every course needs its own class" },
      { name: "Teacher", attrs: [{ name: "teacher_id" }, { name: "teacher_name" }] },
      {
        name: "Enrollment", alias: ["Enroll", "Registration", "Enrolment"],
        why: "a grade is a fact about <i>one student in one subject</i>, so it needs its own class",
        attrs: [{ name: "grade", why: "put the grade here, not in Student or Subject" }],
        notAttrs: [{ name: "credit", why: "credit is a property of the Subject" }]
      }
    ],
    edges: [
      { from: "Enrollment", to: "Student", kind: "assoc", fromMult: "0..*", toMult: "1",
        why: "an enrolment record points at exactly one student" },
      { from: "Enrollment", to: "Subject", kind: "assoc", fromMult: "0..*", toMult: "1",
        why: "and at exactly one subject" },
      { from: "Subject", to: "Teacher", kind: "assoc", fromMult: "0..*", toMult: "1",
        why: "a subject stores who teaches it", whyKind: "the subject keeps the teacher as an attribute, so this is an association, not a dependency" }
    ],
    forbidEdges: [
      { from: "Student", to: "Subject", why: "do not link Student straight to Subject — the grade would have nowhere to live" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 2. Aggregation: who holds the lists?                        *
   * ---------------------------------------------------------- */
  "school-container": {
    mode: "class",
    title: "Where do the objects live?",
    brief: "Every instance needs a container, or Python's garbage collector throws it away. " +
           "Add a <b>School</b> class that holds all four lists, and connect it with aggregation (hollow diamond).",
    seed: [
      { name: "Student",    x: 420, y: 40,  attrs: ["- student_id"] },
      { name: "Subject",    x: 620, y: 150, attrs: ["- subject_id"] },
      { name: "Teacher",    x: 420, y: 270, attrs: ["- teacher_id"] },
      { name: "Enrollment", x: 190, y: 270, attrs: ["- grade"] }
    ],
    nodes: [
      { name: "School", alias: ["Registry", "University", "Institute"],
        why: "something must own the master lists",
        attrs: [
          { name: "student_list", alias: ["students"] },
          { name: "subject_list", alias: ["subjects"] },
          { name: "teacher_list", alias: ["teachers"] },
          { name: "enrollment_list", alias: ["enrollments", "enrolments"] }
        ],
        methods: [{ name: "add_student", alias: ["addstudent", "register"] }]
      }
    ],
    edges: [
      { from: "School", to: "Student", kind: "aggreg", fromMult: "1", toMult: "0..*",
        whyKind: "a student still exists if the School object is deleted, so the diamond is hollow",
        whyDir: "the diamond sits on the container" },
      { from: "School", to: "Subject", kind: "aggreg", fromMult: "1", toMult: "0..*" },
      { from: "School", to: "Teacher", kind: "aggreg", fromMult: "1", toMult: "0..*" },
      { from: "School", to: "Enrollment", kind: "aggreg|compos", fromMult: "1", toMult: "0..*" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 3. Lab 3 — bank / ATM                                       *
   * ---------------------------------------------------------- */
  "atm": {
    mode: "class",
    title: "Lab 3 — bank and ATM",
    brief: "A user opens any number of savings accounts. Each account may request one ATM card. " +
           "Cards are used at ATMs to deposit, withdraw and transfer. <b>Every transaction is recorded in the account.</b> " +
           "The ATM stores nothing except the cash in its drawer — that constraint decides one of the relationships.",
    seed: [
      { name: "User", x: 70, y: 50, attrs: ["- citizen_id: str", "- name: str"] }
    ],
    nodes: [
      { name: "User", alias: ["Customer"], attrs: [{ name: "citizen_id", alias: ["nationalid", "citizenid", "id"] }, { name: "name" }] },
      {
        name: "Account", alias: ["SavingAccount", "SavingsAccount"],
        attrs: [
          { name: "account_number", alias: ["accountno", "accno", "number"] },
          { name: "balance", why: "the account is the information expert for the money" },
          { name: "owner", alias: ["user", "accountowner"], why: "the account knows whose it is" }
        ],
        methods: [
          { name: "deposit" },
          { name: "withdraw" },
          { name: "transfer" }
        ]
      },
      {
        name: "ATMCard", alias: ["Card", "AtmCard"],
        attrs: [{ name: "card_number", alias: ["cardno", "cardnumber"] }, { name: "pin", alias: ["pinnumber"] }],
        notAttrs: [{ name: "balance", why: "the card is plastic; the money lives in the Account" }]
      },
      {
        name: "ATM", alias: ["AtmMachine", "Machine"],
        attrs: [{ name: "atm_id", alias: ["machineno", "atmno", "id", "machineid"] }, { name: "cash", alias: ["money", "cashinmachine"] }],
        notAttrs: [
          { name: "balance", why: "“The ATM will not store any information except the money in the machine”" },
          { name: "pin", why: "the ATM never keeps a PIN — it passes it to the card for verification" }
        ]
      },
      {
        name: "Transaction", alias: ["Trans", "Statement", "TransactionRecord"],
        why: "a deposit is an event with its own data, so it is a class",
        attrs: [
          { name: "type", alias: ["transactiontype", "kind"] },
          { name: "amount" }
        ]
      },
      {
        name: "Bank", alias: ["BankSystem", "Controller"],
        why: "a controller class to hold the master lists of users, accounts and ATMs",
        attrs: [{ name: "users", alias: ["userlist", "customers"] }, { name: "atms", alias: ["atmlist", "machines"] }]
      }
    ],
    edges: [
      { from: "Account", to: "User", kind: "assoc", fromMult: "0..*", toMult: "1",
        why: "one user, many accounts" },
      { from: "Account", to: "Transaction", kind: "compos", fromMult: "1", toMult: "0..*",
        whyKind: "delete the account and its transaction history goes with it — that is composition, a filled diamond",
        whyDir: "the diamond sits on Account, the owner" },
      { from: "ATMCard", to: "Account", kind: "assoc", fromMult: "0..1", toMult: "1",
        why: "a card belongs to exactly one account; an account may have no card yet" },
      { from: "ATM", to: "ATMCard", kind: "depend",
        whyKind: "the ATM receives the card as a parameter and forgets it — it never stores one, so the line is a dashed dependency, not an association" },
      { from: "Bank", to: "User", kind: "aggreg", fromMult: "1", toMult: "0..*" },
      { from: "Bank", to: "ATM", kind: "aggreg", fromMult: "1", toMult: "0..*" }
    ],
    forbidEdges: [
      { from: "ATM", to: "Transaction", why: "the ATM does not keep transactions; the account does" },
      { from: "User", to: "ATMCard", why: "the card is attached to an account, not directly to the person" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 4. Composition vs aggregation drill                         *
   * ---------------------------------------------------------- */
  "has-a": {
    mode: "class",
    title: "Hollow or filled diamond?",
    brief: "Six pairs are already placed. Join each pair with the <b>right</b> kind of “has-a”. " +
           "Ask yourself: if the owner is destroyed, does the part still make sense on its own?",
    seed: [
      { name: "Person",   x: 50,  y: 30 },  { name: "Arm",      x: 260, y: 30 },
      { name: "Playlist", x: 50,  y: 150 }, { name: "Song",     x: 260, y: 150 },
      { name: "House",    x: 50,  y: 270 }, { name: "Room",     x: 260, y: 270 },
      { name: "Team",     x: 520, y: 30 },  { name: "Player",   x: 730, y: 30 },
      { name: "Order",    x: 520, y: 150 }, { name: "OrderLine",x: 730, y: 150 },
      { name: "Library",  x: 520, y: 270 }, { name: "Book",     x: 730, y: 270 }
    ],
    nodes: [],
    edges: [
      { from: "Person", to: "Arm", kind: "compos", whyKind: "an arm has no independent existence — filled diamond" },
      { from: "Playlist", to: "Song", kind: "aggreg", whyKind: "delete the playlist and the songs are still in your library — hollow diamond" },
      { from: "House", to: "Room", kind: "compos", whyKind: "demolish the house and the rooms are gone with it" },
      { from: "Team", to: "Player", kind: "aggreg", whyKind: "a player survives their team being disbanded" },
      { from: "Order", to: "OrderLine", kind: "compos", whyKind: "an order line means nothing without its order" },
      { from: "Library", to: "Book", kind: "aggreg", whyKind: "close the library and the books still exist" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 5. Week 5 inheritance — restaurant ordering                 *
   * ---------------------------------------------------------- */
  "restaurant": {
    mode: "class",
    title: "Week 5 — restaurant menu hierarchy",
    brief: "Four kinds of menu item, each with its own price formula: regular food, fast food, beverage and dessert. " +
           "Build the inheritance tree so that <code>calculate_price()</code> is declared once and overridden where the formula differs. " +
           "Note that regular food and fast food are both <i>food</i>.",
    seed: [
      { name: "MenuItem", x: 360, y: 30, attrs: ["- name: str", "- base_price: float"], methods: ["+ calculate_price(): float"] }
    ],
    nodes: [
      { name: "MenuItem", alias: ["Menu", "Item"], methods: [{ name: "calculate_price", alias: ["calculateprice", "price", "getprice"] }] },
      { name: "Food", why: "regular food and fast food share ingredient handling, so they need a common parent" },
      { name: "RegularFood", alias: ["Regular"], methods: [{ name: "calculate_price", alias: ["price", "getprice"], why: "override it — base + special ingredients + special requests" }] },
      { name: "FastFood", alias: ["Fast"], methods: [{ name: "calculate_price", alias: ["price", "getprice"] }] },
      { name: "Beverage", alias: ["Drink"], methods: [{ name: "calculate_price", alias: ["price", "getprice"] }] },
      { name: "Dessert", alias: ["Sweet"], methods: [{ name: "calculate_price", alias: ["price", "getprice"] }] }
    ],
    edges: [
      { from: "Food", to: "MenuItem", kind: "inherit", whyDir: "the triangle points at the superclass" },
      { from: "Beverage", to: "MenuItem", kind: "inherit" },
      { from: "Dessert", to: "MenuItem", kind: "inherit" },
      { from: "RegularFood", to: "Food", kind: "inherit", why: "a regular dish is a kind of food, not a direct kind of menu item" },
      { from: "FastFood", to: "Food", kind: "inherit" }
    ],
    forbidEdges: [
      { from: "RegularFood", to: "MenuItem", kind: "inherit", why: "go through Food — otherwise the shared food behaviour has nowhere to live" },
      { from: "FastFood", to: "MenuItem", kind: "inherit", why: "go through Food instead" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 6. Week 6 polymorphism — media player                       *
   * ---------------------------------------------------------- */
  "media": {
    mode: "class",
    title: "Week 6 — media player",
    brief: "Songs and podcast episodes play differently per file type, but the player calls one method on all of them. " +
           "Albums and playlists both hold media; only an album has an artist. " +
           "Build the hierarchy so <code>play()</code> is declared once at the top.",
    nodes: [
      { name: "Media", alias: ["MediaFile", "AudioFile"], why: "the shared interface every playable thing implements",
        methods: [{ name: "play", why: "declare it abstract here so the player can call it on anything" }] },
      { name: "Song", alias: ["Music", "Track"], attrs: [{ name: "artist", alias: ["artistname"] }] },
      { name: "Podcast", alias: ["Episode", "PodcastEpisode"], attrs: [{ name: "episode", alias: ["episodenumber", "episodeno"] }] },
      { name: "Collection", alias: ["MediaCollection", "Container"], why: "album and playlist share “a list of media with a name”" },
      { name: "Album", attrs: [{ name: "artist", alias: ["artistname"] }] },
      { name: "Playlist" }
    ],
    edges: [
      { from: "Song", to: "Media", kind: "inherit" },
      { from: "Podcast", to: "Media", kind: "inherit" },
      { from: "Album", to: "Collection", kind: "inherit" },
      { from: "Playlist", to: "Collection", kind: "inherit" },
      { from: "Collection", to: "Media", kind: "aggreg", fromMult: "0..*", toMult: "0..*",
        whyKind: "removing a playlist must not delete the songs — hollow diamond" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 7. Week 7 use case — cinema booking                         *
   * ---------------------------------------------------------- */
  "cinema-uc": {
    mode: "usecase",
    title: "Week 7 — cinema ticketing",
    brief: "Two actors: a <b>Customer</b> and a <b>Staff</b> member. " +
           "Booking a ticket always needs a seat selected and a payment taken — that is «include». " +
           "Applying a coupon only sometimes happens on top of paying — that is «extend».",
    seed: [
      { kind: "actor",   name: "Customer",     x: 40,  y: 120 },
      { kind: "usecase", name: "Book Ticket",  x: 300, y: 130 }
    ],
    nodes: [
      { name: "Customer", alias: ["Moviegoer", "User", "Member"] },
      { name: "Staff", alias: ["Cashier", "Officer", "Admin", "ProgramPlanner"], why: "somebody behind the counter has to add the movies and showtimes" },
      { name: "Book Ticket", alias: ["BookTicket", "CreateBooking", "BuyTicket", "ReserveTicket"] },
      { name: "Select Seat", alias: ["SelectSeats", "ChooseSeat", "AssignSeat"] },
      { name: "Pay", alias: ["PayForTickets", "MakePayment", "Payment"] },
      { name: "Apply Coupon", alias: ["ApplyCoupon", "UseCoupon", "ApplyDiscount", "ApplyPromotion"] },
      { name: "Search Movie", alias: ["SearchMovie", "ViewMovieDetail", "BrowseMovies"] },
      { name: "Manage Showtime", alias: ["ManageShowtime", "AddShowtime", "ManageShow", "EditShowtime"] }
    ],
    edges: [
      { from: "Customer", to: "Book Ticket", kind: "ucassoc", directed: false },
      { from: "Customer", to: "Search Movie", kind: "ucassoc", directed: false },
      { from: "Staff", to: "Manage Showtime", kind: "ucassoc", directed: false,
        why: "the behind-the-scenes work still belongs on the diagram" },
      { from: "Book Ticket", to: "Select Seat", kind: "include",
        whyKind: "you can never book without choosing a seat, so it is «include»",
        whyDir: "the arrow points at the use case being included" },
      { from: "Book Ticket", to: "Pay", kind: "include",
        whyKind: "payment is mandatory inside booking" },
      { from: "Apply Coupon", to: "Pay", kind: "extend",
        whyKind: "a coupon is optional extra behaviour layered on paying, so it is «extend»",
        whyDir: "the arrow points from the extending use case back to the base one" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 8. include vs extend drill                                  *
   * ---------------------------------------------------------- */
  "include-extend": {
    mode: "usecase",
    title: "«include» or «extend»?",
    brief: "An online shop. Decide for each pair whether the second use case is <b>always required</b> (include) " +
           "or an <b>optional add-on</b> (extend).",
    seed: [
      { kind: "usecase", name: "Checkout",        x: 60,  y: 40  },
      { kind: "usecase", name: "Calculate Total", x: 330, y: 40  },
      { kind: "usecase", name: "Take Payment",    x: 330, y: 130 },
      { kind: "usecase", name: "Gift Wrap",       x: 60,  y: 220 },
      { kind: "usecase", name: "View Product",    x: 600, y: 220 },
      { kind: "usecase", name: "Add to Wishlist", x: 600, y: 310 },
      { kind: "usecase", name: "Log In",          x: 330, y: 310 }
    ],
    nodes: [],
    edges: [
      { from: "Checkout", to: "Calculate Total", kind: "include", whyKind: "you cannot check out without a total" },
      { from: "Checkout", to: "Take Payment", kind: "include", whyKind: "payment always happens during checkout" },
      { from: "Gift Wrap", to: "Checkout", kind: "extend", whyKind: "gift wrapping is optional, and it is layered onto checkout — the arrow runs from the optional one to the base" },
      { from: "Add to Wishlist", to: "View Product", kind: "extend", whyKind: "you may or may not add the item you are viewing" },
      { from: "Add to Wishlist", to: "Log In", kind: "include", whyKind: "a wishlist needs an account, so logging in is required" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 9. Library system (lecture 4 worked example)                 *
   * ---------------------------------------------------------- */
  "library": {
    mode: "class",
    title: "Library system",
    brief: "Three copies of the same Python book share one ISBN but are three separate items on the shelf. " +
           "A loan and a reservation are both events with their own dates. " +
           "Librarians and members share id, name and join date.",
    seed: [
      { name: "Book", x: 330, y: 40, attrs: ["- isbn: str", "- title: str", "- author: str"] }
    ],
    nodes: [
      { name: "Book", attrs: [{ name: "isbn" }, { name: "title" }, { name: "author" }],
        notAttrs: [{ name: "status", why: "availability is per physical copy, so it belongs to BookItem" }] },
      { name: "BookItem", alias: ["Item", "Copy", "BookCopy"], why: "“each copy is called a book item”",
        attrs: [{ name: "item_no", alias: ["itemno", "barcode", "id" ] }, { name: "status" }] },
      { name: "BookRack", alias: ["Rack", "Shelf", "Bookshelf"], attrs: [{ name: "rack_no", alias: ["rackno", "number"] }] },
      { name: "User", alias: ["Person", "Account"], why: "member and librarian both have id, name and join date — lift them up",
        attrs: [{ name: "name" }, { name: "join_date", alias: ["joindate", "dateofmember"] }] },
      { name: "Member", methods: [{ name: "checkout_book_item", alias: ["checkout", "borrow", "borrowbook"] }] },
      { name: "Librarian", alias: ["Staff"], methods: [{ name: "add_book_item", alias: ["addbookitem", "addbook", "additems"] }] },
      { name: "BookLending", alias: ["Lending", "Loan", "Borrowing"], attrs: [{ name: "due_date", alias: ["duedate"] }, { name: "issue_date", alias: ["issuedate", "borrowdate"] }] },
      { name: "BookReservation", alias: ["Reservation", "Booking"], attrs: [{ name: "expiry_date", alias: ["expirydate", "expire"] }] },
      { name: "Library", why: "the controller that owns the catalogue, the racks, the loans and the reservations" }
    ],
    edges: [
      { from: "Book", to: "BookItem", kind: "aggreg|compos", fromMult: "1", toMult: "1..*",
        why: "one title, many physical copies" },
      { from: "BookRack", to: "BookItem", kind: "aggreg", fromMult: "1", toMult: "0..*" },
      { from: "Member", to: "User", kind: "inherit", whyDir: "the triangle points at the superclass" },
      { from: "Librarian", to: "User", kind: "inherit" },
      { from: "BookLending", to: "BookItem", kind: "assoc", fromMult: "0..*", toMult: "1" },
      { from: "BookLending", to: "Member", kind: "assoc", fromMult: "0..*", toMult: "1" },
      { from: "BookReservation", to: "BookItem", kind: "assoc", fromMult: "0..1", toMult: "1",
        why: "“a borrowed book can be reserved by only 1 person”" },
      { from: "BookReservation", to: "Member", kind: "assoc", fromMult: "0..*", toMult: "1" },
      { from: "Library", to: "Book", kind: "aggreg", fromMult: "1", toMult: "0..*" },
      { from: "Library", to: "User", kind: "aggreg", fromMult: "1", toMult: "0..*" }
    ]
  },

  /* ---------------------------------------------------------- *
   * 10. SOLID — splitting a god class                           *
   * ---------------------------------------------------------- */
  "solid-split": {
    mode: "class",
    title: "Week 10 — split the god class",
    brief: "<code>Order</code> currently adds items, totals the bill <i>and</i> takes payment by debit or credit. " +
           "Apply SRP and OCP: leave Order with the basket, pull payment out behind an abstract " +
           "<code>PaymentProcessor</code>, then add one subclass per payment method.",
    seed: [
      { name: "Order", x: 70, y: 60, attrs: ["- items: list", "- status: str"], methods: ["+ add_item()", "+ total_price()"] }
    ],
    nodes: [
      { name: "Order", methods: [{ name: "add_item", alias: ["additem" ] }, { name: "total_price", alias: ["totalprice", "total"] }],
        notAttrs: [{ name: "security_code", why: "a card's security code is not part of a basket of goods" }] },
      { name: "PaymentProcessor", alias: ["Payment", "AbstractPayment", "PaymentStrategy"],
        why: "an abstract base class so Order depends on an idea, not on a concrete card type",
        methods: [{ name: "pay", why: "one abstract method — and note it takes only the order" }] },
      { name: "DebitPaymentProcessor", alias: ["Debit", "DebitProcessor", "DebitPayment"], methods: [{ name: "pay" }] },
      { name: "CreditPaymentProcessor", alias: ["Credit", "CreditProcessor", "CreditPayment"], methods: [{ name: "pay" }] },
      { name: "PromptPayProcessor", alias: ["PromptPay", "PromptPayPayment", "PromptpayProcessor", "EWallet"],
        why: "adding PromptPay must mean adding a class, never editing an existing one",
        methods: [{ name: "pay" }] },
      { name: "SMSAuthorizer", alias: ["SmsAuth", "Authorizer", "SMSAuth"],
        why: "SMS authorisation is a separate responsibility — compose it in rather than forcing every processor to implement auth_sms()",
        methods: [{ name: "verify_code", alias: ["verifycode", "authsms", "auth" ] }, { name: "is_authorized", alias: ["isauthorized", "authorized" ] }] }
    ],
    edges: [
      { from: "DebitPaymentProcessor", to: "PaymentProcessor", kind: "inherit" },
      { from: "CreditPaymentProcessor", to: "PaymentProcessor", kind: "inherit" },
      { from: "PromptPayProcessor", to: "PaymentProcessor", kind: "inherit" },
      { from: "PaymentProcessor", to: "Order", kind: "depend",
        whyKind: "pay(order) receives the order as a parameter and does not keep it — dashed dependency",
        whyDir: "the processor is the one that depends on Order" },
      { from: "DebitPaymentProcessor", to: "SMSAuthorizer", kind: "assoc|aggreg", fromMult: "0..*", toMult: "1",
        why: "the debit processor holds an authoriser it was handed — that is dependency injection" }
    ],
    forbidEdges: [
      { from: "Order", to: "DebitPaymentProcessor", why: "Order must not know about any concrete payment type (DIP)" },
      { from: "Order", to: "CreditPaymentProcessor", why: "Order must not know about any concrete payment type (DIP)" }
    ]
  }
};
