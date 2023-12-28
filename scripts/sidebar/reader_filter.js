class ReaderFilter {
    static #filter;

    static setFilter(strFilter) {
        strFilter.trim();
        if (strFilter === "")
            ReaderFilter.#filter = undefined;
        ReaderFilter.#filter = strFilter.toLowerCase();
    }

    static fits(item) {
        if (ReaderFilter.#filter === undefined)
            return true;
        let label = item.getLabel().toLowerCase();
        return label.includes(ReaderFilter.#filter);
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