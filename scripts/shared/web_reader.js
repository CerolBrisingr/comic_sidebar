import { HtmlContainer } from "./html_container.js"
import {ReaderData} from "./reader_data.js"
import {ReaderManager} from "../sidebar/reader_manager.js"
import {importBackup, unpackReaderObjectList, getShowAll} from "./backup_import.js"
import {saveBackup, buildWebReaderObject, saveShowAll} from "./backup_export.js"
import { ReaderFilter } from "../sidebar/reader_filter.js"
import { ReaderSort } from "../sidebar/reader_sort.js"
import { FavIconController, FavIconSubscriber } from "./fav_icon_manager.js"
import { dissectUrl } from "./url.js"

class WebReader {

    constructor() {
        this._currentReader = new ReaderClassDummy();
        this._savingSuspended = false;
        this._readerStorage = new HtmlContainer();
        this._latestId = 0;
    }
    
    importBackup(file, fktDone) {
        let fktImportBackup = (readerObjectList) => {
            this._importReaderObjectList(readerObjectList);
            fktDone();
        }
        importBackup(file, fktImportBackup);
    }
    
    updateBookmark(data) {
        let object = this._selectCorrespondingStorage(data.url);
        if (!object.isValid())
            return false;
        return object.addAutomatic(data);
    }
    
    saveBackup() {
        saveBackup(this._getSortedStorage());
    }
    
    _clearData() {
        for (let storageObject of this._readerStorage.getList()) {
            storageObject.deleteMe();
        }
        this._readerStorage.clearData();
    }

    _getSortedStorage() {
        return ReaderSort.apply(this._readerStorage.getList());
    }
    
    getObjectList() {
        let readerObject = buildWebReaderObject(this._getSortedStorage());
        return readerObject.data;
    }
    
    _selectCorrespondingStorage(url) {
        if (this._currentReader.urlIsCompatible(url))
            return this._currentReader;
        let object = this._readerStorage.getObject(url);
        if (object === undefined) {
            this._updateCurrentReader(new ReaderClassDummy());
            return this._currentReader;
        }
        this._updateCurrentReader(object);
        return object;
    }
    
    _updateCurrentReader(newObject) {
        this._currentReader.collapse();
        newObject.expand();
        this._currentReader = newObject;
    }
    
    _importReaderObjectList(readerObjectList){
        this._clearData();
        this._savingSuspended = true;
        for (let [index, readerObject] of readerObjectList.entries()) {
            this._latestId = index;
            let newObject = this._createReaderClass(readerObject, index);
            if (!newObject.isValid())
                continue;
            this._readerStorage.saveObject(newObject);
        }
        this._savingSuspended = false;
        this.saveProgress();
    }
    
    _createReaderClass(readerObject, intId) {
        throw new Error("not implemented");
    }
    
    registerPage(readerObject) {
        let storageObject 
            = this._selectCorrespondingStorage(readerObject.url);
        if (storageObject.isValid()) {
            console.log("Page already registered as " + storageObject.getLabel());
            return -1;
        }
        this._latestId += 1;
        let newManager = this._createReaderClass(readerObject, this._latestId);
        if (!newManager.isValid()) {
            console.log("Failed to build comic entry");
            return -1;
        }
        this._readerStorage.saveObject(newManager);
        this.updateBookmark(readerObject); // This also updates storage
        this.relistViewers();
        return this._latestId;
    }
    
    removeReader(prefixMask) {
        if (this._currentReader.urlIsCompatible(prefixMask))
            this._updateCurrentReader(new ReaderClassDummy());
        this._readerStorage.removeObject(prefixMask);
    }

    relistViewers() {}
    saveProgress() {}
}

class WebReaderBackground extends WebReader {
    #favIconController = new FavIconController();
    constructor() {
        super();
    }

    _createReaderClass(readerObject, intId) {
        return new ReaderData(
            readerObject,
            new WebReaderInterface(this),
            intId
        )
    }
    
    async loadInterface() {
        let storageResult = await browser.storage.local.get("comicData");
        if (!storageResult.hasOwnProperty("comicData")) {
            console.log("No data stored locally, aborting loading sequence!");
            return;
        }
        let readerObjectList = unpackReaderObjectList(storageResult.comicData);
        this._importReaderObjectList(readerObjectList);
        await this.#favIconController.initialize(this._readerStorage.keys());
    }

