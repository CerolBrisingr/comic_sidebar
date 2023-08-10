import {SubscriberPort} from "../sidebar/subscriber_port.js"

let bsConnection = new SubscriberPort(receiveMessage, "options_script");
let isActive = true;
let iconToggleState;
let textToggleState;

// ui.popup.disable_autohide

document.addEventListener('DOMContentLoaded', function () {
    importInterface();
    console.log("works");
});

function importInterface() {
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

function requestSaveBackup() {
    bsConnection.sendMessage("requestSaveBackup");
}

function requestLoadBackup(file) {
    bsConnection.sendMessage({requestLoadBackup: file});
}

function receiveMessage(message) {
    console.log("Don't know how to act on this background message:");
    console.log(message);
}
