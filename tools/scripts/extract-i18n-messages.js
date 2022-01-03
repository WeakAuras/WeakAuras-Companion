"use strict";
/* tslint:disable:no-console */
Object.defineProperty(exports, "__esModule", { value: true });
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const Utils_1 = require("./Utils");
const run = () => {
    glob.glob('./src/components/**/*.vue', (err, files) => {
        const basePath = path.resolve(process.cwd());
        const packageJSON = JSON.parse(fs.readFileSync(path.join(basePath, 'package.json')).toString());
        const supportedLocales = packageJSON.config['supported-locales'];
        const defaultLocale = packageJSON.config['default-locale'];
        let translations = {};
        /**
         * go through all *.vue files end extract the translation object $t('foo') -> {id: 'foo'}
         */
        files.forEach((file) => {
            const content = fs.readFileSync(file).toString();
            const matches = (0, Utils_1.getTranslationsFromString)(content);
            if (matches) {
                translations = Object.assign(Object.assign({}, translations), (0, Utils_1.getTranslationObject)(matches));
            }
        });
        /**
         * analyze and write languages files
         */
        supportedLocales.forEach((locale) => {
            const i18nFilePath = path.join(basePath, 'i18n', `${locale}.json`);
            const i18nFileContent = fs.existsSync(i18nFilePath) ? fs.readFileSync(i18nFilePath).toString() : "";
            const i18nFileObject = i18nFileContent ? JSON.parse(i18nFileContent) : {};
            Object.keys(i18nFileObject).forEach((key) => {
                i18nFileObject[key] = i18nFileObject[key].replace(/\n/g, '\\n').replace(/"/g, '\\"');
            });
            const newI18nObject = locale === defaultLocale
                ? Object.assign({}, i18nFileObject, translations)
                : Object.assign({}, translations, i18nFileObject);
            /**
             * sort entries
             */
            const sortedKeys = Object.keys(newI18nObject).sort();
            const sortedEntries = sortedKeys.map((key) => {
                return `"${key}": "${newI18nObject[key]}"`;
            });
            fs.writeFileSync(path.join(basePath, 'i18n', `${locale}.json`), `{\n  ${sortedEntries.join(',\n  ')}\n}\n`);
            console.info(`wrote i18n/${locale}.json`);
        });
        console.info('i18n extraction finished');
    });
};
run();