    updateBookmark(data) {
        let bookmarkIsNew = super.updateBookmark(data);
        let favIconIsNew = this.#updateFavIcon(data);
        return bookmarkIsNew | favIconIsNew;
    }

    #updateFavIcon(data) {
        if (data.favIcon === undefined) {
            delete data.favIcon; // Don't want to trigger anything without data
            return false;
        }
        const urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined) {
            delete data.favIcon; // Don't want to send extra 2kb if not needed
            return false;
        }
        const favIconIsNew = this.#favIconController.updateValue(urlPieces.base_url, data.favIcon);
        if (!favIconIsNew) {
            delete data.favIcon; // Don't want to send extra 2kb if not needed
            return false;
        }
        return true;
    }
    
    saveProgress() {
        if (this._savingSuspended)
            return;
        let comicDataObject = buildWebReaderObject(this._readerStorage.getList());
        browser.storage.local.set({comicData: comicDataObject});
    }
}

class WebReaderSidebar extends WebReader {
    #container;
    #showAllInterface;
    #favIconSubscriber = new FavIconSubscriber();
    constructor(container, showAllInterface) {
        if (container == undefined)
            throw new Error("Containing element for reader listings must be provided");
        super();
        this.#container = container;
        this.#showAllInterface = showAllInterface;
    }

    _createReaderClass(readerObject) {
        return new ReaderManager(
            readerObject,
            new WebReaderInterface(this),
            this.#container
        )
    }

    async _importReaderObjectList(readerObjectList) {
        super._importReaderObjectList(readerObjectList);
        await this.#favIconSubscriber.initialize();
        this.#setFavIcons();
        this._setContainerContent();
    }

    updateBookmark(data) {
        super.updateBookmark(data);
        this.#updateFavIcon(data);
    }    
    
    #updateFavIcon(data) {
        if (!data.hasOwnProperty("favIcon")) {
            console.log("No favIcon packaged");
            return;
        }
        const urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined)
            return; // Should not happen in sidebar
        if (this.#favIconSubscriber.updateValue(urlPieces.origin, data.favIcon))
            this.setFavIcon(data.url, data.favIcon);
    }

    #setFavIcons() {
        for (const [key, value] of this.#favIconSubscriber.entries()) {
            this.setFavIcon(key, value);
        }
    }

    setFavIcon(key, value) {
        let managerList = this._readerStorage.getHostListFromKey(key);
        for (const manager of managerList) {
            manager.updateFavIcon(value);
        }
    }

    relistViewers() {
        this._setContainerContent();
    }
    
    _setContainerContent() {
        let visualsList = [];
        for (let manager of this._getSortedStorage()) {
            if (!manager.isValid())
                continue;
            if (!ReaderFilter.fits(manager))
                continue;
            visualsList.push(manager.getVisuals());
        }
        this.#container.replaceChildren(...visualsList);
    }
    
    async importInterface(readerObjectList) {
        if (readerObjectList === undefined)
            return;
        this._importReaderObjectList(readerObjectList);
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
    
    relistViewerDisplay() {
        this.#webReader.relistViewers();
    }
}

class ShowAllInterface {
    #showAllUi;
    #showAll;

    constructor(showAll = undefined) {
        this.#showAllUi = showAll;
        this.#setUpButton();
        this.#initValue();
    }

    async #initValue() {
        const value = await getShowAll();
        this.#showAll = value;
        this.#setShowAllVisuals(value);
    }

    #setUpButton() {
        this.#showAllUi.icon.style.visibility = "visible";
        this.#showAllUi.button.onclick = () => {
            this.setValue(!this.#showAll);
        };
    }

    #setShowAllVisuals(value) {
        if (!this.#showAllUi)
            return;
        if (value) {
            this.#setTrueVisuals();
        } else {
            this.#setFalseVisuals();
        }
    }

    #setTrueVisuals() {
        this.#showAllUi.icon.src = "../../icons/eye.svg";
        this.#showAllUi.label.innerText = "Showing hidden";
    }

    #setFalseVisuals() {
        this.#showAllUi.icon.src = "../../icons/eye-slash.svg";
        this.#showAllUi.label.innerText = "Show hidden";

    }

    getValue() {
        return this.#showAll;
    }

    setValue(value) {
        value = Boolean(value);
        this.#setShowAllVisuals(value);
        this.#showAll = value;
        saveShowAll(value);
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

export {WebReaderSidebar, WebReaderBackground, ReaderSort, ShowAllInterface}