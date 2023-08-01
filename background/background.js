let isActive = true;
let sbConnection;
let connectionAlive = false;

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
}

function broadcastActiveState() {
    sendMessage({setActiveState: isActive});
}

// Try a more static connection
function contacted(port) {
    if (port.name !== "port_from_sidebar") {
        console.log("Connection failed due to identification");
        return;
    }
    sbConnection = port;
    connectionAlive = true;
    sbConnection.onMessage.addListener(receiveMessage);
    sbConnection.onDisconnect.addListener((m) => {
        connectionAlive = false;
        })
}
function receiveMessage(message) {
    if (message === "getActiveState") {
        broadcastActiveState();
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}
function sendMessage(message) {
    if (connectionAlive)
        sbConnection.postMessage(message);
}

// Allow connection to sidebar
browser.runtime.onConnect.addListener(contacted);
// React to toolbar click
browser.browserAction.onClicked.addListener(toggleActive);
updateBrowserAction();