import {SubscriberPort} from "../sidebar/subscriber_port.js"

let bsConnection = new SubscriberPort(receiveMessage, "options_script");
let iconToggleState;
let textToggleState;

document.addEventListener('DOMContentLoaded', function () {
    importInterface();
    requestActiveState();
});

function importInterface() {
    // Toggle active/inactive tracking (listeners)
    iconToggleState = document.getElementById('icon_toggle_enable');
    textToggleState = document.getElementById('text_toggle_enable');
    let buttonToggleState = document.getElementById('button_toggle_enable');
    buttonToggleState.onclick = () => {
        requestActiveStateChange();
    };
    
    // File selector
    let fileSelector = document.getElementById("file_selector");
    fileSelector.style.display = "none";
    fileSelector.addEventListener("change", (event) => {
        requestLoadBackup(event.target.files[0]);
    });
    
    // Save Backup
    let buttonSaveBackup = document.getElementById('button_save_backup');
    buttonSaveBackup.onclick = () => {
        requestSaveBackup();
    };
    
    // Load Backup
    let buttonLoadBackup = document.getElementById('button_load_backup');
    buttonLoadBackup.onclick = () => {
        fileSelector.click();
    };
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
    if (activeState) {
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
