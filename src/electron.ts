import { app, ipcMain, BrowserWindow, Menu, nativeTheme } from "electron"
import windowStateKeeper = require("electron-window-state")
import Store = require("electron-store")
import performUpdate from "./scripts/update-scripts"

const locked = app.requestSingleInstanceLock()
if (!locked) {
    app.quit()
}

let mainWindow: BrowserWindow
let store: Store
let restarting: boolean

function init() {
    restarting = false
    store = new Store()
    performUpdate(store)
    nativeTheme.themeSource = store.get("theme", "system")
}

init()

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 700,
    })
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "Fluent Reader",
        backgroundColor: nativeTheme.shouldUseDarkColors ? "#282828" : "#faf9f8",
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 992,
        minHeight: 600,
        frame: false,
        fullscreenable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            enableRemoteModule: true
        }
    })
    mainWindowState.manage(mainWindow)
    mainWindow.on("ready-to-show", () => {
        mainWindow.show()
        mainWindow.focus()
        if (!app.isPackaged) mainWindow.webContents.openDevTools()
    });
    // and load the index.html of the app.
    mainWindow.loadFile((app.isPackaged ? "dist/" : "") + "index.html")
}

Menu.setApplicationMenu(null)

app.on("ready", createWindow)

app.on("second-instance", () => {
    if (mainWindow !== null) {
        mainWindow.focus()
    }
})

app.on("window-all-closed", function () {
    mainWindow = null
    if (restarting) {
        init()
        createWindow()
    } else if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", function () {
    if (mainWindow === null) {
        createWindow()
    }
})

ipcMain.on("restart", () => {
    restarting = true
    mainWindow.close()
})
