---
layout: post
title: "Classes: Building Our Own Data Structures"
date: 2025-04-14
author: Erick Johnson
categories: Python
tags: [data-structures]
---

# Classes: Building Our Own Data Structures

As Data Structures students, we've worked a lot with Python's built-in data types like strings, lists, and dictionaries. We've also talked about more intricate data types like stacks, queues and trees. Now, it's time to level up your skills by creating *your very own custom data types* using **Classes**. Classes are the foundation of object-oriented programming (OOP) and allow you to bundle data and functionality together in a way that mirrors real-world objects.

## What is a Class?

A **Class** is like a blueprint for creating objects. Think of it as a template that defines:

 - Attributes (variables) - the data that describes an object
 - Methods (functions) - the behaviors or actions an object can perform

For example, if we were creating a video game, we might have a Player class that contains attributes like health, position, and inventory, along with methods like move, attack, and use_item.

### Creating Your First Class

Mrs. Johnson really wants a dog. I'm sure a digital Dog that lives in terminal memory will be good enough, right? Let's start by creating a Dog class:

```python
class Dog:
    # This is the initializer method (constructor)
    def __init__(self, name, breed, age):
        self.name = name    # Attribute
        self.breed = breed  # Attribute
        self.age = age      # Attribute
        self.is_sitting = False
    
    # Methods define what the dog can do
    def bark(self):
        return f"{self.name} says Woof!"
    
    def sit(self):
        self.is_sitting = True
        return f"{self.name} is now sitting"
    
    def stand(self):
        self.is_sitting = False
        return f"{self.name} is now standing"
    
    def birthday(self):
        self.age += 1
        return f"{self.name} is now {self.age} years old!"
```

### Creating Objects from a Class

Once you've defined a class, you can create instances (objects) of that class:
```python
# Create two dog objects
my_dog = Dog("Snoopy", "Cocker Spaniel", 3)
your_dog = Dog("Flinn", "French Poodle", 2)

# Use the objects
print(my_dog.name)          # Output: Snoopy
print(your_dog.breed)       # Output: French Poodle
print(my_dog.bark())        # Output: Snoopy says Woof!
print(your_dog.sit())       # Output: Flinn is now sitting
print(your_dog.is_sitting)  # Output: True
print(my_dog.is_sitting)    # Output: False
```

Each Dog object has its own separate set of attributes, but they share the same methods.

### The self Parameter

You might have noticed that methods in a class take a parameter called `self`. This parameter represents the specific instance of the class that's calling the method. When you call `my_dog.bark()`, Python automatically passes `my_dog` as the `self` parameter to the `bark` method.

### A More Complex Example

Let's create a BankAccount class to manage a simple bank account:
```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.transaction_history = []
    
    def deposit(self, amount):
        if amount > 0:
            self.balance += amount
            self.transaction_history.append(f"Deposit: +${amount}")
            return f"Deposited ${amount}. New balance: ${self.balance}"
        else:
            return "Deposit amount must be positive"
    
    def withdraw(self, amount):
        if amount > 0:
            if amount <= self.balance:
                self.balance -= amount
                self.transaction_history.append(f"Withdrawal: -${amount}")
                return f"Withdrew ${amount}. New balance: ${self.balance}"
            else:
                return "Insufficient funds"
        else:
            return "Withdrawal amount must be positive"
    
    def get_balance(self):
        return f"Current balance: ${self.balance}"
    
    def show_transactions(self):
        if not self.transaction_history:
            return "No transactions yet"
        return "\n".join(self.transaction_history)
```

Let's put the BankAccount class into action:

```python
# Create a new account
account = BankAccount("Samuel", 100)

# Perform some transactions
print(account.deposit(50))    # Output: Deposited $50. New balance: $150
print(account.withdraw(30))   # Output: Withdrew $30. New balance: $120
print(account.withdraw(200))  # Output: Insufficient funds
print(account.get_balance())  # Output: Current balance: $120

# Check transaction history
print(account.show_transactions())
# Output:
# Deposit: +$50
# Withdrawal: -$30
```

## Inheritance: Building on Existing Classes

One of the most powerful features of OOP is **inheritance**, which allows you to create new classes based on existing ones. The new class (subclass) inherits attributes and methods from the existing class (superclass) and can add or override them.

Let's create a SavingsAccount class that inherits from our BankAccount class:

```python
class SavingsAccount(BankAccount):
    def __init__(self, owner, balance=0, interest_rate=0.01):
        # Call the parent class's __init__ method
        super().__init__(owner, balance)
        self.interest_rate = interest_rate
    
    def add_interest(self):
        interest = self.balance * self.interest_rate
        self.deposit(interest)
        return f"Added ${interest:.2f} interest"
    
    # Override the withdraw method to add a limit
    def withdraw(self, amount):
        if self.balance - amount < 50:
            return "Savings account must maintain a minimum balance of $50"
        return super().withdraw(amount)
```
Let's put the SavingsAccount class into action:

```python
# Create a savings account
savings = SavingsAccount("Bob", 1000, 0.05)

print(savings.get_balance())   # Output: Current balance: $1000
print(savings.add_interest())  # Output: Added $50.00 interest
print(savings.get_balance())   # Output: Current balance: $1050
print(savings.withdraw(1000))  # Output: Savings account must maintain a minimum balance of $50
print(savings.withdraw(500))   # Output: Withdrew $500. New balance: $550
```

