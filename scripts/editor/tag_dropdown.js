class TagDropdown {
    #editorInterface;
    #knownTags;
    #fktOpenTagCreator;
    #fktCreateTag;
    #openDropdown;
    #createNew;
    #divider;
    #optionsBox;
    #ui;
    #isOpen = false;

    constructor(editorInterface, knownTags, fktOpenTagCreator, fktCreateTag) {
        this.#editorInterface = editorInterface;
        this.#knownTags = knownTags;
        this.#fktOpenTagCreator = fktOpenTagCreator;
        this.#fktCreateTag = fktCreateTag;
        this.#setUpUi();
        this.#setUpDivider();
        this.#setUpCreateNew();
        this.#setUpOptionsBox();
        this.#setUpDropdownButton();
    }

    #setUpUi() {
        this.#ui = document.getElementById("tag_add_ui");
    }

    #setUpDivider() {
        this.#divider = document.getElementById("divider_to_suggestions");
        this.#divider.onblur = (evt) => {this.#onblur(evt)};
    }

    #setUpDropdownButton() {
        this.#openDropdown = document.getElementById("tag_add_button");
        this.#openDropdown.onclick = () => {
            if (this.#isOpen) {
                this.#close();
            } else {
                this.#updateDropdown();
                this.#open();
            }
        };
        this.#openDropdown.onblur = (evt) => {this.#onblur(evt)};
    }

    #setUpOptionsBox() {
        this.#optionsBox = document.getElementById("dropdown_option_box");
    }

    #setUpCreateNew() {
        this.#createNew = document.getElementById("start_dropdown_creator");
        this.#createNew.onclick = () => {
            this.#fktOpenTagCreator();
            this.#close();
        };
    }

    #updateDropdown() {
        // Adjust content
        let list = [this.#createNew];
        let suggestions = this.#gatherSuggestions();
        if (suggestions.length > 0)
            list.push(this.#divider);
        for (let suggestion of suggestions) {
            list.push(this.#buildSuggestion(suggestion));
        }
        this.#optionsBox.replaceChildren(...list);

        // Adjust position
        let rectButton = this.#openDropdown.getBoundingClientRect();
        let rectUi = this.#ui.getBoundingClientRect();
        this.#optionsBox.style.top = (rectButton.top + rectButton.height) + "px";
        this.#optionsBox.style.right = (window.innerWidth - rectUi.right - rectButton.width) + "px";
    }

    #gatherSuggestions() {
        let list = [];
        let usedTags = this.#editorInterface.listTags();
        for (let tag of this.#knownTags) {
            if (!usedTags.includes(tag))
                list.push(tag);
        }
        return list;
    }

    #buildSuggestion(suggestionText) {
        let suggestion = document.createElement("button");
        suggestion.classList.add("dropdown_option");

        suggestion.onclick = () => {
            this.#fktCreateTag(suggestionText);
            this.#close();
        };

        let label = document.createElement("div");
        label.classList.add("dropdown_label");
        label.innerText = suggestionText;
        suggestion.appendChild(label);
        return suggestion;
    }

    #onblur(evt) {
        if (!relatedTargetOnDropdown(evt.relatedTarget)) 
            this.#close();
    }

    #open() {
        this.#isOpen = true;
        this.#optionsBox.style.display = "flex";
    }

    #close() {
        this.#isOpen = false;
        this.#optionsBox.style.display = "none";
    }

    getUi() {
        return this.#ui;
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

export {TagDropdown}
