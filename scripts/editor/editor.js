import { SubscriberPort } from "../sidebar/subscriber_port.js";
import { ReaderEditor } from "./reader_editor.js";

let readerEditor;
let port;

if (document.readySate === "loading") {
    document.addEventListener('DOMContentLoaded', function (event) {
        setUpScript();
    });
} else {
    setUpScript();
}

function setUpScript() {
    setUpReaderEditor()
    window.addEventListener("blur", () => {closeMe();});
    port = new SubscriberPort(receive, "editor_form");
    port.sendMessage("setUp");
}

function receive(message) {
    if (message === "close") {
        closeMe();
        return;
    }
    if (message.hasOwnProperty("import")) {
        readerEditor.createReaderEntry(message.import, finalize);
        return;
    }
    if (message.hasOwnProperty("update")) {
        readerEditor.updateReaderEntry(message.update, finalize);
        return;
    }
}

function finalize(data) {
    port.sendMessage({data: data});
    closeMe();
}

function closeMe() {
    let winId = browser.windows.WINDOW_ID_CURRENT;
    let removing = browser.windows.remove(winId);
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
    readerEditor = new ReaderEditor(fullFrame, fullLink, label, prefix, linkLabel, 
        textMsg, errorMsg, cancelBtn, okBtn, startDel, confirmDel);
}

