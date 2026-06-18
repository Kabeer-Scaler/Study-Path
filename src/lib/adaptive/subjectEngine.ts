import { callLLMJson, getAIProvider } from "@/lib/ai/provider";
import {
  buildAssessmentQuestionUserPrompt,
  buildSubjectDomainUserPrompt
} from "@/lib/ai/promptBuilder";
import {
  ASSESSMENT_QUESTION_SYSTEM_PROMPT,
  SUBJECT_DOMAIN_SYSTEM_PROMPT
} from "@/lib/ai/prompts";
import {
  DEFAULT_SUBJECT,
  assessmentQuestions as pythonQuestions,
  concepts as pythonConcepts
} from "@/lib/db/seed";
import { makeId, normalizeText } from "@/lib/db/store";
import type { AssessmentQuestion, Concept, DataStore, Difficulty, QuestionType } from "@/lib/types";

type SubjectDomain = {
  concepts: Concept[];
  questions: AssessmentQuestion[];
};

const conceptTemplates = [
  ["foundations", "Foundations", "Core definitions, purpose, and basic vocabulary."],
  ["terminology", "Terminology", "Important terms and how they are used."],
  ["core-principles", "Core Principles", "Main ideas and rules that organize the topic."],
  ["processes", "Processes and Steps", "How key processes, workflows, or sequences happen."],
  ["examples", "Examples and Applications", "Recognize the topic in examples and use cases."],
  ["analysis", "Analysis and Reasoning", "Compare ideas and reason through problems."],
  ["common-mistakes", "Common Mistakes", "Typical misconceptions and how to avoid them."],
  ["practice", "Practice and Review", "Apply the topic in short practice scenarios."]
] as const;

const genericQuestionPatterns = [
  /a correct core idea/i,
  /an unrelated idea/i,
  /a detail that sounds plausible/i,
  /a memorized term/i,
  /which option best matches/i,
  /which statement is most accurate about/i,
  /strongest understanding of/i,
  /topic from a different subject/i,
  /random memorized phrase/i,
  /usable understanding rather than memorisation/i,
  /what evidence should the system trust most/i,
  /transfer to a related situation/i,
  /next diagnostic step check/i,
  /selects the longest answer option/i,
  /concept title sounds familiar/i,
  /which learner response/i,
  /\blearner\b/i,
  /\bassessment\b/i,
  /\bdiagnostic\b/i,
  /education app/i,
  /learning app/i,
  /what should the assessment do/i,
  /what should the system do/i,
  /what gap is most likely/i,
  /best checks/i,
  /best demonstrates/i,
  /most useful after a mistake/i,
  /what kind of practice/i,
  /only rereading/i,
  /learner improves after practice/i,
  /correct-or-wrong score/i,
  /marking the concept mastered/i,
  /learning style/i,
  /random answer/i,
  /color theme/i
];

export function subjectSlug(subject: string) {
  return subject
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 42) || "topic";
}

export function getSubjectConcepts(store: DataStore, subject: string) {
  return store.concepts
    .filter((concept) => concept.subject.toLowerCase() === subject.toLowerCase())
    .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name));
}

export function getSubjectQuestions(store: DataStore, subject: string) {
  const conceptIds = new Set(getSubjectConcepts(store, subject).map((concept) => concept.id));
  return store.assessmentQuestions.filter((question) => conceptIds.has(question.conceptId));
}

