import { domReady } from "./utils";
import { useLoading } from "./loading";
import { default as sharpInterface } from "sharp";

export function sharp(options) {
    // TODO
    return sharpInterface(options);
}

const { appendLoading, removeLoading } = useLoading();
window.removeLoading = removeLoading;

domReady().then(appendLoading);
