# Pluralization template

Sometimes you need to localize the phrase in which a word changes depending on the number that qualifies it. In that case, you deal with so-called pluralization. It is used to show correct form of the word to the user.

## Format

By adding or editing such phrases in these files, you have to use and keep the following format:

**De, En or Fr:** specify the forms of the word for cases: none, singular, plural

```
"app.phrase": "no things | 1 thing | {n} things"
```

**Ru:** specify the forms of the word for cases: none, singular, few (2-4), plural

```
"app.phrase": "no things | {n} thing | {n} things | {n} things"
```

## Example

Phrase is "You have selected n files".

**En:** 
```
"app.countFiles": "You haven't selected any files | You have selected 1 file | You have selected {n} files"
```

**Ru:**
```
"app.countFiles": "Вы не выбрали ни одного файла | Вы выбрали {n} файл | Вы выбрали {n} файла | Вы выбрали {n} файлов"
```