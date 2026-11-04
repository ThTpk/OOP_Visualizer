/* ============================================================
   snippets.js — starter code for the playground.
   Keyed by the ?load= query parameter.
   ============================================================ */
window.SNIPPETS = {

  "hello": {
    title: "Two instances, two addresses",
    note: "Chapter 2. Prove to yourself that instances do not share data.",
    code:
`class Student:
    def __init__(self, student_id, name):
        self.student_id = student_id
        self.name = name

    def __str__(self):
        return f'{self.student_id} {self.name}'


stu1 = Student('001', 'John')
stu2 = Student('002', 'Peter')

print(stu1)
print(stu2)

# the same attribute name, two different places in memory
print('stu1 lives at', hex(id(stu1)))
print('stu2 lives at', hex(id(stu2)))
print('same object?', stu1 is stu2)

stu2.name = 'Pete'
print('after editing stu2:', stu1.name, '/', stu2.name)
`
  },

  "encapsulation": {
    title: "Public vs private, side by side",
    note: "Chapter 3. Run it, then try changing the value assigned to each.",
    code:
`class OpenStudent:
    """Everything public. Nothing is defended."""
    def __init__(self, name, gpa):
        self.name = name
        self.gpa = gpa


class SafeStudent:
    """Private storage, validating setter."""
    def __init__(self, name, gpa):
        self.__name = name
        self.set_gpa(gpa)

    def get_gpa(self):
        return self.__gpa

    def set_gpa(self, value):
        if not isinstance(value, (int, float)):
            raise ValueError('gpa must be a number')
        if not 0 <= value <= 4:
            raise ValueError(f'gpa {value} is outside 0.00-4.00')
        self.__gpa = value


a = OpenStudent('John', 3.5)
a.gpa = -5                      # accepted silently
print('open  ->', a.gpa, '  <- the object is now invalid')

b = SafeStudent('John', 3.5)
try:
    b.set_gpa(-5)
except ValueError as e:
    print('safe  ->', e)
print('safe  ->', b.get_gpa(), '  <- unchanged, still valid')

# and the private attribute is not reachable by its written name
try:
    print(b.__gpa)
except AttributeError as e:
    print('safe  ->', e)
print('safe  ->', b._SafeStudent__gpa, '  <- name mangling, not a lock')
`
  },

  "property": {
    title: "@property",
    note: "Chapter 3. Attribute syntax with method safety.",
    code:
`class Dog:
    def __init__(self, age):
        self.age = age          # goes through the setter

    @property
    def age(self):
        print('  (getter ran)')
        return self.__age

    @age.setter
    def age(self, value):
        print('  (setter ran with', value, ')')
        if not isinstance(value, int) or not 0 < value < 30:
            raise ValueError('invalid age')
        self.__age = value


d = Dog(8)
print('read :', d.age)
print('--- d.age += 1 is a read AND a write ---')
d.age += 1
print('read :', d.age)

try:
    d.age = 99
except ValueError as e:
    print('rejected:', e, '- stored value is still', d.age)
`
  },

  "activity2": {
    title: "Week 2, Activity 2 — registration model",
    note: "Create 5 students, 2 teachers, 2 sections of the OOP course, then answer the two questions.",
    code:
`class Student:
    def __init__(self, stu_id, name):
        self.stu_id = stu_id
        self.name = name
    def __str__(self):
        return f'{self.stu_id} {self.name}'


class Teacher:
    def __init__(self, teacher_id, name):
        self.teacher_id = teacher_id
        self.name = name
    def __str__(self):
        return f'{self.teacher_id} {self.name}'


class Subject:
    def __init__(self, subject_id, subject_name, section, credit):
        self.subject_id = subject_id
        self.subject_name = subject_name
        self.section = section
        self.credit = credit
        self.teacher = None
        self.student_list = []        # stores Student INSTANCES

    def assign_teacher(self, teacher):
        self.teacher = teacher

    def add_student(self, student):
        if student not in self.student_list:
            self.student_list.append(student)

    def __str__(self):
        return f'{self.subject_id} sec {self.section} ({self.subject_name})'


students = [Student(f'6601000{i}', n) for i, n in
            enumerate(['Keanu', 'Khadijah', 'Jean', 'Jayden', 'Owain'], start=1)]
teachers = [Teacher('T001', 'Mr. Welsh'), Teacher('T002', 'Mr. Burton')]

sec1 = Subject('CS101', 'OOP', 1, 3)
sec2 = Subject('CS101', 'OOP', 2, 3)
sec1.assign_teacher(teachers[0])
sec2.assign_teacher(teachers[1])
for s in students[:3]:
    sec1.add_student(s)
for s in students[3:]:
    sec2.add_student(s)

sections = [sec1, sec2]


# TODO: given a teacher id, who studies with them?
def students_of_teacher(teacher_id):
    found = []
    for sub in sections:
        if sub.teacher and sub.teacher.teacher_id == teacher_id:
            found.extend(sub.student_list)
    return found


# TODO: given a student id, what do they study?
def subjects_of_student(stu_id):
    return [sub for sub in sections
            if any(s.stu_id == stu_id for s in sub.student_list)]


print('T001 teaches:', [str(s) for s in students_of_teacher('T001')])
print('66010004 studies:', [str(x) for x in subjects_of_student('66010004')])
`
  },

  "lab2": {
    title: "Lab 2 skeleton — student registration",
    note: "Every attribute private. Fill in each TODO, then run the test cases at the bottom.",
    code:
`class Student:
    def __init__(self, student_id, student_name):
        self.__student_id = student_id
        self.__student_name = student_name

    @property
    def student_id(self):
        return self.__student_id

    @property
    def student_name(self):
        return self.__student_name


class Subject:
    def __init__(self, subject_id, subject_name, credit):
        self.__subject_id = subject_id
        self.__subject_name = subject_name
        self.__credit = credit
        self.__teacher = None

    @property
    def subject_id(self):
        return self.__subject_id

    @property
    def subject_name(self):
        return self.__subject_name

    @property
    def credit(self):
        return self.__credit

    @property
    def teacher(self):
        return self.__teacher

    def assign_teacher(self, teacher):
        if not isinstance(teacher, Teacher):
            return None
        self.__teacher = teacher


class Teacher:
    def __init__(self, teacher_id, teacher_name):
        self.__teacher_id = teacher_id
        self.__teacher_name = teacher_name

    @property
    def teacher_id(self):
        return self.__teacher_id

    @property
    def teacher_name(self):
        return self.__teacher_name


class Enrollment:
    """The extra class: a grade is a fact about one student in one subject."""
    def __init__(self, subject, student, grade=None):
        self.__subject = subject
        self.__student = student
        self.__grade = grade

    @property
    def subject(self):
        return self.__subject

    @property
    def student(self):
        return self.__student

    @property
    def grade(self):
        return self.__grade

    @grade.setter
    def grade(self, grade):
        self.__grade = grade


student_list = []
subject_list = []
teacher_list = []
enrollment_list = []


# TODO 1: find a Subject instance in subject_list by id
def search_subject_by_id(subject_id):
    pass


# TODO 2: find a Student instance in student_list by id
def search_student_by_id(student_id):
    pass


# TODO 3: create an enrolment from a Student and a Subject instance
def enroll_to_subject(student, subject):
    pass


# TODO 4: remove an enrolment
def drop_from_subject(student, subject):
    pass


# TODO 5: find one enrolment for a given subject and student
def search_enrollment_subject_student(subject, student):
    pass


# TODO 6: all enrolments in a subject
def search_student_enroll_in_subject(subject):
    pass


# TODO 7: all enrolments of a student
def search_subject_that_student_enrolled(student):
    pass


# TODO 8: set the grade on an enrolment
def assign_grade(student, subject, grade):
    pass


# TODO 9: the teacher of a subject
def get_teacher_teach(subject_search):
    pass


# TODO 10: how many students are enrolled in a subject
def get_no_of_student_enrolled(subject):
    pass


# TODO 11: {subject_id: [subject_name, grade]} for one student
def get_student_record(student):
    pass


def grade_to_count(grade):
    return {'A': 4, 'B': 3, 'C': 2, 'D': 1}.get(grade, 0)


# TODO 12: the student's GPA
def get_student_gpa(student):
    pass


def list_student_enrolled_in_subject(subject_id):
    subject = search_subject_by_id(subject_id)
    if subject is None:
        return 'Subject not found'
    return {e.student.student_id: e.student.student_name
            for e in search_student_enroll_in_subject(subject)}


def create_instance():
    for sid, name in [('66010001', 'Keanu Welsh'), ('66010002', 'Khadijah Burton'),
                      ('66010003', 'Jean Caldwell'), ('66010004', 'Jayden Mccall'),
                      ('66010005', 'Owain Johnston')]:
        student_list.append(Student(sid, name))
    for cid, cname in [('CS101', 'Computer Programming 1'),
                       ('CS102', 'Computer Programming 2'),
                       ('CS103', 'Data Structure')]:
        subject_list.append(Subject(cid, cname, 3))
    for tid, tname in [('T001', 'Mr. Welsh'), ('T002', 'Mr. Burton'), ('T003', 'Mr. Smith')]:
        teacher_list.append(Teacher(tid, tname))
    for i in range(3):
        subject_list[i].assign_teacher(teacher_list[i])


create_instance()

print('Test 2 — bad arguments, expect Error:')
print(' ', enroll_to_subject('66010001', 'CS101'))

print('Test 1 — enrol then list, expect a dict of ids to names:')
enroll_to_subject(student_list[0], subject_list[0])
enroll_to_subject(student_list[1], subject_list[0])
print(' ', list_student_enrolled_in_subject('CS101'))

print('Test 3 — duplicate enrolment, expect Already Enrolled:')
print(' ', enroll_to_subject(student_list[0], subject_list[0]))
`
  },

  "polymorphism": {
    title: "Polymorphism — one loop, many behaviours",
    note: "Chapter 6. Add a fourth character class and notice the loop does not change.",
    code:
`from abc import ABC, abstractmethod


class GameCharacter(ABC):
    def __init__(self, name, level=1):
        self._name = name
        self._level = level

    @abstractmethod
    def attack(self):
        ...

    def __str__(self):
        return f'{self._name} (lv{self._level})'


class Warrior(GameCharacter):
    def attack(self):
        return f'{self._name} swings a sword for {self._level * 18} melee damage'


class Archer(GameCharacter):
    def attack(self):
        return f'{self._name} fires an arrow for {self._level * 12} ranged damage'


class Mage(GameCharacter):
    def attack(self):
        return f'{self._name} casts fireball for {self._level * 25} magic damage'


party = [Warrior('Conan', 3), Archer('Robin', 2), Mage('Merlin', 4)]

# ---- the loop. It never changes, however many classes you add. ----
for c in party:
    print(c.attack())

# an abstract class cannot be instantiated, and nor can an incomplete subclass
class Priest(GameCharacter):
    pass

try:
    Priest('Anna')
except TypeError as e:
    print('\\nforgot attack():', e)
`
  },

  "mro": {
    title: "The diamond problem",
    note: "Chapter 9. Compare super() with calling the base class by name.",
    code:
`class BaseClass:
    num_base_calls = 0

    def call_me(self):
        print('BaseClass.call_me')
        BaseClass.num_base_calls += 1


class LeftSubclass(BaseClass):
    def call_me(self):
        super().call_me()
        print('LeftSubclass.call_me')


class RightSubclass(BaseClass):
    def call_me(self):
        super().call_me()
        print('RightSubclass.call_me')


class Subclass(LeftSubclass, RightSubclass):
    def call_me(self):
        super().call_me()
        print('Subclass.call_me')


print('MRO:', ' -> '.join(c.__name__ for c in Subclass.__mro__))
print()
Subclass().call_me()
print('base ran', BaseClass.num_base_calls, 'time(s)')

# -------- now the class-name version --------
print()
print('=' * 46)


class L2(BaseClass):
    def call_me(self):
        BaseClass.call_me(self)
        print('L2.call_me')


class R2(BaseClass):
    def call_me(self):
        BaseClass.call_me(self)
        print('R2.call_me')


class S2(L2, R2):
    def call_me(self):
        L2.call_me(self)
        R2.call_me(self)
        print('S2.call_me')


BaseClass.num_base_calls = 0
S2().call_me()
print('base ran', BaseClass.num_base_calls, 'time(s)  <- the diamond problem')
`
  },

  "solid": {
    title: "SOLID — before and after",
    note: "Chapter 10. The god class, then the refactored version. Add a payment method to each and compare the work.",
    code:
`from abc import ABC, abstractmethod

# ============ BEFORE: one class, three responsibilities ============

class BadOrder:
    def __init__(self):
        self.items, self.quantities, self.prices = [], [], []
        self.status = 'open'

    def add_item(self, name, qty, price):
        self.items.append(name)
        self.quantities.append(qty)
        self.prices.append(price)

    def total_price(self):
        return sum(q * p for q, p in zip(self.quantities, self.prices))

    def pay(self, payment_type, security_code):
        if payment_type == 'debit':
            print(f'  debit, code {security_code}')
            self.status = 'paid'
        elif payment_type == 'credit':
            print(f'  credit, code {security_code}')
            self.status = 'paid'
        else:
            raise Exception(f'Unknown payment type: {payment_type}')


o = BadOrder()
o.add_item('Keyboard', 1, 50)
o.add_item('SSD', 1, 150)
o.add_item('USB cable', 2, 5)
print('total', o.total_price())
o.pay('debit', '0372846')
print('->', o.status)
print()

# ============ AFTER: S, O, L, I and D applied ============

class Order:
    """One reason to change: the rules of a basket."""
    def __init__(self):
        self.__lines = []
        self.status = 'open'

    def add_item(self, name, qty, price):
        self.__lines.append((name, qty, price))

    def total_price(self):
        return sum(q * p for _, q, p in self.__lines)


class PaymentProcessor(ABC):
    @abstractmethod
    def pay(self, order):            # L: same contract for everyone
        ...


class SMSAuthorizer:                 # I + D: a separate responsibility
    def __init__(self):
        self.__authorized = False

    def verify_code(self, code):
        print(f'  verifying SMS code {code}')
        self.__authorized = True

    def is_authorized(self):
        return self.__authorized


class DebitPaymentProcessor(PaymentProcessor):
    def __init__(self, security_code, authorizer):
        self.__security_code = security_code
        self.__authorizer = authorizer       # injected, not built here

    def pay(self, order):
        if not self.__authorizer.is_authorized():
            raise Exception('Not authorized')
        print(f'  debit, code {self.__security_code}')
        order.status = 'paid'


class PromptPayProcessor(PaymentProcessor):
    """O: a whole new payment method, and nothing above was edited."""
    def __init__(self, phone):
        self.__phone = phone

    def pay(self, order):
        print(f'  PromptPay to {self.__phone}')
        order.status = 'paid'


order = Order()
order.add_item('Keyboard', 1, 50)
order.add_item('SSD', 1, 150)
order.add_item('USB cable', 2, 5)
print('total', order.total_price())

auth = SMSAuthorizer()
auth.verify_code(465839)
DebitPaymentProcessor('2349875', auth).pay(order)
print('->', order.status)

order2 = Order()
order2.add_item('Mouse', 1, 30)
PromptPayProcessor('081-234-5678').pay(order2)
print('->', order2.status)
`
  }
};
