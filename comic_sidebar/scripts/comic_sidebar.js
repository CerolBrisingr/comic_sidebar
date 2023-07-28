import {ComicManager, ComicManagerDummy} from "./comic_manager.js"
import {Comic} from "./bookmarks.js"
import {importBackupNew, readComicObject} from "./backup_import.js"
import {saveBackup, buildComicObject} from "./backup_export.js"

class ComicSidebar {
    #fktTriggerStorage;
    
    constructor(container, comicEditor) {
        this.comicManagerList = [];
        this.comicEditor = comicEditor;
        this.currentManager = new ComicManagerDummy();
        this.container = container;
        this.#fktTriggerStorage = () => {this.saveToStorage();};
        
        this.importStorage();
    }
    
    importBackup(file) {
        let uiUpdateFkt = (comicDataList) => {
            this.#importComicDataList(comicDataList);
        }
        importBackupNew(file, uiUpdateFkt);
    }
    
    saveBackup() {
        saveBackup(this.#compileComicDataList());
    }
    
    importStorage() {
        let gettingItem = browser.storage.local.get("comicData");
        gettingItem.then((storageResult) => {
            if (!storageResult.hasOwnProperty("comicData")) {
                console.log("No data stored locally, aborting loading sequence! (2)");
                return;
            }
            let importData = readComicObject(storageResult.comicData);
            this.#importComicDataList(importData);
            }, 
            () => {console.log("No data stored locally, aborting loading sequence! (1)")});
    }
    
    #importComicDataList(comicDataList){
        let visualsList = [];
        this.comicManagerList.length = 0; // keep object permanence
        for (let comicData of comicDataList) {
            let newManager = this.buildNewManager(comicData);
            if (!newManager.valid)
                continue;
            this.comicManagerList.push(newManager);
            visualsList.push(newManager.visuals);
        }
        this.container.replaceChildren(...visualsList);
        this.saveToStorage();
    }
    
    #compileComicDataList() {
        let comicDataList = [];
        for (let comicManager of this.comicManagerList) {
            comicDataList.push(comicManager.comicData);
        }
        return comicDataList;
    }
    
    buildNewManager(comicData) {
        return new ComicManager(
                comicData,
                this.comicEditor,
                this.#fktTriggerStorage
                );
    }
    
    tryRegisterPage(url) {
        let triggerFkt = (comicEssentials) => {
            this.#registerPage(comicEssentials);
        }
        this.comicEditor.importLink(url, triggerFkt);
    }
    
    #registerPage(comicEssentials) {
        let comicManager 
            = this.selectCorrespondingManager(comicEssentials.initialUrl);
        if (comicManager.valid) {
            console.log("Page already registered as " + comicManager.comicData.label);
            return;
        }
        let comicData = new Comic(comicEssentials.prefix, comicEssentials.label);
        let newManager = this.buildNewManager(comicData);
        if (!newManager.valid) {
            console.log("Failed to build comic entry");
            return;
        }
        this.comicManagerList.push(newManager);
        this.container.appendChild(newManager.visuals);
        this.updateBookmark(comicEssentials.initialUrl); // This also updates storage
    }
    
    updateBookmark(url) {
        let comicManager = this.selectCorrespondingManager(url);
        if (!comicManager.valid)
            return;
        if (comicManager.addAutomatic(url))
            this.saveToStorage();
    }
    
    selectCorrespondingManager(url) {
        if (this.currentManager.urlIsCompatible(url))
            return this.currentManager;
        for (let comicManager of this.comicManagerList) {
            if (comicManager.urlIsCompatible(url)) {
                this.updateCurrentManager(comicManager);
                return comicManager;
            }
        }
        this.updateCurrentManager(new ComicManagerDummy());
        return new ComicManagerDummy();
    }
    
    updateCurrentManager(newManager) {
        this.currentManager.collapse();
        newManager.expand();
        this.currentManager = newManager;
    }
    
    saveToStorage() {
        console.log('Should have saved, implement it!');
    }
}

export {ComicSidebar}