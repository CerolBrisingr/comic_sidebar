function saveBackup(readerClassList) {
    const link = document.createElement("a");
    const content = exportJSON(readerClassList);
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
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
    return JSON.stringify(webReaderObject);
}

export {saveBackup, buildWebReaderObject}