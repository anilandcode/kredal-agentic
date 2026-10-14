// Smoke test: can ADK drive Gemini on Vertex with a typed output and fail over?
//
//   GOOGLE_CLOUD_PROJECT=fiery-protocol-506516-b0 node scripts/agentic-smoke.mjs
//
// Uses Application Default Credentials — no API key. Two checks:
//   1. An LlmAgent with a zod outputSchema returns parseable, typed JSON.
//   2. A RoutedLlm whose first model does not exist fails over to the next one,
//      which is the mechanism the Healer relies on.

import { Gemini, InMemoryRunner, LlmAgent, RoutedLlm } from "@google/adk";
import { z } from "zod";

const project = process.env.GOOGLE_CLOUD_PROJECT;
if (!project) throw new Error("Set GOOGLE_CLOUD_PROJECT");
const location = process.env.GOOGLE_CLOUD_LOCATION ?? "global";

const gemini = (model) => new Gemini({ model, vertexai: true, project, location });

const Verdict = z.object({
  match: z.boolean().describe("Do the two names refer to the same person?"),
  probability: z.number().min(0).max(1).describe("Probability that `match` is correct"),
  rationale: z.string().describe("One sentence"),
});

async function ask(model, label) {
  const agent = new LlmAgent({
    name: "name_matcher",
    model,
    instruction:
      "Decide whether two names on identity documents refer to the same person. " +
      "Account for transliteration and name order. Answer only in the schema.",
    outputSchema: Verdict,
    outputKey: "verdict",
  });
  const runner = new InMemoryRunner({ agent, appName: "kredal-smoke" });
  const started = Date.now();
  let last;
  for await (const event of runner.runEphemeral({
    userId: "smoke",
    newMessage: {
      role: "user",
      parts: [{ text: 'Passport: "MOHAMMED ABDULLAH KHAN". Trade licence owner: "Muhammad Abdullah Khan".' }],
    },
  })) {
    if (event.content?.parts?.length) last = event;
    if (event.errorMessage) console.log(`  [${label}] event error: ${event.errorMessage}`);
  }
  const text = last?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const parsed = Verdict.parse(JSON.parse(text));
  console.log(`  [${label}] ${Date.now() - started}ms ->`, parsed);
}

console.log("1. Typed output from gemini-3.8-flash on Vertex");
await ask(gemini("gemini-3.8-flash"), "fast");

console.log("2. Failover: first model does not exist, router moves on");
const tried = [];
const routed = new RoutedLlm({
  models: {
    broken: gemini("gemini-does-not-exist"),
    fast: gemini("gemini-3.8-flash"),
  },
  router: (_models, _req, errorContext) => {
    const order = ["broken", "fast"];
    const next = order.find((k) => !errorContext?.failedKeys.has(k));
    tried.push(next);
    return next;
  },
});
await ask(routed, "routed");
console.log(`  router sequence: ${tried.join(" -> ")}`);
