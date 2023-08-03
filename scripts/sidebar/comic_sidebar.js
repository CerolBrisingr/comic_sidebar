import {ComicManager, ComicManagerDummy} from "./comic_manager.js"
import {ComicData} from "./comic_data.js"
import {importBackup, readComicObject} from "../shared/backup_import.js"
import {saveBackup, buildComicObject} from "../shared/backup_export.js"

class ComicSidebar {
    #sidebarInterface;
    #comicEditor;
    #container;
    
    constructor() {
        this.comicManagerList = [];
        this.currentManager = new ComicManagerDummy();
        this.#sidebarInterface = new ComicSidebarInterface(this);
        
        this.#importStorage();
    }
    
    importBackup(file) {
        let uiUpdateFkt = (comicDataList) => {
            this.#importComicDataList(comicDataList);
        }
        importBackup(file, uiUpdateFkt);
    }
    
    saveBackup() {
        saveBackup(this.#compileComicDataList());
    }
    
    setContainer(container) {
        this.#container = container;
        this.#setContainerContent();
    }
    
    removeContainer() {
        this.#container = undefined;
    }
    
    #setContainerContent() {
        if (this.#container == undefined)
            return;
        let visualsList = [];
        for (let manager of this.comicManagerList) {
            if (!manager.valid)
                continue;
            visualsList.push(manager.visuals);
        }
        this.#container.replaceChildren(...visualsList);
    }
    
    #addToContainer(manager) {
        if (this.#container == undefined)
            return;
        if (!manager.valid)
            return;
        this.#container.appendChild(manager.visuals);
    }
    
    setComicEditor(comicEditor) {
        this.#comicEditor = comicEditor;
    }
    
    getComicEditor() {
        return this.#comicEditor;
    }
    
    removeComicEditor() {
        this.#comicEditor = undefined;
    }
    
    #importStorage() {
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
    
    saveToStorage() {
        console.log("Does work but avoiding this for now");
        return;
        
        let comicDataObject = buildComicObject(this.#compileComicDataList());
        browser.storage.local.set({comicData: comicDataObject});
    }
    
    #importComicDataList(comicDataList){
        this.comicManagerList.length = 0; // keep object permanence
        for (let comicData of comicDataList) {
            let newManager = this.#buildNewManager(comicData);
            if (!newManager.valid)
                continue;
            this.comicManagerList.push(newManager);
        }
        this.#setContainerContent();
        this.saveToStorage();
    }
    
    #compileComicDataList() {
        let comicDataList = [];
        for (let comicManager of this.comicManagerList) {
            comicDataList.push(comicManager.getComicData());
        }
        return comicDataList;
    }
    
    #buildNewManager(comicData) {
        return new ComicManager(
                comicData,
                this.#sidebarInterface
                );
    }
    
    tryRegisterPage(url, fktUpdateBackground) {
        let triggerFkt = (comicEssentials) => {
            this.registerPage(comicEssentials);
            fktUpdateBackground(comicEssentials);
        }
        this.#comicEditor.importLink(url, triggerFkt);
    }
    
    registerPage(comicEssentials) {
        let comicManager 
            = this.#selectCorrespondingManager(comicEssentials.initialUrl);
        if (comicManager.valid) {
            console.log("Page already registered as " + comicManager.comicData.label);
            return;
        }
        let comicData = new ComicData(comicEssentials.prefix, comicEssentials.label);
        let newManager = this.#buildNewManager(comicData);
        if (!newManager.valid) {
            console.log("Failed to build comic entry");
            return;
        }
        this.comicManagerList.push(newManager);
        this.#addToContainer(newManager);
        this.updateBookmark(comicEssentials.initialUrl); // This also updates storage
    }
    
    updateBookmark(url) {
        let comicManager = this.#selectCorrespondingManager(url);
        if (!comicManager.valid)
            return;
        if (comicManager.addAutomatic(url))
            this.saveToStorage();
    }
    
    #selectCorrespondingManager(url) {
        if (this.currentManager.urlIsCompatible(url))
            return this.currentManager;
        for (let comicManager of this.comicManagerList) {
            if (comicManager.urlIsCompatible(url)) {
                this.#updateCurrentManager(comicManager);
                return comicManager;
            }
        }
        this.#updateCurrentManager(new ComicManagerDummy());
        return new ComicManagerDummy();
    }
    
    #updateCurrentManager(newManager) {
        this.currentManager.collapse();
        newManager.expand();
        this.currentManager = newManager;
    }
}

class ComicSidebarInterface {
    #comicSidebar
    
    constructor(comicSidebar) {
        this.#comicSidebar = comicSidebar;
    }
    
    getComicEditor() {
        return this.#comicSidebar.getComicEditor();
    }
    
    saveProgress() {
        this.#comicSidebar.saveToStorage();
    }
}

export {ComicSidebar}