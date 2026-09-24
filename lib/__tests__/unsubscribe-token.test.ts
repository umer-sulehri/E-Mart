import { describe, it, expect } from "vitest";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../unsubscribe-token";

describe("unsubscribe-token", () => {
  it("creates a token that verifies for the same email", () => {
    const email = "user@example.com";
    const token = createUnsubscribeToken(email);
    expect(verifyUnsubscribeToken(token)).toBe(email);
  });

  it("normalizes case and whitespace", () => {
    const token = createUnsubscribeToken("  User@Example.COM ");
    expect(verifyUnsubscribeToken(token)).toBe("user@example.com");
  });

  it("decodes the email embedded in a valid token", () => {
    const token = createUnsubscribeToken("alice@example.com");
    expect(verifyUnsubscribeToken(token)).toBe("alice@example.com");
  });

  it("rejects malformed tokens", () => {
    expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
    expect(verifyUnsubscribeToken("")).toBeNull();
    expect(verifyUnsubscribeToken("a.b")).toBeNull();
  });

  it("rejects tampered tokens", () => {
    const token = createUnsubscribeToken("user@example.com");
    const tampered = token.slice(0, -2) + (token.endsWith("ab") ? "cd" : "ab");
    expect(tampered).not.toBe(token);
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });
});