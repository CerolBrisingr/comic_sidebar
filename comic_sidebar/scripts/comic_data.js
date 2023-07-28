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
        let bm = new Bookmark(url);
        if (bm.href == "#")
            return false;
        if (this.automatic.length > 0)
            if (this.automatic[this.automatic.length -1].href === url) {
                console.log("Avoiding duplicate automatic entry");
                return false;
            }
        this.automatic.push(bm);
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
            return;
        let bookmark = new Bookmark(url);
        if (bookmark.href == "#")
            return;
        this.manual.push(bookmark);
        if (this.manual.length > 2)
            this.manual.shift();
        return bookmark;
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
        return {
            href:this.href
        }
    }
}

function dissectUrl(url, prefix, fallback) {
    let currentUrl
    try {
        currentUrl = new URL(url);
    } catch (error) {
        console.error(error);
        return;
    }
    
    if (currentUrl.origin === "null")
        return;
    
    if (arguments.length < 2)
        prefix = currentUrl.origin;
    if (arguments.length < 3)
        fallback = false;
    
    if (!url.startsWith(prefix)) {
        if (fallback) {
            prefix = currentUrl.origin;
        } else {
            console.log("Prefix does not match start of URL");
            return;
        }
    }
    let tail = url.slice(prefix.length);
    return {host: currentUrl.host, tail: tail, base_url: currentUrl.origin};
}

export {Bookmark, ComicData, dissectUrl}