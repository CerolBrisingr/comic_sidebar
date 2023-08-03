import {dissectUrl} from "./url.js"

class ReaderData {
    #label;
    #prefixMask;
    #automatic;
    #manual;
    #parentInterface;
    
    constructor(data, parentInterface) {
        this.#parentInterface = parentInterface;
        if (data.hasOwnProperty("base_url"))
            data.prefix_mask = String(data.base_url);
        if (data.hasOwnProperty("prefix_mask"))
            this.#prefixMask = String(data.prefix_mask);
        if (data.hasOwnProperty("label"))
            this.#label = String(data.label);
        this.#automatic = [];
        this.#manual = [];
        if (data.hasOwnProperty("automatic"))
            this.#importAutomaticList(data.automatic);
        if (data.hasOwnProperty("manual"))
            this.#importManualList(data.manual);
    }
    
    #importAutomaticList(list) {
        if (!Array.isArray(list))
            return
        for (let entry of list) {
            if (entry.hasOwnProperty("href"))
                this.addAutomatic(String(entry.href));
        }
    }
    
    #importManualList(list) {
        if (!Array.isArray(list))
            return
        for (let entry of list) {
            if (!entry.hasOwnProperty("href"))
                continue;
            let bookmark = this.addManual(String(entry.href));
            if ((bookmark !== undefined) && entry.hasOwnProperty("label"))
                bookmark.setLabel(String(entry.label));
        }
    }
    
    hasVisuals() {
        return false;
    }
    
    getLabel() {
        return this.#label;
    }
    
    getPrefixMask() {
        return this.#prefixMask;
    }
    
    isValid() {
        return ((this.#prefixMask !== undefined) && (this.#label !== undefined));
    }
    
    urlIsCompatible(url_string) {
        if (!(typeof url_string === "string"))
            return false;
        return url_string.startsWith(this.#prefixMask);
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
        let urlPieces = dissectUrl(url, this.#prefixMask);
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
        this.#prefixMask = pageEssentials.prefix;
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
            prefix_mask:this.#prefixMask,
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
    
    // Interface only
    expand() {}
    collapse() {}
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