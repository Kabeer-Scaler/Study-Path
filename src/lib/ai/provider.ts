import type { LessonContent } from "@/lib/types";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayFrom(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(15000, retryAfterSeconds * 1000);
  }
  return 1500 * (attempt + 1);
}

export function getAIProvider() {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (provider === "groq" && process.env.GROQ_API_KEY?.trim()) {
    return "groq" as const;
  }
  return "fallback" as const;
}

export async function callGroqJson({
  messages,
  temperature = 0.2
}: {
  messages: ChatMessage[];
  temperature?: number;
}) {
  if (getAIProvider() !== "groq") return undefined;

  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages,
        temperature,
        response_format: { type: "json_object" }
      })
    });

    if (response.status === 429 && attempt < 2) {
      lastStatus = response.status;
      await sleep(retryDelayFrom(response, attempt));
      continue;
    }

    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? "Groq rate limit reached. Please wait a minute and try again."
          : `Groq request failed with status ${response.status}.`
      );
    }

    const payload = (await response.json()) as GroqChatResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response.");
    return content;
  }

  throw new Error(
    lastStatus === 429
      ? "Groq rate limit reached. Please wait a minute and try again."
      : "Groq request failed after retries."
  );
}

export function isLessonContent(value: unknown): value is LessonContent {
  if (!value || typeof value !== "object") return false;
  const item = value as LessonContent;
  return (
    typeof item.title === "string" &&
    typeof item.learningObjective === "string" &&
    typeof item.explanation === "string" &&
    typeof item.analogy === "string" &&
    typeof item.example === "string" &&
    typeof item.codeExample === "string" &&
    typeof item.commonMistake === "string" &&
    typeof item.practiceQuestion?.question === "string" &&
    typeof item.practiceQuestion?.answer === "string" &&
    typeof item.practiceQuestion?.hint === "string" &&
    Array.isArray(item.quiz) &&
    item.quiz.every(
      (question) =>
        typeof question.questionId === "string" &&
        typeof question.question === "string" &&
        typeof question.type === "string" &&
        typeof question.correctAnswer === "string" &&
        typeof question.explanation === "string"
    )
  );
}

export function isTutorPayload(
  value: unknown
): value is { reply: string; tutorStrategy: "guiding_question" | "hint" | "explanation" } {
  if (!value || typeof value !== "object") return false;
  const item = value as { reply?: unknown; tutorStrategy?: unknown };
  return (
    typeof item.reply === "string" &&
    ["guiding_question", "hint", "explanation"].includes(
      String(item.tutorStrategy)
    )
  );
}
