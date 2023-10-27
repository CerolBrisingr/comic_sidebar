import {WebReaderSidebar} from "../shared/web_reader.js"
import {SubscriberPort} from "./subscriber_port.js"
import {UrlListener} from "../shared/url_listener.js"
import { ReaderFilter } from "./reader_filter.js"
import { SortControls } from "./reader_sort.js"
import { ShowAllInterface } from "../shared/scheduler.js"
import { CanvasIcon } from "./canvas_icon.js"
import { TrackingState } from "../shared/tracking_state.js"
import { dissectUrl } from "../shared/url.js"
import { HideableHint } from "../shared/hideable_hint.js"

// Tab management
let webReader;
let addComicBtn
let sortControls;
let isSetUp = false;
let trackingStateImage;
let trackingStateBtn;
// Connection to background script
let bsConnection = new SubscriberPort(receiveMessage);
let activeStateConnection = new SubscriberPort(receiveStateMessage, "options_script");

document.addEventListener('DOMContentLoaded', function () {
    requestWebReader();
});

function setUpUserInterface() {
    addComicBtn = document.getElementById('add_reader');
    addComicBtn.onclick = function () {addCurrentPage()};

    setUpSearchBar();
    setUpDropdownMenu();
    setUpTrackingState();
    setUpHint();
}

function setUpSearchBar() {
    const searchBox = document.getElementById('search_box');
    searchBox.addEventListener("input", (event) => {
        ReaderFilter.setFilter(event.target.value);
        webReader.relistViewers();
    });
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

function setUpDropdownMenu() {
    const fcnUpdate = () => {
        webReader.relistViewers();
    };
    const btnToggle = document.getElementById("dropdown_toggle");
    const optionBox = document.getElementById("dropdown_option_box");
    const name = {
        button: document.getElementById("sort_name"), 
        icon: document.getElementById("sort_name_tick")
    };
    const url = {
        button: document.getElementById("sort_url"),
        icon: document.getElementById("sort_url_tick")
    };
    const latest = {
        button: document.getElementById("sort_latest"),
        icon: document.getElementById("sort_latest_tick")
    };
    const oldest = {
        button: document.getElementById("sort_oldest"),
        icon: document.getElementById("sort_oldest_tick")
    };
    sortControls = new SortControls(fcnUpdate, btnToggle, optionBox, 
        name, url, latest, oldest);
}

function setUpWebReader(readerObjectList) {
    if (readerObjectList === undefined)
        return;
    const container = document.getElementById('container');
    const showAll = {
        button: document.getElementById("sidebar_show_all"),
        icon: document.getElementById("sidebar_show_all_icon")
    }
    let showAllInterface = new ShowAllInterface(showAll);
    webReader = new WebReaderSidebar(container, showAllInterface);
    showAllInterface.setUpdateFcn(() => {webReader.relistViewers();});
}

function requestUrlRetransmission() {
    bsConnection.sendMessage("urlRetransmissionRequest");
}

function requestPageAddition(data) {
    // data: latest browser tab information
    bsConnection.sendMessage({requestPageAddition: data});
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
    setUpWebReader(readerObjectList);
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
function addCurrentPage() {
    // Request information about current tab and then
    // message background script to start configuration dialog
    if (webReader === undefined)
        return;
    UrlListener.findLatestTabUrl()
        .then((data) => {
            requestPageAddition(data);
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
        webReader.registerPage(message.addPage);
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

async function setUpHint() {
    let hint = new HideableHint();
    hint.init("show_searchbar_hint", "searchbar_hint", "searchbar_hint_dismiss");
    if (hint.isActive()) {
        const icon = new CanvasIcon("hint_icon", "../../icons/icon.png");
        const iconGrey = new CanvasIcon("hint_icon_grey", "../../icons/icon_gray.png");
    }
}