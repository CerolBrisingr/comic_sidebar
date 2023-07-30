import {ComicVisuals} from "./comic_visuals.js"

class ComicManager {
    #comicData;
    #comicEditor;
    #sidebarInterface;
    
    constructor(comicData, comicEditor, sidebarInterface) {
        this.#comicEditor = comicEditor;
        this.#comicData = comicData;
        this.#sidebarInterface = sidebarInterface;
        this.#createComicVisuals();
    }
    
    #createComicVisuals() {
        if (this.#comicData === undefined) {
            this.comicVisuals = undefined;
            console.log("Encountered invalid comicData");
            return;
        }
        let comicManagerInterface = new ComicManagerInterface(this);
        this.comicVisuals = new ComicVisuals(this.#comicData, comicManagerInterface);
    }
    
    editComic() {
        let triggerFkt = () => {
            this.#comicData.update(this.#comicEditor);
            this.#updateComicVisuals();
            this.#sidebarInterface.saveProgress();
            }
         this.#comicEditor.updateLink(this.#comicData, triggerFkt);
         this.#comicEditor.setVisible();
    }
    
    #updateComicVisuals() {
        this.comicVisuals.updateListing(this.#comicData);
    }
    
    urlIsCompatible(url) {
        return this.#comicData.urlIsCompatible(url);
    }
    
    addAutomatic(url) {
        let didUpdate = this.#comicData.addAutomatic(url);
        if (didUpdate)
            this.comicVisuals.updateComicUrls(this.#comicData);
        return didUpdate;
    }
    
    addManual(url) {
        let bookmark = this.#comicData.addManual(url);
        if (bookmark === undefined)
            return false
        this.comicVisuals.updateComicUrls(this.#comicData);
        return true;
    }
    
    get visuals() {
        return this.comicVisuals.listing;
    }
    
    get valid() {
        if (this.#comicData === undefined || this.comicVisuals === undefined)
            return false;
        return this.#comicData.valid;
    }
    
    getComicData() {
        return this.#comicData;
    }
    
    expand() {
        this.comicVisuals.expand();
    }
    
    collapse() {
        this.comicVisuals.collapse();
    }
}

class ComicManagerDummy {
    constructor() {
    }
    
    get valid() {
        return false;
    }
    
    urlIsCompatible(url) {
        return false;
    }
    
    expand() {
        // Nothing to do
    }
    collapse() {
        // Nothing to do
    }
    
}

class ComicManagerInterface {
    #comicManager

    construct(comicManager) {
        this.#comicManager = comicManager;
    }

    editor() {
        this.#comicManager.editComic();
    }
}

export {ComicManager, ComicManagerDummy}
