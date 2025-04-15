import {WebReaderSidebar} from "../shared/web_reader.js"
import {SubscriberPort} from "./subscriber_port.js"
import {UrlListener} from "../shared/url_listener.js"
import { ShowAllInterface } from "../shared/scheduler.js"
import { CanvasIcon } from "./canvas_icon.js"
import { TrackingState } from "../shared/tracking_state.js"
import { dissectUrl } from "../shared/url.js"
import { HideableHint } from "../shared/hideable_hint.js"

// Tab management
let webReader;
let addComicBtn
let isSetUp = false;
let trackingStateImage;
let trackingStateBtn;
// Connection to background script
let bsConnection = new SubscriberPort(receiveMessage);
let activeStateConnection = new SubscriberPort(receiveStateMessage, "options_script");

document.addEventListener('DOMContentLoaded', function () {
    requestWebReader();
    setUpTrackingState();
    setUpHints();
});

function setUpUserInterface() {
    addComicBtn = document.getElementById('add_reader');
    addComicBtn.onclick = function () {addCurrentPageAsReader()};
}

function setUpTrackingState() {
    trackingStateImage = new CanvasIcon("sidebar_tracking_state_icon", "../../icons/icon.png");
    let trackingState = new TrackingState(activeStateConnection);
    trackingState.requestCurrentState();
    trackingStateBtn = document.getElementById("sidebar_tracking_state");
    trackingStateBtn.addEventListener("click", () => {
        trackingState.requestToggleState();
    });
}

function gatherSortUi() {
    let sortUi = {};
    sortUi.btnToggle = document.getElementById("sort_dropdown_toggle");
    sortUi.optionBox = document.getElementById("sort_dropdown_option_box");
    sortUi.name = {
        button: document.getElementById("sort_name"), 
        icon: document.getElementById("sort_name_tick")
    };
    sortUi.url = {
        button: document.getElementById("sort_url"),
        icon: document.getElementById("sort_url_tick")
    };
    sortUi.latest = {
        button: document.getElementById("sort_latest"),
        icon: document.getElementById("sort_latest_tick")
    };
    sortUi.oldest = {
        button: document.getElementById("sort_oldest"),
        icon: document.getElementById("sort_oldest_tick")
    };
    sortUi.filter = {
        titleFilterInput: document.getElementById("search_box"),
        button: document.getElementById("filter_tags_button"),
        icon: document.getElementById("filter_tags_tick"),
        tagFilterDiv: document.getElementById("reader_tags")
    }
    return sortUi;
}

function setUpWebReader(readerObjectList, sortUi) {
    if (readerObjectList === undefined)
        return;
    const container = document.getElementById('container');
    const showAll = {
        button: document.getElementById("sidebar_show_all"),
        icon: document.getElementById("sidebar_show_all_icon")
    }
    let showAllInterface = new ShowAllInterface(showAll);
    webReader = new WebReaderSidebar(container, showAllInterface, sortUi);
    showAllInterface.setUpdateFcn(() => {webReader.relistViewers();});
}

function requestUrlRetransmission() {
    bsConnection.sendMessage("urlRetransmissionRequest");
}

function requestReaderAddition(data) {
    // data: latest browser tab information
    bsConnection.sendMessage({requestReaderAddition: data});
}

function requestWebReader() {
    if (!isSetUp)
        bsConnection.sendMessage("requestReaderTransmission");
}

function receiveReaderObjectList(readerObjectList) {
    if (isSetUp)
        return;
    if (readerObjectList === undefined)
        return;
    isSetUp = true;
    setUpUserInterface();
    let sortUi = gatherSortUi();
    setUpWebReader(readerObjectList, sortUi);
    executeWebReaderLoading(readerObjectList);
}

async function executeWebReaderLoading(readerObjectList) {
    if (readerObjectList === undefined)
        return;
    await webReader.importInterface(readerObjectList);
    setTimeout(() => {
        requestUrlRetransmission();
        }, 250);
}

// Add current page to list
function addCurrentPageAsReader() {
    // Request information about current tab and then
    // message background script to start configuration dialog
    if (webReader === undefined)
        return;
    UrlListener.findLatestTabUrl()
        .then((data) => {
            requestReaderAddition(data);
            }, onError);
}

function updateAddButtonActivity(url) {
    let test = dissectUrl(url);
    if (test === undefined) {
        // Link is reserved or no valid URL
        addComicBtn.disabled = true;
    } else {
        addComicBtn.disabled = false;
    }
}

// Display error for failed promises
function onError(error) {
    console.log(`Error: ${error}`);
}

async function updateBookmark(data) {
    if (webReader === undefined)
        return;
    updateAddButtonActivity(data.url);
    await webReader.updateBookmark(data);
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
    if (message.hasOwnProperty("webReaderReload")) {
        executeWebReaderLoading(message.webReaderReload);
        return;
    }
    if (message.hasOwnProperty("updateBookmark")) {
        updateBookmark(message.updateBookmark);
        return;
    }
    if (message.hasOwnProperty("addPage")) {
        webReader.registerReader(message.addPage);
        return;
    }
    console.log("Don't know how to act on this message:");
    console.log(message);
}

function receiveStateMessage(message) {
    if (message.hasOwnProperty("activeState")) {
        updateActiveState(message.activeState);
        return;
    }
    console.log("Don't know how to act on this background message:");
    console.log(message);
}

function updateActiveState(activeState) {
    if (activeState) {
        trackingStateImage.setImage("../../icons/icon_48.png");
        trackingStateBtn.title="Deactivate URL tracking";
    } else {
        trackingStateImage.setImage("../../icons/icon_gray_48.png");
        trackingStateBtn.title="Activate URL tracking";
    }
}

async function setUpHints() {
    const addReaderHint = new HideableHint("add_reader");
    let searchbarHint = new HideableHint();
    await searchbarHint.init("searchbar");
    if (searchbarHint.isActive()) {
        const icon = new CanvasIcon("hint_icon", "../../icons/icon.png");
        const iconGrey = new CanvasIcon("hint_icon_grey", "../../icons/icon_gray.png");
    }
}