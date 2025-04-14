---
layout: post
title: Functions & Modules in Python
date: 2025-04-13
author: Erick Johnson
categories: Python
tags: [intro-to-programming, data-structures]
---

# Functions & Modules in Python

At this point in your programming journey, you've become familiar with reading and writing the basics. You should be able to understand the core concepts of writing scripts that accomplish a small task - and that's great!

Softtware development in the real world is almost always in the context of a larger system. As computer scientists, we need to be able to break down the larger, abstract puzzle into smaller pieces.

Imagine you're building a video game. If you just wrote one huge script handling every aspect of the game, you'd end up with:

 - Probably a ridiculously long script
 - A debugging nightmare
 - Something that would be hard for other developers to understand
 - A lot of extra work to expand or modify your game in the future

Instead, let's break down the bigger ideas into bite-sized pieces that accomplish a single task. These are called **functions**. In Python, you can define a function using `def`. Developers all over the world expect to read and write code that looks like this:

```python
def move_character(direction, speed):
    # Code to move character on screen
    
def attack_enemy(weapon_type, enemy_health):
    # Code for combat calculations
    
def open_inventory():
    # Code to display inventory screen
    
def save_game(player_data):
    # Code to save game state
```

This design paradigm is called **Top-Down Design**. We use it everywhere in the professional world for all kinds of projects big and small. Note that proper function design means confining a function to a *single* task. It can be tempting to take shortcuts and cram more code into a single function call, but its always best to just break it down further. 

After reducing our big-picture game into bite-sized chunks, the main gameplay loop might look something like this:

```python
while game_running:
    player_input = get_player_input()
    
    if player_input == "move":
        move_character("north", player_speed)
    elif player_input == "attack":
        attack_enemy("sword", enemy.health)
    elif player_input == "inventory":
        open_inventory()
    elif player_input == "save":
        save_game(player)
```

This approach has many benefits:

 - Each function has a single responsibility
 - Code is more readable and organized
 - Functions can be reused (we don't need to write movement code multiple times)
 - Testing becomes easier as we can test each function separately
 - Collaboration improves as different team members can work on different functions
 - Maintenance is simpler since changes to one function don't affect others

Functions are the building blocks that turn complex problems into manageable pieces - essential for any project bigger than a few dozen lines!

## So, what *is* a Function?
A function is simply *a block of code which only runs when you tell it to* - just like in math class. Think of functions as little machines that take inputs, do something with them, and potentially provide an output.

### Defining Functions with def
To create a function, use the keyword def followed by a name and parameters:
```python
def simple_calc(num1, num2):
    # Function code goes here
```
Python functions are flexible:

 - Use any type of variable as parameters
 - Call with or without arguments depending on your design
 - Functions may require several parameters to run properly

If you're not sure how many parameters you'll need, use the asterisk:
```python
def simple_calc(*nums):
    # Now nums will be a tuple of all arguments passed
```

### Keyword Arguments
You can send arguments as key-value pairs to make your code more readable:
```python
def simple_calc(num1, num2):
    # Function code using num1 and num2
    
# Call with keyword arguments
simple_calc(num1=10, num2=5)
```

This way, the order doesn't matter and your code becomes easier to understand!

### Arbitrary Keyword Arguments
If you need ultimate flexibility, use the double asterisk (**) to receive arguments as a dictionary:

```python
def flname(**student):
    print("His last name is " + student["lname"])
    
flname(fname="Berthier", lname="Lombo")
```

### Default Parameters
Make your functions more forgiving by defining default values:
```python
def name_func(fname="Kristian"):
    print("His/her first name is " + fname)

name_func("Prince")  # Uses "Prince"
name_func()           # Uses default "Kristian" 
name_func("Jeannine") # Uses "Jeannine"
```

### Return Statements
Some functions become much more useful when they give something back. Use `return` to send data back to the caller:
```python
def name_func(fname="Jimmy"):
    fname_string = "His/her first name is " + fname
    return fname_string

first_name1 = name_func("Frank")
first_name2 = name_func()
first_name3 = name_func("Phanuel")
```

## Python Modules
Think of Python modules as pre-built toolboxes:

**Module**: A library of Python classes and functions that can be imported
**Package**: A collection of related modules

You can download modules via PIP (or PyPI) or just make your own!

### Using Third Party Modules
First, download the package you want via PIP:
`pip install numpy`
Some key concepts to understand:

**Virtual Environment**: A separate location for specific versions of installed packages
**Dependency**: Software components your project needs to function properly

Use installed modules by importing them:
```python
import requests
from bs4 import BeautifulSoup

# Now you can use these modules
link_text = requests.get(link).text
soup = BeautifulSoup(link_text, 'html.parser')
```
### Documentation == Your Best Friend

**Documentation**: Detailed breakdown explaining how to use the software
 - Usually found online or via the `help` function in the terminal
 - When in doubt, always check the docs!

*Docs will (nearly) always be more accurate than AI.*

### Helpful Documentation Links

 - Python 3.13: https://docs.python.org/3/index.html
 - VSCode: https://code.visualstudio.com/docs
 - pip: https://pip.pypa.io/en/stable/ or simply `pip help`
 - Pandas: https://pandas.pydata.org/docs/
 - Numpy: https://numpy.org/doc/2.1/

And so much more you'll find along the way. Happy function writing!
Mr. Johnson