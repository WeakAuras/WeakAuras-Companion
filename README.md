# WeakAuras Companion

[![Build Status](https://github.com/WeakAuras/WeakAuras-Companion/workflows/Windows%20Build/badge.svg)](https://github.com/WeakAuras/WeakAuras-Companion/actions?workflow=Windows%20Build/) [![Build Status](https://github.com/WeakAuras/WeakAuras-Companion/workflows/Linux%20Build/badge.svg)](https://github.com/WeakAuras/WeakAuras-Companion/actions?workflow=Linux%20Build/) [![Build Status](https://github.com/WeakAuras/WeakAuras-Companion/workflows/macOS%20Build/badge.svg)](https://github.com/WeakAuras/WeakAuras-Companion/actions?workflow=macOS%20Build/) [![Patreon](https://img.shields.io/badge/patreon-donate-orange.svg)](https://www.patreon.com/weakauras)

The WeakAuras Companion is a cross-platform (Windows/macOS/Linux) application built to provide the missing link between [Wago](https://wago.io) and the WeakAuras World of Warcraft addon.

It enables you to fetch updates to the auras you have installed  directly from Wago, without having to manually copy-paste import strings  all the time. It also makes sure you don't miss any updates, always  keeping you up to date with the latest versions.

![preview](https://i.imgur.com/Du23Mep.png)

## How to Use

- Download and install the WeakAuras Companion from [our website](https://weakauras.wtf/) or [GitHub](https://github.com/WeakAuras/WeakAuras-Companion/releases/latest).
- Start the Companion, it will ask you to give it at least your World of Warcraft folder and account name.
- Follow the instructions inside the app
- Click on 'Fetch Updates', this is also done automatically once every hour.
- Restart World of Warcraft or reload your UI. The first time you  start WeakAuras Companion, you will have to restart the game for it to  be able to load the addon.
- Now open the WeakAuras panel in-game and look for the new 'update-available' icon next to the names in the list.
- After clicking on it, you get the usual choice of being able to upgrade or import as copy. That's it!

![preview2](https://i.imgur.com/cffdU0N.png)

![preview3](https://i.imgur.com/VVCWrfE.png)

![preview4](https://i.imgur.com/48uLOw8.png)

### Backups

The Companion is able to regularily create backups of your WeakAuras so you don't lose them in case of a crash or other accident. This option needs to be enabled manually in the options.

![preview4](https://i.imgur.com/9WchRsg.png)

### Known Issues

- If you previously downloaded an aura from Wago that is not a whole  group and put it into one of your own custom groups, the Companion will  not show any updates for it.

### Other Addons

- We recently took a pull request that adds [Plater](https://www.curseforge.com/wow/addons/plater-nameplates) support to the Companion. Since Plater profiles and mods could already be shared on wago.io, it was the logical next step to add them to Companion.

## Contributing

### Build Setup

```bash
# install dependencies
yarn

# serve with hot reload at localhost:9080
yarn dev

# build electron application for production
yarn build
```

### Extract new translation strings to i18n/*.json files

```bash
yarn i18n
```