function fallbackDomain(subject: string): SubjectDomain {
  const slug = subjectSlug(subject);
  const concepts: Concept[] = conceptTemplates.map(([suffix, name, description], index) => ({
    id: `${slug}_${suffix}`,
    subject,
    name: `${subject} ${name}`,
    description,
    difficulty: (index < 2 ? 1 : index < 6 ? 2 : 3) as Difficulty,
    prerequisites:
      index === 0
        ? []
        : index === 1
          ? [`${slug}_foundations`]
          : index < 5
            ? [`${slug}_foundations`, `${slug}_terminology`]
            : [`${slug}_core_principles`, `${slug}_processes`].filter((id) =>
                conceptTemplates.some(([suffixValue]) => `${slug}_${suffixValue.replace(/-/g, "_")}` === id)
              )
  }));

  for (const concept of concepts) {
    concept.id = concept.id.replace(/-/g, "_");
    concept.prerequisites = concept.prerequisites.map((item) => item.replace(/-/g, "_"));
  }

  const questions: AssessmentQuestion[] = concepts.flatMap((concept) => {
    const suffix = concept.id.replace(`${slug}_`, "");
    const questionSetByConcept: Record<
      string,
      Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        difficulty: Difficulty;
      }>
    > = {
      foundations: [
        {
          question: `Which learner response best shows that the basic purpose of ${subject} is understood?`,
          options: [
            `It identifies what ${subject} is used to explain or solve before naming details.`,
            `It lists several advanced terms from ${subject} without connecting them.`,
            "It answers by copying a phrase from the question stem.",
            "It avoids saying what the topic is actually about."
          ],
          correctAnswer: `It identifies what ${subject} is used to explain or solve before naming details.`,
          explanation: "A foundation question should check purpose and meaning before advanced detail.",
          difficulty: 1
        },
        {
          question: `A beginner can define ${subject} but cannot use it in an example. What gap is most likely?`,
          options: [
            "They recognize vocabulary but have not connected it to application.",
            "They have mastered all advanced reasoning in the topic.",
            "They should skip the introductory concepts entirely.",
            "They only need a longer multiple-choice question."
          ],
          correctAnswer: "They recognize vocabulary but have not connected it to application.",
          explanation: "Definitions alone are weaker evidence than using the idea in context.",
          difficulty: 2
        },
        {
          question: `When diagnosing ${subject} foundations, which answer pattern suggests guessing?`,
          options: [
            "Choosing familiar words without explaining the relationship between them.",
            "Comparing two examples and stating why one fits better.",
            "Identifying a prerequisite before solving the problem.",
            "Correcting an earlier misconception with a reason."
          ],
          correctAnswer: "Choosing familiar words without explaining the relationship between them.",
          explanation: "Guessing often looks like word matching without reasoning.",
          difficulty: 3
        }
      ],
      terminology: [
        {
          question: `What is the safest way to check whether a learner understands ${subject} terminology?`,
          options: [
            "Ask them to match a term with its meaning and use it in context.",
            "Ask them to choose whichever term appears most often.",
            "Ask them to ignore definitions and move to advanced work.",
            "Ask them to memorize term order alphabetically."
          ],
          correctAnswer: "Ask them to match a term with its meaning and use it in context.",
          explanation: "Terminology knowledge requires meaning plus contextual use.",
          difficulty: 1
        },
        {
          question: `A learner confuses two terms in ${subject}. What should the assessment do next?`,
          options: [
            "Present a contrast example that separates the two meanings.",
            "Mark every other concept as mastered.",
            "Ask only easier spelling questions.",
            "Stop assessing the topic immediately."
          ],
          correctAnswer: "Present a contrast example that separates the two meanings.",
          explanation: "Contrast examples reveal whether the learner understands the boundary between terms.",
          difficulty: 2
        },
        {
          question: `Which response is strongest evidence that ${subject} terminology is not just memorized?`,
          options: [
            "The learner explains why one term fits a scenario and another does not.",
            "The learner repeats the term loudly.",
            "The learner selects the shortest option.",
            "The learner says the word looks familiar."
          ],
          correctAnswer: "The learner explains why one term fits a scenario and another does not.",
          explanation: "Reasoned distinction is stronger than recognition.",
          difficulty: 3
        }
      ],
      core_principles: [
        {
          question: `Which task best checks a core principle in ${subject}?`,
          options: [
            "Apply the principle to decide between two similar cases.",
            "Pick the option with the most technical words.",
            "Recall the page where the principle appeared.",
            "Avoid examples and answer from memory only."
          ],
          correctAnswer: "Apply the principle to decide between two similar cases.",
          explanation: "Core principles are best tested through application and discrimination.",
          difficulty: 1
        },
        {
          question: `A learner knows examples from ${subject} but cannot explain the rule behind them. What is weak?`,
          options: [
            "The underlying principle connecting the examples.",
            "Their ability to click through the assessment quickly.",
            "Their preference for one lesson layout.",
            "Their memory of unrelated topic names."
          ],
          correctAnswer: "The underlying principle connecting the examples.",
          explanation: "Examples without the rule suggest shallow pattern recognition.",
          difficulty: 2
        },
        {
          question: `Which answer would best diagnose mastery of a ${subject} principle?`,
          options: [
            "A justified choice that explains why the principle applies.",
            "A copied definition with no connection to the case.",
            "A guess based on answer length.",
            "A statement that avoids the principle entirely."
          ],
          correctAnswer: "A justified choice that explains why the principle applies.",
          explanation: "Mastery requires both a choice and the reasoning behind it.",
          difficulty: 3
        }
      ],
      processes: [
        {
          question: `When learning a process in ${subject}, what should a learner identify first?`,
          options: [
            "The starting condition and the next step that follows from it.",
            "The final answer before reading the steps.",
            "Only the longest word in the process name.",
            "A step from a different subject."
          ],
          correctAnswer: "The starting condition and the next step that follows from it.",
          explanation: "Process understanding begins with sequence and cause.",
          difficulty: 1
        },
        {
          question: `A learner swaps two steps in a ${subject} process. What does that usually reveal?`,
          options: [
            "They may not understand the dependency between the steps.",
            "They have definitely mastered the whole topic.",
            "The process has no meaningful order.",
            "The assessment should ignore sequencing."
          ],
          correctAnswer: "They may not understand the dependency between the steps.",
          explanation: "Step order matters when later steps depend on earlier ones.",
          difficulty: 2
        },
        {
          question: `Which question best tests process reasoning in ${subject}?`,
          options: [
            "What changes if this earlier step is removed or done incorrectly?",
            "Which answer choice is visually centered?",
            "Can the learner repeat the section title?",
            "Does the learner prefer short questions?"
          ],
          correctAnswer: "What changes if this earlier step is removed or done incorrectly?",
          explanation: "Process reasoning checks consequences, not just recall.",
          difficulty: 3
        }
      ],
      examples: [
        {
          question: `Which activity best checks examples and applications in ${subject}?`,
          options: [
            "Classify a fresh example and explain the clue that makes it fit.",
            "Repeat a definition without looking at any case.",
            "Select an option because it mentions the subject name.",
            "Skip examples and only study headings."
          ],
          correctAnswer: "Classify a fresh example and explain the clue that makes it fit.",
          explanation: "Application requires transfer to a fresh case.",
          difficulty: 1
        },
        {
          question: `A learner correctly recognizes a familiar ${subject} example but misses a new one. What is likely weak?`,
          options: [
            "Transfer from memorized examples to new situations.",
            "Their ability to read the subject title.",
            "Their knowledge of an unrelated advanced topic.",
            "The number of choices shown on screen."
          ],
          correctAnswer: "Transfer from memorized examples to new situations.",
          explanation: "New examples test whether the learner understands the pattern behind known cases.",
          difficulty: 2
        },
        {
          question: `Which answer gives the strongest evidence of application mastery in ${subject}?`,
          options: [
            "It uses evidence from the scenario to justify why the concept applies.",
            "It repeats the exact same example from the lesson.",
            "It chooses a familiar-looking phrase.",
            "It avoids explaining the connection."
          ],
          correctAnswer: "It uses evidence from the scenario to justify why the concept applies.",
          explanation: "Application mastery is shown by justified use in context.",
          difficulty: 3
        }
      ],
      analysis: [
        {
          question: `What does analysis in ${subject} usually require beyond recall?`,
          options: [
            "Comparing ideas and explaining the reason for a choice.",
            "Choosing the first answer that sounds familiar.",
            "Ignoring differences between cases.",
            "Only naming the topic."
          ],
          correctAnswer: "Comparing ideas and explaining the reason for a choice.",
          explanation: "Analysis depends on comparison and justification.",
          difficulty: 1
        },
        {
          question: `Two ${subject} examples look similar but have different outcomes. What should the learner compare?`,
          options: [
            "The condition or feature that changes the outcome.",
            "The order of answer choices.",
            "The number of words in each example.",
            "Whether the title contains a familiar term."
          ],
          correctAnswer: "The condition or feature that changes the outcome.",
          explanation: "Analytical thinking looks for meaningful differences.",
          difficulty: 2
        },
        {
          question: `Which response best demonstrates reasoning in ${subject}?`,
          options: [
            "It states a conclusion and supports it with relevant evidence.",
            "It gives a conclusion with no reason.",
            "It copies one word from the prompt.",
            "It refuses to compare the options."
          ],
          correctAnswer: "It states a conclusion and supports it with relevant evidence.",
          explanation: "Reasoning requires evidence-backed conclusions.",
          difficulty: 3
        }
      ],
      common_mistakes: [
        {
          question: `Why are common mistakes useful in a ${subject} assessment?`,
          options: [
            "They reveal misconceptions that a correct-or-wrong score alone may hide.",
            "They make every learner repeat all beginner lessons.",
            "They remove the need for explanations.",
            "They prove the topic has no prerequisites."
          ],
          correctAnswer: "They reveal misconceptions that a correct-or-wrong score alone may hide.",
          explanation: "Mistake patterns help the system choose targeted review.",
          difficulty: 1
        },
        {
          question: `A learner repeatedly chooses the same wrong type of answer in ${subject}. What should happen next?`,
          options: [
            "Assign targeted review for the misconception behind that pattern.",
            "Treat the concept as fully mastered.",
            "Skip all future questions in the topic.",
            "Ignore the pattern because only final score matters."
          ],
          correctAnswer: "Assign targeted review for the misconception behind that pattern.",
          explanation: "Repeated wrong patterns are evidence for remediation.",
          difficulty: 2
        },
        {
          question: `Which diagnostic result is most useful after a mistake in ${subject}?`,
          options: [
            "A specific misconception linked to a concept and prerequisite.",
            "Only a message saying the answer was wrong.",
            "A random harder question from another unit.",
            "A skipped explanation with no evidence."
          ],
          correctAnswer: "A specific misconception linked to a concept and prerequisite.",
          explanation: "Specific misconception evidence supports adaptive next steps.",
          difficulty: 3
        }
      ],
      practice: [
        {
          question: `What kind of practice best strengthens ${subject}?`,
          options: [
            "Short tasks that require applying one concept and checking feedback.",
            "Only rereading the same heading repeatedly.",
            "Choosing answers without reviewing explanations.",
            "Avoiding mistakes by skipping questions."
          ],
          correctAnswer: "Short tasks that require applying one concept and checking feedback.",
          explanation: "Focused practice with feedback improves mastery evidence.",
          difficulty: 1
        },
        {
          question: `A learner improves after practice in ${subject} but confidence is still low. What should the system do?`,
          options: [
            "Give another varied check before marking the concept mastered.",
            "Delete the learner's progress.",
            "Assume one good answer proves full mastery.",
            "Stop tracking the concept."
          ],
          correctAnswer: "Give another varied check before marking the concept mastered.",
          explanation: "Confidence should grow from repeated evidence, not one result.",
          difficulty: 2
        },
        {
          question: `Which practice result is strongest evidence for mastery in ${subject}?`,
          options: [
            "Consistent success across varied questions with clear explanations.",
            "One lucky correct answer with no reasoning.",
            "Fast guessing across unrelated questions.",
            "Avoiding every question marked difficult."
          ],
          correctAnswer: "Consistent success across varied questions with clear explanations.",
          explanation: "Stable mastery needs varied and repeated evidence.",
          difficulty: 3
        }
      ]
    };

    const questionSet = questionSetByConcept[suffix] ?? questionSetByConcept.practice;

    return questionSet.map((item) => ({
      id: `q_${concept.id}_${item.difficulty}`,
      conceptId: concept.id,
      question: item.question,
      type: "multiple_choice" as QuestionType,
      options: item.options,
      correctAnswer: item.correctAnswer,
      acceptedAnswers: [item.correctAnswer],
      explanation: item.explanation,
      difficulty: item.difficulty
    }));
  });

  return { concepts, questions };
}

