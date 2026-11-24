# ---------------------------------------------------------------------------
# Lab 10 · the six versions of the Order example, as real runnable Python.
#
# These follow the refactor the chapter already walks through in 10.2-10.7
# (assets/js/viz.js, VIZ["solid"]): the god class, then S, O, L, I, D.
# Each stage also carries the three changes a maintainer might be asked for.
# A change is written the way a developer would write it, by hand; what the
# measurement counts is mechanical - which classes the diff touches.
# ---------------------------------------------------------------------------

# --- stage 0: one class does everything ------------------------------------
S0 = '''
class Order:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = "open"

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        total = 0
        for i in range(len(self.prices)):
            total += self.quantities[i] * self.prices[i]
        return total

    def pay(self, payment_type, security_code):
        if payment_type == "debit":
            self.status = "paid"
            return "debit " + security_code
        elif payment_type == "credit":
            self.status = "paid"
            return "credit " + security_code
        else:
            raise Exception("Unknown payment type")
'''

# --- stage 1: S - payment has its own reason to change ---------------------
S1 = '''
class Order:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = "open"

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        total = 0
        for i in range(len(self.prices)):
            total += self.quantities[i] * self.prices[i]
        return total


class PaymentProcessor:
    def pay_debit(self, order, security_code):
        order.status = "paid"
        return "debit " + security_code

    def pay_credit(self, order, security_code):
        order.status = "paid"
        return "credit " + security_code
'''

# --- stage 2: O - a new payment type is a new class ------------------------
S2 = '''
from abc import ABC, abstractmethod


class Order:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = "open"

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        total = 0
        for i in range(len(self.prices)):
            total += self.quantities[i] * self.prices[i]
        return total


class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, order, security_code):
        ...


class DebitPaymentProcessor(PaymentProcessor):
    def pay(self, order, security_code):
        order.status = "paid"
        return "debit " + security_code


class CreditPaymentProcessor(PaymentProcessor):
    def pay(self, order, security_code):
        order.status = "paid"
        return "credit " + security_code
'''

# --- stage 3: L - the base contract stops demanding a security code --------
S3 = '''
from abc import ABC, abstractmethod


class Order:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = "open"

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        total = 0
        for i in range(len(self.prices)):
            total += self.quantities[i] * self.prices[i]
        return total


class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, order):
        ...


class DebitPaymentProcessor(PaymentProcessor):
    def __init__(self, security_code):
        self.security_code = security_code

    def pay(self, order):
        order.status = "paid"
        return "debit " + self.security_code


class CreditPaymentProcessor(PaymentProcessor):
    def __init__(self, security_code):
        self.security_code = security_code

    def pay(self, order):
        order.status = "paid"
        return "credit " + self.security_code
'''

# --- stage 4: I - only the processors that authenticate implement auth -----
S4 = '''
from abc import ABC, abstractmethod


class Order:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = "open"

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        total = 0
        for i in range(len(self.prices)):
            total += self.quantities[i] * self.prices[i]
        return total


class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, order):
        ...


class PaymentProcessorSMS(PaymentProcessor):
    @abstractmethod
    def auth_sms(self, code):
        ...


class DebitPaymentProcessor(PaymentProcessorSMS):
    def __init__(self, security_code):
        self.security_code = security_code
        self.verified = False

    def auth_sms(self, code):
        self.verified = True

    def pay(self, order):
        if not self.verified:
            raise Exception("Not authorised")
        order.status = "paid"
        return "debit " + self.security_code


class CreditPaymentProcessor(PaymentProcessor):
    def __init__(self, security_code):
        self.security_code = security_code

    def pay(self, order):
        order.status = "paid"
        return "credit " + self.security_code
'''

# --- stage 5: D - the authoriser is injected, not constructed --------------
S5 = '''
from abc import ABC, abstractmethod


class Order:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = "open"

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        total = 0
        for i in range(len(self.prices)):
            total += self.quantities[i] * self.prices[i]
        return total


class Authoriser(ABC):
    @abstractmethod
    def is_authorised(self):
        ...


class SMSAuthoriser(Authoriser):
    def __init__(self):
        self.authorised = False

    def verify(self, code):
        self.authorised = True

    def is_authorised(self):
        return self.authorised


class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, order):
        ...


class DebitPaymentProcessor(PaymentProcessor):
    def __init__(self, security_code, authoriser):
        self.security_code = security_code
        self.authoriser = authoriser

    def pay(self, order):
        if not self.authoriser.is_authorised():
            raise Exception("Not authorised")
        order.status = "paid"
        return "debit " + self.security_code


class CreditPaymentProcessor(PaymentProcessor):
    def __init__(self, security_code, authoriser):
        self.security_code = security_code
        self.authoriser = authoriser

    def pay(self, order):
        order.status = "paid"
        return "credit " + self.security_code
'''

STAGES = [
    ("START", S0), ("S", S1), ("O", S2), ("L", S3), ("I", S4), ("D", S5),
]

# ---------------------------------------------------------------------------
# The three changes a maintainer gets asked for. Each returns the new source.
# Written by hand, as a developer would; the counting is done by measure.py.
# ---------------------------------------------------------------------------

# change A - a basket rule: the same item may not be added twice
def change_basket(src):
    return src.replace(
        '''    def add_item(self, name, qty, price):
        self.items.append(name)''',
        '''    def add_item(self, name, qty, price):
        if name in self.items:
            raise ValueError("duplicate item")
        self.items.append(name)''')


# change B - a pricing rule: 10% off orders over 1000
def change_pricing(src):
    return src.replace(
        '''            total += self.quantities[i] * self.prices[i]
        return total''',
        '''            total += self.quantities[i] * self.prices[i]
        if total > 1000:
            total *= 0.9
        return total''')


# change C - a payment rule: PromptPay, which authenticates by phone number
def change_payment(src, stage):
    if stage == "START":
        return src.replace(
            '''        else:
            raise Exception("Unknown payment type")''',
            '''        elif payment_type == "promptpay":
            self.status = "paid"
            return "promptpay " + security_code
        else:
            raise Exception("Unknown payment type")''')
    if stage == "S":
        return src.replace(
            '''    def pay_credit(self, order, security_code):
        order.status = "paid"
        return "credit " + security_code''',
            '''    def pay_credit(self, order, security_code):
        order.status = "paid"
        return "credit " + security_code

    def pay_promptpay(self, order, phone):
        order.status = "paid"
        return "promptpay " + phone''')
    if stage == "O":
        # a new class, but the base contract still demands a security code it
        # does not have, so the subclass has to lie about its parameter
        return src + '''

class PromptPayProcessor(PaymentProcessor):
    def pay(self, order, security_code):
        order.status = "paid"
        return "promptpay " + security_code
'''
    if stage in ("L", "I"):
        return src + '''

class PromptPayProcessor(PaymentProcessor):
    def __init__(self, phone):
        self.phone = phone

    def pay(self, order):
        order.status = "paid"
        return "promptpay " + self.phone
'''
    return src + '''

class PromptPayProcessor(PaymentProcessor):
    def __init__(self, phone, authoriser):
        self.phone = phone
        self.authoriser = authoriser

    def pay(self, order):
        order.status = "paid"
        return "promptpay " + self.phone
'''
