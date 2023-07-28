import {Bookmark, ComicData} from "./bookmarks.js"

async function importBackup(file, uiUpdateFkt) {
    if (!fileHasJsonExtension(file)) {
        console.log("Invalid file extension, searching for JSON file!")
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let jsonObject
        try {
            jsonObject = JSON.parse(event.target.result);
        } catch {
            console.log("Invalid source file, could not parse as JSON!")
            return;
        }
        let comicDataList = readComicObject(jsonObject);
        if (comicDataList.length > 0)
            uiUpdateFkt(comicDataList);
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
    let comicDataList = [];
    if (!(data.hasOwnProperty("data") && data.hasOwnProperty("type")))
        return undefined;
    if (!(data.type === "sb_webcomic_sidebar_backup"))
        return undefined;
    for (let comicInfo of data.data) {
        tryAddComic(comicDataList, comicInfo);
    }
    return comicDataList;
}

function tryAddComic(comicDataList, comicInfo) {
    if (!comicInfo.hasOwnProperty("label") || !comicInfo.hasOwnProperty("base_url"))
        return;
    let comicData = new ComicData(comicInfo.base_url, comicInfo.label)
    if (!comicData.valid)
        return;
    if (comicInfo.hasOwnProperty("automatic"))
        tryAddBookmarks((url)=>comicData.addAutomatic(url), comicInfo.automatic);
    if (comicInfo.hasOwnProperty("manual"))
        tryAddBookmarks((url)=>comicData.addManual(url), comicInfo.manual);
    comicDataList.push(comicData);
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
