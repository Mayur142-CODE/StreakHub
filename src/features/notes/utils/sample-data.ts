import { createNotesItem } from '@/services/notes'

export async function seedSampleNotesStructure() {
  // 1. Root Folders
  const programming = await createNotesItem({
    name: 'Programming',
    type: 'folder',
    parent_id: null,
  })

  const dataScience = await createNotesItem({
    name: 'Data Science',
    type: 'folder',
    parent_id: null,
  })

  const dsa = await createNotesItem({
    name: 'DSA',
    type: 'folder',
    parent_id: null,
  })

  const personal = await createNotesItem({
    name: 'Personal Notes',
    type: 'folder',
    parent_id: null,
  })

  // 2. Subfolders of Programming
  const cpp = await createNotesItem({
    name: 'C++',
    type: 'folder',
    parent_id: programming.id,
  })

  const java = await createNotesItem({
    name: 'Java',
    type: 'folder',
    parent_id: programming.id,
  })

  const python = await createNotesItem({
    name: 'Python',
    type: 'folder',
    parent_id: programming.id,
  })

  // 3. Files in C++
  await createNotesItem({
    name: 'Arrays.txt',
    type: 'file',
    parent_id: cpp.id,
    content: `# C++ Arrays Notes

An array is a collection of elements of the same data type stored contiguously in memory.

Key Concepts:
- Fixed size determined at compile-time (e.g. int arr[10];)
- Zero-indexed access: arr[0] is the first element
- Time Complexity:
  * Access: O(1)
  * Search: O(n) unsorted, O(log n) sorted
  * Insert / Delete: O(n)
- Dynamic arrays: std::vector provides automatic resizing and bounds safety.`,
  })

  await createNotesItem({
    name: 'Pointers.txt',
    type: 'file',
    parent_id: cpp.id,
    content: `# C++ Pointers and Memory Management

Pointers store the memory address of another variable.

Syntax:
  int val = 42;
  int* ptr = &val;
  std::cout << *ptr; // Dereference: 42

Smart Pointers (C++11):
- std::unique_ptr: Exclusive ownership of dynamically allocated resource.
- std::shared_ptr: Reference-counted shared ownership.
- std::weak_ptr: Non-owning observer preventing circular references.`,
  })

  await createNotesItem({
    name: 'OOP.txt',
    type: 'file',
    parent_id: cpp.id,
    content: `# Object-Oriented Programming (OOP) in C++

Four Pillars of OOP:
1. Encapsulation: Bundling data and functions within classes; restricting access via private/protected.
2. Abstraction: Hiding implementation details and exposing only essential interfaces.
3. Inheritance: Reusing code and forming hierarchies using base and derived classes.
4. Polymorphism: Compile-time (function overloading, templates) and runtime (virtual functions, vtable).`,
  })

  // 4. Files in Java
  await createNotesItem({
    name: 'Collections.txt',
    type: 'file',
    parent_id: java.id,
    content: `# Java Collections Framework

Hierarchy:
- Collection (Interface)
  ├── List: Ordered, allows duplicates (ArrayList, LinkedList, Vector)
  ├── Set: Unique elements (HashSet, LinkedHashSet, TreeSet)
  └── Queue: FIFO or priority ordering (ArrayDeque, PriorityQueue)

- Map (Key-Value pairs):
  ├── HashMap: O(1) average lookup, unordered
  ├── LinkedHashMap: Maintains insertion order
  └── TreeMap: Sorted by keys (Red-Black tree, O(log n))`,
  })

  // 5. Files in Python
  await createNotesItem({
    name: 'NumPy.txt',
    type: 'file',
    parent_id: python.id,
    content: `# NumPy Essentials

Fast n-dimensional array computing in Python.

import numpy as np

# Creating Arrays:
a = np.array([1, 2, 3])
zeros = np.zeros((3, 3))
grid = np.linspace(0, 10, 5)

# Vectorized Operations:
squared = a ** 2
dot_prod = np.dot(a, a)
print("Shape:", a.shape, "Mean:", a.mean())`,
  })

  await createNotesItem({
    name: 'Pandas.txt',
    type: 'file',
    parent_id: python.id,
    content: `# Pandas DataFrames

Powerful data manipulation and tabular analysis.

import pandas as pd

# Creating DataFrame:
df = pd.DataFrame({
    'Language': ['Python', 'C++', 'Java'],
    'StreakDays': [45, 30, 20]
})

# Filtering & Aggregation:
active = df[df['StreakDays'] >= 25]
avg_streak = df['StreakDays'].mean()`,
  })

  // 6. Subfolders of Data Science
  const ml = await createNotesItem({
    name: 'Machine Learning',
    type: 'folder',
    parent_id: dataScience.id,
  })

  const stats = await createNotesItem({
    name: 'Statistics',
    type: 'folder',
    parent_id: dataScience.id,
  })

  await createNotesItem({
    name: 'Regression.txt',
    type: 'file',
    parent_id: ml.id,
    content: `# Linear and Logistic Regression

Linear Regression:
- Models relationship between continuous dependent variable Y and independent variables X.
- Hypothesis: y_hat = w*x + b
- Loss function: Mean Squared Error (MSE)
- Optimization: Gradient Descent or Normal Equation

Logistic Regression:
- Used for binary classification.
- Sigmoid activation maps real values to probability [0, 1].
- Loss function: Binary Cross-Entropy / Log Loss.`,
  })

  await createNotesItem({
    name: 'Classification.txt',
    type: 'file',
    parent_id: ml.id,
    content: `# Supervised Classification Algorithms

Common Classifiers:
1. Decision Trees: Simple to interpret, prone to overfitting without pruning.
2. Random Forests: Ensemble of bagging trees reducing variance.
3. Support Vector Machines (SVM): Finds hyperplane maximizing margin between classes.
4. K-Nearest Neighbors (KNN): Non-parametric lazy learner based on distance metrics.`,
  })

  await createNotesItem({
    name: 'Probability.txt',
    type: 'file',
    parent_id: stats.id,
    content: `# Probability Foundations for Engineers

Key Theorems:
- Bayes' Theorem: P(A|B) = [P(B|A) * P(A)] / P(B)
- Law of Total Probability
- Expectation and Variance:
  Var(X) = E[X^2] - (E[X])^2

Distributions:
- Discrete: Bernoulli, Binomial, Poisson
- Continuous: Normal (Gaussian), Uniform, Exponential`,
  })

  // 7. Files in DSA
  await createNotesItem({
    name: 'Trees.txt',
    type: 'file',
    parent_id: dsa.id,
    content: `# Tree Data Structures

Binary Trees and Binary Search Trees (BST):
- BST Invariant: left < root < right
- Traversals:
  * In-Order: Left -> Root -> Right (yields sorted order in BST)
  * Pre-Order: Root -> Left -> Right
  * Post-Order: Left -> Right -> Root
  * Level-Order: BFS using queue

Balanced Trees:
- AVL Trees (strictly balanced, height factor in {-1, 0, 1})
- Red-Black Trees (used in C++ std::map and Java TreeMap)`,
  })

  await createNotesItem({
    name: 'Graphs.txt',
    type: 'file',
    parent_id: dsa.id,
    content: `# Graph Algorithms

Representations:
- Adjacency Matrix (O(V^2) space, O(1) edge lookup)
- Adjacency List (O(V + E) space, optimal for sparse graphs)

Essential Algorithms:
- Breadth-First Search (BFS): Shortest path in unweighted graphs
- Depth-First Search (DFS): Cycle detection, topological sorting
- Dijkstra's Algorithm: Shortest path with non-negative weights (O((V + E) log V))
- Bellman-Ford: Handles negative edge weights
- Minimum Spanning Tree: Kruskal's (Union-Find) and Prim's algorithm`,
  })

  // 8. Files in Personal Notes
  await createNotesItem({
    name: 'Ideas.txt',
    type: 'file',
    parent_id: personal.id,
    content: `# StreakHub Ideas and Goals

- Maintain daily coding streaks for 100 days.
- Complete 2 LeetCode problems every morning.
- Build microservices architecture with Go and Docker.
- Learn Rust memory safety model and borrow checker.
- Create automated flashcard review from notes.`,
  })
}
