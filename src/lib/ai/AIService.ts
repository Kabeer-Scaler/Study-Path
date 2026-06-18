import { assessmentQuestions } from "@/lib/db/seed";
import { normalizeText } from "@/lib/db/store";
import { validateLessonContent } from "@/lib/adaptive/validationEngine";
import {
  callLLMJson,
  isLessonContent,
  isTutorPayload
} from "@/lib/ai/provider";
import {
  buildLessonUserPrompt,
  normalizePreferredStyle,
  type LessonMode
} from "@/lib/ai/promptBuilder";
import { LESSON_AUTHOR_SYSTEM_PROMPT, SOCRATIC_TUTOR_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  buildForbiddenTexts,
  buildTutorUserPrompt,
  classifyTutorResponse,
  resolveTutorStrategy,
  type TutorStrategy
} from "@/lib/ai/tutorPolicy";

export {
  buildForbiddenTexts,
  classifyTutorResponse,
  resolveTutorStrategy,
  type TutorStrategy
} from "@/lib/ai/tutorPolicy";
import type {
  AssessmentQuestion,
  Concept,
  LessonContent,
  QuestionType,
  TutorMessage
} from "@/lib/types";

const conceptLessonCopy: Record<
  string,
  {
    objective: string;
    explanation: string;
    analogy: string;
    example: string;
    codeExample: string;
    commonMistake: string;
    practiceQuestion: LessonContent["practiceQuestion"];
    quiz: LessonContent["quiz"];
  }
