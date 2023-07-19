import {Bookmark, BookmarkData, BookmarkDataDummy} from "./bookmarks.js";
import {saveBackup} from "./backup_export.js";
import {importBackup} from "./backup_import.js";
import {buildComicLists, updateComicList} from "./build_table.js";

// My be a good idea to use a map of base-urls for 2-stage differentiation
// E.g. keeping all "gocomics" entries among a "gocomics.com" list
let comicData = [];
let currentBookmark = new BookmarkDataDummy();
// Tab management
let myWindowId;

document.addEventListener('DOMContentLoaded', function () {
    
    wireButtons();
    dropdownExtension();
    addConsoleOutputToFileSelector();
    
    function addConsoleOutputToFileSelector() {
        const fileSelector = document.getElementById('file-selector');
        const container = document.getElementById('container');
        fileSelector.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const uiUpdateFkt = function(data, container) {
                comicData = data;
                buildComicLists(data, container);
            }
            importBackup(file, container, uiUpdateFkt);
        });
    }
});

function wireButtons() {
    const exportTrigger = document.getElementById('export_trigger');
    exportTrigger.onclick = function() {triggerExport()};
    
    const addXkcd = document.getElementById('add_xkcd');
    addXkcd.onclick = function () {addAutoBookmark("https://xkcd.com/1337/")};
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

/*
Update the sidebar's content.
*/
function updateContent() {
  browser.tabs.query({windowId: myWindowId, active: true})
    .then(addCurrentTabs, onError)
}

function addCurrentTabs(tabs) {
    let data = []
    for (const tab of tabs) {
        data = addAutoBookmark(tab.url);
    }
}

// Display error for failed promises
function onError(error) {
  contentBox.textContent ="Error: ${error}";
}

/*
Update content when a new tab becomes active.
*/
browser.tabs.onActivated.addListener(updateContent);

/*
Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});