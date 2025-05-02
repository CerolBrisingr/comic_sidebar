import { dissectUrl } from "./url.js";

class HtmlContainer {
    #hostMap = new Map();
    #debug = true;
    
    constructor() {}

    saveObject(object, urlList) {
        let copyId = 1;
        for (let url of urlList) {
            this.#storeObjectUsingUrl(object, url, copyId);
            copyId += 1;
        }
        this.#logState("save object");
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
        this.#logState("clear data");
    }

    removeObject(urlList) {
        // urlList can be single URL whitout list
        if (!Array.isArray(urlList)) {
            this.#removeObjectUsing(urlList);
            return;
        }
        // otherwise treat each list member individually
        for (let url of urlList) {
            this.#removeObjectUsing(url);
        }
        this.#logState("remove object");
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
        this.#logState("get cargo list");
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

    #logState(origin) {
        if (!this.#debug) return;
        console.log(`Debugging storage via "${origin}"`);
        // Returns stored objects as list
        console.log(`Number of base urls in storage: ${this.#hostMap.size}`);
        for (let [host, containerListForOneKey] of this.#hostMap) {
            console.log(`   ${containerListForOneKey.length} elements for "${host}"`);
            for (let container of containerListForOneKey) {
                if (container.isFirst()) {
                    console.log("    1 Primary Key");
                } else {
                    console.log("    1 Secondary Key");
                }
            }
        }
        return;
    }

    setDebugLogging(state) {
        this.#debug = Boolean(state);
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
    // Encapsulates each cargo element
    // Allows to keep track of copy counts
    #cargo;
    #copyId;    // If it's > 1, it's an alias object

    constructor(cargo, copyId) {
        this.#cargo = cargo;
        this.#copyId = copyId;
    }

    respondsToIdentification(identification) {
        // TODO: establish this call during init
        //       -> get rid of implementation knowledge
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