> = {
  variables: {
    objective: "Store values in names and recognize common Python data types.",
    explanation:
      "A variable is a name that points to a value. Python figures out the type from the value you assign, such as a number, string, or boolean.",
    analogy:
      "Think of a variable like a labeled box. The label is the variable name, and the value is what you put inside.",
    example: "name = \"Aarav\" stores text, while attempts = 3 stores a number.",
    codeExample: "score = 10\nname = \"Aarav\"\npassed = True\nprint(name, score, passed)",
    commonMistake:
      "Putting quotes around a number when you want to do math with it.",
    practiceQuestion: {
      question: "What value is stored in points after this code?",
      code: "points = 7",
      answer: "7",
      hint: "Look to the right side of the equals sign."
    },
    quiz: [
      {
        questionId: "lesson_variables_q1",
        question: "Which line creates a string variable?",
        type: "multiple_choice",
        options: ["age = 12", "age = \"12\"", "age == 12", "print(age)"],
        correctAnswer: "age = \"12\"",
        acceptedAnswers: ["age = \"12\"", "age = '12'"],
        explanation: "Quotes make the value text, so it is a string."
      },
      {
        questionId: "lesson_variables_q2",
        question: "What does print(x) show after x = 5?",
        type: "short_answer",
        correctAnswer: "5",
        explanation: "x points to 5, so print(x) displays 5."
      }
    ]
  },
  operators: {
    objective: "Use arithmetic, comparison, and logical operators in expressions.",
    explanation:
      "Operators are symbols or words that combine values. Python uses them for math, comparisons, and logic.",
    analogy:
      "Operators are like instructions between ingredients: add these, compare those, or check both conditions.",
    example: "2 + 3 makes 5, while score >= 60 checks whether score is high enough.",
    codeExample: "score = 72\npassed = score >= 60\nprint(passed)",
    commonMistake:
      "Using = when you mean ==. One assigns; the other compares.",
    practiceQuestion: {
      question: "What is the result of 4 * 2 + 1?",
      answer: "9",
      hint: "Multiplication happens before addition."
    },
    quiz: [
      {
        questionId: "lesson_operators_q1",
        question: "Which operator checks equality?",
        type: "multiple_choice",
        options: ["=", "==", "+", "and"],
        correctAnswer: "==",
        explanation: "== compares two values for equality."
      },
      {
        questionId: "lesson_operators_q2",
        question: "What does 10 > 3 evaluate to?",
        type: "short_answer",
        correctAnswer: "True",
        acceptedAnswers: ["true"],
        explanation: "10 is greater than 3, so the comparison is True."
      }
    ]
  },
  conditionals: {
    objective: "Choose which code runs by writing clear if, elif, and else branches.",
    explanation:
      "Conditionals let your program make decisions. Python checks a condition and runs the indented block when it is true.",
    analogy:
      "It is like a traffic signal: if the light is green, go; otherwise, wait.",
    example: "Use an if statement to print a message only when a score reaches the passing mark.",
    codeExample: "score = 75\nif score >= 60:\n    print(\"pass\")\nelse:\n    print(\"retry\")",
    commonMistake:
      "Forgetting the colon after the condition or forgetting indentation inside the branch.",
    practiceQuestion: {
      question: "Which branch runs when score is 45?",
      code: "if score >= 60:\n    print(\"pass\")\nelse:\n    print(\"retry\")",
      answer: "else / retry",
      hint: "Ask whether 45 is at least 60."
    },
    quiz: [
      {
        questionId: "lesson_conditionals_q1",
        question: "Which keyword starts a decision?",
        type: "multiple_choice",
        options: ["for", "if", "def", "list"],
        correctAnswer: "if",
        explanation: "if starts a conditional check."
      },
      {
        questionId: "lesson_conditionals_q2",
        question: "What prints when x = 2?\nif x > 3:\n    print(\"big\")\nelse:\n    print(\"small\")",
        type: "short_answer",
        correctAnswer: "small",
        explanation: "2 is not greater than 3, so the else branch runs."
      }
    ]
  },
  loops: {
    objective: "Repeat actions over a sequence using for loops and range.",
    explanation:
      "A loop repeats the same block of code. A for loop runs once for each item in a sequence.",
    analogy:
      "Think of a teacher checking homework for every student in a class.",
    example: "for i in range(3) prints 0, then 1, then 2.",
    codeExample: "for i in range(3):\n    print(i)",
    commonMistake:
      "Expecting range(3) to include 3. It stops before the ending number.",
    practiceQuestion: {
      question: "What values does this loop print?",
      code: "for i in range(3):\n    print(i)",
      answer: "0, 1, 2",
      hint: "Python starts counting at 0 and stops before 3."
    },
    quiz: [
      {
        questionId: "lesson_loops_q1",
        question: "What does range(2) produce?",
        type: "multiple_choice",
        options: ["0, 1", "1, 2", "0, 1, 2", "2 only"],
        correctAnswer: "0, 1",
        acceptedAnswers: ["0, 1", "0 1"],
        explanation: "range(2) starts at 0 and stops before 2."
      },
      {
        questionId: "lesson_loops_q2",
        question: "How many times does this loop run?\nfor item in [\"a\", \"b\", \"c\"]:\n    print(item)",
        type: "short_answer",
        correctAnswer: "3",
        explanation: "The list has three items, so the loop runs three times."
      }
    ]
  },
  functions: {
    objective: "Create reusable blocks of code with parameters and return values.",
    explanation:
      "A function packages steps under a name. You call it when you want those steps to run.",
    analogy:
      "A function is like a recipe card: give it ingredients, follow the steps, and get a result.",
    example: "A function named add can take two numbers and return their sum.",
    codeExample: "def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
    commonMistake:
      "Printing inside a function when the program really needs to return a value.",
    practiceQuestion: {
      question: "What does add(2, 3) return?",
      code: "def add(a, b):\n    return a + b",
      answer: "5",
      hint: "Replace a with 2 and b with 3."
    },
    quiz: [
      {
        questionId: "lesson_functions_q1",
        question: "Which keyword defines a function?",
        type: "multiple_choice",
        options: ["def", "func", "return", "if"],
        correctAnswer: "def",
        explanation: "Python uses def to define functions."
      },
      {
        questionId: "lesson_functions_q2",
        question: "What does return do?",
        type: "multiple_choice",
        options: [
          "Stops Python forever",
          "Sends a value back to the caller",
          "Creates a list",
          "Starts a loop"
        ],
        correctAnswer: "Sends a value back to the caller",
        explanation: "return gives the function's result back to the code that called it."
      }
    ]
  },
  lists: {
    objective: "Store multiple ordered values and process them with indexes and loops.",
    explanation:
      "A list holds several values in order. You can access items by index, append new items, and loop over the list.",
    analogy:
      "A list is like a numbered queue. Each item has a position.",
    example: "colors[0] gets the first color because Python starts indexes at 0.",
    codeExample: "colors = [\"red\", \"blue\", \"green\"]\ncolors.append(\"yellow\")\nprint(colors[0])",
    commonMistake:
      "Trying to access index 1 for the first item. The first index is 0.",
    practiceQuestion: {
      question: "What is nums[1]?",
      code: "nums = [4, 8, 12]",
      answer: "8",
      hint: "Index 0 is 4, so move one position to index 1."
    },
    quiz: [
      {
        questionId: "lesson_lists_q1",
        question: "What is the first index in a Python list?",
        type: "multiple_choice",
        options: ["0", "1", "-1", "first"],
        correctAnswer: "0",
        explanation: "Python list indexing starts at 0."
      },
      {
        questionId: "lesson_lists_q2",
        question: "Which method adds an item to the end of a list?",
        type: "short_answer",
        correctAnswer: "append",
        acceptedAnswers: ["append", "append()"],
        explanation: "append adds one item to the end."
      }
    ]
  },
  dictionaries: {
    objective: "Use keys to store and retrieve related values in dictionaries.",
    explanation:
      "A dictionary stores key-value pairs. Instead of using a position number, you use a key to find the value.",
    analogy:
      "A dictionary is like a contact list: a name key points to a phone number value.",
    example: "student[\"name\"] reads the value stored under the key name.",
    codeExample: "student = {\"name\": \"Maya\", \"age\": 14}\nprint(student[\"name\"])",
    commonMistake:
      "Forgetting quotes around string keys, such as student[name] instead of student[\"name\"].",
    practiceQuestion: {
      question: "What value does student[\"age\"] return?",
      code: "student = {\"name\": \"Maya\", \"age\": 14}",
      answer: "14",
      hint: "Find the value paired with the key \"age\"."
    },
    quiz: [
      {
        questionId: "lesson_dictionaries_q1",
        question: "Which syntax creates a key-value pair?",
        type: "multiple_choice",
        options: ["\"age\": 12", "\"age\" = 12", "[\"age\", 12]", "age -> 12"],
        correctAnswer: "\"age\": 12",
        explanation: "Dictionaries use key: value pairs."
      },
      {
        questionId: "lesson_dictionaries_q2",
        question: "Which method safely reads a key that may be missing?",
        type: "short_answer",
        correctAnswer: "get",
        acceptedAnswers: ["get", "get()"],
        explanation: "dict.get(key) avoids a KeyError by returning None by default."
      }
    ]
  },
  strings: {
    objective: "Work with text using indexes, slices, methods, and formatting.",
    explanation:
      "A string is text. Python lets you join strings, read characters by index, and use methods like upper or lower.",
    analogy:
      "A string is like a row of letter tiles; each tile has a position.",
    example: "\"Py\" + \"thon\" becomes \"Python\".",
    codeExample: "word = \"python\"\nprint(word[0])\nprint(word.upper())",
    commonMistake:
      "Forgetting that string indexes also start at 0.",
    practiceQuestion: {
      question: "What is word[0]?",
      code: "word = \"cat\"",
      answer: "c",
      hint: "Index 0 is the first character."
    },
    quiz: [
      {
        questionId: "lesson_strings_q1",
        question: "What does \"Py\" + \"thon\" produce?",
        type: "short_answer",
        correctAnswer: "Python",
        acceptedAnswers: ["python"],
        explanation: "The + operator joins the strings."
      },
      {
        questionId: "lesson_strings_q2",
        question: "Which method makes a string uppercase?",
        type: "multiple_choice",
        options: ["upper()", "big()", "capitalize_all()", "loud()"],
        correctAnswer: "upper()",
        acceptedAnswers: ["upper", "upper()"],
        explanation: "upper() returns an uppercase copy of the string."
      }
    ]
  },
  debugging: {
    objective: "Read errors and trace program state to fix small mistakes.",
    explanation:
      "Debugging means finding where code behavior differs from what you expected. Start by reading the error or tracing values line by line.",
    analogy:
      "It is like retracing steps when you lose something: go back to the last place everything made sense.",
    example: "If a loop never stops, inspect the condition and the variable that should change.",
    codeExample: "count = 0\nwhile count < 3:\n    print(count)\n    count = count + 1",
    commonMistake:
      "Changing multiple lines at once before identifying the exact failing step.",
    practiceQuestion: {
      question: "If a while loop runs forever, what should you inspect first?",
      answer: "the loop condition",
      hint: "Ask what must become false for the loop to stop."
    },
    quiz: [
      {
        questionId: "lesson_debugging_q1",
        question: "A program runs but gives the wrong answer. What kind of bug is likely?",
        type: "multiple_choice",
        options: ["Logic bug", "Keyboard bug", "Color bug", "No bug"],
        correctAnswer: "Logic bug",
        explanation: "Logic bugs happen when the steps are valid Python but the reasoning is wrong."
      },
      {
        questionId: "lesson_debugging_q2",
        question: "What should you read first when Python shows an error?",
        type: "multiple_choice",
        options: ["The traceback", "The wallpaper", "The package logo", "The keyboard"],
        correctAnswer: "The traceback",
        explanation: "The traceback points to the line and error type."
      }
    ]
  }
};

