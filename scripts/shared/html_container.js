import { dissectUrl } from "./url.js";

class HtmlContainer {
    #data = new Map();
    
    constructor() {}

    saveObject(object) {
        // TODO: remove [] once prefixMask is actually a list
        let urlList = [object.getPrefixMask()];
        for (let url of urlList) {
            this.#storeObjectUsingUrl(object, url);
        }
    }

    #storeObjectUsingUrl(object, url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            return false;
        }
        if (this.#findObject(host, url) !== undefined) {
            return false;
        }
        if (this.#data.has(host)) {
            let array = this.#data.get(host);
            array.push(object);
        } else {
            this.#data.set(host, [object]);
        }
    }

    keys() {
        return Array.from(this.#data.keys());
    }
    
    clearData() {
        this.#data.clear();
    }

    removeObject(urlList) {
        // TODO: remove [] once it's actually a list
        for (let url of [urlList]) {
            this.#removeObjectUsing(url);
        }
    }
    
    #removeObjectUsing(url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            console.log('Could not find valid host for given input');
            return;
        }
        let list = this.#data.get(host);
        if (list === undefined) {
            console.log('Object selected for removal was not found');
            return;
        }
        for (let [index, object] of list.entries()) {
            if (object.urlIsCompatible(url)) {
                list.splice(index, 1);
                break;
            }
        }
        if (list.length === 0) {
            this.#data.delete(host);
        }
    }
    
    getObject(url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            return undefined;
        }
        return this.#findObject(host, url);
    }

    getHostListFromUrl(url) {
        let host = this.#getHost(url);
        if (host === undefined) {
            return [];
        }
        return this.getHostListFromKey(host);
    }

    getHostListFromKey(host) {
        if (!this.#data.has(host)) {
            return [];
        }
        return this.#data.get(host);
    }
    
    #findObject(host, url) {
        for (let object of this.getHostListFromKey(host)) {
            if (object.urlIsCompatible(url))
                return object;
        }
        return undefined;
    }
    
    #getHost(url) {
        let urlPieces = dissectUrl(url);
        if (urlPieces === undefined)
            return
        return urlPieces.host;
    }
    
    getList() {
        // Returns stored objects as list
        let objectList = [];
        for (let host of this.#data.values())
            for (let object of host) {
                objectList.push(object);
            }
        return objectList;
    }
    
}

export {HtmlContainer}