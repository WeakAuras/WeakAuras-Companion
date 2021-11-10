/* eslint-disable no-underscore-dangle */
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  shell,
  ipcMain,
  Notification,
  protocol,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import path from "path";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import AutoLaunch from "auto-launch";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

const remoteMain = require("@electron/remote/main");
remoteMain.initialize();
const electronLocalshortcut = require("electron-localshortcut");
const Store = require("electron-store");
const isDevelopment = process.env.NODE_ENV !== "production";
const isProduction = process.env.NODE_ENV == "production";

// disable outdated method for auto start
const AutoLauncher = new AutoLaunch({
  name: "WeakAuras Companion",
});

AutoLauncher.isEnabled().then(function (isEnabled) {
  if (isEnabled) {
    AutoLauncher.disable();

    app.setLoginItemSettings({
      openAtLogin: true,
    });
  }
});

const store = new Store();
const config = store.get("config");
let cancellationToken;

autoUpdater.autoDownload = false;
autoUpdater.allowDowngrade = true;

autoUpdater.allowPrerelease =
  autoUpdater.allowPrerelease || (config && config.beta === true);
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (isProduction) {
  global.__static = path.join(__dirname, "/public").replace(/\\/g, "\\\\");
}

let tray = null;
let contextMenu = null;
let mainWindow = null;
let winURL = null;

const iconpath = path.join(
  __static,
  `icon${process.platform === "win32" ? ".ico" : "-light.png"}`
);

function handleLinks(link) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("linkHandler", link);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    height: 720,
    width: 940,
    minHeight: 720,
    minWidth: 940,
    frame: false,
    transparent: true,
    backgroundColor: "#00ffffff",
    icon: path.join(__static, "icon.png"),
    resizable: true,
    webPreferences: {
      disableBlinkFeatures: "Auxclick",
      nativeWindowOpen: true,
      webSecurity: process.env.NODE_ENV !== "development",
      allowRunningInsecureContent: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  remoteMain.enable(mainWindow.webContents);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);

    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    mainWindow.loadURL("app://./index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.setMenu(null);

  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.minimize();
  });

  mainWindow.on("ready-to-show", () => {
    if (!store.get("config.startminimize", false)) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Protocol handler for Windows
  if (process.platform === "win32") {
    handleLinks(process.argv.pop());
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.once("dom-ready", () => {
    mainWindow.webContents.send(
      "setAllowPrerelease",
      autoUpdater.allowPrerelease
    );
  });

  tray = new Tray(iconpath);

  contextMenu = Menu.buildFromTemplate([
    {
      label: "Open WeakAuras Companion",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Check for Companion Updates",
      click: () => {
        if (cancellationToken) {
          cancellationToken.cancel();
        }

        autoUpdater.checkForUpdates().then((UpdateCheckResult) => {
          mainWindow.webContents.send(
            "updaterHandler",
            "checkForUpdates",
            UpdateCheckResult
          );
          ({ cancellationToken } = UpdateCheckResult);
        });
      },
    },
    {
      label: "Open DevTools Console",
      click: () => {
        mainWindow.webContents.openDevTools({ mode: "detach" });
      },
    },
    { type: "separator" },
    {
      label: "Fetch Updates",
      click: () => {
        mainWindow.webContents.send("refreshWago");
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.on("right-click", () => tray.popUpContextMenu(contextMenu));

  // Ignore double click events for the tray icon
  tray.setIgnoreDoubleClickEvents(true);

  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on("will-navigate", (event) => {
    if (mainWindow.webContents.getURL() !== winURL) {
      event.preventDefault();
    }
  });

  electronLocalshortcut.register(mainWindow, "Ctrl+Shift+I", () => {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (event, argv) => {
    // Protocol handler for Windows
    if (process.platform === "win32") {
      handleLinks(argv.pop());
    }

    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error("Vue Devtools failed to install:", e.toString());
      }
    }
    createWindow();

    if (process.env.NODE_ENV === "production") {
      autoUpdater.checkForUpdates().then((UpdateCheckResult) => {
        mainWindow.webContents.send(
          "updaterHandler",
          "checkForUpdates",
          UpdateCheckResult
        );
        ({ cancellationToken } = UpdateCheckResult);
      });
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// important for notifications on Windows
app.setAppUserModelId("wtf.weakauras.companion");
app.setAsDefaultProtocolClient("weakauras-companion");

// Protocol handler for macOS
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleLinks(url);
});

// event used when clicking on notifications
ipcMain.on("open", () => {
  mainWindow.show();
  mainWindow.focus();
});

ipcMain.on("minimize", () => {
  mainWindow.hide();
});

ipcMain.on("close", () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.on("installUpdates", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("autoStart", (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
  });
});

let lastNotificationBody = "";

ipcMain.on("postFetchingNewUpdateNotification", (event, news) => {
  const text = news.join("\n");

  if (text === "" || text === lastNotificationBody) return; // prevent notification spam

  const notification = new Notification({
    title: "New update ready to install",
    body: text,
    icon: path.join(
      __static,
      process.platform === "win32" ? "bigicon.png" : "icon.png"
    ),
  });

  notification.on("click", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  notification.show();
  lastNotificationBody = text;
});

ipcMain.on("checkUpdates", (event, isBeta) => {
  if (cancellationToken) {
    cancellationToken.cancel();
  }
  autoUpdater.allowPrerelease = isBeta === true;

  autoUpdater.checkForUpdates().then((UpdateCheckResult) => {
    mainWindow.webContents.send(
      "updaterHandler",
      "checkForUpdates",
      UpdateCheckResult
    );
    ({ cancellationToken } = UpdateCheckResult);
  });
});

// updater functions
autoUpdater.on("checking-for-update", () => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("updaterHandler", "checking-for-update");
  }
});

autoUpdater.on("update-available", (info) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("updaterHandler", "update-available", info);
  }

  if (!installNagAlreadyShowed) {
    new Notification({
      title: "A new update is available",
      body: `WeakAuras Companion ${info.version} is available for download.`,
      icon: path.join(
        __static,
        process.platform === "win32" ? "bigicon.png" : "icon.png"
      ),
    }).show();

    // show install nag only once
    installNagAlreadyShowed = true;
  }
});

autoUpdater.on("update-not-available", () => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("updaterHandler", "update-not-available");
  }
});

autoUpdater.on("error", (err) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("updaterHandler", "error", err);
    mainWindow.setProgressBar(-1);
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(
      "updaterHandler",
      "download-progress",
      progressObj
    );
    mainWindow.setProgressBar(progressObj.percent / 100);
  }
});

let installNagAlreadyShowed = false;

autoUpdater.on("update-downloaded", (info) => {
  if (!installNagAlreadyShowed) {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("updaterHandler", "update-downloaded");
      mainWindow.setProgressBar(-1);
    }

    if (store.get("config").autoupdate === true) {
      autoUpdater.quitAndInstall();
    } else {
      new Notification({
        title: "A new update is ready to install",
        body: `WeakAuras Companion ${info.version} has been downloaded and will be automatically installed when you close the app.`,
        icon: path.join(
          __static,
          process.platform === "win32" ? "bigicon.png" : "icon.png"
        ),
      }).show();

      // show install nag only once
      installNagAlreadyShowed = true;
    }
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