export function evaluateAnswer(
  question: Pick<
    AssessmentQuestion,
    "correctAnswer" | "acceptedAnswers" | "conceptId" | "question"
  >,
  learnerAnswer: string
) {
  const normalizedLearner = normalizeText(learnerAnswer);
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])]
    .filter(Boolean)
    .map((answer) => normalizeText(answer));

  const compactLearner = normalizedLearner.replace(/[,\s]+/g, "");
  const isCorrect = accepted.some((answer) => {
    const compactAnswer = answer.replace(/[,\s]+/g, "");
    return normalizedLearner === answer || compactLearner === compactAnswer;
  });

  const misconception = inferMisconception(question, learnerAnswer, isCorrect);

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    feedback: isCorrect
      ? "Correct. Nice reasoning."
      : `Not quite. A good answer is ${question.correctAnswer}.`,
    misconception
  };
}

function inferMisconception(
  question: Pick<AssessmentQuestion, "correctAnswer" | "conceptId" | "question">,
  learnerAnswer: string,
  isCorrect: boolean
) {
  if (isCorrect) return "";
  const answer = normalizeText(learnerAnswer);
  const text = normalizeText(question.question);

  if (question.conceptId === "loops" && /range/.test(text) && /1.*2.*3/.test(answer)) {
    return "Learner thinks Python ranges start from 1 instead of 0.";
  }
  if (
    ["lists", "strings"].includes(question.conceptId) &&
    /index|\[0\]|\[1\]/.test(text)
  ) {
    return "Learner may be confusing zero-based indexing with one-based positions.";
  }
  if (question.conceptId === "operators" && answer === "=") {
    return "Learner is mixing assignment (=) with equality comparison (==).";
  }
  if (question.conceptId === "conditionals") {
    return "Learner may be tracing the condition branch in the wrong order.";
  }
  return "The answer suggests this concept needs another pass.";
}