### Class Variables vs. Instance Variables
So far, we've been using instance variables (attached to self), which are unique to each object. Python also supports class variables, which are shared among all instances of a class:

```python
class Student:
    # Class variable - shared by all instances
    school_name = "Mooseheart Child City & School"
    student_count = 0
    
    def __init__(self, name, grade):
        self.name = name    # Instance variable - unique to each instance
        self.grade = grade  # Instance variable
        Student.student_count += 1  # Incrementing the class variable
    
    def display_info(self):
        return f"{self.name} is in grade {self.grade} at {Student.school_name}"

# Create some students
student1 = Student("Jimmy", 12)
student2 = Student("Frank", 10)

print(student1.display_info())  # Output: Jimmy is in grade 12 at Mooseheart Child City & School
print(student2.display_info())  # Output: Frank is in grade 10 at Mooseheart Child City & School
print(f"Total students: {Student.student_count}")  # Output: Total students: 2

# Change the class variable
Student.school_name = "Batavia High School"

# Both students are affected by the change
print(student1.display_info())  # Output: Jimmy is in grade 12 at Batavia High School
print(student2.display_info())  # Output: Frank is in grade 10 at Batavia High School
```

## Encapsulation: Protecting Data

**Encapsulation** means bundling data and methods together and restricting direct access to some of an object's components. In Python, we use naming conventions to indicate that attributes or methods should be treated as public, private or protected.

```python
class CreditCard:
    def __init__(self, number, holder, limit):
        self.holder = holder              # Public attribute
        self._limit = limit               # Protected attribute (single underscore)
        self.__number = number            # Private attribute (double underscore)
        self.__balance = 0                # Private attribute
    
    def get_balance(self):
        return f"Current balance: ${self.__balance}"
    
    def charge(self, amount):
        if self.__balance + amount > self._limit:
            return "Transaction declined: over limit"
        self.__balance += amount
        return f"Charged ${amount}. New balance: ${self.__balance}"
    
    def payment(self, amount):
        self.__balance -= amount
        return f"Payment of ${amount} received. New balance: ${self.__balance}"

card = CreditCard("1234-5678-9012-3456", "John Doe", 2000)

print(card.holder)         # Works fine: John Doe
# print(card.__number)     # Error! Can't access private attribute directly
# print(card.__balance)    # Error! Can't access private attribute directly
print(card._limit)         # Works, but convention suggests you shouldn't access it: 2000

print(card.charge(500))    # Output: Charged $500. New balance: $500
print(card.get_balance())  # Output: Current balance: $500
print(card.payment(200))   # Output: Payment of $200 received. New balance: $300
```

### Properties: Controlled Access to Attributes
A more Pythonic way to implement getters and setters is using properties:
```python
class Temperature:
    def __init__(self, celsius=0):
        self._celsius = celsius
    
    @property
    def celsius(self):
        return self._celsius
    
    @celsius.setter
    def celsius(self, value):
        if value < -273.15:  # Absolute zero
            raise ValueError("Temperature cannot be below absolute zero")
        self._celsius = value
    
    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32
    
    @fahrenheit.setter
    def fahrenheit(self, value):
        self.celsius = (value - 32) * 5/9

temp = Temperature(25)
print(temp.celsius)     # Output: 25
print(temp.fahrenheit)  # Output: 77.0

temp.celsius = 30
print(temp.fahrenheit)  # Output: 86.0

temp.fahrenheit = 50
print(temp.celsius)     # Output: 10.0

# temp.celsius = -300   # Raises ValueError: Temperature cannot be below absolute zero
```

## Static Methods and Class Methods
Python classes can also have methods that don't operate on instances:

 - **Static methods**: Don't access instance or class data
 - **Class methods**: Can access and modify class-level data

```python
class MathHelper:
    pi = 3.14159
    
    def __init__(self, value):
        self.value = value
    
    def square(self):
        return self.value ** 2
    
    @staticmethod
    def is_prime(num):
        """Check if a number is prime"""
        if num < 2:
            return False
        for i in range(2, int(num**0.5) + 1):
            if num % i == 0:
                return False
        return True
    
    @classmethod
    def circle_area(cls, radius):
        """Calculate circle area using the class's PI value"""
        return cls.pi * radius ** 2
    
    @classmethod
    def update_pi(cls, new_pi):
        """Update the PI value for all instances"""
        cls.pi = new_pi

# Static method - doesn't need an instance
print(MathHelper.is_prime(17))  # Output: True
print(MathHelper.is_prime(15))  # Output: False

# Class method - works with class variables
print(MathHelper.circle_area(5))  # Output: 78.53975

# Create an instance for instance methods
math = MathHelper(8)
print(math.square())  # Output: 64

# Update class variable using class method
MathHelper.update_pi(3.14)
print(MathHelper.circle_area(5))  # Output: 78.5
```

Classes in Python allow you to create organized, reusable code that models real-world objects and concepts. As you've seen, they provide powerful features like inheritance, encapsulation, and properties that help you write cleaner, more maintainable code.
When designing classes, think about:

 - What attributes (data) the object should have
 - What actions (methods) the object should be able to perform
 - How objects will interact with each other
 - Whether you need inheritance relationships between classes

With these principles in mind, you're well on your way to building complex, object-oriented programs in Python. Thanks for reading and happy coding!