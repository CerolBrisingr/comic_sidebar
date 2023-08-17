class ReaderSort {
    static #possible_rules = {
        Name: compareLabels,
        URL: compareUrls,
        Oldest: compareAgeUp,
        Latest: compareAgeDown
    };
    static #rule = ReaderSort.#possible_rules.Name;

    static setRule(strRule) {
        if (!ReaderSort.#possible_rules.hasOwnProperty(strRule))
            throw new Error(`Invalid sorting rule "${strRule}"`);
            ReaderSort.#rule = ReaderSort.#possible_rules[strRule];
    }

    static apply(readerStorageList) {
        return readerStorageList.sort(ReaderSort.#rule);
    }
}

function compareLabels(a, b) {
    a = a.getLabel();
    b = b.getLabel();
    return compareLower(a,b);
}

function compareUrls(a, b) {
    a = a.getPrefixMask();
    b = b.getPrefixMask();
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

class SortControls {
    #btnToggle;
    #optionBox;
    #fcnUpdate;
    #ruleButtons = {};
    #isOpen = false;

    constructor(fcnUpdate, btnToggle, optionBox, name, url, latest, oldest) {
        this.#btnToggle = btnToggle;
        this.#optionBox = optionBox;
        this.#fcnUpdate = fcnUpdate;
        this.#configureButtons(name, url, latest, oldest);
        this.#setCheckmarks("Name");
    }

    #configureButtons(name, url, latest, oldest) {
        this.#btnToggle.onclick = (evt) => {
            if (this.#isOpen) {
                this.#close();
            } else {
                this.#open();
            }
        };
        this.#btnToggle.onblur = (evt) => {this.#onblur(evt);};
        this.#setUpRuleBtn(name, "Name");
        this.#setUpRuleBtn(url, "URL");
        this.#setUpRuleBtn(latest, "Latest");
        this.#setUpRuleBtn(oldest, "Oldest");
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

    #onblur(evt) {
        if (!relatedTargetOnDropdown(evt.relatedTarget)) 
            this.#close();
    }

    #setRule(strRule) {
        this.#setCheckmarks(strRule);
        ReaderSort.setRule(strRule);
        this.#fcnUpdate();
        this.#close();
    }

    #setCheckmarks(strRule) {
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
}

export {ReaderSort, SortControls}