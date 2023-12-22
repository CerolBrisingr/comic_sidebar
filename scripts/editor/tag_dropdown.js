class TagDropdown {
    _usedTagsManager;
    _knownTags = [];
    _fktCreateTag;
    _openDropdown;
    _optionsBox;
    _ui;
    _isOpen = false;

    constructor(usedTagsManager, fktCreateTag) {
        this._usedTagsManager = usedTagsManager;
        this._fktCreateTag = fktCreateTag;
        this._setUpUi();
        this._setUpOptionsBox();
        this._setUpDropdownButton();
    }

    _setUpUi() {
        this._ui = document.getElementById("tag_add_ui");
    }

    _setUpDropdownButton() {
        this._openDropdown = document.getElementById("tag_add_button");
        this._openDropdown.onclick = () => {
            if (this._isOpen) {
                this._close();
            } else {
                this._updateDropdown();
                this._open();
            }
        };
        this._openDropdown.onblur = (evt) => {this._onblur(evt)};
    }

    _setUpOptionsBox() {
        this._optionsBox = document.getElementById("dropdown_option_box");
    }

    _updateDropdown() {
        this._adjustDropdownContent();
        this._adjustDropdownPosition();
    }

    _adjustDropdownContent() {
        throw new Error("Missing implementation");
    }

    _adjustDropdownPosition() {
        let rectButton = this._openDropdown.getBoundingClientRect();
        let rectUi = this._ui.getBoundingClientRect();
        this._optionsBox.style.top = (window.scrollY + rectButton.top + rectButton.height) + "px";
        this._optionsBox.style.right = this._getOffsetRight(rectUi, rectButton);
    }

    _getOffsetRight(rectUi, rectButton) {
        return (window.innerWidth - rectUi.right - rectButton.width) + "px";
    }

    _gatherSuggestions() {
        let list = [];
        let usedTags = this._usedTagsManager.listTags();
        for (let tag of this._knownTags) {
            if (!usedTags.includes(tag))
                list.push(tag);
        }
        return list;
    }

    _buildSuggestion(suggestionText) {
        let suggestion = document.createElement("button");
        suggestion.classList.add("dropdown_option");

        suggestion.onclick = () => {
            this._fktCreateTag(suggestionText);
            this._close();
        };

        let label = document.createElement("div");
        label.classList.add("dropdown_label");
        label.innerText = suggestionText;
        suggestion.appendChild(label);
        return suggestion;
    }

    _onblur(evt) {
        if (!relatedTargetOnDropdown(evt.relatedTarget)) 
            this._close();
    }

    _open() {
        this._isOpen = true;
        this._optionsBox.style.display = "flex";
    }

    _close() {
        this._isOpen = false;
        this._optionsBox.style.display = "none";
    }

    getUi() {
        return this._ui;
    }
}

class TagDropdownEditor extends TagDropdown {
    _divider;
    _createNew;
    _fktOpenTagCreator;

    constructor(editorInterface, knownTags, fktOpenTagCreator, fktCreateTag) {
        super(editorInterface, fktCreateTag);
        this._fktOpenTagCreator = fktOpenTagCreator;
        this._setUpDivider();
        this._setUpCreateNew();
        this._knownTags = knownTags;
    }

    _setUpDivider() {
        this._divider = document.getElementById("divider_to_suggestions");
        this._divider.onblur = (evt) => {this._onblur(evt);};
    }

    _setUpCreateNew() {
        this._createNew = document.getElementById("start_dropdown_creator");
        this._createNew.onclick = () => {
            this._fktOpenTagCreator();
            this._close();
        };
    }

    _adjustDropdownContent() {
        let list = [this._createNew];
        let suggestions = this._gatherSuggestions();
        if (suggestions.length > 0)
            list.push(this._divider);
        for (let suggestion of suggestions) {
            list.push(this._buildSuggestion(suggestion));
        }
        this._optionsBox.replaceChildren(...list);
    }

}

class TagDropdownFilter extends TagDropdown {
    _placeholder;

    constructor(usedTagsManager, fktCreateTag) {
        // usedTagsManager.listAllKnownTags();  All tags of all readers
        // usedTagsManager.listTags();      Tags that are already listed
        super(usedTagsManager, fktCreateTag);
        this._setUpPlaceholder();
    }

    _updateDropdown() {
        this._knownTags = this._usedTagsManager.listAllKnownTags();
        super._updateDropdown();
    }
    
    _setUpPlaceholder() {
        this._placeholder = document.getElementById("placeholder_for_suggestions");
        this._placeholder.onblur = (evt) => {this._onblur(evt);};
        this._placeholder.onclick = () => {this._close();};
    }

    _getOffsetRight(rectUi, rectButton) {
        return "0px";
    }

    _adjustDropdownContent() {
        let suggestions = this._gatherSuggestions();
        if (suggestions.length == 0) {
            this._optionsBox.replaceChildren(this._placeholder);
            return;
        }
        let list = [];
        for (let suggestion of suggestions) {
            list.push(this._buildSuggestion(suggestion));
        }
        this._optionsBox.replaceChildren(...list);
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

export {TagDropdownEditor, TagDropdownFilter}
