---
layout: post
title: "Stacks, Queues and Trees in Python"
date: 2025-03-13
author: Erick Johnson
categories: Python 
tags: data-structures
---

# Understanding Data Structures: Stacks, Queues, and Trees

Welcome! We've been exploring how complex data structures are fundamental to computer science and software development. They provide organized ways to store and manage data, enabling efficient access, modification, and problem-solving. In this post, we’ll explore three essential data structures: **stacks**, **queues**, and **trees**. We’ll also demonstrate their implementation in Python using practical examples.

---

## Stacks: Last In, First Out (LIFO)

*Check out the [“Next Level Coding Concepts”](https://docs.google.com/presentation/d/16nFt2lmLWZiKAN2i8H8HorkJ8vB_CsmR42WXfKEaxYI/edit?usp=sharing) presentation to learn more about how a stack works.*

A **stack** is a linear data structure that follows the **Last In, First Out (LIFO)** principle. I like to think of a pile of cards: You can only add cards to the top of the pile, and you draw them from the top as well. Stacks are commonly used in scenarios like managing function calls (the call stack), undo operations, and parsing expressions.

While Python lists can be used to implement stacks, they are not optimized for stack operations. Instead, the `deque` (double-ended queue) from the `collections` module is a more efficient choice.

Here’s how to implement a stack using `deque`:

```python
from collections import deque

# Initialize a stack
stack = deque()

# Add items to the stack
stack.append('a')  # Push 'a' onto the stack
stack.append('b')  # Push 'b' onto the stack

# Remove items from the stack
print(stack.pop())  # Output: 'b' (LIFO)
print(stack.pop())  # Output: 'a'
```
Read more about stacks at this [GeeksforGeeks article](https://www.geeksforgeeks.org/stack-in-python/).

---

## Queues: First In, First Out (FIFO)

A **queue** is another linear data structure, but it follows the **First In, First Out (FIFO)** principle. Think of a queue as a line at a ticket counter: the first person in line is the first to be served. Queues are useful in scenarios like task scheduling, print job management, and breadth-first search algorithms.

Like stacks, queues can be implemented using Python’s `deque` for better performance. Here’s an example:

```python
from collections import deque

# Initialize a queue
queue = deque()

# Add items to the queue
queue.append('a')  # Enqueue 'a'
queue.append('b')  # Enqueue 'b'

# Remove items from the queue
print(queue.popleft())  # Output: 'a' (FIFO)
print(queue.popleft())  # Output: 'b'
```
For more details on queues, check out the [GeeksforGeeks article](https://www.geeksforgeeks.org/queue-in-python/).

---

## Trees: Hierarchical Data Structures

A **tree** is a non-linear data structure that represents data hierarchically. Each element in a tree is called a **node**, and nodes are connected by edges. A parent node can have multiple child nodes, but each child node has only one parent (except the root node, which has no parent). Trees are used in file systems, organizational charts, and database indexing.

Unlike other languages (like Java), Python does not have a built-in tree data structure. Instead, the `anytree` library provides an easy way to create and visualize trees. Here’s an example of a family tree:

```python
from anytree import Node, RenderTree

# Create nodes
mr_j = Node("Mr. Johnson")
data_structures = Mode("Data Structures", parent=mr_j)
itp = Mode("Intro to Programming", parent=mr_j)
web_design = Mode("Web Design", parent=mr_j)
phanuel = Node("Phanuel", parent=web_design)
anthony = Node("Anthony", parent=data_structures)
frank = Node("Frank", parent=itp)
frank2 = Node("Frank", parent=web_design)
kristian = Node("Kristian", parent=data_structures)
jeannine = Node("Jeannine", parent=web_design)
samuel = Node("Samuel", parent=itp)
jimmy = Node("Jimmy", parent=data_tructures)
prince = Node("Prince", parent=itp)

# Render the tree
for pre, fill, node in RenderTree(mr_j):
    print(f"{pre}{node.name}")
```

This code creates a family tree and prints it in a hierarchical format. Trees are powerful tools for modeling relationships and organizing data.

Note that there are several kinds of trees with different use cases. We'll explore how we can manipulate large quantities of data with the right tools in order to solve complex problems in the best way possible.

For further reading, check out these resources:

* [Stacks in Python](https://www.geeksforgeeks.org/stack-in-python/)
* [Queues in Python](https://www.geeksforgeeks.org/queue-in-python/)
* [AnyTree Docs](https://anytree.readthedocs.io/en/latest/)