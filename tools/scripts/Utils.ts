export function getTranslationsFromString(
  content: string,
): RegExpMatchArray | string[] {
  return (
    content.match(/\$tc?\([\r\n ]*["'].*["'][^/]*\/\*[^*]*?\*\/[\r\n ]*\)/gm) ||
    []
  );
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

  for (const translation of matches) {
    const id = translation.match(/["',]\S*["',]/)?.[0].replace(/[\\"',]/g, "");
    const defaultMessage: RegExpMatchArray | null =
      translation.match(/\/\*[^/]*\*\//);

    if (defaultMessage) {
      const defaultMessageToSanitize = defaultMessage[0];
      translations[id] = sanitizeMessage(defaultMessageToSanitize);
    }
  }
  return translations;
}
