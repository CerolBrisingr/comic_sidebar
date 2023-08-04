import {dissectUrl} from "./url.js"
import {ReaderData} from "./reader_data.js"
import {ReaderManager} from "../sidebar/reader_manager.js"
import {importBackup, unpackReaderObjectList} from "./backup_import.js"
import {saveBackup, buildWebReaderObject} from "./backup_export.js"

class WebReader {
    #readerEditor;
    #controller;
    #container;
    #readerClass;
    #myInterface;
    #savingSuspended = false;
    #readerStorage = new HtmlContainer();
    #currentReader;
    
    constructor(controller) {
        this.#controller = controller;
        this.#container = controller.getContainer();
        this.#readerClass = this.#getReaderClass();
        this.#myInterface = new WebReaderInterface(this);
        this.#currentReader = new ReaderClassDummy();
        
        this.#loadContent();
    }
    
    importBackup(file) {
        let fktImportBackup = (readerObjectList) => {
            this.#importReaderObjectList(readerObjectList);
        }
        importBackup(file, fktImportBackup);
    }
    
    updateBookmark(url) {
        let object = this.#selectCorrespondingStorage(url);
        if (!object.isValid())
            return;
        object.addAutomatic(url);
    }
    
    saveBackup() {
        saveBackup(this.#readerStorage.getList());
    }
    
    setComicEditor(readerEditor) {
        this.#readerEditor = readerEditor;
    }
    
    getReaderEditor() {
        return this.#readerEditor;
    }
    
    removeComicEditor() {
        this.#readerEditor = undefined;
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
        if (!this.#controller.storageAccessGiven())
            return;
        let comicDataObject = buildWebReaderObject(this.#readerStorage.getList());
        
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
            let readerObjectList = unpackReaderObjectList(storageResult.comicData);
            this.#importReaderObjectList(readerObjectList);
            }, 
            () => {console.log("No data stored locally, aborting loading sequence! (1)")});
    }
    
    #importReaderObjectList(readerObjectList){
        this.#readerStorage.clearData();
        this.#savingSuspended = true;
        for (let readerObject of readerObjectList) {
            let newObject = this.#createReaderClass(readerObject);
            if (!newObject.isValid())
                continue;
            this.#readerStorage.saveObject(newObject);
        }
        this.#setContainerContent();
        this.#savingSuspended = false;
        this.saveProgress();
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
        for (let manager of this.#readerStorage.getList()) {
            if (!manager.hasVisuals())
                continue; // not a manager then
            if (!manager.isValid())
                continue;
            visualsList.push(manager.getVisuals());
        }
        this.#container.replaceChildren(...visualsList);
    }
    
    #addToContainer(manager) {
        if (this.#container == undefined)
            return;
        if (!manager.hasVisuals())
            return;
        if (!manager.isValid())
            return;
        this.#container.appendChild(manager.getVisuals());
    }
    
    registerPage(pageEssentials) {
        let storageObject 
            = this.#selectCorrespondingStorage(pageEssentials.initialUrl);
        if (storageObject.isValid()) {
            console.log("Page already registered as " + storageObject.getLabel());
            return;
        }
        let readerObject = {prefix_mask: pageEssentials.prefix, label: pageEssentials.label};
        let newManager = this.#createReaderClass(readerObject);
        if (!newManager.isValid()) {
            console.log("Failed to build comic entry");
            return;
        }
        this.#readerStorage.saveObject(newManager);
        this.#addToContainer(newManager);
        this.updateBookmark(pageEssentials.initialUrl); // This also updates storage
    }
}

class HtmlContainer {
    #data = new Map();
    
    constructor() {}
    
    saveObject(object, url = undefined) {
        if (url === undefined)
            url = object.getPrefixMask();
        
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
    
    getReaderEditor() {
        return this.#webReader.getReaderEditor();
    }
    
    saveProgress() {
        this.#webReader.saveProgress();
    }
    
}

class WebReaderController {
    #savingAllowed;
    #container;
    #fktEditor;
    
    constructor(allowSave, container = undefined, fktEditor = undefined) {
        this.#savingAllowed = allowSave;
        this.#container = container;
        this.#fktEditor = fktEditor;
    }
    
    getContainer() {
        return this.#container;
    }
    
    editComic(comicData) {
        if (this.#fktEditor !== undefined)
            fktEditor(comicData);
    }
    
    storageAccessGiven() {
        return this.#savingAllowed;
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

export {WebReader, WebReaderController}