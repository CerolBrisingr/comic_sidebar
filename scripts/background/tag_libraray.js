class TagLibrary {
    // Keep track of used tags and the number of readers that use them
    #tagMap;
    #isFine = true;

    constructor() {
        this.#tagMap = new Map();
    }

    isFine() {
        return this.#isFine;
    }

    registerTags(readerData) {
        for (let tag of readerData.getTags()) {
            this.#registerTag(tag);
        }
    }

    retractTags(readerData) {
        for (let tag of readerData.getTags()) {
            this.#retractTag(tag);
        }
    }

    clear() {
        this.#tagMap.clear();
        this.#isFine = true;
    }

    getUsedTags() {
        return Array.from(this.#tagMap.keys());
    }

    getCorrespondingValues() {
        return Array.from(this.#tagMap.values());
    }

    #registerTag(tagString) {
        let count;
        if (this.#tagMap.has(tagString)) {
            count = this.#tagMap.get(tagString);
        } else {
            count = 0;
        }
        this.#tagMap.set(tagString, count + 1);
    }

    #retractTag(tagString) {
        if (!this.#tagMap.has(tagString)) {
            this.#errorExist();
            return;
        }
        let count = this.#tagMap.get(tagString);
        if (count <= 0)
            this.#errorCount();
        if (count <= 1) {
            this.#tagMap.delete(tagString);
            return;
        }
        this.#tagMap.set(tagString, count - 1);
    }

    #errorExist() {
        console.log("Tags: Tried to retract a tag that is not registered");
        this.#isFine = false;
    }

    #errorCount() {
        console.log("Tags: Tried to retract a tag that was unexpectedly registerd with 0 occurencies");
        this.#isFine = false;
    }
}

export {TagLibrary}
