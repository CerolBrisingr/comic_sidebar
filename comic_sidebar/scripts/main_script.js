import {Bookmark, BookmarkData, BookmarkDataDummy, dissectUrl} from "./bookmarks.js";
import {saveBackup, buildComicObject} from "./backup_export.js";
import {importBackup, readComicObject} from "./backup_import.js";
import {buildComicLists, updateComicList, appendComicToPanel} from "./build_table.js";
import {ComicEditor} from "./comic_editor.js"

/* 
Browser modified during development:
about:config
    extensions.webextensions.keepStorageOnUninstall -> true (was false)
    extensions.webextensions.keepUuidOnUninstall    -> true (was false)
  Not yet: xpinstall.signatures.required            -> false (still is true)
Source: https://extensionworkshop.com/documentation/develop/testing-persistent-and-restart-features/#what-do-i-do-to-ensure-i-can-test-my-extension
*/

// My be a good idea to use a map of base-urls for 2-stage differentiation
// E.g. keeping all "gocomics" entries among a "gocomics.com" list
let comicData = [];
let currentBookmark = new BookmarkDataDummy();
let comicEditField;
// Tab management
let myWindowId;
let hasWindowId = false;
let hasLoaded = false;

document.addEventListener('DOMContentLoaded', function () {
    
    wireButtons();
    initcomicEditField();
    dropdownExtension();
    addConsoleOutputToFileSelector();
    loadDataFromStorage();
    hasLoaded = true;
    firstContentUpdate();
    
    function addConsoleOutputToFileSelector() {
        const fileSelector = document.getElementById('file-selector');
        const container = document.getElementById('container');
        fileSelector.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const uiUpdateFkt = function(data, container) {
                comicData = data;
                saveDataToStorage(comicData);
                buildComicLists(data, container);
            }
            currentBookmark = new BookmarkDataDummy();
            importBackup(file, container, uiUpdateFkt);
        });
    }

    function dropdownExtension() {
        document.documentElement.addEventListener('click', event => {
            if (event.target.tagName == 'BUTTON' && event.target.hasAttribute(
                    'aria-expanded')) {
                event.target.setAttribute('aria-expanded', event.target.getAttribute(
                    'aria-expanded') != 'true');
                event.target.nextElementSibling.classList.toggle('visible');
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                document.querySelector('.visible')
                    .classList.remove('visible');
            }
        });
    }
    
    function wireButtons() {
        const exportTrigger = document.getElementById('export_trigger');
        exportTrigger.onclick = function() {triggerExport()};
        
        const inputElement = document.getElementById('file-selector');
        inputElement.style.display = 'none';
        const inputTrigger = document.getElementById('import_trigger');
        inputTrigger.onclick = function () {inputElement.click()};
        
        const addComic = document.getElementById('add_comic');
        addComic.onclick = function () {addCurrentPage()};
        
        const editButton = document.getElementById('edit_element');
        editButton.onclick = function() {editComicData()};
    }

    function initcomicEditField() {
        let fullFrame = document.getElementById('new_comic_input_frame');
        let fullLink = document.getElementById('new_comic_full_link');
        let label = document.getElementById('new_comic_label');
        let prefix = document.getElementById('new_comic_prefix');
        let linkLabel = document.getElementById('new_comic_link_label');
        let textMsg = document.getElementById('new_comic_message');
        let errorMsg = document.getElementById('new_comic_error');
        let cancelBtn = document.getElementById('new_comic_cancel');
        let okBtn = document.getElementById('new_comic_finalize');
        comicEditField = new ComicEditor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn);
    }
});

function saveDataToStorage() {
    let comicDataObject = buildComicObject(comicData);
    browser.storage.local.set({comicData: comicDataObject});
}

function loadDataFromStorage() {
    let gettingItem = browser.storage.local.get("comicData");
    gettingItem.then((storageResult) => {
        if (!storageResult.hasOwnProperty("comicData")) {
            console.log("No data stored locally, aborting loading sequence! (2)");
            return;
        }
        let importData = readComicObject(storageResult.comicData);
        comicData = importData;
        buildComicLists(importData, container);
        }, 
        () => {console.log("No data stored locally, aborting loading sequence! (1)")});
}

function clearComicData() {
    comicData = [];
    saveDataToStorage();
    loadDataFromStorage();
}

function triggerExport() {
    saveBackup(comicData);
}

function addAutoBookmark(url) {
    let comicBookmarkBundle = findCorrectBookmark(url);
    if (!comicBookmarkBundle.valid) {
        console.log("Could not match current URL to listed Bookmark!");
        return;
    }
    let unorderedList = document.getElementById(comicBookmarkBundle.base_url);
    if (unorderedList === undefined) {
        console.log("List entry for current URL not configured!");
        return;
        }
    comicBookmarkBundle.addAutomatic(url);
    updateComicList(unorderedList, comicBookmarkBundle);
    saveDataToStorage();
}

function addUrlToList(comicEssentials) {
    let comicBookmarkBundle = findCorrectBookmark(comicEssentials.initialUrl);
    if (comicBookmarkBundle.valid) {
        console.log("Page already registered as " + comicBookmarkBundle.label);
        return;
    }
    let bookmarkData = new BookmarkData(comicEssentials.prefix, comicEssentials.label);
    comicData.push(bookmarkData);
    const container = document.getElementById('container');
    appendComicToPanel(container, bookmarkData);
    addAutoBookmark(comicEssentials.initialUrl); // This also updates storage
}

function findCorrectBookmark(url) {
    if (currentBookmark.urlIsCompatible(url))
        return currentBookmark;
    for (let bookmark of comicData) {
        if (bookmark.urlIsCompatible(url)) {
            currentBookmark = bookmark;
            return bookmark;
            }
    }
    currentBookmark = new BookmarkDataDummy();
    return currentBookmark;
}

// Edit current page on list
function editComicData() {
    let bookmark = currentBookmark;
    if (!bookmark.valid)
        return;
    let triggerFkt = (comicEssentials) => {
        bookmark.update(comicEssentials);
        const container = document.getElementById('container');
        buildComicLists(comicData, container);
    }
    comicEditField.updateLink(bookmark, triggerFkt);
    comicEditField.setVisible();
}

// Add current page to list
function addCurrentPage() {
    let triggerFkt = (comicEssentials) => {
        addUrlToList(comicEssentials);
    }
    browser.tabs.query({windowId: myWindowId, active: true})
        .then((tabs) => {
            comicEditField.importLink(tabs[0].url, triggerFkt);
            comicEditField.setVisible();
        }, onError)
}

// Update the sidebar's content.
function updateContent() {
    browser.tabs.query({windowId: myWindowId, active: true})
        .then((tabs) => addAutoBookmark(tabs[0].url), onError)
}

// Display error for failed promises
function onError(error) {
    contentBox.textContent ="Error: ${error}";
}

function firstContentUpdate() {
    if (!hasWindowId) {
        return;
    }
    if (!hasLoaded) {
        return;
    }
    updateContent();
}

// Update content when a new tab becomes active.
browser.tabs.onActivated.addListener(updateContent);
// Update content when a new page is loaded into a tab.
browser.tabs.onUpdated.addListener(updateContent);
// When the sidebar loads, get the ID of its window,
// and update its content.
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
    myWindowId = windowInfo.id;
    hasWindowId = true;
    firstContentUpdate();
});