export function generateAssessmentQuestion(
  conceptId: string,
  difficulty: 1 | 2 | 3,
  excludeIds: string[] = [],
  questions: AssessmentQuestion[] = assessmentQuestions
) {
  const exact = questions.find(
    (question) =>
      question.conceptId === conceptId &&
      question.difficulty === difficulty &&
      !excludeIds.includes(question.id)
  );
  if (exact) return exact;

  return questions.find(
    (question) =>
      question.conceptId === conceptId && !excludeIds.includes(question.id)
  );
}

export type LessonGenerateOptions = {
  mode?: LessonMode;
  misconceptions?: string[];
  missedQuestions?: string[];
};

function resolveLessonOptions(
  remedialOrOptions: boolean | LessonGenerateOptions = false
): LessonGenerateOptions {
  if (typeof remedialOrOptions === "boolean") {
    return { mode: remedialOrOptions ? "remedial" : "core" };
  }
  return { mode: remedialOrOptions.mode ?? "core", ...remedialOrOptions };
}

function padQuiz(
  quiz: LessonContent["quiz"],
  conceptId: string,
  conceptName: string,
  subject: string
) {
  const padded = [...quiz];
  let index = padded.length;
  while (padded.length < 3) {
    index += 1;
    padded.push({
      questionId: `lesson_${conceptId}_pad_q${index}`,
      question: `Which statement best applies ${conceptName} within ${subject}?`,
      type: "multiple_choice",
      options: [
        `It is a core idea in ${subject}`,
        "It is unrelated to the topic",
        "It only appears in assessments",
        "It replaces every other concept"
      ],
      correctAnswer: `It is a core idea in ${subject}`,
      explanation: `${conceptName} belongs to the subject matter and should connect to real ideas in ${subject}.`
    });
  }
  return padded;
}

