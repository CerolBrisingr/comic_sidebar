import { dissectUrl } from "./url.js";

class HtmlContainer {
    #hostMap = new Map();
    
    constructor() {}

    saveObject(object) {
        // Bonus: get getPrefixMasks() out of here
        let urlList = object.getPrefixMasks();
        let copyId = 1;
        for (let url of urlList) {
            this.#storeObjectUsingUrl(object, url, copyId);
            copyId += 1;
        }
    }

    findConflictsWith(newReaderData) {
        // TODO: find implementation
        // Bonus: implement without deep knowledge, 
        //        keep implementation information out of this
        return [];
    }

    #storeObjectUsingUrl(object, url, copyId) {
        let host = getHost(url);
        if (host === undefined) {
            return false;
        }
        if (this.#findObject(host, url) !== undefined) {
            return false;
        }
        if (this.#hostMap.has(host)) {
            let array = this.#hostMap.get(host);
            array.push(new StorageContainer(object, copyId));
        } else {
            this.#hostMap.set(host, [new StorageContainer(object, copyId)]);
        }
    }

    keys() {
        return Array.from(this.#hostMap.keys());
    }
    
    clearData() {
        this.#hostMap.clear();
    }

    removeObject(urlList) {
        // TODO: remove [] once it's actually a list
        for (let url of [urlList]) {
            this.#removeObjectUsing(url);
        }
    }
    
    #removeObjectUsing(url) {
        let host = getHost(url);
        if (host === undefined) {
            console.log('Could not find valid host for given input');
            return;
        }
        let list = this.#hostMap.get(host);
        if (list === undefined) {
            console.log('Object selected for removal was not found');
            return;
        }
        for (let [index, object] of list.entries()) {
            if (object.respondsToIdentification(url)) {
                list.splice(index, 1);
                break;
            }
        }
        if (list.length === 0) {
            this.#hostMap.delete(host);
        }
    }
    
    getObject(url) {
        let host = getHost(url);
        if (host === undefined) {
            return undefined;
        }
        return this.#findObject(host, url);
    }

    getCargoListForUrl(url) {
        let host = getHost(url);
        if (host === undefined) {
            return [];
        }
        return this.getCargoListForHost(host);
    }

    getCargoListForHost(host) {
        const containerList = this.#getContainerListForHost(host);
        // Turn containers into cargo list
        let output = [];
        for (let container of containerList) {
            output.push(container.getCargo());
        }
        return output;
    }

    #getContainerListForHost(host) {
        if (!this.#hostMap.has(host)) {
            return [];
        }
        return this.#hostMap.get(host);
    }
    
    #findObject(host, url) {
        for (let container of this.#getContainerListForHost(host)) {
            if (container.respondsToIdentification(url))
                return container.getCargo();
        }
        return undefined;
    }
    
    getList() {
        // Returns stored objects as list
        let allObjects = [];
        for (let containerListForOneKey of this.#hostMap.values())
            for (let container of containerListForOneKey) {
                if (container.isFirst()) {
                    allObjects.push(container.getCargo());
                }
            }
        return allObjects;
    }
    
}

class StorageContainer {
    #cargo;
    #copyId;    // If it's > 1, it's an alias

    constructor(cargo, copyId) {
        this.#cargo = cargo;
        this.#copyId = copyId;
    }

    respondsToIdentification(identification) {
        return this.#cargo.urlIsCompatible(identification);
    }

    isFirst() {
        return this.#copyId < 2;
    }

    getCargo() {
        return this.#cargo;
    }
}

function getHost(url) {
    let urlPieces = dissectUrl(url);
    if (urlPieces === undefined)
        return
    return urlPieces.host;
}

export {HtmlContainer}