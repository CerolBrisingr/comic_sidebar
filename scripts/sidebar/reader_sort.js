class ReaderSort {
    static #possible_rules = {
        Name: (a,b) => {return compareLower(a.getLabel(), b.getLabel());},
        URL: (a,b) => {return compareLower(a.getPrefixMask(), b.getPrefixMask());},
        Latest: (a,b) => {return compare(a.getLatestInputTime(), b.getLatestInputTime());},
        Oldest: (b,a) => {return compare(a.getLatestInputTime(), b.getLatestInputTime());}
    };
    static #rule = ReaderSort.#possible_rules.Name;

    static setRule(strRule) {
        console.log(strRule);
        if (!ReaderSort.#possible_rules.hasOwnParameter(strRule))
            throw new Error(`Invalid sorting rule "${strRule}"`);
            ReaderSort.#rule = ReaderSort.#possible_rules[strRule];
    }

    static apply(readerStorageList) {
        return readerStorageList.sort(ReaderSort.#rule);
    }
}

function compareLower(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return compare(a,b);
}

function compare(a, b) {
    if (a > b)
        return 1;
    if (a == b)
        return 0;
    return -1;
}

class SortControls {
    #fcnUpdate;
    #btnName;
    #btnUrl;
    #btnLatest;
    #btnOldest;

    constructor(fcnUpdate, btnName, btnUrl, btnLatest, btnOldest) {
        this.#fcnUpdate = fcnUpdate;
        this.#btnName = btnName;
        this.#btnUrl = btnUrl;
        this.#btnLatest = btnLatest;
        this.#btnOldest = btnOldest;
        this.#configureButtons();
    }

    #configureButtons() {
        this.#btnName.onclick = () => {
            this.#setRule("Name");
        };
        this.#btnUrl.onclick = () => {
            this.#setRule("URL");
        };
        this.#btnLatest.onclick = () => {
            this.#setRule("Latest");
        };
        this.#btnOldest.onclick = () => {
            this.#setRule("Oldest");
        };
    }

    #setRule(strRule) {
        console.log("clicked!");
        ReaderSort.setRule(strRule);
        this.#fcnUpdate();
    }

}

export {ReaderSort, SortControls}