function machineLearningFallbackDomain(subject: string): SubjectDomain {
  const slug = subjectSlug(subject);
  const concepts: Concept[] = [
    {
      id: `${slug}_features_labels`,
      subject,
      name: "Features and Labels",
      description: "Distinguish input variables from target outputs in supervised learning.",
      difficulty: 1,
      prerequisites: []
    },
    {
      id: `${slug}_supervised_unsupervised`,
      subject,
      name: "Supervised vs Unsupervised Learning",
      description: "Identify whether a task uses labeled targets or discovers structure without labels.",
      difficulty: 1,
      prerequisites: [`${slug}_features_labels`]
    },
    {
      id: `${slug}_train_test_split`,
      subject,
      name: "Training and Test Data",
      description: "Use separate data to train a model and estimate performance on unseen examples.",
      difficulty: 2,
      prerequisites: [`${slug}_features_labels`]
    },
    {
      id: `${slug}_overfitting_generalization`,
      subject,
      name: "Overfitting and Generalization",
      description: "Recognize when a model memorizes training data instead of learning patterns that transfer.",
      difficulty: 2,
      prerequisites: [`${slug}_train_test_split`]
    },
    {
      id: `${slug}_classification_regression`,
      subject,
      name: "Classification and Regression",
      description: "Choose between category prediction and numeric prediction tasks.",
      difficulty: 2,
      prerequisites: [`${slug}_supervised_unsupervised`]
    },
    {
      id: `${slug}_evaluation_metrics`,
      subject,
      name: "Evaluation Metrics",
      description: "Select metrics such as accuracy, precision, recall, or mean squared error for the task.",
      difficulty: 3,
      prerequisites: [`${slug}_classification_regression`, `${slug}_train_test_split`]
    }
  ];

  const q = (
    conceptId: string,
    difficulty: Difficulty,
    question: string,
    options: string[],
    correctAnswer: string,
    explanation: string
  ): AssessmentQuestion => ({
    id: `q_${conceptId}_${difficulty}`,
    conceptId,
    question,
    type: "multiple_choice",
    options,
    correctAnswer,
    acceptedAnswers: [correctAnswer],
    explanation,
    difficulty
  });

  const ids = Object.fromEntries(concepts.map((concept) => [concept.id.split(`${slug}_`)[1], concept.id]));
  const questions: AssessmentQuestion[] = [
    q(
      ids.features_labels,
      1,
      "In a house-price prediction dataset, which item is usually the label?",
      ["The final sale price", "The number of bedrooms", "The area in square feet", "The year the house was built"],
      "The final sale price",
      "The label is the target value the model is trained to predict."
    ),
    q(
      ids.features_labels,
      2,
      "A model predicts whether an email is spam using sender, subject words, and link count. What are those inputs called?",
      ["Features", "Labels", "Loss values", "Clusters"],
      "Features",
      "Features are the input variables used to make a prediction."
    ),
    q(
      ids.features_labels,
      3,
      "A training table accidentally includes the future sale price as an input column while predicting sale price. What problem does this create?",
      ["Target leakage", "Class imbalance", "Unsupervised clustering", "Feature scaling"],
      "Target leakage",
      "Target leakage happens when information from the answer is improperly included in the inputs."
    ),
    q(
      ids.supervised_unsupervised,
      1,
      "Which task is supervised learning?",
      ["Predicting exam scores from labeled past student records", "Grouping customers without known categories", "Compressing images without target labels", "Finding hidden topics without annotations"],
      "Predicting exam scores from labeled past student records",
      "Supervised learning uses examples with known target labels."
    ),
    q(
      ids.supervised_unsupervised,
      2,
      "A retailer wants to discover natural customer groups without pre-defined group names. Which approach fits best?",
      ["Clustering", "Linear regression", "Binary classification", "Label encoding"],
      "Clustering",
      "Clustering is an unsupervised method for finding groups without labeled targets."
    ),
    q(
      ids.supervised_unsupervised,
      3,
      "A dataset has images but no category labels, and the goal is to find visual patterns before any human labels them. Which learning setup is most appropriate?",
      ["Unsupervised learning", "Supervised classification", "Supervised regression", "Manual test-set scoring"],
      "Unsupervised learning",
      "Without target labels, the task is to discover structure rather than learn from known answers."
    ),
    q(
      ids.train_test_split,
      1,
      "Why do machine learning projects keep a test set separate from training data?",
      ["To estimate performance on unseen examples", "To make the model memorize more rows", "To remove the need for evaluation", "To guarantee perfect accuracy"],
      "To estimate performance on unseen examples",
      "A test set checks how well the model generalizes beyond the data it learned from."
    ),
    q(
      ids.train_test_split,
      2,
      "A model is tuned repeatedly on the same test set. What risk does this create?",
      ["The test set becomes part of the model selection process", "The labels become features automatically", "The task changes from supervised to unsupervised", "The dataset becomes larger"],
      "The test set becomes part of the model selection process",
      "Repeatedly tuning on test results can make the test score too optimistic."
    ),
    q(
      ids.train_test_split,
      3,
      "A validation score is strong but the final test score is much worse. Which explanation is most reasonable?",
      ["The model or choices may have overfit the validation process", "The model automatically became unsupervised", "The test labels were used as features correctly", "The train split must always be larger than before"],
      "The model or choices may have overfit the validation process",
      "A large validation-test gap can indicate that model choices adapted too closely to validation feedback."
    ),
    q(
      ids.overfitting_generalization,
      1,
      "A model scores 99% on training data but poorly on new data. What is the most likely issue?",
      ["Overfitting", "Under-sampling only", "Perfect generalization", "Missing labels in every row"],
      "Overfitting",
      "Overfitting happens when a model learns training-specific noise instead of general patterns."
    ),
    q(
      ids.overfitting_generalization,
      2,
      "Which sign suggests better generalization?",
      ["Similar performance on validation and test data", "Perfect training score with weak validation score", "Memorizing every training example", "Removing the test set"],
      "Similar performance on validation and test data",
      "Generalization is stronger when performance remains stable on unseen data."
    ),
    q(
      ids.overfitting_generalization,
      3,
      "A decision tree grows until every training row is classified perfectly, but validation accuracy drops. Which adjustment is most likely to help?",
      ["Limit tree depth or prune the tree", "Train only on the validation set", "Remove all input features", "Evaluate only on training accuracy"],
      "Limit tree depth or prune the tree",
      "Reducing model complexity can reduce overfitting and improve generalization."
    ),
    q(
      ids.classification_regression,
      1,
      "Predicting whether a tumor is benign or malignant is what kind of task?",
      ["Classification", "Regression", "Clustering", "Dimensionality reduction"],
      "Classification",
      "Classification predicts a category or class."
    ),
    q(
      ids.classification_regression,
      2,
      "Predicting next month's electricity usage in kilowatt-hours is usually what kind of task?",
      ["Regression", "Binary classification", "Clustering", "Tokenization"],
      "Regression",
      "Regression predicts a continuous numeric value."
    ),
    q(
      ids.classification_regression,
      3,
      "A hospital model outputs risk scores from 0 to 1, then labels patients as high-risk above 0.7. Which statement is most accurate?",
      ["The score is numeric, but the thresholded decision is classification", "The whole task must be clustering", "The labels disappear after thresholding", "The model cannot be evaluated"],
      "The score is numeric, but the thresholded decision is classification",
      "Many classifiers produce scores or probabilities before converting them into categories."
    ),
    q(
      ids.evaluation_metrics,
      1,
      "For a model predicting house prices, which metric is more natural than accuracy?",
      ["Mean squared error", "Recall", "Precision", "Confusion matrix count"],
      "Mean squared error",
      "Numeric prediction tasks are commonly evaluated with regression error metrics."
    ),
    q(
      ids.evaluation_metrics,
      2,
      "In a rare-disease screening model, why might accuracy alone be misleading?",
      ["A model can be accurate overall while missing many positive cases", "Accuracy always measures false negatives directly", "Accuracy only works for regression", "Accuracy ignores the number of predictions"],
      "A model can be accurate overall while missing many positive cases",
      "With imbalanced classes, accuracy can hide poor recall on the rare class."
    ),
    q(
      ids.evaluation_metrics,
      3,
      "Which metric is most directly focused on reducing missed positive cases?",
      ["Recall", "Mean squared error", "Silhouette score", "R-squared"],
      "Recall",
      "Recall measures the share of actual positives the model successfully finds."
    )
  ];

  return { concepts, questions };
}

