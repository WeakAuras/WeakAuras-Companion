export function getTranslationsFromString(content: string): string[] {
  // Match:
  // - $t("id" /* ... */)
  // - $tc("id" /* ... */)
  // - i18n.global.t("id" /* ... */)
  // - anything.t("id" /* ... */)
  //
  // We only collect calls that include a /* default message */ comment.
  const re =
    /\b(?:\$tc?|\$t|i18n\.global\.t|[\w$.]+\.t)\(\s*["']([^"']+)["']([\s\S]*?)\/\*([\s\S]*?)\*\/([\s\S]*?)\)/gm;

  return content.match(re) || [];
}

export function sanitizeMessage(message: string): string {
  const replacements: Array<{ from: string | RegExp; to: string }> = [
    { from: /\s\s+/g, to: " " },
    { from: "/*", to: "" },
    { from: "*/", to: "" },
    { from: /\[/g, to: "<" },
    { from: /\]/g, to: ">" },
    { from: /"/g, to: '\\"' },
  ];

  let sanitizedMessage = message;

  for (const replacement of replacements) {
    sanitizedMessage = sanitizedMessage.replace(
      replacement.from,
      replacement.to,
    );
  }

  return sanitizedMessage.trim();
}

export function getTranslationObject(
  matches: string[],
): Record<string, string> {
  const translations: Record<string, string> = {};

  for (const call of matches) {
    // First string argument inside (...)
    const idMatch = call.match(/\(\s*["']([^"']+)["']/m);
    const commentMatch = call.match(/\/\*([\s\S]*?)\*\//m);

    if (!idMatch || !commentMatch) continue;

    const id = idMatch[1];
    const defaultMessageToSanitize = `/*${commentMatch[1]}*/`;

    translations[id] = sanitizeMessage(defaultMessageToSanitize);
  }

  return translations;
}
