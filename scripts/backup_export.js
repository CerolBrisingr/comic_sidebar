import {BookmarkData} from "./bookmarks.js"

function saveBackup(comicData) {
    const link = document.createElement("a");
    const content = constructBackupContent(comicData);
    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = "backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
}

function constructBackupContent(data) {
    let comicObject = {data: [], type: "sb_webcomic_sidebar_backup"};
    for (let comic of data) {
        comicObject.data.push(comic.returnAsObject());
    }
    return JSON.stringify(comicObject);
}

export {saveBackup}