function containsGenericAssessmentText(value: string) {
  return genericQuestionPatterns.some((pattern) => pattern.test(value));
}

function answerIsGivenAway(question: AssessmentQuestion) {
  const stem = normalizeText(question.question);
  const answer = normalizeText(question.correctAnswer);
  if (answer.length < 6) return false;
  return stem.includes(answer);
}

function hasPlausibleOptions(question: AssessmentQuestion) {
  if (question.type !== "multiple_choice") return true;
  const options = question.options?.map((option) => option.trim()).filter(Boolean) ?? [];
  const uniqueOptions = new Set(options.map((option) => normalizeText(option)));
  const answer = normalizeText(question.correctAnswer);
  return (
    options.length >= 3 &&
    uniqueOptions.size === options.length &&
    options.some((option) => normalizeText(option) === answer) &&
    !options.some(containsGenericAssessmentText)
  );
}

function questionPassesQualityGate(question: AssessmentQuestion) {
  const assessableText = [
    question.question,
    ...(question.options ?? [])
  ].join(" ");

  const answer = normalizeText(question.correctAnswer);
  const stem = normalizeText(question.question);
  const exactStemOverlap =
    answer.length > 12 && stem.includes(answer.replace(/[.!?]$/, ""));

  return (
    question.question.split(/\s+/).length >= 8 &&
    question.question.split(/\s+/).length <= 42 &&
    question.explanation.split(/\s+/).length >= 6 &&
    !containsGenericAssessmentText(assessableText) &&
    !answerIsGivenAway(question) &&
    !exactStemOverlap &&
    hasPlausibleOptions(question)
  );
}

