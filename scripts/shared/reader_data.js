import {dissectUrl} from "./url.js"
import {ReaderSync} from "./reader_sync.js"

class ReaderData {
    #label;
    #intId;
    #latestInteraction = 0;
    #readerSync;
    #prefixMask;
    #automatic;
    #manual;
    #parentInterface;
    #schedule;
    
    constructor(data, parentInterface, readerSync) {
        // Import object from storage
        this.#parentInterface = parentInterface;
        this.#registerInteraction(data.time);
        if (data.hasOwnProperty("base_url"))
            data.prefix_mask = String(data.base_url);
        if (data.hasOwnProperty("prefix_mask"))
            this.#prefixMask = String(data.prefix_mask);
        if (data.hasOwnProperty("label"))
            this.#label = String(data.label);
        this.#importManualList(data.manual);
        this.#importAutomaticList(data.automatic);
        this.#schedule = new ReaderSchedule(data.schedule);
        
        if (typeof readerSync === "number")
            readerSync = ReaderSync.makeCore(readerSync, this);
        this.#readerSync = readerSync;
        this.#intId = this.#readerSync.getId();
    }
    
    #importAutomaticList(list) {
        this.#automatic = [];
        if (!isArray(list))
            return;
        for (let entry of list) {
            if (entry.hasOwnProperty("href"))
                this.#registerAutomatic(String(entry.href));
        }
    }
    
    #importManualList(list) {
        this.#manual = [];
        if (!isArray(list))
            return;
        for (let entry of list) {
            if (!entry.hasOwnProperty("href"))
                continue;
            let bookmark = this.addManual(String(entry.href));
            if ((bookmark !== undefined) && entry.hasOwnProperty("label"))
                bookmark.setLabel(String(entry.label));
        }
    }
    
    getLabel() {
        return this.#label;
    }
    
    getPrefixMask() {
        return this.#prefixMask;
    }
    
    getPinnedBookmarks() {
        return this.#manual;
    }
    
    getAutomaticBookmarks() {
        return this.#automatic;
    }

    getLatestInputTime() {
        return this.#latestInteraction;
    }
    
    isValid() {
        return ((this.#prefixMask !== undefined) && (this.#label !== undefined));
    }
    
    urlIsCompatible(url_string) {
        if (!(typeof url_string === "string"))
            return false;
        return url_string.startsWith(this.#prefixMask);
    }

    addAutomatic(data) {
        let changeHappened = this.#registerInteraction(data.time);
        changeHappened |= this.#registerAutomatic(data.url);
        if (changeHappened) {
            this.#parentInterface.saveProgress();
            return true;
        }
        return false;
    }

    #registerInteraction(time) {
        if (time) {
            this.#latestInteraction = time;
            return true;
        }
        return false;
    }
    
    #registerAutomatic(url) {
        if (!this.#isValidNewUrl(url))
            return false;
        let newBoockmark = new Bookmark(url);
        if (newBoockmark.href == "#")
            return false;
        if (this.#automatic.length > 0)
            if (this.#automatic[this.#automatic.length -1].href === url) {
                console.log("Avoiding duplicate automatic entry");
                return false;
            }
        for (let bookmark of this.#manual) {
            if (bookmark.href === url) {
                console.log("Manual entry for this exists. Avoiding duplicate");
                return false;
            }
        }
        this.#automatic.push(newBoockmark);
        if (this.#automatic.length > 4)
            this.#automatic.shift();
        
        return true;
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
    
    editReader(readerEssentials) {
        this.#label = readerEssentials.label;
        this.#prefixMask = readerEssentials.prefix;
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
    
    removeManual(url) {
        let index = this.#findManualBookmark(url);
        if (index === -1) {
            console.log('Could not find requested bookmark in list to remove it');
            return false;
        }
        this.#manual.splice(index, 1);
        this.#parentInterface.saveProgress();
        return true;
    }
    
    updateManualLabel(url, newLabel) {
        let index = this.#findManualBookmark(url);
        if (index === -1)
            return false;
        this.#manual[index].setLabel(newLabel);
        return true;
    }
    
    #findManualBookmark(url) {
        for (let [index, bookmark] of this.#manual.entries()) {
            if (bookmark.href === url)
                return index;
        }
        return -1;
    }

    getSchedule() {
        return this.#schedule;
    }
    
    returnAsObject() {
        let thisAsObject = {
            intId: this.#intId,
            time: this.#latestInteraction,
            label:this.#label,
            prefix_mask:this.#prefixMask,
            schedule:this.#schedule.returnAsObject(),
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
    
    deleteMe() {
        this.#readerSync.disconnect();
        this.#parentInterface.deleteMe(this.#prefixMask);
    }
}

function isArray(list) {
    if (list === undefined)
        return false;
    return Array.isArray(list);
}

class ReaderSchedule {
    #possibleRules = ["none", "daily", "hourly"];
    #rule = "hourly";
    
    constructor(rule) {
        if (rule === undefined)
            return;
        if (this.#possibleRules.includes(rule)) {
            this.#rule = rule;
        } else {
            console.log("Invalid scheduling rule");
        }
    }

    getRule() {
        return this.#rule;
    }

    returnAsObject() {
        return this.#rule;
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