---
layout: post
title: Debugging Tips & Tricks
date: 2025-03-18
author: Erick Johnson
categories: Python
tags: [intro-to-programming, data-structures]
---

# Debugging Tips & Tricks for new developers

Welcome programming students! Debugging is an essential skill for every programmer. It involves identifying, analyzing, and fixing errors in your code. In this post, we’ll explore what debugging is, how to avoid common pitfalls, and practical tips to make your debugging process more efficient.

---

## What is Debugging?

### Bug
A **bug** is an error, flaw, or fault in your code that causes it to behave unexpectedly or produce incorrect results. Bugs can range from simple typos to complex logic errors.

### Debugging
**Debugging** is the process of finding and resolving these bugs. It’s not just about fixing errors but also about improving the overall quality and reliability of your code.

---

## What Counts as a Bug?

Bugs can manifest in various ways. Here are some common types:

1. **Python Errors**: These include syntax errors, runtime errors, and exceptions that prevent your code from running or functioning correctly.
2. **Performance Problems**: Your code might run without errors but be inefficient, slow, or resource-intensive.
3. **Incorrect Instructions/Output**: Your code might produce unexpected or incorrect results, even if it runs without errors.

---

## Avoid Debugging By…

### 1. Understanding the Problem
Before writing code, take time to fully understand the problem you’re trying to solve. Break it down into smaller, manageable tasks and plan your approach. Trust me, your time in the long run will be better spent writing code that doesn't need to be rewritten.

### 2. Starting Small
Write and test small pieces of code incrementally. A good rule of thumb is to start by testing every few lines if possible. This makes it easier to identify where errors occur and confirms that each part of your program works as expected before moving on to the next.

### 3. Finding Small Improvements
Continuously refine and improve your code. Look for ways to simplify logic, remove redundancy, and enhance readability. Following best practices can help prevent *your* bugs from creeping in.

---

## Debugging Tips

### Everybody is a Suspect… Except for Python
When debugging, assume that the issue lies in your code, not in Python itself. Python is a well-tested language, so errors are more likely due to logic mistakes or incorrect assumptions.

### Don’t Make Too Many Assumptions
Avoid assuming that your code works the way *you* think it should. Test your assumptions by printing out variables, intermediate results, or using debugging tools.

```python
x = 10
y = 5
print(f"x: {x}, y: {y}")  # Confirm values of x and y
result = x / y
print(f"Result: {result}")
```
### Play Detective
Look for clues in error messages, logs, and outputs. Trace the flow of your program to identify where things go wrong.

```python
File "c:\Users\ejohnson\Documents\intro_to_programming\debugging\debugging_practice1.py", line 14 ## This will tell me which line is problematic
    y = int(input("Enter another number: )) ## The arrow underneath this line of code is a hint 
                  ^
SyntaxError: unterminated string literal (detected at line 14) ## Each word here is a clue: "unterminated", "string", "literal"...
```

---

## Types of Errors
### Syntax Errors
**Syntax** refers to the rules and structure of a programming language. Syntax errors occur when your code violates these rules.

Example:
```python
print("1. Addition (+))  # Missing closing quote
```
This will raise a SyntaxError because the string is not properly closed.

Fix:
```python
print("1. Addition (+)")  # Corrected syntax
```
Syntax errors are usually easy to spot because Python will point them out with clear error messages. However, they can sometimes be tricky, especially if the error message is unclear.

---

### Runtime Errors
Runtime errors occur after your code has passed the initial syntax check and begins executing. These are also called exceptions.

Common causes include:
* *Illegal operations:* For example, dividing by zero.
* Misspelled or incorrectly capitalized variable/function names.
* *Unexpected input:* For example, passing a string to a function that expects an integer.

Example:
```python
10 * (1/0)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
    10 * (1/0)
          ~^~
ZeroDivisionError: division by zero
4 + spam*3
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
    4 + spam*3
        ^^^^
NameError: name 'spam' is not defined
'2' + 2
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
    '2' + 2
    ~~~~^~~
TypeError: can only concatenate str (not "int") to str
```
---

### Semantic (Logic) Errors
Semantic errors occur when your code runs without errors but produces incorrect results. These are often the hardest to debug because there are no error messages to guide you.

Example:
```python
def calculate_area(length, width):
    return length + width  # Incorrect logic; should be length * width

area = calculate_area(5, 10)
print(f"Area: {area}")  # Outputs 15 instead of 50
```

Fix:
Carefully review your logic and use test cases to verify correctness.

```python
def calculate_area(length, width):
    return length * width  # Corrected logic

area = calculate_area(5, 10)
print(f"Area: {area}")  # Outputs 50
```

## Try-Except: A Smarter Error-Handling Approach
The try-except block is a powerful tool for handling errors gracefully. It allows you to test a block of code for errors and handle them without crashing your program.

Example:
```python
try:
    num1 = int(input("Enter a number: "))
    num2 = int(input("Enter another number: "))
    result = num1 / num2
    print(f"Result: {result}")
except ValueError:
    print("Error: Please enter valid numbers.")
except ZeroDivisionError:
    print("Error: Cannot divide by zero.")
else:
    print("Division successful!")
finally:
    print("Execution complete.")
```

* *try:* Tests the code for errors.
* *except:* Handles specific errors.
* *else:* Runs if no errors occur.
* *finally:* Runs regardless of whether an error occurred.

### Raising Exceptions
You can raise custom or predefined exceptions to catch potential issues early.

Example:
```python
x = -1
if x < 0:
    raise ValueError("Error: Negative numbers are not allowed.")
```

This helps you enforce rules and catch problems before they cause unexpected behavior.

## Use the Debugger!
Debugging tools can save you a lot of time and effort. If you’re using Visual Studio Code (VSCode), follow these steps:

1. Install the Python VSCode Extension.
2. Open your Python file.
3. Click “Run and Debug” in the sidebar.
4. Choose Python Debug as the configuration.
5. Start setting breakpoints on suspicious lines of code by clicking to the left of the line numbers.
6. Click "Run and Debug" to step through your code, inspect variables, and identify issues.

--- 

Debugging is a critical skill that improves with practice. By understanding the types of errors, using tools like try-except blocks and debuggers, and following best practices, you can become a more effective and efficient programmer. Remember, the goal is not just to fix bugs but to write clean, reliable, and maintainable code.

Check out these resources for more examples and more detailed explainations:
* [The Official Python Docs](https://docs.python.org/3/tutorial/errors.html)
* [Python Try-Except Blocks on W3](https://www.w3schools.com/python/python_try_except.asp)

Happy debugging!