import {dissectUrl} from "./url.js"

class ReaderData {
    #label;
    #prefix_mask;
    #automatic;
    #manual;
    #parentInterface;
    
    constructor(data, parentInterface) {
        this.#parentInterface = parentInterface;
        if (data.hasOwnProperty(prefix_mask))
            this.#prefix_mask = String(data.prefix_mask);
        if (data.hasOwnProperty(label))
            this.#label = String(data.label);
        this.#automatic = [];
        this.#manual = [];
    }
    
    hasVisuals() {
        return false;
    }
    
    getLabel() {
        return this.#label;
    }
    
    isValid() {
        return ((this.#prefix_mask !== undefined) && (this.#label !== undefined));
    }
    
    urlIsCompatible(url_string) {
        if (!(typeof url_string === "string"))
            return false;
        return url_string.startsWith(this.#prefix_mask);
    }
    
    addAutomatic(url) {
        if (!this.#isValidNewUrl(url))
            return;
        let newBoockmark = new Bookmark(url);
        if (newBoockmark.href == "#")
            return;
        if (this.#automatic.length > 0)
            if (this.#automatic[this.#automatic.length -1].href === url) {
                console.log("Avoiding duplicate automatic entry");
                return;
            }
        for (let bookmark of this.#manual) {
            if (bookmark.href === url) {
                console.log("Manual entry for this exists. Avoiding duplicate");
                return;
            }
        }
        this.#automatic.push(newBoockmark);
        if (this.#automatic.length > 4)
            this.#automatic.shift();
        
        this.#parentInterface.saveProgress();
    }
    
    #isValidNewUrl(url) {
        let urlPieces = dissectUrl(url, this.#prefix_mask);
        if (urlPieces === undefined)
            return false;
        if (urlPieces.tail === "") {
            console.log("New URL must differ from prefix")
            return false;
        }
        return true;
    }
    
    update(pageEssentials) {
        this.#label = pageEssentials.label;
        this.#prefix_mask = pageEssentials.prefix;
        this.#parentInterface.saveProgress();
    }
    
    getMostRecentAutomaticUrl() {
        if (this.#automatic.length == 0)
            return;
        let bookmark = this.#automatic.slice(-1)[0];
        return bookmark.href;
    }
    
    addManual(url) {
        if (!this.#isValidNewUrl(url))
            return undefined;
        let newBookmark = new Bookmark(url);
        if (newBookmark.href == "#")
            return undefined;
        for (let bookmark of this.#manual) {
            if (bookmark.href === url) {
                console.log("Avoiding duplicate manual entry");
                return undefined;
            }
        }
        this.#manual.push(newBookmark);
        this.#parentInterface.saveProgress();
        return newBookmark;
    }
    
    removeManual(bookmark) {
        let index = this.#manual.indexOf(bookmark);
        if (index === -1) {
            console.log('Could not find requested bookmark in list to remove it');
            return false;
        }
        this.#manual.splice(index, 1);
        this.#parentInterface.saveProgress();
        return true;
    }
    
    returnAsObject() {
        let thisAsObject = {
            label:this.#label,
            prefix_mask:this.#prefix_mask,
            automatic: [],
            manual: []
        }
        for (let bookmark of this.#manual) {
            thisAsObject.manual.push(bookmark.returnAsObject());
            }
        for (let bookmark of this.#automatic) {
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

export {Bookmark, ReaderData}