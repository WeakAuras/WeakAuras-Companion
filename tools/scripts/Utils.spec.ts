import { describe, expect, test } from "vitest";

import {
  getTranslationObject,
  getTranslationsFromString,
  sanitizeMessage,
} from "./Utils.js";

describe("Utils", () => {
  test("should remove comments, line breaks and double white spaces", () => {
    const message = `/*
    test \\n test
    test
    test
    */`;

    expect(sanitizeMessage(message)).toBe("test \\n test test test");
  });

  test("should escape double quotes", () => {
    const message = '/* "foo" */';

    expect(sanitizeMessage(message)).toBe('\\"foo\\"');
  });

  test("should replace <> with []", () => {
    const message = "/* [a]test[/a] */";

    expect(sanitizeMessage(message)).toBe("<a>test</a>");
  });

  test("should parse translations from a string", () => {
    const content = `<div>
      {{ $t('test' /* this is a test */) }}
      {{ $t('test.test') }}
      {{ $t('test.foo' /* test (test) [test] test */) }}
      {{ $t('test.foo2' /* test (test) [test] test */ ) }}
      {{ $t("test.bar" /* test (test) [test] test */ ) }}
      <small>{{ $t('App.nav.counter' /* Counter */) }}</small>
                  text:  this.$t('components.register.submit.notification.text', model /* We've sent an email to: {email}! */),
$t('components.markdown' /*
# Markdown support\\n
- build on top of marked\\n
- server side rendering!!!\\n
- \`github style\` markdown
*/)
    </div>`;

    expect(getTranslationsFromString(content)).toEqual([
      "$t('test' /* this is a test */)",
      "$t('test.foo' /* test (test) [test] test */)",
      "$t('test.foo2' /* test (test) [test] test */ )",
      '$t("test.bar" /* test (test) [test] test */ )',
      "$t('App.nav.counter' /* Counter */)",
      "$t('components.register.submit.notification.text', model /* We've sent an email to: {email}! */)",
      "$t('components.markdown' /*\n# Markdown support\\n\n- build on top of marked\\n\n- server side rendering!!!\\n\n- `github style` markdown\n*/)",
    ]);

    expect(getTranslationsFromString("")).toEqual([]);
  });

  test("should get a translation object", () => {
    const content = `<div>
      {{ $t('test' /* this is a test */) }}
      {{ $t('test.test') }}
      {{ $t('test.foo' /* test (test) [test] test */) }}
      {{ $t('test.foo' /* test (test) [test] test */ ) }}
    </div>`;

    expect(getTranslationObject(getTranslationsFromString(content))).toEqual({
      "test": "this is a test",
      "test.foo": "test (test) <test> test",
    });
  });
});
