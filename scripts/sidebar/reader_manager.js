import {ReaderVisuals} from "./reader_visuals.js"
import {ReaderData} from "../shared/reader_data.js"
import {ReaderSync} from "../shared/reader_sync.js"

class ReaderManager {
    #readerData;
    #parentInterface;
    #container;
    #readerVisuals;
    #readerSync;
    
    constructor(readerObject, parentInterface, intId, container) {
        this.#container = container;
        this.#parentInterface = parentInterface;
        this.#readerSync = ReaderSync.makeSatellite(readerObject.intId, this);
        this.#readerData = this.#createReaderData(readerObject, readerObject.intId);
        this.#createReaderVisuals();
    }
    
    hasVisuals() {
        return true;
    }
    
    getLabel() {
        return this.#readerData.getLabel();
    }
    
    getPrefixMask() {
        return this.#readerData.getPrefixMask();
    }
    
    #createReaderData(readerObject, intId) {
        return new ReaderData(
            readerObject,
            new ReaderManagerInterface(this),
            this.#readerSync
        );
    }
    
    #createReaderVisuals() {
        if (this.#readerData === undefined) {
            this.#readerVisuals = undefined;
            console.log("Encountered invalid readerData");
            return;
        }
        let readerManagerInterface = new ReaderManagerInterface(this);
        this.#readerVisuals = new ReaderVisuals(this.#readerData, readerManagerInterface);
    }
    
    prepareReaderEdit() {
        this.#parentInterface.prepareReaderEdit(this.#readerData);
        this.expand();
    }
    
    updateReaderConfig(readerEssentials) {
        console.log(readerEssentials);
        this.#readerData.updateReaderConfig(readerEssentials);
        this.#updateReaderVisuals();
        this.expand();
    }
    
    #updateReaderVisuals() {
        this.#readerVisuals.updateListing(this.#readerData);
    }
    
    urlIsCompatible(url) {
        return this.#readerData.urlIsCompatible(url);
    }
    
    getMostRecentAutomaticUrl() {
        return this.#readerData.getMostRecentAutomaticUrl();
    }
    
    addAutomatic(url) {
        if (this.#readerData.addAutomatic(url))
            this.#readerVisuals.updateReaderUrls(this.#readerData);
    }
    
    addManual(url) {
        let bookmark = this.#readerData.addManual(url);
        if (bookmark === undefined)
            return false
        this.#readerVisuals.updateReaderUrls(this.#readerData);
        return true;
    }

    removeManual(bookmark) {
        let didRemove = this.#readerData.removeManual(bookmark);
        if (didRemove)
            this.#readerVisuals.updateReaderUrls(this.#readerData);
        return didRemove;
    }
    
    getVisuals() {
        return this.#readerVisuals.listing;
    }
    
    isValid() {
        if (this.#readerData === undefined || this.#readerVisuals === undefined)
            return false;
        return this.#readerData.isValid();
    }
    
    returnAsObject() {
        return this.#readerData.returnAsObject();
    }
    
    expand() {
        this.#readerVisuals.expand();
    }
    
    collapse() {
        this.#readerVisuals.collapse();
    }
}

class ReaderManagerDummy {
    constructor() {
    }
    
    isValid() {
        return false;
    }
    
    urlIsCompatible(url) {
        return false;
    }
    
    prepareReaderEdit() {}
    
    pinBookmark(bookmark) {
        return false;
    }
    unpinBookmark(bookmark) {
        return false;
    }
    
    expand() {}
    collapse() {}
}

class ReaderManagerInterface {
    #readerManager

    constructor(readerManager) {
        this.#readerManager = readerManager;
    }

    prepareReaderEdit() {
        this.#readerManager.prepareReaderEdit();
    }
    
    pinBookmark(bookmark) {
        if (this.#readerManager.addManual(bookmark.href)) {
            return true;
        }
        return false;
    }
    
    unpinBookmark(bookmark) {
        if (this.#readerManager.removeManual(bookmark)) {
            return true;
        }
        return false;
    }
    
    saveProgress() {
    }
}

export {ReaderManager, ReaderManagerDummy}
