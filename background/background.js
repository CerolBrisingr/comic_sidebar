let isActive = true;

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
    broadcastState();
}

function handleRequest(request, sender, sendResponse) {
    if (!request.hasOwnProperty("requestStr")) {
        console.log('Missing message purpose');
        sendResponse({response: 'Missing request'});
        return;
    }
    if (request.requestStr === "getActive") {
        sendResponse(buildActiveMessage());
        return;
    }
    sendResponse({response: ""});
}

function handleResponse(message) {
    if (message === undefined) {
        return;
    }
    if (!message.hasOwnProperty("response")) {
        console.log("Response message does not contain a valid response");
        return;
    }
    console.log(`Notification response received: ${message.response}`);
}

function handleError(error) {
    console.log(`Error: ${error}`);
}

function buildActiveMessage() {
    return {newState: isActive};
}

function broadcastState() {
    const sending = browser.runtime.sendMessage(buildActiveMessage());
    sending.then(handleResponse, handleError);
}

// Get state request from sidebar script
browser.runtime.onMessage.addListener(handleRequest);
browser.browserAction.onClicked.addListener(toggleActive);
updateBrowserAction();