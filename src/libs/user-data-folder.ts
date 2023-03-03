import { ipcRenderer } from "electron";

const userDataPath = ipcRenderer.sendSync("get-user-data-path");

console.log("userDataPath", userDataPath);

export default userDataPath;