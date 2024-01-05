import {
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  app,
  dialog,
  ipcMain,
  nativeImage,
  protocol,
  shell,
} from "electron";
import { join } from "node:path";
import log from "electron-log";
import Store from "electron-store";
import type {
  ProgressInfo,
  UpdateCheckResult,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

import { autoUpdater } from "electron-updater";

process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");

process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

const isDevelopment = process.env.NODE_ENV !== "production";
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

const store = new Store();
Store.initRenderer();
const configStoreSerialized = store.get("configStore");
let config: { beta: boolean; startminimize?: boolean; minimized?: boolean };

if (typeof configStoreSerialized === "string") {
  config = JSON.parse(configStoreSerialized);
} else {
  config = {
    beta: false,
    minimized: false,
  };
}

let cancellationToken: { cancel: () => void };

autoUpdater.autoDownload = false;
autoUpdater.allowDowngrade = true;
autoUpdater.allowPrerelease = autoUpdater.allowPrerelease || config.beta;
autoUpdater.logger = log;
// @ts-expect-error Weird stuff here
autoUpdater.logger.transports.file.level = "info";
log.initialize({ preload: true });
log.info("App starting...");

let tray: Tray | null = null;
let contextMenu: Menu | null = null;
let mainWindow: BrowserWindow | null = null;
const winURL = null;

const trayIconPath = join(
  process.env.PUBLIC,
  process.platform === "win32" ? "bigicon.png" : "icon-light.png",
);
const notificationIconPath = join(
  process.env.PUBLIC,
  process.platform === "win32" ? "bigicon.png" : "icon.png",
);

const trayIcon = nativeImage.createFromPath(trayIconPath);
const notificationIcon = nativeImage.createFromPath(notificationIconPath);

function handleLinks(link: string) {
  if (mainWindow?.webContents) {
    mainWindow?.webContents.send("linkHandler", link);
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
    backgroundColor: "#00000000",
    icon: notificationIcon,
    resizable: true,
    webPreferences: {
      preload,
      disableBlinkFeatures: "Auxclick",
      webSecurity: process.env.NODE_ENV !== "development",
      allowRunningInsecureContent: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
    },
    show: !config.startminimize,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    mainWindow.loadURL(url);
    // Open devTools if the app is not packaged
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(indexHtml);
  }

  // Workaround for electron/electron#39959
  if (
    /^(27|28)\.\d+\.\d+(\-alpha\.\d+|\-beta\.\d+)?$/.test(
      process.versions.electron,
    ) &&
    process.platform === "win32"
  ) {
    mainWindow.on("blur", () => {
      const [width_39959, height_39959] = mainWindow.getSize();
      mainWindow.setSize(width_39959, height_39959 + 1);
      mainWindow.setSize(width_39959, height_39959);
    });

    mainWindow.on("focus", () => {
      const [width_39959, height_39959] = mainWindow.getSize();
      mainWindow.setSize(width_39959, height_39959 + 1);
      mainWindow.setSize(width_39959, height_39959);
    });
  }

  // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow?.on("closed", () => {
    mainWindow = null;
  });

  mainWindow?.setMenu(null);

  mainWindow?.on("minimize", (event) => {
    event.preventDefault();
    mainWindow?.minimize();

    if (process.platform === "darwin") {
      app.dock.hide();
    }
  });

  // Protocol handler for Windows
  if (process.platform === "win32" || process.platform === "linux") {
    handleLinks(process.argv.pop());
  }

  mainWindow?.on("closed", () => {
    mainWindow = null;
  });

  mainWindow?.webContents.once("dom-ready", () => {
    mainWindow?.webContents.send(
      "setAllowPrerelease",
      autoUpdater.allowPrerelease,
    );
  });

  tray = new Tray(trayIcon);

  contextMenu = Menu.buildFromTemplate([
    {
      label: "Open WeakAuras Companion",
      click: () => {
        mainWindow?.show();

        if (process.platform === "darwin") {
          app.dock.show();
        }
      },
    },
    {
      label: "Check for Companion Updates",
      click: () => {
        if (cancellationToken) {
          cancellationToken.cancel();
        }

        autoUpdater
          .checkForUpdates()
          .then((UpdateCheckResult: UpdateCheckResult) => {
            mainWindow?.webContents.send(
              "updaterHandler",
              "checking-for-update",
              UpdateCheckResult,
            );
            ({ cancellationToken } = UpdateCheckResult);
          });
      },
    },
    {
      label: "Open Developer Tools",
      click: () => {
        mainWindow?.webContents.openDevTools({ mode: "detach" });
      },
    },
    { type: "separator" },
    {
      label: "Check for Aura Updates",
      click: () => {
        mainWindow?.webContents.send("refreshWago");
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray?.on("right-click", () => tray?.popUpContextMenu(contextMenu));

  // Ignore double click events for the tray icon
  tray?.setIgnoreDoubleClickEvents(true);

  tray?.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow?.hide();

      if (process.platform === "darwin") {
        app.dock.hide();
      }
    } else {
      mainWindow?.show();

      if (process.platform === "darwin") {
        app.dock.show();
      }
    }
  });

  mainWindow?.webContents.on("will-navigate", (event) => {
    if (mainWindow?.webContents.getURL() !== winURL) {
      event.preventDefault();
    }
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (event, argv) => {
    // Protocol handler for Windows
    if (process.platform === "win32" || process.platform === "linux") {
      handleLinks(argv.pop());
    }

    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (!mainWindow?.isVisible()) {
        mainWindow?.show();
      }
      mainWindow?.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    if (process.platform === "darwin") {
      app.dock.show();
    }

    if (process.env.NODE_ENV === "production") {
      autoUpdater
        .checkForUpdates()
        .then((UpdateCheckResult: UpdateCheckResult) => {
          mainWindow?.webContents.send(
            "updaterHandler",
            "checking-for-update",
            UpdateCheckResult,
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

    if (process.platform === "darwin") {
      app.dock.show();
    }
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

app.on("web-contents-created", (webContentsCreatedEvent, webContents) => {
  webContents.on("before-input-event", (beforeInputEvent, input) => {
    const { code, alt, control, shift, meta } = input;

    // Shortcut: toggle devTools
    if (shift && control && !alt && !meta && code === "KeyI") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }

    // Shortcut: window reload
    if (shift && control && !alt && !meta && code === "KeyR") {
      mainWindow.reload();
    }
  });
});

ipcMain.on("get-user-data-path", (event) => {
  event.returnValue = app.getPath("userData");
});

ipcMain.handle("openDialog", (event, args) => {
  return dialog.showOpenDialog(
    BrowserWindow.fromWebContents(event.sender),
    args,
  );
});

// event used when clicking on notifications
ipcMain.handle("open", () => {
  mainWindow?.show();
  mainWindow?.focus();

  if (process.platform === "darwin") {
    app.dock.show();
  }
});

ipcMain.handle("minimize", () => {
  mainWindow?.hide();

  if (process.platform === "darwin") {
    app.dock.hide();
  }
});

ipcMain.handle("close", () => {
  app.quit();
});

ipcMain.handle("installUpdates", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("autoStart", (_event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
  });
});

let lastNotificationBody = "";

ipcMain.handle("postFetchingNewUpdateNotification", (_event, news) => {
  const text = news.join("\n");

  if (text === "" || text === lastNotificationBody) {
    return;
  } // prevent notification spam

  const notification = new Notification({
    title: "New update ready to install",
    body: text,
    icon: notificationIcon,
  });

  notification.on("click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  notification.show();
  lastNotificationBody = text;
});

ipcMain.handle("checkUpdates", (_event, isBeta) => {
  if (cancellationToken) {
    cancellationToken.cancel();
  }
  autoUpdater.allowPrerelease = isBeta === true;

  autoUpdater.checkForUpdates().then((UpdateCheckResult: UpdateCheckResult) => {
    mainWindow?.webContents.send(
      "updaterHandler",
      "checking-for-update",
      UpdateCheckResult,
    );
    ({ cancellationToken } = UpdateCheckResult);
  });
});

ipcMain.handle("refreshWago", () => {
  mainWindow?.webContents.send("refreshWago");
});

ipcMain.handle("getStore", (event, key) => {
  return store.get(key);
});

ipcMain.handle("setStore", (event, key, value) => {
  return store.set(key, value);
});

ipcMain.handle("deleteStore", (event, key) => {
  return store.delete(key);
});

ipcMain.handle("getLang", () => {
  if (typeof configStoreSerialized === "string") {
    return JSON.parse(configStoreSerialized).lang;
  }
});

// updater functions
autoUpdater.on("checking-for-update", () => {
  if (mainWindow?.webContents) {
    mainWindow?.webContents.send("updaterHandler", "checking-for-update");
  }
});

autoUpdater.on("update-available", (info: UpdateInfo) => {
  if (mainWindow?.webContents) {
    mainWindow?.webContents.send("updaterHandler", "update-available", info);
  }
  let installNagAlreadyShown;

  if (!installNagAlreadyShown) {
    new Notification({
      title: "A new update is available",
      body: `WeakAuras Companion ${info.version} is available for download.`,
      icon: notificationIcon,
    }).show();

    // show install nag only once
    installNagAlreadyShown = true;
  }
});

autoUpdater.on("update-not-available", (info: UpdateInfo) => {
  if (mainWindow?.webContents) {
    mainWindow?.webContents.send(
      "updaterHandler",
      "update-not-available",
      info,
    );
  }
});

autoUpdater.on("error", (err: Error, message?: string) => {
  if (mainWindow?.webContents) {
    mainWindow?.webContents.send("updaterHandler", "error", err, message);
    mainWindow?.setProgressBar(-1);
  }
});

autoUpdater.on("download-progress", (info: ProgressInfo) => {
  if (mainWindow?.webContents) {
    mainWindow?.webContents.send("updaterHandler", "download-progress", info);
    mainWindow?.setProgressBar(info.percent / 100);
  }
});

const installNagAlreadyShown = false;

autoUpdater.on("update-downloaded", (event: UpdateDownloadedEvent) => {
  if (!installNagAlreadyShown && mainWindow?.webContents) {
    mainWindow?.webContents.send("updaterHandler", "update-downloaded", event);
    mainWindow?.setProgressBar(-1);
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
