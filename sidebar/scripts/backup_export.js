function saveBackup(comicDataList) {
    const link = document.createElement("a");
    const content = exportJSON(comicDataList);
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
}

function buildComicObject(comicDataList) {
    let comicObject = {data: [], type: "sb_webcomic_sidebar_backup"};
    for (let comicData of comicDataList) {
        comicObject.data.push(comicData.returnAsObject());
    }
    return comicObject;
}

function exportJSON(comicDataList) {
    let comicObject = buildComicObject(comicDataList);
    return JSON.stringify(comicObject);
}

export {saveBackup, buildComicObject}