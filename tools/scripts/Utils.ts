export const getTranslationsFromString = (content: string): RegExpMatchArray => {
  return content.match(/\$tc?\([\r\n ]*["'].*["'][^/]*\/\*[^*]*?\*\/[\r\n ]*\)/gm) || [];
};
export const sanitizeMessage = (message: string): string => {
  const replacements: Array<{ from: string | RegExp, to: string }> = [
    { from: /\s\s+/g, to: ' ' },
    { from: '/*', to: '' },
    { from: '*/', to: '' },
    { from: /\[/g, to: '<' },
    { from: /\]/g, to: '>' },
    { from: /"/g, to: '\\"' },
  ];

  replacements.forEach((replacement: { from: string | RegExp, to: string }) => {
    message = message.replace(replacement.from, replacement.to);
  });

  return message.trim();
};
export const getTranslationObject = (matches: string[]): any => {
  const translations: any = {};

  matches.forEach((translation: string): void => {
    const id: string = translation.match(/["',]\S*["',]/)[0].replace(/[\\"',]/g, "");
    const defaultMessage: string = translation.match(/\/\*[^/]*\*\//);
    if (defaultMessage) {
      translations[id] = sanitizeMessage(defaultMessage)[0];
    }
  });

  return translations;
};