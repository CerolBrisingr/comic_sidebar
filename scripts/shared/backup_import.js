import {Bookmark, ReaderData} from "./reader_data.js"

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
        let readerDataList = readReaderObjectList(jsonObject);
        if (readerDataList.length > 0)
            uiUpdateFkt(readerDataList);
            return;
    });
    reader.readAsText(file);
    return;
}

function fileHasJsonExtension(file) {
    let fileExt = file.name.split('.').pop();
    return (fileExt === "json")
}

function readReaderObjectList(data) {
    let readerDataList = [];
    if (!(data.hasOwnProperty("data") && data.hasOwnProperty("type")))
        return undefined;
    if (!(data.type === "sb_webcomic_sidebar_backup"))
        return undefined;
    for (let readerInfo of data.data) {
        tryAddReader(readerDataList, readerInfo);
    }
    return readerDataList;
}

function tryAddReader(readerDataList, readerInfo) {
    if (!readerInfo.hasOwnProperty("label") || !readerInfo.hasOwnProperty("base_url"))
        return;
    let readerData = new ReaderData(readerInfo)
    if (!readerData.valid)
        return;
    if (readerInfo.hasOwnProperty("automatic"))
        tryAddAutomaticBookmarks(readerData, readerInfo);
    if (readerInfo.hasOwnProperty("manual"))
        tryAddManualBookmarks(readerData, readerInfo);
    readerDataList.push(readerData);
}

function tryAddAutomaticBookmarks(readerData, readerInfo) {
    if (!Array.isArray(readerInfo.automatic))
        return;
    for (let bookmark of readerInfo.automatic) {
        if (!bookmark.hasOwnProperty("href"))
            return;
        readerData.addAutomatic(bookmark.href);
    }
}

function tryAddManualBookmarks(readerData, readerInfo) {
    if (!Array.isArray(readerInfo.manual))
        return;
    for (let bookmark of readerInfo.manual) {
        if (!bookmark.hasOwnProperty("href"))
            return;
        let manualBookmark = readerData.addManual(bookmark.href);
        if (manualBookmark === undefined)
            return;
        if (bookmark.hasOwnProperty("label"))
            manualBookmark.setLabel(bookmark.label);
    }
}

export {importBackup, readReaderObjectList}