function richExplanation(
  base: string,
  example: string,
  style: ReturnType<typeof normalizePreferredStyle>,
  isRemedial: boolean
) {
  const styleTail =
    style === "code"
      ? "Trace each step in order before you change anything."
      : style === "visual"
        ? "Follow the numbered steps and picture how each part connects to the next."
        : "Start from a concrete scenario, then name the pattern you notice.";
  const remedialTail = isRemedial
    ? " Take one small step at a time and check your understanding after each step."
    : "";
  return `${base} ${example} ${styleTail}${remedialTail}`.trim();
}

function lessonIntro(objective: string, conceptName: string) {
  return `In this unit you will build a clear mental model of ${conceptName.toLowerCase()} and connect it to the bigger picture. ${objective}`;
}

function isProgrammingSubject(subject: string) {
  return /\b(python|javascript|typescript|java|c\+\+|c#|programming|coding|software|react|node|sql|html|css|algorithm|data structure)\b/i.test(
    subject
  );
}

function fallbackCodeExample(concept: Concept) {
  if (!isProgrammingSubject(concept.subject)) {
    return `No code needed: choose one example of ${concept.name}, identify the key evidence, then explain how it connects to ${concept.subject}.`;
  }

  return `# Practice prompt for ${concept.name}
concept = "${concept.name}"
example = "Write a tiny example that demonstrates this concept."
print(concept, example)`;
}

function ensureExplanationDepth(
  text: string,
  conceptName: string,
  subject: string
) {
  let result = text.trim();
  const bridge = `When you study ${conceptName} in ${subject}, connect each example back to the objective. Ask what changes, what stays the same, and how you would spot this idea in a new problem. Re-read the example, predict the outcome, then check your prediction against the explanation.`;
  while (result.split(/\s+/).length < 100) {
    result = `${result} ${bridge}`;
  }
  return result;
}

