import {ComicVisuals} from "./comic_visuals.js"

class ReaderManager {
    #readerData;
    #parentInterface;
    #container
    
    constructor(data, parentInterface, container) {
        this.#readerData = readerData;
        this.#container = container;
        this.#parentInterface = sidebarInterface;
        this.#createComicVisuals();
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
    
    #createComicVisuals() {
        if (this.#readerData === undefined) {
            this.comicVisuals = undefined;
            console.log("Encountered invalid readerData");
            return;
        }
        let readerManagerInterface = new ReaderManagerInterface(this);
        this.comicVisuals = new ComicVisuals(this.#readerData, readerManagerInterface);
    }
    
    editComic() {
        let comicEditor = this.sidebarInterface.getComicEditor();
        if (comicEditor == undefined)
            return
        let triggerFkt = () => {
            this.#readerData.update(comicEditor);
            this.#updateComicVisuals();
            this.saveProgress();
            this.expand();
            }
        comicEditor.updateLink(this.#readerData, triggerFkt);
        comicEditor.setVisible();
        this.expand();
    }
    
    #updateComicVisuals() {
        this.comicVisuals.updateListing(this.#readerData);
    }
    
    urlIsCompatible(url) {
        return this.#readerData.urlIsCompatible(url);
    }
    
    getMostRecentAutomaticUrl() {
        return this.#readerData.getMostRecentAutomaticUrl();
    }
    
    addAutomatic(url) {
        let didUpdate = this.#readerData.addAutomatic(url);
        if (didUpdate)
            this.comicVisuals.updateComicUrls(this.#readerData);
        return didUpdate;
    }
    
    addManual(url) {
        let bookmark = this.#readerData.addManual(url);
        if (bookmark === undefined)
            return false
        this.comicVisuals.updateComicUrls(this.#readerData);
        return true;
    }

    removeManual(bookmark) {
        let didRemove = this.#readerData.removeManual(bookmark);
        if (didRemove)
            this.comicVisuals.updateComicUrls(this.#readerData);
        return didRemove;
    }
    
    get visuals() {
        return this.comicVisuals.listing;
    }
    
    isValid() {
        if (this.#readerData === undefined || this.comicVisuals === undefined)
            return false;
        return this.#readerData.isValid();
    }
    
    getComicData() {
        return this.#readerData;
    }
    
    returnAsObject() {
        return this.#readerData.returnAsObject();
    }
    
    expand() {
        this.comicVisuals.expand();
    }
    
    collapse() {
        this.comicVisuals.collapse();
    }
    
    saveProgress() {
        this.#parentInterface.saveProgress();
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
    
    editComic() {}
    
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

    editReader() {
        this.#readerManager.editReader();
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
        this.#readerManager.saveProgress();
    }
}

export {ReaderManager, ReaderManagerDummy}
