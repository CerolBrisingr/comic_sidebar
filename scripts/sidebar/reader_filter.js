class ReaderFilter {
    #filter;

    constructor(strFilter) {
        this.setFilter(strFilter);
    }

    setFilter(strFilter) {
        strFilter.trim();
        if (strFilter === "")
            this.#filter = undefined;
        this.#filter = strFilter.toLowerCase();
    }

    fits(item) {
        if (this.#filter === undefined)
            return true;
        let label = item.getLabel().toLowerCase();
        return label.includes(this.#filter);
    }
}

class TagFilter {
    _tagEditor;

    constructor(tagEditor) {
        this._tagEditor = tagEditor;
    }

    fits(readerManager) {
        const readerTags = readerManager.getTags();
        const tags = this._tagEditor.getTags();
        if (tags.length === 0)
            return true;
        for (const tag of tags) {
            if (readerTags.includes(tag))
                return true;
        }
    }
}

export {ReaderFilter, TagFilter}