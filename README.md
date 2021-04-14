# WeakAuras Companion

[![Build Status](https://github.com/WeakAuras/WeakAuras-Companion/workflows/Windows%20Build/badge.svg)](https://github.com/WeakAuras/WeakAuras-Companion/actions?workflow=Windows%20Build/) [![Build Status](https://github.com/WeakAuras/WeakAuras-Companion/workflows/Linux%20Build/badge.svg)](https://github.com/WeakAuras/WeakAuras-Companion/actions?workflow=Linux%20Build/) [![Build Status](https://github.com/WeakAuras/WeakAuras-Companion/workflows/macOS%20Build/badge.svg)](https://github.com/WeakAuras/WeakAuras-Companion/actions?workflow=macOS%20Build/) [![Patreon](https://img.shields.io/badge/patreon-donate-orange.svg)](https://www.patreon.com/weakauras)

The WeakAuras Companion is a cross-platform (Windows/macOS/Linux) application built to provide the missing link between [Wago](https://wago.io) and the WeakAuras World of Warcraft addon.

It enables you to fetch updates to the auras you have installed  directly from Wago, without having to manually copy-paste import strings  all the time. It also makes sure you don't miss any updates, always  keeping you up to date with the latest versions.

![preview](https://i.imgur.com/Du23Mep.png)

## How to Use

### WeakAuras

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

### Updating Plater Profiles, Mods or Scripts

- Follow the steps above in 'How to Use' for WeakAuras to install and configure the WeakAuras Companion up to the point after restarting World of Warcraft / reloading your UI.
- Each 'Fetch' for new updates will recognize installed Plater Profiles, Mods and Scripts. Please note, that you need to have them copied and installed from wago.io prior to being able to receive updates this way.
- Now open the Plater options panel in-game and look for the wago icons on the Scripting, Modding or Profiles tab. Those icons indicate available updates in this category, as can be seen on (1.) on the screenshots below.

To update your profile, go to the Profiles tab and check the wago.io Profile Information (2.), then click on 'Update Profile' (3.) - You will be prompted to update.
![preview5](https://i.imgur.com/C9YGuES.png)

The update procedure for Mods and Scripts is identical: First check for available updates indicated by the small wago icon on the respective tab (1.) then find the update indicator on the Mod/Script (2.). The tooltip will give you additional information about the update (3.).
![preview6](https://i.imgur.com/42V4AH5.png)

To update a Mod or Script, either click on the wago icon (2.) or use the right-click menu on the Mod or Script and select 'Update from Wago.io' (3.).
![preview7](https://i.imgur.com/6wtgxIn.png)

You will be prompted to either overwrite the existing version (Yes) or to create a copy (No). Cancelling the operation is possible by closing the prompt window by clicking on the 'X' on the top right.
![preview8](https://i.imgur.com/2IDBgMw.png)

### Backups

The Companion is able to regularly create backups of your WeakAuras so you don't lose them in case of a crash or other accident. This option needs to be enabled manually in the options.

![preview9](https://i.imgur.com/9WchRsg.png)

### Known Issues

- If you previously downloaded an aura from Wago that is not a whole  group and put it into one of your own custom groups, the Companion will  not show any updates for it.

### Other Addons

- We recently took a pull request that adds [Plater](https://www.curseforge.com/wow/addons/plater-nameplates) support to the Companion. Since Plater profiles and mods could already be shared on wago.io, it was the logical next step to add them to Companion.
- Support for additional Addons can be implemented by adding an addon-configuration and SavedVariables parser to the existing framework.

## Contributing

### Build Setup

```bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build
```

### Extract new translation strings to i18n/*.json files

```bash
npm run i18n
```
