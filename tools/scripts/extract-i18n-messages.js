"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const glob_1 = require("glob");
const path = require("path");
const Utils_1 = require("./Utils");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield (0, glob_1.glob)('./src/components/**/*.vue');
    const basePath = path.resolve(process.cwd());
    const packageJSON = JSON.parse(fs.readFileSync(path.join(basePath, 'package.json')).toString());
    const supportedLocales = packageJSON.config['supported-locales'];
    const defaultLocale = packageJSON.config['default-locale'];
    let translations = {};
    /** go through all *.vue files end extract the translation object $t('foo') -> {id: 'foo'} */
    files.forEach((file) => {
        const content = fs.readFileSync(file).toString();
        const matches = (0, Utils_1.getTranslationsFromString)(content);
        if (matches) {
            translations = Object.assign(Object.assign({}, translations), (0, Utils_1.getTranslationObject)(matches));
        }
    });
    /** analyze and write languages files */
    supportedLocales.forEach((locale) => {
        const i18nFilePath = path.join(basePath, 'i18n', `${locale}.json`);
        const i18nFileContent = fs.existsSync(i18nFilePath) ? fs.readFileSync(i18nFilePath).toString() : "";
        const i18nFileObject = i18nFileContent ? JSON.parse(i18nFileContent) : {};
        Object.keys(i18nFileObject).forEach((key) => {
            i18nFileObject[key] = i18nFileObject[key].replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
        });
        const newI18nObject = locale === defaultLocale
            ? Object.assign({}, i18nFileObject, translations)
            : Object.assign({}, translations, i18nFileObject);
        /** sort entries */
        const sortedKeys = Object.keys(newI18nObject).sort();
        const sortedEntries = sortedKeys.map((key) => {
            return `"${key}": "${newI18nObject[key]}"`;
        });
        fs.writeFileSync(path.join(basePath, 'i18n', `${locale}.json`), `{\n  ${sortedEntries.join(',\n  ')}\n}`);
        console.info(`wrote i18n/${locale}.json`);
    });
    console.info('i18n extraction finished');
});
run();
