class FavIcons {
    _data = new Map();
    _defaultEntry;

    constructor() {
        this._defaultEntry = "../../icons/reader.svg";
    }

    async initialize(originUrlList) {
        await this.#readStorage();
        this.#removeUnneededEntries(originUrlList);
        this.#createMissingEntries(originUrlList);
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

    setValue(key, value) {
        let entry = this._data.get(key);
        if (value === entry) {
            return false;
        }
        if (value === undefined) {
            this._data.set(key, this._defaultEntry);
            return true;
        }
        this._data.set(key, value);
        return true;
        
    }

    updateValue(key, value) {
        // Tries to update favIcon data for key
        // Returns true on success
        // Returns false if same value is already set
        // Returns false if key does not exist
        let entry = this._data.get(key);
        if (entry === undefined) {
            return false;
        }
        if (value === undefined) {
            this._data.set(key, this._defaultEntry);
            return true;
        }
        if (value === entry) {
            return false;
        }
        this._data.set(key, value);
        return true;
    }

    #createMissingEntries(originUrlList) {
        for (const url of originUrlList) {
            if (!this._data.has(url))
                this._data.set(url, this._defaultEntry);
        }
    }

    #removeUnneededEntries(originUrlList) {
        for (const key of this._data.keys()) {
            if (!originUrlList.includes(key))
                this._data.delete(key);
        }
    }

    async #readStorage() {
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
    #imageAdjuster = new ImageAdjuster();

    constructor() {
        super();
    }

    async initialize(originUrlList) {
        await super.initialize(originUrlList);
        await this._updateStorage();
    }

    async setValue(key, favIcon) {
        favIcon = await this.#imageAdjuster.apply(favIcon);
        let info = {didSet: super.setValue(key, favIcon), favIcon: favIcon};
        if (info.didSet) {
            this._updateStorage();
        }
        return info;
    }

    async updateValue(key, favIcon) {
        favIcon = await this.#imageAdjuster.apply(favIcon);
        let info = {hasUpdate: super.updateValue(key, favIcon), favIcon: favIcon};
        if (info.hasUpdate) {
            this._updateStorage();
        }
        return info;
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

    async setValue(key, favIcon) {
        let info = {didSet: super.setValue(key, favIcon), favIcon: favIcon};
        return info;
    }

    async updateValue(key, favIcon) {
        let info = {hasUpdate: super.updateValue(key, favIcon), favIcon: favIcon};
        return info;
    }

}

class ImageAdjuster {
    #canvas;
    #ctx;
    #targetHeight = 16;
    #targetWidth = 16;

    constructor() {
        this.#canvas = document.createElement('canvas');
        this.#ctx = this.#canvas.getContext('2d');
    }

    async apply(favIcon) {
        if (favIcon === undefined) {
            return favIcon;
        }
        if (!favIcon.startsWith("data:image")) {
            console.log(`Not scaling "${favIcon}"`);
            return favIcon;
        }

        let image = new Image();
        image.src = favIcon;
        await image.decode();

        if (image.naturalWidth == image.naturalHeight) {
            favIcon = this.#treatSquare(favIcon, image);
        } else if (image.naturalWidth > image.naturalHeight) {
            favIcon = this.#treatWideImage(favIcon, image);
        } else {
            favIcon = this.#treatHighImage(favIcon, image);
        }
        return favIcon;
    }

    #treatSquare(value, image) {
        if (image.naturalHeight <= this.#targetHeight) {
            return value;
        }
        return this.#returnDims(image, this.#targetWidth, this.#targetHeight);
    }

    #treatWideImage(value, image) {
        if (image.naturalWidth <= this.#targetWidth) {
            return value;
        }
        let individualHeight = this.#targetHeight * image.naturalWidth / this.#targetWidth;
        return this.#returnDims(image, this.#targetWidth, individualHeight);
    }

    #treatHighImage(value, image) {
        if (image.naturalHeight <= this.#targetHeight) {
            return value;
        }
        let individualWidth = this.#targetWidth * image.naturalHeight / this.#targetHeight;
        return this.#returnDims(image, individualWidth, this.#targetHeight);
    }

    #returnDims(image, width, height) {
        this.#canvas.width = width;
        this.#canvas.height = height;
        this.#ctx.drawImage(image, 0, 0, width, height);
        return this.#canvas.toDataURL();
    }
}

async function displaySize(data, strTitle) {
    let image = new Image();
    image.src = data;
    await image.decode();
    console.log(`Image ${strTitle}: ${image.naturalWidth} x ${image.naturalHeight}`);
}

export {FavIconController, FavIconSubscriber, ImageAdjuster}