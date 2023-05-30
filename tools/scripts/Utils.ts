export function getTranslationsFromString(content: string): RegExpMatchArray | string[] {
  return content.match(/\$tc?\([\r\n ]*["'].*["'][^/]*\/\*[^*]*?\*\/[\r\n ]*\)/gm) || [];
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

  replacements.forEach((replacement: { from: string | RegExp; to: string }) => {
    message = message.replace(replacement.from, replacement.to);
  });

  return message.trim();
}

export function getTranslationObject(matches: string[]): any {
  const translations: any = {};

  matches.forEach((translation: string): void => {
    const id = translation.match(/["',]\S*["',]/)?.[0].replace(/[\\"',]/g, "") as string;
    const defaultMessage: RegExpMatchArray | null = translation.match(/\/\*[^/]*\*\//);

    if (defaultMessage) {
      const defaultMessageToSanitize = defaultMessage[0];
      translations[id] = sanitizeMessage(defaultMessageToSanitize) as string;
    }
  });

  return translations;
}