function hasDifficultyCoverage(concepts: Concept[], questions: AssessmentQuestion[]) {
  return concepts.every((concept) => {
    const difficulties = new Set(
      questions
        .filter((question) => question.conceptId === concept.id)
        .map((question) => question.difficulty)
    );
    return difficulties.has(1) && difficulties.has(2) && difficulties.has(3);
  });
}

function qualityFilterQuestions(questions: AssessmentQuestion[]) {
  return questions.filter(questionPassesQualityGate);
}

function domainPassesQualityGate(concepts: Concept[], questions: AssessmentQuestion[]) {
  if (questions.length < concepts.length * 3) return false;
  if (!hasDifficultyCoverage(concepts, questions)) return false;
  return questions.every(questionPassesQualityGate);
}

function subjectGuidance(subject: string) {
  if (/high\s*level\s*design|hld|system\s*design/i.test(subject)) {
    return "Interpret this as software high-level design / system architecture: scalability, availability, components, APIs, databases, caching, load balancing, queues, consistency, and trade-offs.";
  }
  return "Interpret the subject using its common academic or professional meaning. If the phrase is broad, choose the most standard beginner-to-intermediate scope for that field.";
}

function domainScopedId(slug: string, value: string) {
  const normalized = subjectSlug(value);
  return normalized.startsWith(`${slug}_`) ? normalized : `${slug}_${normalized}`;
}

