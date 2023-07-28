import {Bookmark, ComicData} from "./comic_data.js"

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
        tryAddAutomaticBookmarks(comicData, comicInfo);
    if (comicInfo.hasOwnProperty("manual"))
        tryAddManualBookmarks(comicData, comicInfo);
    comicDataList.push(comicData);
}

function tryAddAutomaticBookmarks(comicData, comicInfo) {
    if (!Array.isArray(comicInfo.automatic))
        return;
    for (let bookmark of comicInfo.automatic) {
        if (!bookmark.hasOwnProperty("href"))
            return;
        comicData.addAutomatic(bookmark.href);
    }
}

function tryAddManualBookmarks(comicData, comicInfo) {
    if (!Array.isArray(comicInfo.manual))
        return;
    for (let bookmark of comicInfo.manual) {
        if (!bookmark.hasOwnProperty("href"))
            return;
        let manualBookmark = comicData.addManual(bookmark.href);
        if (bookmark.hasOwnProperty("label"))
            manualBookmark.setLabel(bookmark.label);
    }
}

export {importBackup, readComicObject}