export function generateLesson(
  concept: Concept,
  mastery: number,
  preferredStyle: string,
  isRemedial = false
): LessonContent {
  const style = normalizePreferredStyle(preferredStyle);
  const base =
    conceptLessonCopy[concept.id] ??
    {
      objective: `Understand the role of ${concept.name} in ${concept.subject}.`,
      explanation: `${concept.name} is one part of ${concept.subject}. Focus on what it means, why it matters, and how it connects to the surrounding ideas.`,
      analogy: `Think of ${concept.name} as one piece in a larger ${concept.subject} puzzle—each piece has a shape that only fits in certain places.`,
      example: `A simple example in ${concept.subject} is recognizing when ${concept.name.toLowerCase()} is being used and explaining why it matters.`,
      codeExample: fallbackCodeExample(concept),
      commonMistake:
        "Memorizing a phrase without being able to explain it in your own words.",
      practiceQuestion: {
        question: `In your own words, what is the main purpose of ${concept.name}?`,
        answer: `A strong answer explains the core idea of ${concept.name} and connects it to ${concept.subject}.`,
        hint: "Start with what the concept does or explains."
      },
      quiz: [
        {
          questionId: `lesson_${concept.id}_q1`,
          question: `Which answer best describes ${concept.name}?`,
          type: "multiple_choice" as QuestionType,
          options: [
            `A core idea within ${concept.subject}`,
            "An unrelated detail",
            "A random memorized phrase",
            "A topic from a different subject"
          ],
          correctAnswer: `A core idea within ${concept.subject}`,
          explanation: `${concept.name} belongs to ${concept.subject}, so the best answer connects it to the subject's core ideas.`
        },
        {
          questionId: `lesson_${concept.id}_q2`,
          question: `What should you do first when studying ${concept.name}?`,
          type: "multiple_choice" as QuestionType,
          options: [
            "Define the concept clearly",
            "Skip the definition",
            "Memorize unrelated facts",
            "Ignore examples"
          ],
          correctAnswer: "Define the concept clearly",
          explanation: "A clear definition makes examples and practice easier to reason through."
        }
      ]
    };

  const explanation = ensureExplanationDepth(
    richExplanation(base.explanation, base.example, style, isRemedial),
    concept.name,
    concept.subject
  );

  const lesson: LessonContent = {
    title: `${isRemedial ? "Review: " : ""}${concept.name}`,
    learningObjective: base.objective,
    intro: lessonIntro(base.objective, concept.name),
    explanation,
    analogy: base.analogy,
    example: base.example,
    codeExample: base.codeExample,
    commonMistake: base.commonMistake,
    practiceQuestion: base.practiceQuestion,
    quiz: padQuiz(
      base.quiz.map((question) => ({
        ...question,
        type: question.type as QuestionType
      })),
      concept.id,
      concept.name,
      concept.subject
    )
  };

  const validation = validateLessonContent(lesson, concept.id);
  if (validation.valid) return lesson;

  const safeExplanation = ensureExplanationDepth(
    `This lesson focuses on ${concept.name} within ${concept.subject}. ${base.explanation}`,
    concept.name,
    concept.subject
  );
  return {
    title: `Safe Fallback: ${concept.name}`,
    learningObjective: `Practice the core idea of ${concept.name}.`,
    intro: lessonIntro(`Practice the core idea of ${concept.name}.`, concept.name),
    explanation: safeExplanation,
    analogy: `Treat ${concept.name} as one step you can trace one line at a time.`,
    example: base.example,
    codeExample: base.codeExample,
    commonMistake: base.commonMistake,
    practiceQuestion: base.practiceQuestion,
    quiz: padQuiz(
      base.quiz.map((question) => ({
        ...question,
        type: question.type as QuestionType
      })),
      concept.id,
      concept.name,
      concept.subject
    )
  };
}

