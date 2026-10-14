// Diagnostic: how long does each Gemini model take to read one bank statement,
// with its default thinking and with thinking reduced? Sequential, so quota
// limits do not distort the timings.
//
//   GOOGLE_CLOUD_PROJECT=fiery-protocol-506516-b0 node scripts/agentic-latency.mjs

import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: "global" });
const pdf = readFileSync(new URL("../public/specimens/bluewater-cargo/bank-statement.pdf", import.meta.url)).toString("base64");
const prompt =
  "Read this bank statement. Return JSON with keys account_holder, bank_name, period_start, period_end " +
  "(yyyy-mm-dd), opening_balance, closing_balance, total_credits, total_debits (plain numbers), currency.";

const trials = [
  ["gemini-3.8-flash", undefined],
  ["gemini-3.8-flash", { thinkingLevel: "LOW" }],
  ["gemini-3.5-flash", undefined],
  ["gemini-3.5-flash", { thinkingLevel: "LOW" }],
  ["gemini-2.5-flash", undefined],
  ["gemini-2.5-flash", { thinkingBudget: 0 }],
];

for (const [model, thinkingConfig] of trials) {
  const started = Date.now();
  const label = `${model.padEnd(18)} ${thinkingConfig ? JSON.stringify(thinkingConfig) : "default thinking"}`;
  try {
    const res = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "application/pdf", data: pdf } }] }],
        config: { temperature: 0, responseMimeType: "application/json", ...(thinkingConfig ? { thinkingConfig } : {}) },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("no answer in 60s")), 60_000)),
    ]);
    const u = res.usageMetadata ?? {};
    const ok = /21975\.25/.test(res.text ?? "");
    console.log(`${label.padEnd(56)} ${String(Date.now() - started).padStart(6)}ms  thoughts=${u.thoughtsTokenCount ?? 0}  out=${u.candidatesTokenCount ?? 0}  correct=${ok}`);
  } catch (err) {
    console.log(`${label.padEnd(56)} ${String(Date.now() - started).padStart(6)}ms  FAILED: ${String(err.message ?? err).slice(0, 90)}`);
  }
}
