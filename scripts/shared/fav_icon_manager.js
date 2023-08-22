class FavIcons {
    _data = new Map();
    _defaultEntry;

    constructor() {
        this._defaultEntry = "../../icons/globe.svg";
    }

    async initialize() {
        await this._readStorage();
    }

    entries() {
        return this._data.entries();
    }

    getValue(key) {
        if (!this._data.has(key)) {
            this._data.set(key, this._defaultEntry);
            this._updateStorage();
        }
        return this._data.get(key);
    }

    updateValue(key, value) {
        // Tries to update favIcon data for key
        // Returns true on success
        // Returns false if same value is already set
        let entry = this._data.get(key);
        if (value === undefined) {
            this._data.set(key, this._defaultEntry);
            this._updateStorage();
            return true;
        }
        if (value === entry) {
            return false;
        }
        this._data.set(key, value);
        return true;
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

    async _updateStorage() {}
}
class FavIconController extends FavIcons {

    constructor() {
        super();
    }

    async initialize(originUrlList) {
        super.initialize();
        this._removeUnneededEntries(originUrlList);
        this._createMissingEntries(originUrlList);
        await this._updateStorage();
    }

    updateValue(key, value) {
        if (super.updateValue(key, value)) {
            this._updateStorage();
            return true;
        }
        return false;
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

    async _updateStorage() {
        const jsonFromData = JSON.stringify(Object.fromEntries(this._data));
        await browser.storage.local.set({favIconData: jsonFromData});
    }
}

class FavIconSubscriber extends FavIcons {

    constructor() {
        super();
    }

}

export {FavIconController, FavIconSubscriber}