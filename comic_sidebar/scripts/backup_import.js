import {Bookmark, Comic} from "./bookmarks.js"

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
        let importData = readComicObject(data);
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

function readComicObject(data) {
    let importData = [];
    if (!(data.hasOwnProperty("data") && data.hasOwnProperty("type")))
        return undefined;
    if (!(data.type === "sb_webcomic_sidebar_backup"))
        return undefined;
    for (let comicInfo of data.data) {
        tryAddComic(importData, comicInfo);
    }
    return importData;
}

function tryAddComic(importData, comicInfo) {
    if (!comicInfo.hasOwnProperty("label") || !comicInfo.hasOwnProperty("base_url"))
        return;
    let comic = new Comic(comicInfo.base_url, comicInfo.label)
    if (!comic.valid)
        return;
    if (comicInfo.hasOwnProperty("automatic"))
        tryAddBookmarks((url)=>comic.addAutomatic(url), comicInfo.automatic);
    if (comicInfo.hasOwnProperty("manual"))
        tryAddBookmarks((url)=>comic.addManual(url), comicInfo.manual);
    importData.push(comic);
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

export {importBackup, readComicObject}
