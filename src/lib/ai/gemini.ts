import "server-only";

/**
 * Minimal server-side Gemini client (REST, no SDK). Used for document
 * extraction and narrative drafting. The API key never leaves the server.
 *
 * Free-tier rate limits are low (~15 RPM), so calls retry with backoff on
 * 429/5xx. Keep prompts small and responses JSON-constrained.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GenerateOptions {
  /** Force JSON output. */
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function geminiGenerate(
  parts: GeminiPart[],
  options: GenerateOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY is not configured.");
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  let lastError: GeminiError | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${BASE_URL}/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    }).catch((err) => {
      lastError = new GeminiError(`network: ${err.message}`);
      return null;
    });

    if (res) {
      if (res.ok) {
        const data = await res.json();
        const text: string | undefined =
          data?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? "")
            .join("");
        if (!text) {
          throw new GeminiError("Empty response from Gemini.");
        }
        return text;
      }
      const detail = await res.text().catch(() => "");
      lastError = new GeminiError(
        `Gemini ${res.status}: ${detail.slice(0, 200)}`,
        res.status
      );
      // Retry only on rate limits / transient server errors.
      if (res.status !== 429 && res.status < 500) break;
    }
    await sleep(1500 * attempt);
  }

  throw lastError ?? new GeminiError("Gemini request failed.");
}

/** Parse a JSON response, tolerating markdown code fences. */
export function parseGeminiJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as T;
}
