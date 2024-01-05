class TagFilter {
    #tagEditor;

    constructor(tagEditor) {
        this.#tagEditor = tagEditor;
    }

    fits(readerManager) {
        const readerTags = readerManager.getTags();
        const tags = this.#tagEditor.getTags();
        if (tags.length === 0)
            return true;
        for (const tag of tags) {
            if (readerTags.includes(tag))
                return true;
        }
    }
}

export {TagFilter}