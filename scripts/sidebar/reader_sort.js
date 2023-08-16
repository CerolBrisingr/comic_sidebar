class ReaderSort {
    static #rule = "Name";
    static #possible_rules = ["Name", "URL", "Time"];

    static setRule(strRule) {
        if (!ReaderSort.#possible_rules.includes(strRule))
            throw new Error(`Invalid sorting rule "${strRule}"`);
            ReaderSort.#rule = strRule;
    }

    static apply(readerStorageList) {
        let sortFcn;
        switch (ReaderSort.#rule) {
            case "Name": {
                sortFcn = (a,b) => {return compareLower(a.getLabel(), b.getLabel());};
                break;
            }
            case "URL": {
                sortFcn = (a,b) => {return compareLower(a.getPrefixMask(), b.getPrefixMask());};
                break;
            }
            case "Time": {
                sortFcn = (a,b) => {return compare(a.getLatestInputTime(), b.getLatestInputTime());};
                break;
            }
        }
        return readerStorageList.sort(sortFcn);
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
    #btnToggle;
    #btnName;
    #btnUrl;
    #btnTime;

    constructor(fcnUpdate, btnToggle, btnName, btnUrl, btnTime) {
        this.#fcnUpdate = fcnUpdate;
        this.#btnToggle = btnToggle; // sticking to hover for now
        this.#btnName = btnName;
        this.#btnUrl = btnUrl;
        this.#btnTime = btnTime;
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
        this.#btnTime.onclick = () => {
            ReaderSort.setRule("Time");
            this.#fcnUpdate();
        }
    }

}

export {ReaderSort, SortControls}