import { TagDropdownEditor, TagDropdownFilter } from "./tag_dropdown.js";
import { TagData } from "../shared/tag_data.js";

class TagEditor {
    _tagData;
    _container;
    _tagBuilder = new TagCreatorDummy();
    _tags;
    _addTagUi;

    _myInterface;

    constructor(tagData) {
        this._tagData = tagData;
    }

    _setUpTags(tagData) {
        this._container = document.getElementById("reader_tags");
        this._tags = [];
        for (let tag of tagData) {
            this._addTagObject(tag);
        }
    }

    _setUpTagAdder() {
        throw new Error("not implemented!");
    }

    getTags() {
        return this._tagData.getTags();
    }

    removeCreateInterface() {
        this._tagBuilder = new TagCreatorDummy();
    }

    updateTagContainer() {
        let list = [this._addTagUi.getUi()];
        if (this._tagBuilder.isValid())
            list.push(this._tagBuilder.getUi());
        for (let tag of this._tags) {
            list.push(tag.getUi());
        }
        this._container.replaceChildren(...list);
    }

    removeTag(tagObject) {
        let wasRemoved = this._tagData.removeTag(tagObject.getString());
        let iFound = this._tags.indexOf(tagObject);
        if (iFound === -1)
            return false;
        this._tags.splice(iFound, 1);
        return wasRemoved;
    }

    addTag(tagString) {
        let addedTag = this._tagData.addTag(tagString);
        if (addedTag !== "") {
            // addTag() will return emtpy string if rejected
            this._addTagObject(addedTag);
            return true;
        }
        return false;
    }

    _addTagObject(tagString) {
        let nTags = this._tags.length;
        if (nTags === 0) {
            this._tags.push(new TagObject(this._myInterface, tagString));
            return;
        } 
        let slot = SlotFinder.findTagSlot(tagString, this._tags);
        this._addTagObjectInSlot(tagString, slot);
    }

    _addTagObjectInSlot(tagString, slot) {
        let newTag = new TagObject(this._myInterface, tagString);
        this._tags.splice(slot, 0, newTag);
    }

}

class TagEditorEditor extends TagEditor {

    constructor(readerData, knownTags) {
        super(readerData);
        this._myInterface = new EditorInterface(this);
        this._setUpTags(this.getTags());
        this._setUpTagAdder(knownTags);
        this.updateTagContainer();
    }

    _setUpTagAdder(knownTags) {
        this._addTagUi = new TagDropdownEditor(
            this._myInterface, 
            knownTags, 
            () => {this._startTagCreator();}, 
            (tag) => {
                this.addTag(tag);
                this.updateTagContainer();
                }
            );
    }

    _startTagCreator() {
        this._tagBuilder = new TagCreator(this._myInterface);
        this.updateTagContainer();
        this._tagBuilder.select();
    }
}

class TagEditorFilter extends TagEditor {

    constructor(tagLibrary) {
        super(new TagData);
        this._myInterface = new EditorInterface(this, tagLibrary);
        this._setUpTags(this.getTags());
        this._setUpTagAdder();
        this.updateTagContainer();
    }

    _setUpTagAdder() {
        this._addTagUi = new TagDropdownFilter(
            this._myInterface, 
            (tag) => {
                this.addTag(tag);
                this.updateTagContainer();
                }
            );
    }

}

class SlotFinder {
    static findTagSlot(tagString, tags) {
        tagString = tagString.toLowerCase();
        let [firstCandidate, lastCandidate] = SlotFinder._fastSearch(tagString, tags);
        return SlotFinder._slowSearch(tagString, tags, firstCandidate, lastCandidate);
    }

    static _fastSearch(tagString, tags) {
        let start = 0;
        let last = tags.length - 1;
        while ((last - start) >= 2) {
            let center = SlotFinder._getCenter(start, last);
            if (SlotFinder._isAfter(tagString, tags[center])) {
                start = center + 1;
            } else {
                last = center - 1;
            }
        }
        return [start, last];
    }

    static _slowSearch(tagString, tags, start, last) {
        for (let id = start; id <= last; id++) {
            if (!SlotFinder._isAfter(tagString, tags[id])) {
                return id;
            }
        }
        return last + 1;
    }

    static _getCenter(a, b) {
        return Math.floor((a + b) / 2);
    }

    static _isAfter(tagString, tag) {
        return tagString > tag.getString().toLowerCase();
    }
}

