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
        console.log(this.getUsedTags());
        console.log(Array.from(this.#tagMap.values()));
    }

    retractTags(readerData) {
        for (let tag of readerData.getTags()) {
            this.#retractTag(tag);
        }
        console.log(this.getUsedTags());
        console.log(Array.from(this.#tagMap.values()));
    }

    recount(readerList) {
        this.#tagMap.clear();
        for (let readerData of readerList) {
            this.registerTags(readerData);
        }
    }

    getUsedTags() {
        return Array.from(this.#tagMap.keys());
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

    #retractTag(tag) {
        if (!this.#tagMap.has(tagString))
            this.#errorExist();
        let count = this.#tagMap.get(tagString);
        if (count <= 0)
            this.#errorCount();
        if (count <= 1)
            this.#tagMap.delete(tagString);
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
