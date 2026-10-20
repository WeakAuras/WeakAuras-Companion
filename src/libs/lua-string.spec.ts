import luaparse from "luaparse";
import { describe, expect, it } from "vitest";

import { serializeLuaString } from "./lua-string";

function parseSerializedString(value: unknown): string {
  const chunk = luaparse.parse(`return ${serializeLuaString(value)}`);
  const statement = chunk.body[0];

  if (
    statement?.type !== "ReturnStatement" ||
    statement.arguments[0]?.type !== "StringLiteral"
  ) {
    throw new Error("Expected a single Lua string literal");
  }

  return statement.arguments[0].value;
}

describe("serializeLuaString", () => {
  it("preserves values containing Lua long-string delimiters", () => {
    const maliciousValue = 'name]=]; error("injected") -- [==[still data]==]';

    expect(parseSerializedString(maliciousValue)).toBe(maliciousValue);
  });

  it("prevents a closing delimiter from spanning the content boundary", () => {
    const boundaryValue = "contains ]=] and ends with a wider prefix]==";

    expect(parseSerializedString(boundaryValue)).toBe(boundaryValue);
  });

  it("preserves a leading newline", () => {
    const multilineValue = "\nfirst line\nsecond line";

    expect(parseSerializedString(multilineValue)).toBe(multilineValue);
  });

  it("serializes non-string values as strings", () => {
    expect(parseSerializedString(42)).toBe("42");
  });
});
