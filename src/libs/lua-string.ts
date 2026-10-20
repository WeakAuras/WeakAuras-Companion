export function serializeLuaString(value: unknown): string {
  const content = String(value);
  let separator = "=";

  while (
    content.includes(`]${separator}]`) ||
    content.endsWith(`]${separator}`)
  ) {
    separator += "=";
  }

  // Lua discards one newline immediately after a long-string opener.
  return `[${separator}[\n${content}]${separator}]`;
}
