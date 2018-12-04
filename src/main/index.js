/* eslint-disable no-underscore-dangle */
import { app, BrowserWindow, Tray, Menu, shell, ipcMain } from "electron";
import path from "path";

const Store = require("electron-store");

const store = new Store();

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  global.__static = path.join(__dirname, "/static").replace(/\\/g, "\\\\");
}

let mainWindow;
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`;

const iconpath = path.join(
  __static,
  `icon.${process.platform === "darwin" ? "png" : "ico"}`
);

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 550,
    width: 600,
    frame: false,
    resizable: process.env.NODE_ENV === "development",
    backgroundColor: "#252525",
    webPreferences: {
      disableBlinkFeatures: "Auxclick",
      webSecurity: process.env.NODE_ENV !== "development",
      allowRunningInsecureContent: false
    },
    show: false
  });

  mainWindow.loadURL(winURL);
  mainWindow.setMenu(null);
  mainWindow.on("minimize", event => {
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.on("ready-to-show", () => {
    if (!store.get("config.startminimize", false)) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  const tray = new Tray(iconpath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open WeakAuras Companion",
      click: () => {
        mainWindow.show();
      }
    },
    { type: "separator" },
    {
      label: "Check for updates on Wago",
      click: () => {
        mainWindow.webContents.send("refreshWago");
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

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

  mainWindow.webContents.on("will-navigate", event => {
    if (mainWindow.webContents.getURL() !== winURL) {
      event.preventDefault();
    }
  });
}

app.on("ready", () => {
  createWindow();
});

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

// event use when clicking on notifications
ipcMain.on("open", () => {
  mainWindow.show();
  mainWindow.focus();
});
ipcMain.on("minimize", () => {
  mainWindow.hide();
});
ipcMain.on("close", () => {
  app.isQuiting = true;
  app.quit();
});
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from "electron-updater"

autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall()
})

app.on("ready", () => {
  if (process.env.NODE_ENV === "production") autoUpdater.checkForUpdates()
})
 */
