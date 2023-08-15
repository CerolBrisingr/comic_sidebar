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

export {ReaderFilter}