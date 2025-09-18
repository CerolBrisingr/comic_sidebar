class ReaderSort {
    #possibleRules;
    #rule;

    constructor(strRule) {
        this.#possibleRules = {
            Name: compareLabels,
            URL: compareUrls,
            Oldest: compareAgeUp,
            Latest: compareAgeDown
        };
        this.setRule(strRule);
    }

    setRule(strRule) {
        if (!this.#possibleRules.hasOwnProperty(strRule))
            throw new Error(`Invalid sorting rule "${strRule}"`);
            this.#rule = this.#possibleRules[strRule];
    }

    apply(readerStorageList) {
        return readerStorageList.sort(this.#rule);
    }
}

function compareLabels(a, b) {
    a = a.getLabel();
    b = b.getLabel();
    return compareLower(a,b);
}

function compareUrls(a, b) {
    a = a.getPrefixMasks()[0];
    b = b.getPrefixMasks()[0];
    return compareLower(a,b);
}

function compareAgeUp(a, b) {
    let result = compare(a.getLatestInputTime(), b.getLatestInputTime())
    if (result === 0) // Secondary sort by label
        result = compareLower(a.getLabel(), b.getLabel());
    return result;
}

function compareAgeDown(a, b) {
    let result = compare(b.getLatestInputTime(), a.getLatestInputTime())
    if (result === 0) // Secondary sort by label
        result = compareLower(a.getLabel(), b.getLabel());
    return result;
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

class SortSelector {
    #btnToggle;
    #optionBox;
    #ruleButtons = {};
    #doFilter = false;
    #isOpen = false;
    #clickFilterFcn;
    #updateFcn;

    constructor(sortUi) {
        this.#btnToggle = sortUi.btnToggle;
        this.#optionBox = sortUi.optionBox;
        this.#configureButtons(sortUi);
        this.#setSortingCheckmarks("Name");
        this.setOnClickFilter();
    }

    setOnClickFilter(fcnOnClick) {
        if (typeof fcnOnClick !== "function") {
            fcnOnClick = () => {};
        }
        this.#clickFilterFcn = fcnOnClick;
    }

    triggerOnClickFilter() {
        this.#clickFilterFcn(this.#doFilter);
    }

    setOnUpdate(fcnOnUpdate) {
        if (typeof fcnOnUpdate !== "function") {
            fcnOnClick = () => {};
        }
        this.#updateFcn = fcnOnUpdate;
    }

    #triggerUpdateFcn(strRule) {
        this.#updateFcn(strRule);
    }

    #configureButtons(sortUi) {
        this.#btnToggle.onclick = (evt) => {
            if (this.#isOpen) {
                this.#close();
            } else {
                this.#open();
            }
        };
        this.#btnToggle.onblur = (evt) => {this.#onblur(evt);};
        this.#setUpRuleBtn(sortUi.name, "Name");
        this.#setUpRuleBtn(sortUi.url, "URL");
        this.#setUpRuleBtn(sortUi.latest, "Latest");
        this.#setUpRuleBtn(sortUi.oldest, "Oldest");
        this.#setUpFilterBtn(sortUi.filter);
    }

    #open() {
        this.#isOpen = true;
        this.#optionBox.style.display = "flex";
    }

    #close() {
        this.#isOpen = false;
        this.#optionBox.style.display = "none";
    }

    #setUpRuleBtn(element, strRule) {
        element.button.onclick = () => {this.#setRule(strRule);};
        element.button.onblur = (evt) => {this.#onblur(evt);};
        this.#ruleButtons[strRule] = element;
    }

    #setUpFilterBtn(filter) {
        filter.button.onclick = () => {
            this.#doFilter = !this.#doFilter;
            this.triggerOnClickFilter();
            this.#close();
        };
        filter.button.onblur = (evt) => {
            this.#onblur(evt);
        };
    }

    #onblur(evt) {
        if (!relatedTargetOnDropdown(evt.relatedTarget)) 
            this.#close();
    }

    #setRule(strRule) {
        this.#setSortingCheckmarks(strRule);
        this.#triggerUpdateFcn(strRule);
        this.#close();
    }

    #setSortingCheckmarks(strRule) {
        for (const [key, entry] of Object.entries(this.#ruleButtons)) {
            if (key === strRule) {
                entry.icon.style.visibility = "visible";
            } else {
                entry.icon.style.visibility = "hidden";
            }
        }
    }

}

function relatedTargetOnDropdown(relTarget) {
    if (relTarget === null)
        return false;
    if (relTarget.classList.contains("dropdown_option"))
        return true;
    if (relTarget.classList.contains("dropdown_divider"))
        return true;
    return false;
}

export {ReaderSort, SortSelector}