import {ReaderVisuals} from "./reader_visuals.js"
import {ReaderData} from "../shared/reader_data.js"
import {ReaderSync} from "../shared/reader_sync.js"
import {ReaderEditor} from "./reader_editor.js"
import { Scheduler } from "../shared/schedule.js"

class ReaderManager {
    #readerData;
    #parentInterface;
    #container;
    #readerVisuals;
    #readerSync;
    #schedule;
    
    constructor(readerObject, parentInterface, container, showAllInterface) {
        this.#container = container;
        this.#parentInterface = parentInterface;
        this.#readerSync = ReaderSync.makeSatellite(readerObject.intId, this);
        this.#readerData = this.#createReaderData(readerObject);
        this.#schedule = new Scheduler(this.#readerData.getSchedule(), showAllInterface);
        this.#createReaderVisuals();
    }

    canShow() {
        return this.#schedule.canShow(this.#readerData.getLatestInputTime());
    }
    
    getLabel() {
        return this.#readerData.getLabel();
    }
    
    getPrefixMask() {
        return this.#readerData.getPrefixMask();
    }
    
    #createReaderData(readerObject) {
        return new ReaderData(
            readerObject,
            new ReaderManagerInterface(this),
            this.#readerSync
        );
    }

    updateFavIcon(src) {
        this.#readerVisuals.updateFavIcon(src);
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
        let fktForward = (readerEssentials) => {
            this.#readerSync.sendEditRequest(readerEssentials);
        };
        ReaderEditor.updateLink(this.#readerData, fktForward);
        this.expand();
    }
    
    editReader(readerEssentials) {
        this.#readerData.editReader(readerEssentials);
        this.#updateReaderVisuals();
        this.expand();
        this.#parentInterface.relistViewerDisplay();
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
    
    addAutomatic(data) {
        const addedAutomatic = this.#readerData.addAutomatic(data);
        if (addedAutomatic)
            this.#readerVisuals.updateReaderUrls(this.#readerData);
        return addedAutomatic;
    }

    getLatestInputTime() {
        return this.#readerData.getLatestInputTime();
    }
    
    sendPinRequest(url) {
        this.#readerSync.sendPinRequest(url);
    }
    
    addManual(url) {
        if (this.#readerData.addManual(url))
            this.#readerVisuals.updateReaderUrls(this.#readerData);
    }
    
    updateBookmarkLabel(url, newLabel) {
        if (this.#readerData.updateManualLabel(url, newLabel)) {
            this.#readerVisuals.updateManualLabel(url, newLabel);
        }
    }

    updateFavIcon(src) {
        this.#readerVisuals.updateFavIcon(src);
    }
    
    sendUnpinRequest(url) {
        this.#readerSync.sendUnpinRequest(url);
    }
    
    sendBookmarkLabelUpdateRequest(url, newLabel) {
        this.#readerSync.sendBookmarkLabelUpdateRequest(url, newLabel);
    }

    removeManual(url) {
        let didRemove = this.#readerData.removeManual(url);
        if (didRemove)
            this.#readerVisuals.updateReaderUrls(this.#readerData);
        return didRemove;
    }
    
    getVisuals() {
        return this.#readerVisuals.getListing();
    }
    
    isValid() {
        if (this.#readerData === undefined 
            || this.#readerVisuals === undefined
            || this.#schedule === undefined)
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
    
    deleteMe() {
        this.#readerSync.disconnect();
        this.#container.removeChild(this.getVisuals());
        this.#parentInterface.deleteMe(this.#readerData.getPrefixMask());
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
    
    requestPinBookmark(bookmark) {
        this.#readerManager.sendPinRequest(bookmark.href);
    }
    
    requestUnpinBookmark(bookmark) {
        this.#readerManager.sendUnpinRequest(bookmark.href);
    }
    
    requestBookmarkLabelUpdate(bookmark, newLabel) {
        this.#readerManager.sendBookmarkLabelUpdateRequest(bookmark.href, newLabel);
    }
    
    saveProgress() {
        // ReaderManager/Sidebar does not autosave
    }
    
    deleteMe(prefixMask) {
        throw new Error("ReaderData should never be in a position to call delete to ReaderManager!");
    }
}

export {ReaderManager, ReaderManagerDummy}
