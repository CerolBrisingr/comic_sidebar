import { dissectUrl } from "./url.js"
import { SiteRecognition } from "./site_recognition.js";
import { ReaderSchedule } from "./reader_schedule.js";
import { TagData } from "./tag_data.js";

class ReaderData {
    #label;
    #latestInteraction = 0;
    #siteRecognition;
    #automatic;
    #manual = [];
    #parentInterface;
    #schedule;
    #tags;

    static buildForEditor(readerObject) {
        // Build readerData without the connected behavior
        return new ReaderData(readerObject, new InterfaceDummy(), new ReaderSyncDummy());
    }

    static buildForEditorFromData(data) {
        // Build readerData without connected behavior and from basic assumptions
        let siteRecognition = SiteRecognition.buildFromUrl(data.url);
        let urlPieces = dissectUrl(data.url);
        let readerObject = {time: data.time, site_recognition: siteRecognition.returnAsObject(), label: urlPieces.host, manual: [], automatic: []};
        readerObject.automatic.push({href: data.url});
        return ReaderData.buildForEditor(readerObject);
    }
    
    constructor(data, parentInterface) {
        // Import object from storage
        this.#parentInterface = parentInterface;
        this.#registerInteraction(data.time);
        if (data.hasOwnProperty("base_url"))        // Deprecated notion
            data.prefix_mask = String(data.base_url);
        if (data.hasOwnProperty("prefix_mask")) { // Deprecated notion
            let prefix = String(data.prefix_mask);
            this.#siteRecognition = SiteRecognition.buildFromPrefix(prefix);
        }
        if (data.hasOwnProperty("site_recognition"))
            this.#siteRecognition = new SiteRecognition(data.site_recognition);
        if (data.hasOwnProperty("label"))
            this.#label = String(data.label);
        this.#tags = new TagData(data.tags);
        this.#importAutomaticList(data.automatic);
        this.#importManualList(data.manual);
        this.#schedule = new ReaderSchedule(data.schedule);
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
            let bookmark = this.#registerManual(String(entry.href));
            if ((bookmark !== undefined) && entry.hasOwnProperty("label"))
                bookmark.setLabel(String(entry.label));
        }
    }

    removeTag(tag) {
        return this.#tags.removeTag(tag);
    }

    addTag(tag) {
        return this.#tags.addTag(tag);
    }

    getTags() {
        return this.#tags.getTags();
    }
    
    getLabel() {
        return this.#label;
    }

    setLabel(label) {
        this.#label = label;
    }

    getPrefixMasks() {
        return this.#siteRecognition.getPrefixMasks();
    }

    getRecognitionObject() {
        return this.#siteRecognition;
    }

    getRecognitionInterface() {
        return this.#siteRecognition.getInterface();
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
        return ((this.#siteRecognition.isValid() !== undefined) 
                 && (this.#label !== undefined));
    }
    
    urlIsCompatible(url_string, allowPrefix = false) {
        if (!(typeof url_string === "string"))
            return false;
        return this.#siteRecognition.siteIsCompatible(url_string, "", allowPrefix);
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
        if (!this.urlIsCompatible(url))
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
    
    editReader(readerObjectLike) {
        this.#label = readerObjectLike.label;
        this.#siteRecognition.update(readerObjectLike.site_recognition);
        this.#tags.update(readerObjectLike.tags);
        this.#schedule.updateSchedule(readerObjectLike.schedule);
        this.#parentInterface.saveProgress();
    }
    
    getMostRecentAutomaticUrl() {
        if (this.#automatic.length == 0)
            return;
        let bookmark = this.#automatic.slice(-1)[0];
        return bookmark.href;
    }
    
    addManual(url) {
        let newBookmark = this.#registerManual(url);
        if (newBookmark === undefined)
            return;
        this.#parentInterface.saveProgress();
        return newBookmark;
    }

    #registerManual(url) {
        if (!this.urlIsCompatible(url))
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

    updateSchedule(scheduleObject) {
        this.#schedule.updateSchedule(scheduleObject);
    }
    
    returnAsObject() {
        let thisAsObject = {
            time: this.#latestInteraction,
            label:this.#label,
            site_recognition:this.#siteRecognition.returnAsObject(),
            schedule:this.#schedule.returnAsObject(),
            tags:this.getTags(),
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

function isArray(list) {
    if (list === undefined)
        return false;
    return Array.isArray(list);
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
    
    getLabelWFallback(fallback) {
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

class ReaderSyncDummy {
    getId() {
        return 1;
    }

    disconnect() {}
}

class InterfaceDummy {
    saveProgress() {}
    deleteMe() {}
}

export {ReaderData}