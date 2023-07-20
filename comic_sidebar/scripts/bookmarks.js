class BookmarkData {
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
        let bm = new Bookmark(url);
        if (bm.href == "#")
            return;
        if (this.automatic.length > 0)
            if (this.automatic[this.automatic.length -1].href === url) {
                console.log("Avoiding duplicate automatic entry");
                return;
            }
        this.automatic.push(bm);
        if (this.automatic.length > 4)
            this.automatic.shift();
    }
    
    addManual(url) {
        let bm = new Bookmark(url);
        if (bm.href == "#")
            return;
        this.manual.push(bm);
        if (this.manual.length > 2)
            this.manual.shift();
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

class BookmarkDataDummy {
    constructor() {}
    
    get valid() {
        return false;
    }
    
    urlIsCompatible(ignoredString) {
        return false;
    }
}

class Bookmark {
    #href = "#";
    constructor(href) {
        this.href = href;
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

function dissectUrl(url, prefix) {
    let currentUrl
    try {
        currentUrl = new URL(url);
    } catch (error) {
        console.error(error);
        return;
    }
    if (currentUrl.origin === "null")
        return;
    let tail;
    if (url.startsWith(prefix)) {
        tail = url.slice(prefix.length);
    } else {
        tail = url.slice(currentUrl.origin.length);
    }
    return {host: currentUrl.host, tail: tail, base_url: currentUrl.origin};
}

export {Bookmark, BookmarkData, BookmarkDataDummy, dissectUrl}