export async function generateLessonWithProvider(
  concept: Concept,
  mastery: number,
  preferredStyle: string,
  remedialOrOptions: boolean | LessonGenerateOptions = false
) {
  const options = resolveLessonOptions(remedialOrOptions);
  const isRemedial = options.mode === "remedial";
  const fallback = generateLesson(concept, mastery, preferredStyle, isRemedial);
  const style = normalizePreferredStyle(preferredStyle);
  const userPrompt = buildLessonUserPrompt({
    subject: concept.subject,
    conceptId: concept.id,
    conceptName: concept.name,
    conceptDescription: concept.description,
    mastery,
    style,
    mode: options.mode ?? "core",
    misconceptions: options.misconceptions,
    missedQuestions: options.missedQuestions
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await callLLMJson({
        messages: [
          { role: "system", content: LESSON_AUTHOR_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ]
      });
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as unknown;
      if (isLessonContent(parsed)) {
        const validation = validateLessonContent(parsed, concept.id);
        if (validation.valid) return parsed;
        console.warn("Invalid LLM lesson content", validation.errors);
      } else {
        console.warn("LLM lesson response failed schema validation.");
      }
    } catch (error) {
      console.warn(
        "LLM lesson generation failed",
        error instanceof Error ? error.message : "unknown error"
      );
    }
  }

  return fallback;
}

export function safeTutorFallback(practiceStem?: string) {
  const focus = practiceStem?.trim()
    ? `about "${practiceStem.trim()}"`
    : "step by step";
  return {
    reply: `Let's work through it ${focus}. What do you think happens first?`,
    tutorStrategy: "guiding_question" as const
  };
}

export function generateTutorResponse({
  concept,
  lessonTitle,
  mastery,
  message,
  priorMessages,
  requiredStrategy,
  practiceStem,
  explanationExcerpt
}: {
  concept: Concept;
  lessonTitle: string;
  mastery: number;
  message: string;
  priorMessages: TutorMessage[];
  requiredStrategy: TutorStrategy;
  practiceStem?: string;
  explanationExcerpt?: string;
}) {
  const stem = practiceStem?.trim() || `${concept.name.toLowerCase()} in ${lessonTitle}`;
  const asksForFinal = /final|just tell|answer directly|give me the answer/i.test(message);

  if (requiredStrategy === "explanation") {
    const context = explanationExcerpt?.trim()
      ? `Start from the lesson idea: ${explanationExcerpt.trim().slice(0, 200)}`
      : `Focus on ${concept.name.toLowerCase()}.`;
    return {
      reply: `Let's unpack ${lessonTitle} step by step. ${context} Name what the question is asking, trace each step in order, then check your result against the example.`,
      tutorStrategy: "explanation" as const
    };
  }

  if (requiredStrategy === "hint") {
    return {
      reply: `Small hint for "${stem}": focus on one line or clue at a time. Which part of the example changes first before the final result?`,
      tutorStrategy: "hint" as const
    };
  }

  if (asksForFinal) {
    return {
      reply: `Before I answer directly about "${stem}", what is the first clue that points toward one outcome and rules out another?`,
      tutorStrategy: "guiding_question" as const
    };
  }

  if (mastery < 0.45) {
    return {
      reply: `What do you think happens first in "${stem}", and which detail in the lesson supports that?`,
      tutorStrategy: "guiding_question" as const
    };
  }

  return {
    reply: `Good question. What do you think happens first in "${stem}", and which line or step makes that happen?`,
    tutorStrategy: "guiding_question" as const
  };
}

export type TutorResponseArgs = {
  concept: Concept;
  lessonTitle: string;
  mastery: number;
  message: string;
  priorMessages: TutorMessage[];
  misconception?: string;
  requiredStrategy: TutorStrategy;
  forbiddenTexts: string[];
  learningObjective?: string;
  explanationExcerpt?: string;
  practiceStem?: string;
  quizStems?: string[];
};

export async function generateTutorResponseWithProvider(args: TutorResponseArgs) {
  const userTurns = args.priorMessages.filter((item) => item.role === "user").length;
  const fallback = () =>
    generateTutorResponse({
      concept: args.concept,
      lessonTitle: args.lessonTitle,
      mastery: args.mastery,
      message: args.message,
      priorMessages: args.priorMessages,
      requiredStrategy: args.requiredStrategy,
      practiceStem: args.practiceStem,
      explanationExcerpt: args.explanationExcerpt
    });

  let retryNote: string | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const userPrompt = buildTutorUserPrompt({
      subject: args.concept.subject,
      lessonTitle: args.lessonTitle,
      conceptName: args.concept.name,
      mastery: args.mastery,
      userTurns,
      requiredStrategy: args.requiredStrategy,
      misconception: args.misconception,
      message: args.message,
      learningObjective: args.learningObjective,
      explanationExcerpt: args.explanationExcerpt,
      practiceStem: args.practiceStem,
      quizStems: args.quizStems,
      retryNote
    });

    try {
      const raw = await callLLMJson({
        messages: [
          { role: "system", content: SOCRATIC_TUTOR_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1
      });
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (!isTutorPayload(parsed)) {
        console.warn("LLM tutor response failed schema validation.");
        continue;
      }

      const policy = classifyTutorResponse({
        reply: parsed.reply,
        requiredStrategy: args.requiredStrategy,
        userTurns,
        message: args.message,
        concept: args.concept,
        forbiddenTexts: args.forbiddenTexts
      });
      if (policy.valid) {
        return { reply: parsed.reply, tutorStrategy: args.requiredStrategy };
      }
      retryNote = `avoid ${policy.violations.join(", ")}`;
      console.warn("LLM tutor reply failed policy", policy.violations);
    } catch (error) {
      console.warn(
        "LLM tutor generation failed",
        error instanceof Error ? error.message : "unknown error"
      );
    }
  }

  return fallback();
}
