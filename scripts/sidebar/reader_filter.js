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

export {ReaderFilter}