/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "glob";
import { getTranslationObject, getTranslationsFromString } from "./Utils.js";

async function run(): Promise<void> {
  const files = await glob("./src/components/**/*.vue");
  const basePath: string = path.resolve(process.cwd());
  const packageJSON: any = JSON.parse(
    fs.readFileSync(path.join(basePath, "package.json")).toString(),
  );
  const supportedLocales: string[] = packageJSON.config["supported-locales"];
  const defaultLocale: string = packageJSON.config["default-locale"];
  let translations: any = {};

  /** go through all *.vue files end extract the translation object $t('foo') -> {id: 'foo'} */
  files.forEach((file: string) => {
    const content = fs.readFileSync(file).toString();
    const matches: string[] = getTranslationsFromString(content);

    if (matches) {
      translations = { ...translations, ...getTranslationObject(matches) };
    }
  });

  /** analyze and write languages files */
  supportedLocales.forEach((locale: string) => {
    const i18nFilePath: string = path.join(basePath, "i18n", `${locale}.json`);
    const i18nFileContent: string = fs.existsSync(i18nFilePath)
      ? fs.readFileSync(i18nFilePath).toString()
      : "";
    const i18nFileObject: any = i18nFileContent
      ? JSON.parse(i18nFileContent)
      : {};

    (Object as any).keys(i18nFileObject).forEach((key: string) => {
      i18nFileObject[key] = i18nFileObject[key]
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/"/g, '\\"');
    });

    const newI18nObject: any =
      locale === defaultLocale
        ? (Object as any).assign({}, i18nFileObject, translations)
        : (Object as any).assign({}, translations, i18nFileObject);

    /** sort entries */
    const sortedKeys: string[] = (Object as any).keys(newI18nObject).sort();
    const sortedEntries: string[] = sortedKeys.map((key: string) => {
      return `"${key}": "${newI18nObject[key]}"`;
    });

    fs.writeFileSync(
      path.join(basePath, "i18n", `${locale}.json`),
      `{\n  ${sortedEntries.join(",\n  ")}\n}`,
    );

    console.info(`wrote i18n/${locale}.json`);
  });

  console.info("i18n extraction finished");
}

void run();
