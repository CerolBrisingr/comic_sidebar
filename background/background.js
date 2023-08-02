import {UrlListener} from "./url_listener.js"
import {ListeningPort} from "./listening_port.js"

let isActive = true;
let sbConnection;
let connectionAlive = false;
let urlListener = new UrlListener(pasteUrl);
let port = new ListeningPort(receiveMessage);

function updateBrowserAction() {
    browser.browserAction.setIcon({
        path: isActive ? {
            48: "../icons/icon_48.png"
        } : {
            48: "../icons/icon_gray_48.png"
        }
    })
}

function toggleActive() {
    isActive = !isActive;
    updateBrowserAction();
    broadcastActiveState();
    updateUrlListener();
}

function broadcastActiveState() {
    port.sendMessage({setActiveState: isActive});
}

function receiveMessage(message) {
    if (message === "getActiveState") {
        broadcastActiveState();
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}

function pasteUrl(url) {
    console.log(url);
}

function updateUrlListener() {
    if (isActive) {
        urlListener.activate();
    } else {
        urlListener.deactivate();
    }
}

// React to toolbar click
browser.browserAction.onClicked.addListener(toggleActive);
updateBrowserAction();