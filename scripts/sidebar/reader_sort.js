class ReaderSort {
    static #rule = "Name";
    static #possible_rules = ["Name", "URL"];

    static setRule(strRule) {
        if (!ReaderSort.#possible_rules.includes(strRule))
            throw new Error(`Invalid sorting rule "${strRule}"`);
            ReaderSort.#rule = strRule;
    }

    static apply(readerStorageList) {
        let sortFcn;
        switch (ReaderSort.#rule) {
            case "Name": {
                sortFcn = (a,b) => {return compare(a.getLabel(), b.getLabel());};
                break;
            }
            case "URL": {
                sortFcn = (a,b) => {return compare(a.getPrefixMask(), b.getPrefixMask());};
                break;
            }
        }
        return readerStorageList.sort(sortFcn);
    }
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
    #btnToggle;
    #btnName;
    #btnUrl;

    constructor(fcnUpdate, btnToggle, btnName, btnUrl) {
        this.#fcnUpdate = fcnUpdate;
        this.#btnToggle = btnToggle; // sticking to hover for now
        this.#btnName = btnName;
        this.#btnUrl = btnUrl;
        this.#configureButtons();
    }

    #configureButtons() {
        this.#btnName.onclick = () => {
            ReaderSort.setRule("Name");
            this.#fcnUpdate();
        };
        this.#btnUrl.onclick = () => {
            ReaderSort.setRule("URL");
            this.#fcnUpdate();
        };
    }

}

export {ReaderSort, SortControls}