function validateGeneratedDomain(
  subject: string,
  value: unknown,
  minimumUsableConcepts = 4
): SubjectDomain | undefined {
  if (!value || typeof value !== "object") return undefined;
  const item = value as {
    concepts?: Array<Partial<Concept>>;
    questions?: Array<Partial<AssessmentQuestion>>;
  };
  if (!Array.isArray(item.concepts) || !Array.isArray(item.questions)) return undefined;

  const slug = subjectSlug(subject);
  const conceptIdAliases = new Map<string, string>();
  const concepts = item.concepts.slice(0, 10).map((concept, index): Concept => {
    const rawId = String(concept.id || concept.name || `concept_${index + 1}`);
    const id = domainScopedId(slug, rawId);
    conceptIdAliases.set(subjectSlug(rawId), id);
    conceptIdAliases.set(String(index + 1), id);
    if (concept.name) conceptIdAliases.set(subjectSlug(String(concept.name)), id);
    return {
      id,
      subject,
      name: String(concept.name || `Concept ${index + 1}`),
      description: String(concept.description || "Generated topic concept."),
      difficulty: ([1, 2, 3].includes(Number(concept.difficulty)) ? Number(concept.difficulty) : 2) as Difficulty,
      prerequisites: Array.isArray(concept.prerequisites)
        ? concept.prerequisites.map((prereq) => domainScopedId(slug, String(prereq)))
        : []
    };
  });

  const conceptIds = new Set(concepts.map((concept) => concept.id));
  for (const concept of concepts) {
    concept.prerequisites = concept.prerequisites.filter((id) => conceptIds.has(id));
  }

  if (concepts.length < minimumUsableConcepts) return undefined;

  const questions = item.questions
    .map((question, index): AssessmentQuestion | undefined => {
      const rawConceptId = subjectSlug(String(question.conceptId || ""));
      const conceptId = conceptIdAliases.get(rawConceptId) ?? domainScopedId(slug, rawConceptId);
      if (!conceptIds.has(conceptId)) return undefined;
      const type = String(question.type || "multiple_choice") as QuestionType;
      const safeType = ["multiple_choice", "short_answer", "code_output", "fill_blank"].includes(type)
        ? type
        : "multiple_choice";
      const correctAnswer = String(question.correctAnswer || "").trim();
      const prompt = String(question.question || "").trim();
      if (!prompt || !correctAnswer) return undefined;
      const options = Array.isArray(question.options)
        ? question.options.map(String).filter(Boolean).slice(0, 5)
        : [];
      const normalizedOptions = options.some(
        (option) => option.trim().toLowerCase() === correctAnswer.toLowerCase()
      )
        ? options
        : [correctAnswer, ...options].slice(0, 5);
      if (safeType === "multiple_choice" && normalizedOptions.length < 2) {
        return undefined;
      }
      return {
        id: `q_${conceptId}_${index}_${makeId("gen").slice(-4)}`,
        conceptId,
        question: prompt,
        type: safeType,
        options:
          safeType === "multiple_choice"
            ? normalizedOptions
            : normalizedOptions.length
              ? normalizedOptions
              : undefined,
        correctAnswer,
        acceptedAnswers: Array.isArray(question.acceptedAnswers)
          ? question.acceptedAnswers.map(String)
          : [correctAnswer],
        explanation: String(question.explanation || `Correct answer: ${correctAnswer}`),
        difficulty: ([1, 2, 3].includes(Number(question.difficulty)) ? Number(question.difficulty) : 2) as Difficulty
      };
    })
    .filter(Boolean) as AssessmentQuestion[];

  const qualityQuestions = qualityFilterQuestions(questions);
  const usableConceptIds = new Set(
    concepts
      .filter((concept) => hasDifficultyCoverage([concept], qualityQuestions))
      .map((concept) => concept.id)
  );
  const usableConcepts = concepts
    .filter((concept) => usableConceptIds.has(concept.id))
    .map((concept) => ({
      ...concept,
      prerequisites: concept.prerequisites.filter((id) => usableConceptIds.has(id))
    }));
  const usableQuestions = qualityQuestions.filter((question) => usableConceptIds.has(question.conceptId));

  if (usableConcepts.length < minimumUsableConcepts) return undefined;
  if (!domainPassesQualityGate(usableConcepts, usableQuestions)) return undefined;

  return { concepts: usableConcepts, questions: usableQuestions };
}

