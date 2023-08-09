import {SubscriberPort} from "../sidebar/subscriber_port.js"
import {FileSelector} from "./file_selector.js"

let bsConnection = new SubscriberPort(receiveMessage, "browser_action");
let isActive = true;
let iconToggleState;
let textToggleState;
let fileSelector;

// ui.popup.disable_autohide

document.addEventListener('DOMContentLoaded', function () {
    importInterface();
    requestActiveState();
});

function importInterface() {
    iconToggleState = document.getElementById('icon_toggle_enable');
    textToggleState = document.getElementById('text_toggle_enable');
    
    let buttonToggleState = document.getElementById('button_toggle_enable');
    buttonToggleState.onclick = () => {
        requestActiveStateChange();
    };
    let buttonSaveBackup = document.getElementById('button_save_backup');
    buttonSaveBackup.onclick = () => {
        requestSaveBackup();
    }
    let buttonLoadBackup = document.getElementById('button_load_backup');
    fileSelector = new FileSelector(buttonLoadBackup, requestLoadBackup);
}

function requestActiveState() {
    bsConnection.sendMessage("requestActiveState");
}

function requestActiveStateChange() {
    bsConnection.sendMessage("requestActiveStateChange");
}

function requestSaveBackup() {
    bsConnection.sendMessage("requestSaveBackup");
}

function requestLoadBackup(file) {
    bsConnection.sendMessage({requestLoadBackup: file});
}

function updateActiveState(activeState) {
    isActive = activeState;
    updateStateControls();
}

function updateStateControls() {
    if (isActive) {
        iconToggleState.src = "../icons/icon_gray_48.png";
        textToggleState.innerText = "Disable tracking";
    } else {
        iconToggleState.src = "../icons/icon_48.png";
        textToggleState.innerText = "Enable tracking";
    }
}

function receiveMessage(message) {
    if (message.hasOwnProperty("activeState")) {
        updateActiveState(message.activeState);
        return;
    }
    console.log("Don't know how to act on this background message:");
    console.log(message);
}
