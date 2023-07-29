import {ComicVisuals} from "./comic_visuals.js"

class ComicManager {
    #fktTriggerStorage;
    
    constructor(comicData, comicEditor, fktTriggerStorage) {
        this.comicEditor = comicEditor;
        this.comicData = comicData;
        this.#fktTriggerStorage = fktTriggerStorage;
        this.createComicVisuals(comicData);
    }
    
    createComicVisuals(comicData) {
        if (comicData === undefined) {
            this.comicVisuals = undefined;
            console.log("Encountered invalid comicData");
            return;
        }
        this.comicVisuals = new ComicVisuals(comicData, this.#fktTriggerStorage);
        this.enableEditing(comicData);
    }
    
    updateComicVisuals(comicData) {
        this.comicVisuals.updateListing(comicData);
        this.enableEditing(comicData);
    }
    
    enableEditing(comicData) {
        let editButton = this.comicVisuals.editButton;
        if (editButton === undefined)
            return;
        
        editButton.onclick = () => {
            let triggerFkt = () => {
                comicData.update(this.comicEditor);
                this.updateComicVisuals(comicData);
                this.#fktTriggerStorage();
            }
            this.comicEditor.updateLink(comicData, triggerFkt);
            this.comicEditor.setVisible();
        }
    }
    
    urlIsCompatible(url) {
        return this.comicData.urlIsCompatible(url);
    }
    
    addAutomatic(url) {
        let didUpdate = this.comicData.addAutomatic(url);
        if (didUpdate)
            this.comicVisuals.updateComicUrls(this.comicData);
        return didUpdate;
    }
    
    get visuals() {
        return this.comicVisuals.listing;
    }
    
    get valid() {
        if (this.comicData === undefined || this.comicVisuals === undefined)
            return false;
        return this.comicData.valid;
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