function normalizeGeneratedConcepts(subject: string, value: unknown): Concept[] {
  if (!value || typeof value !== "object") return [];
  const item = value as { concepts?: Array<Partial<Concept>> };
  if (!Array.isArray(item.concepts)) return [];

  const slug = subjectSlug(subject);
  const concepts = item.concepts.slice(0, 5).map((concept, index): Concept => {
    const rawId = String(concept.id || concept.name || `concept_${index + 1}`);
    return {
      id: domainScopedId(slug, rawId),
      subject,
      name: String(concept.name || `Concept ${index + 1}`),
      description: String(concept.description || "Generated topic concept."),
      difficulty: ([1, 2, 3].includes(Number(concept.difficulty)) ? Number(concept.difficulty) : 2) as Difficulty,
      prerequisites: Array.isArray(concept.prerequisites)
        ? concept.prerequisites.map((prereq) => domainScopedId(slug, String(prereq)))
        : []
    };
  });

  const conceptIds = new Set(concepts.map((concept) => concept.id));
  return concepts.map((concept) => ({
    ...concept,
    prerequisites: concept.prerequisites.filter((id) => conceptIds.has(id))
  }));
}

async function generateDomainInFocusedBatches(subject: string): Promise<SubjectDomain | undefined> {
  const guidance = subjectGuidance(subject);
  const conceptRaw = await callLLMJson({
    messages: [
      { role: "system", content: SUBJECT_DOMAIN_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${buildSubjectDomainUserPrompt(subject, guidance)}

Return JSON only:
{
  "concepts": [
    {
      "id": "lowercase-descriptive-slug",
      "name": "",
      "description": "",
      "difficulty": 1,
      "prerequisites": []
    }
  ]
}`
      }
    ],
    temperature: 0.1
  });
  if (!conceptRaw) return undefined;

  const concepts = normalizeGeneratedConcepts(subject, JSON.parse(conceptRaw));
  if (concepts.length < 4) return undefined;

  const generatedQuestions: AssessmentQuestion[] = [];
  for (const concept of concepts) {
    const questionRaw = await callLLMJson({
      messages: [
        { role: "system", content: ASSESSMENT_QUESTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${buildAssessmentQuestionUserPrompt(subject, guidance, concept)}

Return JSON only:
{
  "questions": [
    {
      "conceptId": "${concept.id}",
      "question": "",
      "type": "multiple_choice",
      "options": ["", "", "", ""],
      "correctAnswer": "",
      "acceptedAnswers": [],
      "explanation": "",
      "difficulty": 1
    }
  ]
}`
        }
      ],
      temperature: 0.1
    });
    if (!questionRaw) continue;
    const domain = validateGeneratedDomain(subject, {
      concepts: [concept],
      questions: (JSON.parse(questionRaw) as { questions?: unknown[] }).questions ?? []
    }, 1);
    if (domain) generatedQuestions.push(...domain.questions);
  }

  return validateGeneratedDomain(subject, { concepts, questions: generatedQuestions });
}

