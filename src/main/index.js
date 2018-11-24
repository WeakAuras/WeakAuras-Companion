import { app, BrowserWindow, Tray, Menu, shell } from 'electron'
import path from 'path'

const AutoLaunch = require("auto-launch");

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
    height: 300,
    width: 600,
    resizable: process.env.NODE_ENV === 'development',
    backgroundColor: '#252525',
    webPreferences: { webSecurity: false },
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
    mainWindow.show();
    mainWindow.focus();
  });

  var AutoLauncherStarted
  var AutoLauncher = new AutoLaunch({
    name: 'WeakAuras Wago Updater'
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
      label: 'Auto-Start with ' + `${process.platform == 'darwin' ? 'Mac OS' : 'Windows'}`, type: 'checkbox', checked: false, click: (item) => {
        if (item.checked) {
          AutoLauncher.enable();
        } else {
          AutoLauncher.disable();
        }
        //item.checked = !item.checked
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

  AutoLauncher.isEnabled().then((isEnabled) => {
    console.log("isEnabled: " + isEnabled + " checkbox: " + contextMenu.items[4].checked + " label: " + contextMenu.items[4].label)
    contextMenu.items[4].checked = isEnabled;
    tray.setContextMenu(contextMenu);
  });

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })

  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });
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
