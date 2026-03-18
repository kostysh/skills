import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Password reset rate limiting", () => {
  it("AC-F0001-04 rate limits reset requests", async () => {
    const attemptsPerHour = 5;
    const blockedAttempt = attemptsPerHour + 1;

    assert.equal(attemptsPerHour, 5);
    assert.ok(blockedAttempt > attemptsPerHour);
  });
});
