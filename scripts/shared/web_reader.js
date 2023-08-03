import {dissectUrl} from "./url.js"
import {ReaderData} from "./reader_data.js"
import {ReaderManager} from "../sidebar/reader_manager.js"
import {importBackup, readReaderObjectList} from "./backup_import.js"
import {saveBackup, buildComicObject} from "./backup_export.js"

class WebReader {
    #comicEditor;
    #container;
    #readerClass;
    #myInterface;
    #savingSuspended = false;
    #readerStorage = htmlContainer();
    #currentReader;
    
    constructor(container = undefined) {
        this.#container = container;
        this.#readerClass = this.#getReaderClass();
        this.#myInterface = new WebReaderInterface(this);
        this.#currentReader = new ReaderClassDummy();
        
        this.#loadContent();
    }
    
    importBackup(file) {
        let uiUpdateFkt = (readerObjectList) => {
            this.#importReaderObjectList(readerObjectList);
        }
        importBackup(file, uiUpdateFkt);
    }
    
    updateBookmark(url) {
        let object = this.#selectCorrespondingStorage(url);
        if (!object.valid)
            return;
        if (object.addAutomatic(url))
            this.saveToStorage();
    }
    
    saveBackup() {
        saveBackup(this.#readerStorage.getList());
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
    
    #selectCorrespondingStorage(url) {
        if (this.#currentReader.urlIsCompatible(url))
            return this.#currentReader;
        let object = this.#readerStorage.getObject(url);
        if (object === undefined) {
            this.#udateCurrentReader(new ReaderClassDummy());
            return this.#currentReader;
        }
        this.#udateCurrentReader(object);
        return object;
    }
    
    #udateCurrentReader(newObject) {
        this.#currentReader.collapse();
        newObject.expand();
        this.#currentReader = newObject;
    }
    
    saveProgress() {
        if (this.#savingSuspended)
            return;
        let comicDataObject = buildComicObject(this.#readerStorage.getList());
        
        console.log(comicDataObject);
        return;
        
        browser.storage.local.set({comicData: comicDataObject});
    }
    
    #loadContent() {
        let gettingItem = browser.storage.local.get("comicData");
        gettingItem.then((storageResult) => {
            if (!storageResult.hasOwnProperty("comicData")) {
                console.log("No data stored locally, aborting loading sequence! (2)");
                return;
            }
            let readerObjectList = readReaderObjectList(storageResult.comicData);
            this.#importReaderObjectList(readerObjectList);
            }, 
            () => {console.log("No data stored locally, aborting loading sequence! (1)")});
    }
    
    #importReaderObjectList(readerObjectList){
        this.#readerStorage.clearData();
        this.#savingSuspended = true;
        for (let readerObject of readerObjectList) {
            let newObject = this.#createReaderClass(readerObject);
            if (!newObject.valid)
                continue;
            this.#readerStorage.saveObject(newObject);
        }
        this.#setContainerContent();
        this.#savingSuspended = false;
        this.saveToStorage();
    }
    
    #createReaderClass(readerObject) {
        return new this.#readerClass(
            readerObject,
            this.#myInterface,
            this.#container
        )
    }
    
    #getReaderClass() {
        if (this.#container === undefined) {
            return ReaderData;
        } else {
            return ReaderManager;
        }
    }
    
    #setContainerContent() {
        if (this.#container == undefined)
            return;
        let visualsList = [];
        for (let manager of this.comicManagerList) {
            if (!manager.hasVisuals())
                continue;
            if (!manager.valid)
                continue;
            visualsList.push(manager.visuals);
        }
        this.#container.replaceChildren(...visualsList);
    }
    
    #addToContainer(manager) {
        if (this.#container == undefined)
            return;
        if (!manager.hasVisuals())
            return;
        if (!manager.valid)
            return;
        this.#container.appendChild(manager.visuals);
    }
    
    // Add new page
    tryRegisterPage(url, fktUpdateBackground) {
        if (this.#comicEditor === undefined)
            return;
        let triggerFkt = (pageEssentials) => {
            this.registerPage(pageEssentials);
            fktUpdateBackground(pageEssentials);
        }
        this.#comicEditor.importLink(url, triggerFkt);
    }
    
    registerPage(pageEssentials) {
        let storageObject 
            = this.#selectCorrespondingStorage(pageEssentials.initialUrl);
        if (storageObject.valid) {
            console.log("Page already registered as " + storageObject.getLabel());
            return;
        }
        let readerObject = {prefix_mask: pageEssentials.prefix, label: pageEssentials.label};
        let newManager = this.#createReaderClass(readerObject);
        if (!newManager.valid) {
            console.log("Failed to build comic entry");
            return;
        }
        this.comicManagerList.push(newManager);
        this.#addToContainer(newManager);
        this.updateBookmark(pageEssentials.initialUrl); // This also updates storage
    }
}

class htmlContainer {
    #data = new Map();
    
    constructor() {}
    
    saveObject(object, url = undefined) {
        if (url === undefined)
            url = object.getMostRecentAutomaticUrl();
        
        let host = this.#getHost(url);
        if (host === undefined) {
            console.log(`htmlContainer: invalid target url "${String(url)}"`)
            return false;
        }
        if (this.#findObject(host, url) !== undefined) {
            console.log(`htmlContainer: already contains object for "${String(url)}"`)
            return false;
        }
        if (this.#data.has(host)) {
            let array = this.#data.get(host);
            array.push(object);
        } else {
            this.#data.set(host, [object]);
        }
    }
    
    clearData() {
        this.#data.clear();
    }
    
    getObject(url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            console.log(`htmlContainer: invalid query url "${String(url)}"`)
            return undefined;
        }
        return this.#findObject(host, url);
    }
    
    #findObject(host, url) {
        if (!this.#data.has(host)) {
            console.log("htmlContainer: missing entry for host");
            return undefined;
        }
        for (let object of this.#data.get(host)) {
            if (object.urlIsCompatible(url))
                return object;
        }
        return undefined;
    }
    
    #getHost(url) {
        let urlPieces = dissectUrl(url);
        if (urlPieces === undefined)
            return
        return urlPieces.host;
    }
    
    getList() {
        // Returns stored objects as list
        // Upkeeping a sorted index is probably better once we actually sort
        let objectList = [];
        for (let host of this.#data.values())
            for (let object of host) {
                objectList.push(object);
            }
        return objectList;
    }
    
}

class WebReaderInterface {
    #webReader
    
    constructor(webReader) {
        this.#webReader = webReader;
    }
    
    getComicEditor() {
        return this.#webReader.getComicEditor();
    }
    
    saveProgress() {
        this.#webReader.saveProgress();
    }
    
}

class ReaderClassDummy {
    constructor() {}
    
    isValid() {
        return false;
    }
    
    urlIsCompatible(url) {
        return false;
    }
    
    expand() {}
    collapse() {}
}

export {WebReader}