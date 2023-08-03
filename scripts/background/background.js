import {UrlListener} from "./url_listener.js"
import {ListeningPort} from "./listening_port.js"
import {WebReader} from "../shared/web_reader.js"

let isActive = true;
let urlListener = new UrlListener(updateSidebar);
let sbConnection = new ListeningPort(receiveMessage);
let webReader = new WebReader();

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
    updateUrlListener();
}

function receiveMessage(message) {
    if (message === "urlRetransmissionRequest") {
        urlListener.retransmit();
        return;
    }
    if (message.hasOwnProperty("requestPageAddition")) {
        let pageEssentials = message.requestPageAddition;
        webReader.registerPage(pageEssentials);
        sbConnection.sendMessage({addPage: pageEssentials});
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}

function updateSidebar(url) {
    sbConnection.sendMessage({updateBookmark: url});
    webReader.updateBookmark(url);
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