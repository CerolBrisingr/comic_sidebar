import {SubscriberPort} from "../sidebar/subscriber_port.js"

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
    
    // Toggle active/inactive tracking (listeners)
    let buttonToggleState = document.getElementById('button_toggle_enable');
    buttonToggleState.onclick = () => {
        requestActiveStateChange();
    };
    
    // Save Backup
    let buttonSaveBackup = document.getElementById('button_save_backup');
    buttonSaveBackup.onclick = () => {
        requestSaveBackup();
    };
    
    // Load Backup
    let buttonLoadBackup = document.getElementById('button_load_backup');
    let inputElement = document.getElementById("file-selector");
    inputElement.style.display = 'none';
    inputElement.addEventListener('change', (event) => {
        console.log('File selected');
        requestLoadBackup(event.target.files[0]);
    });    
    buttonLoadBackup.onclick = () => {
        console.log('Button click');
        inputElement.click();
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
