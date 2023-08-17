class ReaderSort {
    static #possible_rules = {
        Name: (a,b) => {return compareLower(a.getLabel(), b.getLabel());},
        URL: (a,b) => {return compareLower(a.getPrefixMask(), b.getPrefixMask());},
        Oldest: (a,b) => {return compare(a.getLatestInputTime(), b.getLatestInputTime());},
        Latest: (b,a) => {return compare(a.getLatestInputTime(), b.getLatestInputTime());}
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
    #ruleButtons = [];
    #isOpen = false;

    constructor(fcnUpdate, btnToggle, optionBox, btnName, btnUrl, btnLatest, btnOldest) {
        this.#btnToggle = btnToggle;
        this.#optionBox = optionBox;
        this.#fcnUpdate = fcnUpdate;
        this.#configureButtons(btnName, btnUrl, btnLatest, btnOldest);
    }

    #configureButtons(btnName, btnUrl, btnLatest, btnOldest) {
        this.#btnToggle.onclick = (evt) => {
            if (this.#isOpen) {
                this.#close();
            } else {
                this.#open();
            }
        };
        this.#btnToggle.onblur = (evt) => {this.#onblur(evt);};
        this.#setUpRuleBtn(btnName, "Name");
        this.#setUpRuleBtn(btnUrl, "URL");
        this.#setUpRuleBtn(btnLatest, "Latest");
        this.#setUpRuleBtn(btnOldest, "Oldest");
    }

    #open() {
        this.#isOpen = true;
        this.#optionBox.style.display = "flex";
    }

    #close() {
        this.#isOpen = false;
        this.#optionBox.style.display = "none";
    }

    #setUpRuleBtn(btn, strRule) {
        btn.onclick = () => {this.#setRule(strRule);};
        btn.onblur = (evt) => {this.#onblur(evt);};
        this.#ruleButtons.push(btn);
    }

    #onblur(evt) {
        if (!relatedTargetOnDropdown(evt.relatedTarget)) 
            this.#close();
    }

    #setRule(strRule) {
        ReaderSort.setRule(strRule);
        this.#fcnUpdate();
        this.#close();
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