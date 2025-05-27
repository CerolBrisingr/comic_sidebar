import { ReaderVisuals } from "../sidebar/reader_visuals.js"
import { ReaderData } from "./reader_data.js"
import { ReaderSync } from "./reader_sync.js"
import { Scheduler } from "./scheduler.js"

class BasicReaderManager {
    _readerData;
    _readerSync = new ReaderSyncDummy();
    _parentInterface;
    _tagLibrary;
    _intId;

    constructor(readerObject, parentInterface, tagLibrary, intId) {
        this.#importReaderData(readerObject);
        this._parentInterface = parentInterface;
        this._tagLibrary = tagLibrary;
        this._tagLibrary.registerTags(this._readerData);
        this._intId = intId;
    }
    
    #importReaderData(readerObject) {
        this._readerData = new ReaderData(
            readerObject,
            new ReaderManagerInterface(this)
        );
    }
    
    getLabel() {
        return this._readerData.getLabel();
    }

    getPrefixMasks() {
        return this._readerData.getPrefixMasks();
    }

    getLatestInputTime() {
        return this._readerData.getLatestInputTime();
    }
    
    urlIsCompatible(url, allowPrefix = false) {
        return this._readerData.urlIsCompatible(url, allowPrefix);
    }
    
    getMostRecentAutomaticUrl() {
        return this._readerData.getMostRecentAutomaticUrl();
    }

    addAutomatic(data){
        return this._readerData.addAutomatic(data);
    }

    updateBookmarkLabel(url, newLabel) {
        return this._readerData.updateManualLabel(url, newLabel);
    }

    addManual(url) {
        return this._readerData.addManual(url);
    }

    removeManual(url) {
        return this._readerData.removeManual(url);
    }
    
    editReader(readerObjectLike) {
        this._tagLibrary.retractTags(this._readerData);
        this._readerData.editReader(readerObjectLike);
        this._tagLibrary.registerTags(this._readerData);
        if (!this._tagLibrary.isFine())
            this._parentInterface.recountTags();
    }

    getTags() {
        return this._readerData.getTags();
    }

    getKnownTags() {
        return this._tagLibrary.getKnownTags();
    }
    
    returnAsObject() {
        let object = this._readerData.returnAsObject();
        object.intId = this._intId;
        return object;
    }
    
    deleteMe() {
        this._readerSync.disconnect();
        this._parentInterface.removeReader(this._readerData.getPrefixMasks());
    }

    isValid() {
        if (this._readerData === undefined)
            return false;
        return this._readerData.isValid();
    }
    
    // Interface only
    expand() {}
    collapse() {}
    saveProgress() {}
}

class CoreReaderManager extends BasicReaderManager {

    constructor(readerObject, parentInterface, tagLibrary, intId) {
        super(readerObject, parentInterface, tagLibrary, intId);
        this._readerSync = ReaderSync.makeCore(intId, this);
    }

    managesThis(readerData) {
        return readerData === this._readerData;
    }

    canBeUpdatedWith(readerObjectLike) {
        const tempReader = new ReaderData(readerObjectLike);
        return this._parentInterface.canWeUpdateReaderWith(this._readerData, tempReader);
    }

    getRecognitionInterface() {
        return this._readerData.getRecognitionInterface();
    }

    saveProgress() {
        this._parentInterface.saveProgress();
    }
}

class SidebarReaderManager extends BasicReaderManager{
    #readerVisuals;
    #schedule;
    #favIcon;
    
    constructor(readerObject, parentInterface, showAllInterface, tagLibrary) {
        super(readerObject, parentInterface, tagLibrary, readerObject.intId);
        this._readerSync = ReaderSync.makeSatellite(readerObject.intId, this);
        this.#schedule = new Scheduler(this._readerData.getSchedule(), showAllInterface);
        this.#createReaderVisuals();
    }

    canShow() {
        return this.#schedule.canShow(super.getLatestInputTime());
    }

    updateFavIcon(src) {
        this.#favIcon = src;
        this.#drawFavIcon();
    }

    #drawFavIcon() {
        if (this.#favIcon)
            this.#readerVisuals.updateFavIcon(this.#favIcon);
    }
    
    #createReaderVisuals() {
        if (this._readerData === undefined) {
            this.#readerVisuals = undefined;
            console.log("Encountered invalid readerData");
            return;
        }
        let readerManagerInterface = new ReaderManagerInterface(this);
        this.#readerVisuals = new ReaderVisuals(this._readerData, readerManagerInterface);
    }
    
    prepareReaderEdit() {
        this._readerSync.sendEditRequest(this.#favIcon);
    }
    
    editReader(readerObjectLike) {
        super.editReader(readerObjectLike);
        this.#schedule.updateRuleset(this._readerData.getSchedule());
        this.#updateReaderVisuals();
        this._parentInterface.relistViewerDisplay();
    }
    
    #updateReaderVisuals() {
        this.#readerVisuals.updateListing(this._readerData, this.#favIcon);
    }
    
    addAutomatic(data) {
        const addedAutomatic = super.addAutomatic(data);
        if (addedAutomatic)
            this.#readerVisuals.updateReaderUrls(this._readerData);
        return addedAutomatic;
    }
    
    sendPinRequest(url) {
        this._readerSync.sendPinRequest(url);
    }
    
    addManual(url) {
        if (super.addManual(url))
            this.#readerVisuals.updateReaderUrls(this._readerData);
    }
    
    updateBookmarkLabel(url, newLabel) {
        if (super.updateBookmarkLabel(url, newLabel)) {
            this.#readerVisuals.updateManualLabel(url, newLabel);
        }
    }
    
    sendUnpinRequest(url) {
        this._readerSync.sendUnpinRequest(url);
    }
    
    sendBookmarkLabelUpdateRequest(url, newLabel) {
        this._readerSync.sendBookmarkLabelUpdateRequest(url, newLabel);
    }

    removeManual(url) {
        let didRemove = super.removeManual(url);
        if (didRemove)
            this.#readerVisuals.updateReaderUrls(this._readerData);
        return didRemove;
    }
    
    getVisuals() {
        return this.#readerVisuals.getListing();
    }
    
    isValid() {
        if (this.#readerVisuals === undefined
            || this.#schedule === undefined)
            return false;
        return super.isValid();
    }
    
    expand() {
        this.#readerVisuals.expand();
    }
    
    collapse() {
        this.#readerVisuals.collapse();
    }
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
        this.#readerManager.saveProgress();
    }
    
    removeReader(prefixMask) {
        throw new Error("ReaderData should never be in a position to call delete to SidebarReaderManager!");
    }
}

class ReaderSyncDummy {
    disconnect(){};
}

export {CoreReaderManager, SidebarReaderManager}
