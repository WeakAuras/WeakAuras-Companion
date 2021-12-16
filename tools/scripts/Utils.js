"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslationObject = exports.sanitizeMessage = exports.getTranslationsFromString = void 0;
const getTranslationsFromString = (content) => {
    return content.match(/\$tc?\([\r\n ]*["'].*["'][^/]*\/\*[^*]*?\*\/[\r\n ]*\)/gm) || [];
};
exports.getTranslationsFromString = getTranslationsFromString;
const sanitizeMessage = (message) => {
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
exports.sanitizeMessage = sanitizeMessage;
const getTranslationObject = (matches) => {
    const translations = {};
    matches.forEach((translation) => {
        const id = translation.match(/["',]\S*["',]/)[0].replace(/[\\"',]/g, "");
        const defaultMessage = translation.match(/\/\*[^/]*\*\//)[0];
        translations[id] = (0, exports.sanitizeMessage)(defaultMessage);
    });
    return translations;
};
exports.getTranslationObject = getTranslationObject;
