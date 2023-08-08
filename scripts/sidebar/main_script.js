import {ReaderEditor} from "./reader_editor.js"
import {WebReader, WebReaderController} from "../shared/web_reader.js"
import {SubscriberPort} from "./subscriber_port.js"

/* 
Browser modified during development:
about:config
    extensions.webextensions.keepStorageOnUninstall -> true (was false)
    extensions.webextensions.keepUuidOnUninstall    -> true (was false)
  Not yet: xpinstall.signatures.required            -> false (still is true)
Source: https://extensionworkshop.com/documentation/develop/testing-persistent-and-restart-features/#what-do-i-do-to-ensure-i-can-test-my-extension
*/

// Tab management
let myWindowId;
let webReader;
let isSetUp = false;
// Connection to background script
let bsConnection = new SubscriberPort(receiveMessage);

document.addEventListener('DOMContentLoaded', function () {
    
    setUpReaderEditor();
    requestWebReader();
});

function setUpButtons() {
    const exportTrigger = document.getElementById('export_trigger');
    exportTrigger.onclick = function() {
        if (webReader === undefined)
            return;
        webReader.saveBackup();
        };
    
    const inputElement = document.getElementById('file-selector');
    inputElement.style.display = 'none';
    inputElement.addEventListener('change', (event) => {
        if (webReader === undefined)
            return;
        webReader.importBackup(event.target.files[0]);
    });
    
    const inputTrigger = document.getElementById('import_trigger');
    inputTrigger.onclick = function () {inputElement.click()};
    
    const addComic = document.getElementById('add_comic');
    addComic.onclick = function () {addCurrentPage()};
}

function setUpReaderEditor() {
    let fullFrame = document.getElementById('new_comic_input_frame');
    let fullLink = document.getElementById('new_comic_full_link');
    let label = document.getElementById('new_comic_label');
    let prefix = document.getElementById('new_comic_prefix');
    let linkLabel = document.getElementById('new_comic_link_label');
    let textMsg = document.getElementById('new_comic_message');
    let errorMsg = document.getElementById('new_comic_error');
    let cancelBtn = document.getElementById('new_comic_cancel');
    let okBtn = document.getElementById('new_comic_finalize');
    let startDel = document.getElementById('comic_start_delete');
    let confirmDel = document.getElementById('comic_confirm_delete');
    ReaderEditor.setUpEditor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn, startDel, confirmDel);
}

function setUpWebReader(readerObjectList) {
    if (readerObjectList === undefined)
        return;
    let container = document.getElementById('container');
    let webReaderController = new WebReaderController(container);
    webReader = new WebReader(webReaderController);
    webReader.importInterface(readerObjectList);
}

function requestUrlRetransmission() {
    bsConnection.sendMessage("urlRetransmissionRequest");
}

function requestPageAddition(readerEssentials) {
    bsConnection.sendMessage({requestPageAddition: readerEssentials});
}

function requestWebReader() {
    if (!isSetUp)
        bsConnection.sendMessage("requestReaderTransmission");
}

function receiveReaderObjectList(readerObjectList) {
    if (isSetUp)
        return;
    isSetUp = true;
    setUpButtons();
    setUpWebReader(readerObjectList);
    setTimeout(() => {
        requestUrlRetransmission();
        }, 250);
}

// Add current page to list
function addCurrentPage() {
    // Will start configuration dialog and then hand result over to background script
    if (webReader === undefined)
        return;
    if (myWindowId === undefined)
        return;
    browser.tabs.query({windowId: myWindowId, active: true})
        .then((tabs) => {
            ReaderEditor.importLink(tabs[0].url, requestPageAddition);
            }
            , onError);
}

// Display error for failed promises
function onError(error) {
    console.log("Error: ${error}");
}

function updateBookmark(url) {
    if (webReader === undefined)
        return;
    webReader.updateBookmark(url);
}

function receiveMessage(message) {
    if (message === "test") {
        console.log("Sidebar script received test message");
        return;
    }
    if (message.hasOwnProperty("webReader")) {
        receiveReaderObjectList(message.webReader);
        return;
    }
    if (message.hasOwnProperty("updateBookmark")) {
        updateBookmark(message.updateBookmark);
        return;
    }
    if (message.hasOwnProperty("addPage")) {
        webReader.registerPage(message.addPage);
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}

// When the sidebar loads, get the ID of its window,
// and update its content.
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
    myWindowId = windowInfo.id;
});