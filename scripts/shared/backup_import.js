async function importBackup(file, fktImportBackup) {
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
        let readerObjectList = unpackReaderObjectList(jsonObject);
        if (readerObjectList.length > 0)
            fktImportBackup(readerObjectList);
            return;
    });
    reader.readAsText(file);
    return;
}

async function getShowAll() {
    return await getBoolean("showAll", false);
}

async function getActiveState() {
    return await getBoolean("activeState", true);
}

async function getBoolean(strStorage, fallback = true) {
    let data = await browser.storage.local.get(strStorage);
    if (!data.hasOwnProperty(strStorage)) {
        console.log(`No data for ${strStorage}, ${fallback} by default`);
        return fallback;
    }
    return Boolean(data[strStorage]);
}

function fileHasJsonExtension(file) {
    let fileExt = file.name.split('.').pop();
    return (fileExt === "json")
}

function unpackReaderObjectList(data) {
    if (!(data.hasOwnProperty("data") && data.hasOwnProperty("type")))
        return undefined;
    if (!(data.type === "sb_webcomic_sidebar_backup"))
        return undefined;
    if (!Array.isArray(data.data))
        return undefined;
    return data.data;
}

export {importBackup, unpackReaderObjectList, getActiveState, getShowAll, getBoolean}
