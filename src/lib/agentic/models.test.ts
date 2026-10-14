import { BaseLlm, type LlmRequest, type LlmResponse } from "@google/adk";
import { describe, expect, it } from "vitest";
import { TimedLlm } from "./models";

/** A model that answers after `delayMs`, or never if `delayMs` is Infinity. */
class FakeLlm extends BaseLlm {
  constructor(private readonly delayMs: number) {
    super({ model: "fake" });
  }
  async *generateContentAsync(): AsyncGenerator<LlmResponse, void> {
    if (this.delayMs === Infinity) await new Promise(() => {}); // hangs, ignores abort
    await new Promise((r) => setTimeout(r, this.delayMs));
    yield { content: { role: "model", parts: [{ text: "ok" }] } } as LlmResponse;
  }
  connect(): never {
    throw new Error("not used");
  }
}

const drain = async (llm: BaseLlm) => {
  const out: LlmResponse[] = [];
  for await (const r of llm.generateContentAsync({} as LlmRequest)) out.push(r);
  return out;
};

describe("TimedLlm", () => {
  it("passes a timely answer straight through", async () => {
    const out = await drain(new TimedLlm(new FakeLlm(5), 200));
    expect(out[0].content?.parts?.[0].text).toBe("ok");
  });

  it("turns a model that never answers into an ordinary failure", async () => {
    const started = Date.now();
    await expect(drain(new TimedLlm(new FakeLlm(Infinity), 80))).rejects.toThrow(/did not answer within/);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
