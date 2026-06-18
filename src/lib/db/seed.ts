import type { AssessmentQuestion, Concept } from "@/lib/types";

export const DEFAULT_SUBJECT = "Python Programming Fundamentals";

export const concepts: Concept[] = [
  {
    id: "variables",
    subject: DEFAULT_SUBJECT,
    name: "Variables and Data Types",
    description: "Store values and recognize strings, numbers, booleans, and basic conversions.",
    difficulty: 1,
    prerequisites: []
  },
  {
    id: "operators",
    subject: DEFAULT_SUBJECT,
    name: "Operators",
    description: "Use arithmetic, comparison, and logical operators to build expressions.",
    difficulty: 1,
    prerequisites: ["variables"]
  },
  {
    id: "conditionals",
    subject: DEFAULT_SUBJECT,
    name: "Conditionals",
    description: "Make decisions with if, elif, and else blocks.",
    difficulty: 2,
    prerequisites: ["variables", "operators"]
  },
  {
    id: "loops",
    subject: DEFAULT_SUBJECT,
    name: "Loops",
    description: "Repeat work with for loops, while loops, and ranges.",
    difficulty: 2,
    prerequisites: ["conditionals"]
  },
  {
    id: "functions",
    subject: DEFAULT_SUBJECT,
    name: "Functions",
    description: "Package reusable logic with parameters and return values.",
    difficulty: 2,
    prerequisites: ["variables", "conditionals"]
  },
  {
    id: "lists",
    subject: DEFAULT_SUBJECT,
    name: "Lists",
    description: "Store ordered collections and work with indexes, loops, and list methods.",
    difficulty: 2,
    prerequisites: ["loops"]
  },
  {
    id: "dictionaries",
    subject: DEFAULT_SUBJECT,
    name: "Dictionaries",
    description: "Store key-value pairs and retrieve data by meaningful names.",
    difficulty: 3,
    prerequisites: ["lists"]
  },
  {
    id: "strings",
    subject: DEFAULT_SUBJECT,
    name: "Strings",
    description: "Slice, format, search, and transform text values.",
    difficulty: 2,
    prerequisites: ["variables", "loops"]
  },
  {
    id: "debugging",
    subject: DEFAULT_SUBJECT,
    name: "Basic Debugging",
    description: "Read errors, trace code, and fix small logic mistakes.",
    difficulty: 3,
    prerequisites: ["conditionals", "loops", "functions"]
  }
];

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "q_variables_easy_output",
    conceptId: "variables",
    question: "What is the output of this code?\nx = 10\nprint(x)",
    type: "multiple_choice",
    options: ["x", "10", "print", "error"],
    correctAnswer: "10",
    explanation: "x stores the value 10, so print(x) outputs 10.",
    difficulty: 1
  },
  {
    id: "q_variables_medium_type",
    conceptId: "variables",
    question: "Which value is a Python string?",
    type: "multiple_choice",
    options: ["42", "\"42\"", "True", "3.14"],
    correctAnswer: "\"42\"",
    acceptedAnswers: ["42 in quotes", "\"42\"", "'42'"],
    explanation: "Text in quotes is a string, even when the characters look like a number.",
    difficulty: 2
  },
  {
    id: "q_variables_hard_cast",
    conceptId: "variables",
    question: "Fill in the blank to convert text into an integer: age = ___(\"18\")",
    type: "fill_blank",
    correctAnswer: "int",
    acceptedAnswers: ["int", "int()"],
    explanation: "int(\"18\") converts the string into the integer 18.",
    difficulty: 3
  },
  {
    id: "q_operators_easy_symbol",
    conceptId: "operators",
    question: "Which operator checks whether two values are equal in Python?",
    type: "multiple_choice",
    options: ["=", "==", "!=", "equals"],
    correctAnswer: "==",
    explanation: "The == operator compares values. A single = assigns a value.",
    difficulty: 1
  },
  {
    id: "q_operators_medium_precedence",
    conceptId: "operators",
    question: "What is the output?\nprint(2 + 3 * 4)",
    type: "multiple_choice",
    options: ["20", "14", "24", "error"],
    correctAnswer: "14",
    explanation: "Multiplication runs before addition, so 3 * 4 is 12, then 2 + 12 is 14.",
    difficulty: 2
  },
  {
    id: "q_operators_hard_logic",
    conceptId: "operators",
    question: "What does this expression evaluate to?\n(5 > 3) and (2 > 4)",
    type: "code_output",
    options: ["True", "False", "2", "error"],
    correctAnswer: "False",
    explanation: "and is only True when both sides are True. The second comparison is False.",
    difficulty: 3
  },
  {
    id: "q_conditionals_easy_keyword",
    conceptId: "conditionals",
    question: "Which keyword is used for decision-making in Python?",
    type: "multiple_choice",
    options: ["for", "if", "def", "list"],
    correctAnswer: "if",
    explanation: "if starts a conditional branch.",
    difficulty: 1
  },
  {
    id: "q_conditionals_medium_output",
    conceptId: "conditionals",
    question: "What prints?\nscore = 75\nif score >= 60:\n    print(\"pass\")\nelse:\n    print(\"retry\")",
    type: "multiple_choice",
    options: ["pass", "retry", "score", "nothing"],
    correctAnswer: "pass",
    explanation: "75 is at least 60, so the if branch runs.",
    difficulty: 2
  },
  {
    id: "q_conditionals_hard_elif",
    conceptId: "conditionals",
    question: "What prints?\nx = 3\nif x > 5:\n    print(\"high\")\nelif x > 2:\n    print(\"mid\")\nelse:\n    print(\"low\")",
    type: "code_output",
    options: ["high", "mid", "low", "error"],
    correctAnswer: "mid",
    explanation: "x is not greater than 5, but it is greater than 2, so elif runs.",
    difficulty: 3
  },
  {
    id: "q_loops_easy_range",
    conceptId: "loops",
    question: "What does range(3) produce in a for loop?",
    type: "multiple_choice",
    options: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3 only"],
    correctAnswer: "0, 1, 2",
    acceptedAnswers: ["0, 1, 2", "0 1 2", "0,1,2"],
    explanation: "range(3) starts at 0 and stops before 3.",
    difficulty: 1
  },
  {
    id: "q_loops_medium_output",
    conceptId: "loops",
    question: "What is printed?\nfor i in range(2):\n    print(i)",
    type: "code_output",
    options: ["0 and 1", "1 and 2", "0, 1, 2", "2 only"],
    correctAnswer: "0 and 1",
    acceptedAnswers: ["0 and 1", "0, 1", "0 1", "0\n1"],
    explanation: "The loop runs for i = 0 and i = 1.",
    difficulty: 2
  },
  {
    id: "q_loops_hard_accumulator",
    conceptId: "loops",
    question: "What is total after this code?\ntotal = 0\nfor n in [1, 2, 3]:\n    total = total + n",
    type: "short_answer",
    correctAnswer: "6",
    explanation: "The loop adds 1, then 2, then 3, so total becomes 6.",
    difficulty: 3
  },
  {
    id: "q_functions_easy_keyword",
    conceptId: "functions",
    question: "Which keyword is used to define a function in Python?",
    type: "multiple_choice",
    options: ["function", "def", "return", "class"],
    correctAnswer: "def",
    explanation: "Python function definitions start with def.",
    difficulty: 1
  },
  {
    id: "q_functions_medium_return",
    conceptId: "functions",
    question: "What is printed?\ndef add(a, b):\n    return a + b\nprint(add(2, 3))",
    type: "multiple_choice",
    options: ["add", "5", "2 3", "None"],
    correctAnswer: "5",
    explanation: "add(2, 3) returns 5, and print displays it.",
    difficulty: 2
  },
  {
    id: "q_functions_hard_scope",
    conceptId: "functions",
    question: "Fill in the blank: A value passed into a function is called an ___.",
    type: "fill_blank",
    correctAnswer: "argument",
    acceptedAnswers: ["argument", "parameter"],
    explanation: "Learners often use argument and parameter loosely; either wording shows the idea.",
    difficulty: 3
  },
  {
    id: "q_lists_easy_index",
    conceptId: "lists",
    question: "What is the output?\ncolors = [\"red\", \"blue\"]\nprint(colors[0])",
    type: "multiple_choice",
    options: ["red", "blue", "0", "error"],
    correctAnswer: "red",
    explanation: "Python list indexes start at 0, so colors[0] is red.",
    difficulty: 1
  },
  {
    id: "q_lists_medium_append",
    conceptId: "lists",
    question: "Which method adds an item to the end of a list?",
    type: "multiple_choice",
    options: ["push", "append", "add_last", "insert_end"],
    correctAnswer: "append",
    explanation: "list.append(value) adds one item to the end.",
    difficulty: 2
  },
  {
    id: "q_lists_hard_loop",
    conceptId: "lists",
    question: "What prints?\nnums = [2, 4]\nfor n in nums:\n    print(n * 2)",
    type: "code_output",
    options: ["2 and 4", "4 and 8", "nums twice", "error"],
    correctAnswer: "4 and 8",
    acceptedAnswers: ["4 and 8", "4, 8", "4 8", "4\n8"],
    explanation: "The loop doubles each item: 2 becomes 4, and 4 becomes 8.",
    difficulty: 3
  },
  {
    id: "q_dictionaries_easy_key",
    conceptId: "dictionaries",
    question: "Which dictionary stores a student's age correctly?",
    type: "multiple_choice",
    options: ["[\"age\", 12]", "{\"age\": 12}", "(\"age\", 12)", "{12: age}"],
    correctAnswer: "{\"age\": 12}",
    explanation: "Dictionaries use key: value pairs inside braces.",
    difficulty: 1
  },
  {
    id: "q_dictionaries_medium_lookup",
    conceptId: "dictionaries",
    question: "What prints?\nstudent = {\"name\": \"Maya\"}\nprint(student[\"name\"])",
    type: "multiple_choice",
    options: ["student", "name", "Maya", "error"],
    correctAnswer: "Maya",
    explanation: "The key \"name\" retrieves the value \"Maya\".",
    difficulty: 2
  },
  {
    id: "q_dictionaries_hard_missing",
    conceptId: "dictionaries",
    question: "Which method can safely read a key and return None if it is missing?",
    type: "multiple_choice",
    options: ["read", "find", "get", "lookup"],
    correctAnswer: "get",
    explanation: "dict.get(key) returns the value or None by default when the key is absent.",
    difficulty: 3
  },
  {
    id: "q_strings_easy_concat",
    conceptId: "strings",
    question: "What prints?\nprint(\"Py\" + \"thon\")",
    type: "multiple_choice",
    options: ["Py thon", "Python", "Py+thon", "error"],
    correctAnswer: "Python",
    explanation: "The + operator joins strings together.",
    difficulty: 1
  },
  {
    id: "q_strings_medium_index",
    conceptId: "strings",
    question: "What is word[1] if word = \"cat\"?",
    type: "multiple_choice",
    options: ["c", "a", "t", "cat"],
    correctAnswer: "a",
    explanation: "String indexes start at 0, so index 1 is the second character.",
    difficulty: 2
  },
  {
    id: "q_strings_hard_method",
    conceptId: "strings",
    question: "Fill in the blank to make text uppercase: name.___()",
    type: "fill_blank",
    correctAnswer: "upper",
    acceptedAnswers: ["upper", "upper()"],
    explanation: "upper() returns an uppercase version of the string.",
    difficulty: 3
  },
  {
    id: "q_debugging_easy_error",
    conceptId: "debugging",
    question: "What kind of issue is most likely here?\nprint(name)\n# name was never created",
    type: "multiple_choice",
    options: ["NameError", "IndentationError", "SyntaxError", "No issue"],
    correctAnswer: "NameError",
    explanation: "Python raises NameError when code refers to a name that does not exist.",
    difficulty: 1
  },
  {
    id: "q_debugging_medium_trace",
    conceptId: "debugging",
    question: "What should you check first when a loop never stops?",
    type: "multiple_choice",
    options: ["The file name", "The loop condition", "The print color", "The import order"],
    correctAnswer: "The loop condition",
    explanation: "Infinite loops usually happen when the stop condition never becomes false.",
    difficulty: 2
  },
  {
    id: "q_debugging_hard_logic",
    conceptId: "debugging",
    question: "A program runs without errors but gives the wrong answer. What type of bug is this?",
    type: "multiple_choice",
    options: ["Syntax bug", "Logic bug", "Import bug", "Keyboard bug"],
    correctAnswer: "Logic bug",
    explanation: "A logic bug means code runs, but the steps do not match the intended reasoning.",
    difficulty: 3
  }
];
