import { ipcRenderer } from "electron";

const userDataPath: string = ipcRenderer.sendSync(
  "get-user-data-path",
) as string;

console.log("userDataPath", userDataPath);

export default userDataPath;
