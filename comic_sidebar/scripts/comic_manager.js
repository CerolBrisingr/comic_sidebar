import {ComicVisuals} from "./comic_visuals.js"

class ComicManager {
    constructor(comicData, comicEditor) {
        this.comicEditor = comicEditor;
        this.comicData = comicData;
        this.createComicVisuals(comicData);
        this.expanded = false;
    }
    
    createComicVisuals(comicData) {
        if (comicData === undefined) {
            this.comicVisuals = undefined;
            console.log("Encountered invalid comicData");
            return;
        }
        this.comicVisuals = new ComicVisuals(comicData);
        this.enableEditing(comicData);
    }
    
    updateComicVisuals(comicData) {
        this.comicVisuals.updateListing(comicData);
        this.enableEditing(comicData);
    }
    
    enableEditing(clickField, comicData) {
        let editButton = this.comicVisuals.editButton;
        if (editButton === undefined)
            return;
        let editor = this.comicEditor;
        let manager = this;
        
        editButton.onclick = () => {
            let triggerFkt = () => {
                comicData.update(editor);
                manager.updateComicVisuals(comicData);
            }
            editor.updateLink(comicData, triggerFkt);
            editor.setVisible();
        }
    }
    
    urlIsCompatible(url) {
        return this.comicData.urlIsCompatible(url);
    }
    
    addAutomatic(url) {
        this.comicData.addAutomatic(url);
        throw("Still need to update visuals");
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
        this.expanded = true;
    }
    
    collapse() {
        this.expanded = false;
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

export {ComicManager, ComicManagerDummy}