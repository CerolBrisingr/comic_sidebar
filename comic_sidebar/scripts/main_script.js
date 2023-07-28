import {ComicEditor} from "./comic_editor.js"
import {ComicSidebar} from "./comic_sidebar.js"

/* 
Browser modified during development:
about:config
    extensions.webextensions.keepStorageOnUninstall -> true (was false)
    extensions.webextensions.keepUuidOnUninstall    -> true (was false)
  Not yet: xpinstall.signatures.required            -> false (still is true)
Source: https://extensionworkshop.com/documentation/develop/testing-persistent-and-restart-features/#what-do-i-do-to-ensure-i-can-test-my-extension
*/

// Tab management
let myWindowId;
let hasWindowId = false;
let hasLoaded = false;
let comicSidebar;

document.addEventListener('DOMContentLoaded', function () {
    
    setUpButtons();
    let comicEditor = setUpComicEditor();
    setUpSidebar(comicEditor);
    
    function setUpButtons() {
        const exportTrigger = document.getElementById('export_trigger');
        exportTrigger.onclick = function() {comicSidebar.saveBackup()};
        
        const inputElement = document.getElementById('file-selector');
        inputElement.style.display = 'none';
        inputElement.addEventListener('change', (event) => {
            comicSidebar.importBackup(event.target.files[0]);
        });
        
        const inputTrigger = document.getElementById('import_trigger');
        inputTrigger.onclick = function () {inputElement.click()};
        
        const addComic = document.getElementById('add_comic');
        addComic.onclick = function () {addCurrentPage()};
    }

    function setUpComicEditor() {
        let fullFrame = document.getElementById('new_comic_input_frame');
        let fullLink = document.getElementById('new_comic_full_link');
        let label = document.getElementById('new_comic_label');
        let prefix = document.getElementById('new_comic_prefix');
        let linkLabel = document.getElementById('new_comic_link_label');
        let textMsg = document.getElementById('new_comic_message');
        let errorMsg = document.getElementById('new_comic_error');
        let cancelBtn = document.getElementById('new_comic_cancel');
        let okBtn = document.getElementById('new_comic_finalize');
        let comicEditor = new ComicEditor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn);
        return comicEditor;
    }
    
    function setUpSidebar(comicEditor) {
        let container = document.getElementById('container');
        comicSidebar = new ComicSidebar(container, comicEditor);
        hasLoaded = true;
        firstContentUpdate();
    }
});

// Add current page to list
function addCurrentPage() {
    browser.tabs.query({windowId: myWindowId, active: true})
        .then((tabs) => {
            comicSidebar.tryRegisterPage(tabs[0].url);
            }
            , onError);
}

// Update the sidebar's content.
function updateContent() {
    browser.tabs.query({windowId: myWindowId, active: true})
        .then((tabs) => comicSidebar.updateBookmark(tabs[0].url), onError)
}

// Display error for failed promises
function onError(error) {
    console.log("Error: ${error}");
}

function firstContentUpdate() {
    if (!hasWindowId) {
        return;
    }
    if (!hasLoaded) {
        return;
    }
    console.log('Initial update');
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