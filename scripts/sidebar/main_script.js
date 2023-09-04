import {WebReaderSidebar} from "../shared/web_reader.js"
import {SubscriberPort} from "./subscriber_port.js"
import {UrlListener} from "../shared/url_listener.js"
import { ReaderFilter } from "./reader_filter.js"
import { SortControls } from "./reader_sort.js"
import { ShowAllInterface } from "../shared/schedule.js"

/* 
Browser modified during development:
about:config
    extensions.webextensions.keepStorageOnUninstall -> true (was false)
    extensions.webextensions.keepUuidOnUninstall    -> true (was false)
  Not yet: xpinstall.signatures.required            -> false (only works in dev build)
Source: https://extensionworkshop.com/documentation/develop/testing-persistent-and-restart-features/#what-do-i-do-to-ensure-i-can-test-my-extension
*/

// Tab management
let webReader;
let sortControls;
let isSetUp = false;
// Connection to background script
let bsConnection = new SubscriberPort(receiveMessage);

document.addEventListener('DOMContentLoaded', function () {
    requestWebReader();
});

function setUpUserInterface() {
    const addComic = document.getElementById('add_reader');
    addComic.onclick = function () {addCurrentPage()};

    setUpSearchBar();
    setUpDropdownMenu();
}

function setUpSearchBar() {
    const searchBox = document.getElementById('search_box');
    searchBox.addEventListener("input", (event) => {
        ReaderFilter.setFilter(event.target.value);
        webReader.relistViewers();
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
        button: document.getElementById("show_all"),
        icon: document.getElementById("show_all_tick"),
        label: document.getElementById("show_all_label")
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

// Display error for failed promises
function onError(error) {
    console.log(`Error: ${error}`);
}

async function updateBookmark(data) {
    if (webReader === undefined)
        return;
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