class EditorInterface {
    #tagEditor;
    #tagLibrary;

    constructor(tagEditor, tagLibrary) {
        this.#tagEditor = tagEditor;
        this.#tagLibrary = tagLibrary;
    }

    removeCreateInterface() {
        this.#tagEditor.removeCreateInterface();
        this.#tagEditor.updateTagContainer();
    }

    listTags() {
        return this.#tagEditor.getTags();
    }

    listAllKnownTags() {
        if (this.#tagLibrary !== undefined) {
            return this.#tagLibrary.getKnownTags();
        } else {
            return [];
        }
    }

    createTag(tagString) {
        let canCreate = this.#tagEditor.addTag(tagString);
        if (canCreate)
            this.#tagEditor.updateTagContainer();
        return canCreate;
    }

    removeTag(tagObject) {
        let canRemove = this.#tagEditor.removeTag(tagObject);
        if (canRemove)
            this.#tagEditor.updateTagContainer();
        return canRemove;
    }
}

class TagCreatorDummy {
    isValid() {
        return false;
    }
}

class TagCreator {
    #editorInterface;
    #ui;
    #input;

    constructor(editorInterface) {
        this.#editorInterface = editorInterface;
        this.#createUi();
    }

    isValid() {
        return true;
    }

    #createUi() {
        // div class: tag_create_div
        this.#ui = document.createElement("div");
        this.#ui.classList.add("tag_create_div");

        //   text input class: tag_create_edit
        this.#input = document.createElement("input");
        this.#input.type = "text";
        this.#input.classList.add("tag_create_edit");
        this.#ui.appendChild(this.#input);

        let cancel = this.#createButton("../../icons/cross.svg");
        this.#ui.appendChild(cancel);
        cancel.addEventListener('click', () => {
            this._doCancel();
        })

        let create = this.#createButton("../../icons/plus.svg");
        this.#ui.appendChild(create);
        create.addEventListener('click', () => {
            this._tryCreate(this.#input.value);
        })

        this.#ui.addEventListener("keyup", ({key}) => {
            switch (key) {
                case "Enter":
                    this._tryCreate(this.#input.value);
                    break;
                case "Escape":
                    this._doCancel();
                    break;
            }
        });

        return this.#ui;
    }

    _doCancel() {
        this.#editorInterface.removeCreateInterface();
    }

    _tryCreate(tagString) {
        if (this.#editorInterface.createTag(tagString))
            this.#editorInterface.removeCreateInterface();
    }

    select() {
        this.#input.select();
    }

    #createButton(image_path) {
        //   tag cancel button class: tag_create_button
        //      cancel button image class: tag_create_image, cross.svg
        //   tag create button class: tag_create_button
        //      create button image class: tag_create_image, plus.svg
        let button = document.createElement("button");
        button.classList.add("tag_creator_button");

        let image = document.createElement("img");
        image.classList.add("tag_create_image");
        image.src = image_path;
        button.appendChild(image);

        return button;
    }

    getUi() {
        return this.#ui;
    }
}

class TagObject {
    #tagString;
    #ui;
    #editorInterface;

    constructor(editorInterface, tagString) {
        this.#editorInterface = editorInterface;
        this.#tagString = tagString;
        this.#createUi();
    }

    #createUi() {
        // div class: tag_div
        this.#ui = document.createElement("div");
        this.#ui.classList.add("tag_div");

        //    div without class, just tagString
        let text = document.createElement("div");
        text.innerText = this.#tagString;
        this.#ui.appendChild(text);

        //    image with class: tag_remove_image, cross-circle.svg + hover?
        let button = this.#createRemoveButton();
        this.#ui.appendChild(button);
    }

    #createRemoveButton() {
        let button = document.createElement("img");
        button.src = "../../icons/cross-circle.svg";
        button.classList.add("tag_remove_image");

        button.addEventListener('click', () => {
            this.#editorInterface.removeTag(this);
        });

        button.addEventListener('mouseenter', () => {
            button.src = "../../icons/cross-circle-fill.svg";
        })

        button.addEventListener('mouseleave', () => {
            button.src = "../../icons/cross-circle.svg";
        })

        return button;
    }

    getUi() {
        return this.#ui;
    }

    remove() {
        this.#editorInterface.removeTag(this);
    }

    getString() {
        return this.#tagString;
    }
}

export {TagEditorEditor, TagEditorFilter, SlotFinder}