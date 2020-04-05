"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslationsFromString = (content) => {
    return content.match(/\$tc?\([\r\n ]*["'].*["'][^/]*\/\*[^*]*?\*\/[\r\n ]*\)/gm) || [];
};
exports.sanitizeMessage = (message) => {
    const replacements = [
        { from: /\s\s+/g, to: ' ' },
        { from: '/*', to: '' },
        { from: '*/', to: '' },
        { from: /\[/g, to: '<' },
        { from: /\]/g, to: '>' },
        { from: /"/g, to: '\\"' },
    ];
    replacements.forEach((replacement) => {
        message = message.replace(replacement.from, replacement.to);
    });
    return message.trim();
};
exports.getTranslationObject = (matches) => {
    const translations = {};
    matches.forEach((translation) => {
        const id = translation.match(/["',]\S*["',]/)[0].replace(/[\\"',]/g, "");
        const defaultMessage = translation.match(/\/\*[^/]*\*\//)[0];
        translations[id] = exports.sanitizeMessage(defaultMessage);
    });
    return translations;
};
