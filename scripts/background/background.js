import {UrlListener} from "../shared/url_listener.js"
import {ListeningPort} from "./listening_port.js"
import {WebReaderBackground} from "../shared/web_reader.js"
import {getActiveState} from "../shared/backup_import.js"
import {saveActiveState} from "../shared/backup_export.js"

let isActive = true;
let isSetUp = false;
let urlListener = new UrlListener(updateSidebar);
let sbConnection = new ListeningPort(receiveMessage);
let baConnection = new ListeningPort(receiveOptionOrBrowserAction, "browser_action");
let opConnection = new ListeningPort(receiveOptionOrBrowserAction, "options_script");
let webReader = new WebReaderBackground();

async function initialize() {
    isActive = await getActiveState();
    updateBrowserAction();
    await webReader.loadInterface();
    isSetUp = true;
    transmitWebReaderData();
}

function transmitWebReaderData() {
    sbConnection.sendMessage({webReader: webReader.getObjectList()})
}

function enforceWebReaderData() {
    sbConnection.sendMessage({webReaderReload: webReader.getObjectList()})
}

function receiveMessage(message) {
    if (message === "test") {
        console.log("Background script received test message");
        sbConnection.sendMessage("test");
        return;
    }
    if (message === "urlRetransmissionRequest") {
        urlListener.retransmit();
        return;
    }
    if (message.hasOwnProperty("requestPageAddition")) {
        let readerObject = message.requestPageAddition;
        let readerId = webReader.registerPage(readerObject);
        if (readerId === -1)
            return;
        readerObject.intId = readerId;
        sbConnection.sendMessage({addPage: readerObject});
        return;
    }
    if (message === "requestReaderTransmission") {
        if (!isSetUp) {
            console.log("Core is not ready for data transmission")
            return;
        }
        transmitWebReaderData();
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}

function receiveOptionOrBrowserAction(message) {
    if (message === "requestActiveState") {
        sendActiveState();
        return;
    }
    if (message === "requestActiveStateChange") {
        toggleActiveState();
        return;
    }
    if (message === "requestSaveBackup") {
        webReader.saveBackup();
        return;
    }
    if (message.hasOwnProperty("requestLoadBackup")) {
        triggerLoadBackup(message.requestLoadBackup);
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}

function updateBrowserAction() {
    browser.browserAction.setIcon({
        path: isActive ? {
            48: "../icons/icon_48.png"
        } : {
            48: "../icons/icon_gray_48.png"
        }
    })
}

function triggerLoadBackup(file) {
    let fktDone = () => {
        enforceWebReaderData();
    };
    webReader.importBackup(file, fktDone);
}

function toggleActiveState() {
    isActive = !isActive;
    saveActiveState(isActive);
    updateBrowserAction();
    updateUrlListener();
    sendActiveState();
}

function sendActiveState() {
    baConnection.sendMessage({activeState: isActive});
    opConnection.sendMessage({activeState: isActive});
}

function updateSidebar(data) {
    if (webReader.updateBookmark(data))
        sbConnection.sendMessage({updateBookmark: data});
}

function updateUrlListener() {
    if (isActive) {
        urlListener.activate();
    } else {
        urlListener.deactivate();
    }
}

initialize();