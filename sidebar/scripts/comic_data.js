import {dissectUrl} from "./url.js"

class ComicData {
    constructor(base_url, label) {
        if (!(typeof base_url === "string")) {
            base_url = "invalid";
        }
        
        if (!(typeof label === "string")) {
            label = "invalid";
        }
        this.base_url = base_url;
        this.label = label;
        this.automatic = [];
        this.manual = [];
    }
    
    get valid() {
        return ((this.base_url !== "invalid") && (this.label !== "invalid"));
    }
    
    urlIsCompatible(url_string) {
        if (!(typeof url_string === "string"))
            return false;
        return url_string.startsWith(this.base_url);
    }
    
    addAutomatic(url) {
        if (!this.isValidNewUrl(url))
            return false;
        let newBoockmark = new Bookmark(url);
        if (newBoockmark.href == "#")
            return false;
        if (this.automatic.length > 0)
            if (this.automatic[this.automatic.length -1].href === url) {
                console.log("Avoiding duplicate automatic entry");
                return false;
            }
        for (let bookmark of this.manual) {
            if (bookmark.href === url) {
                console.log("Manual entry for this exists. Avoiding duplicate");
                return false;
            }
        }
        this.automatic.push(newBoockmark);
        if (this.automatic.length > 4)
            this.automatic.shift();
        return true;
    }
    
    isValidNewUrl(url) {
        let urlPieces = dissectUrl(url, this.base_url);
        if (urlPieces === undefined)
            return false;
        if (urlPieces.tail === "") {
            console.log("New URL must differ from prefix")
            return false;
        }
        return true;
    }
    
    update(comicEssentials) {
        this.label = comicEssentials.label;
        this.base_url = comicEssentials.prefix;
    }
    
    getMostRecentAutomaticUrl() {
        if (this.automatic.length == 0)
            return;
        let bookmark = this.automatic[this.automatic.length-1];
        return bookmark.href;
    }
    
    addManual(url) {
        if (!this.isValidNewUrl(url))
            return undefined;
        let newBookmark = new Bookmark(url);
        if (newBookmark.href == "#")
            return undefined;
        for (let bookmark of this.manual) {
            if (bookmark.href === url) {
                console.log("Avoiding duplicate manual entry");
                return undefined;
            }
        }
        this.manual.push(newBookmark);
        return newBookmark;
    }
    
    removeManual(bookmark) {
        let index = this.manual.indexOf(bookmark);
        if (index === -1) {
            console.log('Could not find requested bookmark in list to remove it');
            return false;
        }
        this.manual.splice(index, 1);
        return true;
    }
    
    returnAsObject() {
        let thisAsObject = {
            label:this.label,
            base_url:this.base_url,
            automatic: [],
            manual: []
        }
        for (let bookmark of this.manual) {
            thisAsObject.manual.push(bookmark.returnAsObject());
            }
        for (let bookmark of this.automatic) {
            thisAsObject.automatic.push(bookmark.returnAsObject());
            }
        return thisAsObject;
    }
}

class Bookmark {
    #href = "#";
    #label = undefined;
    constructor(href) {
        this.href = href;
    }
    
    setLabel(value) {
        if (typeof value === "string") {
            this.#label = value;
        } else {
            this.#label = undefined;
        }
    }
    
    getLabel(fallback) {
        if (this.#label === undefined)
            return fallback;
        return this.#label;
    }
    
    get href() {
        return this.#href;
    }
    
    set href(url) {
        if (!(typeof url === "string"))
            this.#href = "#";
        else
            this.#href = url;
    }
    
    returnAsObject() {
        if (this.#label === undefined) {
            return {href:this.href}
        } else {
            return {
                href: this.href, 
                label: this.#label 
                };
        }
            
    }
}

export {Bookmark, ComicData}