async function generateDomainWithLLM(subject: string): Promise<SubjectDomain | undefined> {
  const guidance = subjectGuidance(subject);
  const prompt = `${buildSubjectDomainUserPrompt(subject, guidance)}

Return JSON only:
{
  "concepts": [
    {
      "id": "short-kebab-id",
      "name": "",
      "description": "",
      "difficulty": 1,
      "prerequisites": []
    }
  ],
  "questions": [
    {
      "conceptId": "short-kebab-id",
      "question": "",
      "type": "multiple_choice",
      "options": ["", "", "", ""],
      "correctAnswer": "",
      "acceptedAnswers": [],
      "explanation": "",
      "difficulty": 2
    }
  ]
}

Rules:
- Generate exactly 3 questions per concept: one difficulty 1, one difficulty 2, and one difficulty 3.
- Questions must be factually accurate for the topic and useful for diagnosis.
- Use concrete facts, scenarios, examples, or common misconceptions from the topic.
- Do not write generic meta-learning questions.
- Do not mention "learner", "assessment", "diagnostic", "practice strategy", "learning style", or any education-app behavior inside the questions or answer choices.
- The word "system" is allowed only when it is part of the actual subject matter, such as software system design.
- Ask about the subject itself, not about how an education app should assess the subject.
- Do not write questions where the stem gives away the correct answer.
- Avoid placeholders such as "a correct core idea", "an unrelated idea", "a memorized term", or "a topic from a different subject".
- Avoid meta-assessment wording such as "learner response", "what should the system trust", "what should the assessment do", or "what kind of practice".
- Multiple-choice distractors must be plausible, same category as the correct answer, and not obviously silly.
- Mix recall, application, misconception, and reasoning questions.
- Use prerequisites only from generated concept ids.`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = await callLLMJson({
      messages: [
        {
          role: "system",
          content: `${SUBJECT_DOMAIN_SYSTEM_PROMPT}\n${ASSESSMENT_QUESTION_SYSTEM_PROMPT}`
        },
        {
          role: "user",
          content:
            attempt === 0
              ? prompt
              : `${prompt}|retry:fix validation failures`
        }
      ],
      temperature: 0.1
    });
    if (!raw) return undefined;
    const domain = validateGeneratedDomain(subject, JSON.parse(raw));
    if (domain) return domain;
  }
  return generateDomainInFocusedBatches(subject);
}

export async function ensureSubjectDomain(store: DataStore, subject: string) {
  const existingConcepts = getSubjectConcepts(store, subject);
  const existingQuestions = getSubjectQuestions(store, subject);
  const isSeededPythonDomain =
    subject.toLowerCase() === DEFAULT_SUBJECT.toLowerCase() &&
    existingConcepts.some((concept) => concept.id === "variables");

  if (
    existingConcepts.length >= 5 &&
    existingQuestions.length >= existingConcepts.length &&
    domainPassesQualityGate(existingConcepts, existingQuestions) &&
    !(getAIProvider() !== "fallback" && isSeededPythonDomain)
  ) {
    return { concepts: existingConcepts, questions: existingQuestions };
  }

  let domain: SubjectDomain | undefined;
  try {
    domain = await generateDomainWithLLM(subject);
  } catch (error) {
    console.warn(
      "Subject domain generation failed",
      error instanceof Error ? error.message : "unknown error"
    );
  }

  if (!domain && subject.toLowerCase() === pythonConcepts[0]?.subject.toLowerCase()) {
    domain = { concepts: pythonConcepts, questions: pythonQuestions };
  }

  if (!domain && /(^|\b)(machine learning|ml)(\b|$)/i.test(subject)) {
    domain = machineLearningFallbackDomain(subject);
  }

  if (!domain) {
    throw new Error(
      getAIProvider() !== "fallback"
        ? `Could not generate a high-quality factual assessment for ${subject}. Please try again.`
        : `High-quality assessment generation for ${subject} requires an LLM provider. Set LLM_PROVIDER=azure or groq with credentials, then try again.`
    );
  }

  const conceptIdsToReplace = new Set(
    store.concepts
      .filter((concept) => concept.subject.toLowerCase() === subject.toLowerCase())
      .map((concept) => concept.id)
  );
  store.concepts = store.concepts.filter(
    (concept) => concept.subject.toLowerCase() !== subject.toLowerCase()
  );
  store.assessmentQuestions = store.assessmentQuestions.filter(
    (question) => !conceptIdsToReplace.has(question.conceptId)
  );
  store.concepts.push(...domain.concepts);
  store.assessmentQuestions.push(...domain.questions);

  return domain;
}
