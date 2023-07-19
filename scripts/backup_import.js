import {Bookmark, BookmarkData} from "./bookmarks.js"

async function importBackup(file, container, uiUpdateFkt) {
    if (!fileHasJsonExtension(file)) {
        console.log("Invalid file extension, searching for JSON file!")
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let data
        try {
            data = JSON.parse(event.target.result);
        } catch {
            console.log("Invalid source file, could not parse as JSON!")
            return;
        }
        let importData = importStructure(data);
        if (importData.length > 0)
            uiUpdateFkt(importData, container);
            return;
    });
    reader.readAsText(file);
    return;
}

function fileHasJsonExtension(file) {
    let fileExt = file.name.split('.').pop();
    return (fileExt === "json")
}

function importStructure(data) {
    let importData = [];
    if (!(data.hasOwnProperty("data") && data.hasOwnProperty("type")))
        return undefined;
    if (!(data.type === "sb_webcomic_sidebar_backup"))
        return undefined;
    for (let comic of data.data) {
        tryAddComic(importData, comic);
    }
    return importData;
}

function tryAddComic(importData, comic) {
    if (!comic.hasOwnProperty("label") || !comic.hasOwnProperty("base_url"))
        return;
    let bookmarkData = new BookmarkData(comic.base_url, comic.label)
    if (!bookmarkData.valid)
        return;
    if (comic.hasOwnProperty("automatic"))
        tryAddBookmarks((url)=>bookmarkData.addAutomatic(url), comic.automatic);
    if (comic.hasOwnProperty("manual"))
        tryAddBookmarks((url)=>bookmarkData.addManual(url), comic.manual);
    importData.push(bookmarkData);
}

function tryAddBookmarks(importCall, source) {
    if (!Array.isArray(source))
        return;
    for (let bookmark of source) {
        if (!bookmark.hasOwnProperty("href"))
            return;
        importCall(bookmark.href);
    }
}

export {importBackup}
