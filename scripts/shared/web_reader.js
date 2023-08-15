import {dissectUrl} from "./url.js"
import {ReaderData} from "./reader_data.js"
import {ReaderManager} from "../sidebar/reader_manager.js"
import {importBackup, unpackReaderObjectList} from "./backup_import.js"
import {saveBackup, buildWebReaderObject} from "./backup_export.js"
import { ReaderFilter } from "../sidebar/reader_filter.js"
import { ReaderSort } from "../sidebar/reader_sort.js"

class WebReader {
    #controller;
    #container;
    #readerClass;
    #myInterface;
    #savingSuspended = false;
    #readerStorage = new HtmlContainer();
    #currentReader;
    #latestId = 0;
    
    constructor(controller) {
        this.#controller = controller;
        this.#container = controller.getContainer();
        this.#readerClass = this.#getReaderClass();
        this.#myInterface = new WebReaderInterface(this);
        this.#currentReader = new ReaderClassDummy();
    }
    
    importBackup(file, fktDone) {
        let fktImportBackup = (readerObjectList) => {
            this.#importReaderObjectList(readerObjectList);
            fktDone();
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
        saveBackup(this.#getSortedStorage());
    }
    
    #clearData() {
        for (let storageObject of this.#readerStorage.getList()) {
            storageObject.deleteMe();
        }
        this.#readerStorage.clearData();
    }

    #getSortedStorage() {
        return ReaderSort.apply(this.#readerStorage.getList());
    }
    
    getObjectList() {
        let readerObject = buildWebReaderObject(this.#getSortedStorage());
        return readerObject.data;
    }
    
    #selectCorrespondingStorage(url) {
        if (this.#currentReader.urlIsCompatible(url))
            return this.#currentReader;
        let object = this.#readerStorage.getObject(url);
        if (object === undefined) {
            this.#updateCurrentReader(new ReaderClassDummy());
            return this.#currentReader;
        }
        this.#updateCurrentReader(object);
        return object;
    }
    
    #updateCurrentReader(newObject) {
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
        browser.storage.local.set({comicData: comicDataObject});
    }

    reloadVisuals() {
        this.#setContainerContent();
    }
    
    importInterface(readerObjectList) {
        if (readerObjectList === undefined)
            return;
        this.#importReaderObjectList(readerObjectList);
    }
    
    loadInterface(fktDone) {
        let gettingItem = browser.storage.local.get("comicData");
        gettingItem.then((storageResult) => {
            if (!storageResult.hasOwnProperty("comicData")) {
                console.log("No data stored locally, aborting loading sequence! (2)");
                fktDone();
                return;
            }
            let readerObjectList = unpackReaderObjectList(storageResult.comicData);
            this.#importReaderObjectList(readerObjectList);
            fktDone();
            }, 
            () => {console.log("No data stored locally, aborting loading sequence! (1)")});
    }
    
    #importReaderObjectList(readerObjectList){
        this.#clearData();
        this.#savingSuspended = true;
        for (let [index, readerObject] of readerObjectList.entries()) {
            this.#latestId = index;
            let newObject = this.#createReaderClass(readerObject, index);
            if (!newObject.isValid())
                continue;
            this.#readerStorage.saveObject(newObject);
        }
        this.#setContainerContent();
        this.#savingSuspended = false;
        this.saveProgress();
    }
    
    #createReaderClass(readerObject, intId) {
        return new this.#readerClass(
            readerObject,
            this.#myInterface,
            intId,
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
        for (let manager of this.#getSortedStorage()) {
            if (!manager.hasVisuals())
                continue; // not a manager then
            if (!manager.isValid())
                continue;
            if (!ReaderFilter.fits(manager))
                continue;
            visualsList.push(manager.getVisuals());
        }
        this.#container.replaceChildren(...visualsList);
    }
    
    registerPage(readerObject) {
        let storageObject 
            = this.#selectCorrespondingStorage(readerObject.initialUrl);
        if (storageObject.isValid()) {
            console.log("Page already registered as " + storageObject.getLabel());
            return -1;
        }
        this.#latestId += 1;
        let newManager = this.#createReaderClass(readerObject, this.#latestId);
        if (!newManager.isValid()) {
            console.log("Failed to build comic entry");
            return -1;
        }
        this.#readerStorage.saveObject(newManager);
        this.updateBookmark(readerObject.initialUrl); // This also updates storage
        this.reloadVisuals();
        return this.#latestId;
    }
    
    removeReader(prefixMask) {
        if (this.#currentReader.urlIsCompatible(prefixMask))
            this.#updateCurrentReader(new ReaderClassDummy());
        this.#readerStorage.removeObject(prefixMask);
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
            return false;
        }
        if (this.#findObject(host, url) !== undefined) {
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
    
    removeObject(url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            console.log('Object selected for removal was not found');
            return;
        }
        let list = this.#data.get(host);
        for (let [index, object] of list.entries()) {
            if (object.urlIsCompatible(url)) {
                list.splice(index, 1);
                break;
            }
        }
        if (list.length === 0) {
            this.#data.delete(host);
        }
    }
    
    getObject(url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            return undefined;
        }
        return this.#findObject(host, url);
    }
    
    #findObject(host, url) {
        if (!this.#data.has(host)) {
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
    
    saveProgress() {
        this.#webReader.saveProgress();
    }
    
    deleteMe(prefixMask) {
        this.#webReader.removeReader(prefixMask);
    }
    
    updateViewerDisplay() {
        this.#webReader.reloadVisuals();
    }
}

class WebReaderController {
    #container;
    
    constructor(container = undefined) {
        this.#container = container;
    }
    
    getContainer() {
        return this.#container;
    }
    
    storageAccessGiven() {
        return this.#container === undefined;
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

export {WebReader, WebReaderController, ReaderSort}