class TagData {
    #tags;

    constructor(tagData) {
        this.#tags = new Set();
        this.update(tagData);
    }

    update(tagData) {
        this.#tags.clear();
        if (tagData === undefined)
            return;
        if (!Array.isArray(tagData))
            return;
        for (let tag of tagData) {
            this.addTag(tag);
        }
    }

    removeTag(tag) {
        return this.#tags.delete(tag);
    }

    addTag(tag) {
        if (typeof tag !== "string")
            return "";
        tag = tag.trim();
        if (tag === "untagged")
            return "";
        if (tag === "")
            return "";
        if (this.#tags.has(tag))
            return "";
        this.#tags.add(tag);
        return tag;
    }

    getTags() {
        return Array.from(this.#tags);
    }
}

export { TagData }