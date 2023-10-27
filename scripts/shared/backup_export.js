function saveBackup(readerClassList) {
    const link = document.createElement("a");
    const content = exportJSON(readerClassList);
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
}

function saveActiveState(activeState) {
    activeState = Boolean(activeState);
    browser.storage.local.set({activeState: activeState});
}

function saveShowAll(showAll) {
    showAll = Boolean(showAll);
    browser.storage.local.set({showAll: showAll});
}

function saveBoolean(strName, value) {
    value = Boolean(value);
    let data = {};
    data[strName] = value;
    browser.storage.local.set(data);
}

function buildWebReaderObject(readerClassList) {
    let webReaderObject = {data: [], type: "sb_webcomic_sidebar_backup"};
    for (let readerClass of readerClassList) {
        webReaderObject.data.push(readerClass.returnAsObject());
    }
    return webReaderObject;
}

function exportJSON(readerClassList) {
    let webReaderObject = buildWebReaderObject(readerClassList);
    return JSON.stringify(webReaderObject, replacer);
}

function replacer(key, value) {
    if (key === "intId") {
        return undefined;
    } else {
        return value;
    }
}

export {saveBackup, buildWebReaderObject, saveActiveState, saveShowAll, saveBoolean}