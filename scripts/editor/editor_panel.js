import { SubscriberPort } from "../sidebar/subscriber_port.js";
import { Editor } from "./editor.js";

let readerEditor;
let port;

document.addEventListener('DOMContentLoaded', function (event) {
    setUpScript();
});

function setUpScript() {
    readerEditor = new Editor();
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
        //readerEditor.updateReaderEntry(message.update, finalize);
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
