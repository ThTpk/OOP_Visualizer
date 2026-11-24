// ---------------------------------------------------------------------------
// OOP Lab 10 · SOLID. One input: how far through the refactor you are (0..5).
// Every number below was MEASURED by measure.py in this folder, which builds the
// six versions of the Order example as real Python (stages.py, following the
// chapter's own walkthrough in 10.2-10.7), applies three independent changes,
// counts which classes each one touches, and runs the result. See demo.json.
// ---------------------------------------------------------------------------
const SO_T = 1300;            // the basket every version totals: 1×500 + 1×800

// cls: [class name, measured lines of code]; opened: classes the PromptPay
// change has to reopen; forced: parameters the base contract demands of every
// processor; reqCredit: abstract methods CreditPaymentProcessor must implement.
const SO = [
  { tag: 'START', name: 'One class does everything', letter: '',
    cls: [['Order', 22]], loc: 22, reasons: 3,
    opened: ['Order'], openedLines: 3, forced: 0, injected: false,
    note: 'Order holds the basket rules, the pricing rules and the payment rules.',
    gain: 'Three reasons to change, in one file.' },
  { tag: 'S', name: 'Single Responsibility', letter: 'S',
    cls: [['Order', 13], ['PaymentProcessor', 7]], loc: 20, reasons: 2,
    opened: ['PaymentProcessor'], openedLines: 4, forced: 0, injected: false,
    note: 'Payment moves out. Order keeps the basket and the pricing rules.',
    gain: 'Worst class: 3 reasons to change -> 2.' },
  { tag: 'O', name: 'Open-Closed', letter: 'O',
    cls: [['Order', 13], ['PaymentProcessor', 4], ['DebitPaymentProcessor', 4], ['CreditPaymentProcessor', 4]],
    loc: 26, reasons: 2, opened: [], openedLines: 0, forced: 1, injected: false,
    note: 'PromptPay arrives as a new class. Nothing already tested is opened.',
    gain: 'Classes reopened to add a payment type: 1 -> 0.' },
  { tag: 'L', name: 'Liskov Substitution', letter: 'L',
    cls: [['Order', 13], ['PaymentProcessor', 4], ['DebitPaymentProcessor', 6], ['CreditPaymentProcessor', 6]],
    loc: 30, reasons: 2, opened: [], openedLines: 0, forced: 0, injected: false,
    note: 'The contract stops demanding a security code. Each processor declares its own credential.',
    gain: 'Credentials forced on every processor: 1 -> 0.' },
  { tag: 'I', name: 'Interface Segregation', letter: 'I',
    cls: [['Order', 13], ['PaymentProcessor', 4], ['PaymentProcessorSMS', 4],
          ['DebitPaymentProcessor', 11], ['CreditPaymentProcessor', 6]],
    loc: 39, reasons: 2, opened: [], openedLines: 0, forced: 0, injected: false,
    reqCredit: 1, reqCreditFat: 2,
    note: 'Only the processors that authenticate inherit auth_sms().',
    gain: 'Methods a credit card must implement: 2 -> 1.' },
  { tag: 'D', name: 'Dependency Inversion', letter: 'D',
    cls: [['Order', 13], ['Authoriser', 4], ['SMSAuthoriser', 7], ['PaymentProcessor', 4],
          ['DebitPaymentProcessor', 9], ['CreditPaymentProcessor', 7]],
    loc: 45, reasons: 2, opened: [], openedLines: 0, forced: 0, injected: true,
    note: 'The processor is handed its authoriser instead of making one.',
    gain: 'The processor no longer names a concrete collaborator.' },
];

// what fits on the lid of a crate a few centimetres wide
const SO_SHORT = {
  Order: 'Order', PaymentProcessor: 'Payment', PaymentProcessorSMS: 'Payment+SMS',
  DebitPaymentProcessor: 'Debit', CreditPaymentProcessor: 'Credit',
  Authoriser: 'Authoriser', SMSAuthoriser: 'SMS auth',
};
const soShort = (n) => SO_SHORT[n] || n;

const soAt = (i) => SO[clamp(Math.round(i), 0, SO.length - 1)];
// the measurement that the last chapter is about: the same basket, twice the code
const soCost = (i) => soAt(i).loc - SO[0].loc;
const soVerdict = (s, armed) =>
  !armed ? ['READY', s.note, 'grey']
  : s.opened.length ? ['OPENED ' + s.opened.length, s.opened.join(', ') + ' had to be edited', 'coral']
  : ['NOTHING OPENED', 'PromptPay is a new class; no tested code was touched', 'lime'];
