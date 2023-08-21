import { ListeningPort } from "../background/listening_port.js";
import { SubscriberPort } from "../sidebar/subscriber_port.js";

class FavIcons {
    _data = new Map();
    _defaultEntry;

    constructor() {
        this._defaultEntry = {src: "../../icons/globe.svg", id: 0};
    }

    async initialize() {
        await this._readStorage();
    }

    getValue(key) {
        if (!this._data.has(key)) {
            this._data.set(key, this._defaultEntry);
            this._updateStorage();
        }
        return this._data.get(key);
    }

    updateValue() {
        throw new Error("must be implemented");
    }

    async _updateStorage() {}
}
class FavIconController extends FavIcons {
    #broadcast;

    constructor() {
        super();
        this.#broadcast = new ListeningPort((message) => {
            this.#receive(message);
        }, "fav_icons");
    }

    #receive(message) {
        console.log(message);
    }

    async initialize(originUrlList) {
        super().initialize();
        this._removeUnneededEntries(originUrlList);
        this._createMissingEntries(originUrlList);
        await this._updateStorage();
    }

    updateValue(key, value) {
        // Tries to update data below key
        // Returns new entry id on success,
        // returns -1 if same value is already set;
        let entry = this._data.get(key);
        if (value === entry.src) {
            return -1;
        }
        if (value === undefined) {
            this._data.set(key, this._defaultEntry);
            this._updateStorage();
            return this._defaultEntry.id;
        }
        entry.id = (entry.id + 1) % 250;
        entry.src = value;
        this._data.set(key, entry);
        return entry.id;
    }

    _createMissingEntries(originUrlList) {
        for (const url of originUrlList) {
            if (!this._data.has(url))
                this._data.set(url, this._defaultEntry);
        }
    }

    _removeUnneededEntries(originUrlList) {
        for (const key of this._data.keys()) {
            if (!originUrlList.includes(key))
                this._data.delete(key);
        }
    }

    async _readStorage() {
        const favIconData = await browser.storage.local.get("favIconData");
        if (!favIconData.hasOwnProperty("favIconData")) {
            this._data = new Map();
            return
        }
        const objects = JSON.parse(favIconData.favIconData);
        this._data = new Map(Object.entries(objects));
    }

    async _updateStorage() {
        const jsonFromData = JSON.stringify(Object.fromEntries(this._data));
        await browser.storage.local.set({favIconData: jsonFromData});
    }
}

class FavIconSubscriber {
    #receiver;

    constructor() {
        super();
        this.#receiver = new SubscriberPort((message) => {
            this.#receive(message);
        }, "fav_icons");
    }

    #receive(message) {
        console.log(message);
    }

    updateValue(key, value, id) {
        let entry = {scr: value, id: id};
        this._data.set(key, entry);
    }

}

export {FavIconController, FavIconSubscriber}