import type { LessonContent } from "@/lib/types";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type AIProvider = "groq" | "azure" | "fallback";

type ProviderConfig = {
  provider: "groq" | "azure";
  url: string;
  apiKey: string;
  model: string;
  authHeader: "bearer" | "api-key";
  includeModelInBody: boolean;
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

function providerLabel(provider: AIProvider) {
  return provider === "azure" ? "Azure" : "Groq";
}

function getProviderConfig(): ProviderConfig | undefined {
  const provider = getAIProvider();
  if (provider === "azure") {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!.replace(/\/$/, "");
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview";
    return {
      provider,
      url: `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      model: deployment,
      authHeader: "api-key",
      includeModelInBody: false
    };
  }
  if (provider === "groq") {
    return {
      provider,
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY!,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      authHeader: "bearer",
      includeModelInBody: true
    };
  }
  return undefined;
}

export function getAIProvider(): AIProvider {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (
    provider === "azure" &&
    process.env.AZURE_OPENAI_ENDPOINT?.trim() &&
    process.env.AZURE_OPENAI_API_KEY?.trim() &&
    process.env.AZURE_OPENAI_DEPLOYMENT?.trim()
  ) {
    return "azure";
  }
  if (provider === "groq" && process.env.GROQ_API_KEY?.trim()) {
    return "groq";
  }
  return "fallback";
}

export async function callLLMJson({
  messages,
  temperature = 0.2
}: {
  messages: ChatMessage[];
  temperature?: number;
}) {
  const config = getProviderConfig();
  if (!config) return undefined;

  const label = providerLabel(config.provider);
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (config.authHeader === "api-key") {
    headers["api-key"] = config.apiKey;
  } else {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const body: Record<string, unknown> = {
    messages,
    temperature,
    response_format: { type: "json_object" }
  };
  if (config.includeModelInBody) {
    body.model = config.model;
  }

  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(config.url, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers,
        body: JSON.stringify(body)
      });
    } catch (error) {
      if (attempt < 2) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      const detail =
        error instanceof Error && error.cause instanceof Error
          ? error.cause.message
          : error instanceof Error
            ? error.message
            : "unknown error";
      throw new Error(
        `${label} network error: could not reach the API endpoint (${detail}). Check internet/DNS and AZURE_OPENAI_ENDPOINT.`
      );
    }

    if (response.status === 429 && attempt < 2) {
      lastStatus = response.status;
      await sleep(retryDelayFrom(response, attempt));
      continue;
    }

    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? `${label} rate limit reached. Please wait a minute and try again.`
          : `${label} request failed with status ${response.status}.`
      );
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${label} returned an empty response.`);
    return content;
  }

  throw new Error(
    lastStatus === 429
      ? `${label} rate limit reached. Please wait a minute and try again.`
      : `${label} request failed after retries.`
  );
}

export function isLessonContent(value: unknown): value is LessonContent {
  if (!value || typeof value !== "object") return false;
  const item = value as LessonContent;
  return (
    typeof item.title === "string" &&
    typeof item.learningObjective === "string" &&
    (item.intro === undefined || typeof item.intro === "string") &&
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
