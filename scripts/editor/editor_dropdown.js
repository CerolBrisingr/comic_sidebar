class EditorDropdown {
    #editorInterface;
    #knownTags;
    #fktOpenTagCreator;
    #fktCreateTag;
    #createNew;
    #optionsBox;
    #ui;

    constructor(editorInterface, knownTags, fktOpenTagCreator, fktCreateTag) {
        this.#editorInterface = editorInterface;
        this.#knownTags = knownTags;
        this.#fktOpenTagCreator = fktOpenTagCreator;
        this.#fktCreateTag = fktCreateTag;
        this.#ui = document.getElementById("tag_add_ui");
        this.#setUpCreateNew();
        this.#setUpOptionsBox();
        this.#setUpDropdownButton();
    }

    #setUpDropdownButton() {
        let button = document.getElementById("tag_add_button");
        button.onclick = () => {
            this.#updateDropdown();
            this.#open();
        };
        button.onblur = (evt) => {this.#onblur(evt)};
    }

    #setUpOptionsBox() {
        this.#optionsBox = document.getElementById("dropdown_option_box");
    }

    #setUpCreateNew() {
        let button = document.getElementById("start_dropdown_creator");
        button.onclick = () => {
            this.#fktOpenTagCreator();
            this.#close();
        };
    }

    #updateDropdown() {

    }

    #onblur(evt) {
        if (!relatedTargetOnDropdown(evt.relatedTarget)) 
            this.#close();
    }

    #open() {
        this.#optionsBox.style.display = "flex";
    }

    #close() {
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

export {EditorDropdown}
