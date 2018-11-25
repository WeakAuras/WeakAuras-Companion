import { app, BrowserWindow, Tray, Menu, shell } from 'electron'
import path from 'path'
const Store = require("electron-store");
const store = new Store();

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const iconpath = path.join(__static, 'icon.' + `${process.platform == 'darwin' ? 'png' : 'ico'}`)

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 450,
    width: 600,
    resizable: process.env.NODE_ENV === 'development',
    backgroundColor: '#252525',
    webPreferences: {
      disableBlinkFeatures: "Auxclick",
      webSecurity: process.env.NODE_ENV !== 'development',
    },
    show: false
  })

  mainWindow.loadURL(winURL)
  mainWindow.setMenu(null);
  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('ready-to-show', () => {
    if (!store.get('config.startminimize', false)) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  var tray = new Tray(iconpath)
  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open WeakAuras Wago Updater', click: () => {
        mainWindow.show()
      }
    },
    { type: 'separator' },
    {
      label: 'Search updates on Wago', click: () => {
        mainWindow.webContents.send('refreshWago')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit', click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on('will-navigate', (event, newURL) => {
    if (win.webContents.getURL() !== winURL) {
      event.preventDefault();
    }
  })
}

app.on('ready', () => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
