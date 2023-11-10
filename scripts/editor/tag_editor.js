class TagEditor {
    #readerData;
    #container;
    #tags;

    constructor(readerData) {
        this.#readerData = readerData;
        let tagData = this.#readerData.getTags();
        this.#setUpTags(tagData);
        this.#setUpTagAdder(tagData);
    }

    #setUpTags(tagData) {
        this.#container = document.getElementById("reader_tags");
        this.#tags = [];
        let editorInterface = new EditorInterface(this);
        for (let tag of tagData) {
            this._addTagObject(editorInterface, tag);
        }
    }

    #setUpTagAdder(tagData) {
        // For now: just button to add a new tag (id: tag_add_button)
        // later: dropdown menu with "add tag" and all existing tags that are not listed yet
    }

    _removeTag(tagObject) {
        let wasRemoved = this.#readerData.removeTag(tagObject.getString());
        let iFound = this.#tags.indexOf(tagObject);
        if (iFound === -1)
            return false;
        this.#tags.splice(iFound, 1);
        return wasRemoved;
    }

    _addTagObject(editorInterface, tagString) {
        this.#tags.push(new TagObject(editorInterface, tagString));
    }
}

class EditorInterface {
    #tagEditor;

    constructor(tagEditor) {
        this.#tagEditor = tagEditor;
    }

    removeTag(tagObject) {
        return this.#tagEditor._removeTag(tagObject);
    }
}

class TagCreator {
    #editorInterface;

    constructor(edtorInterface) {
        this.#editorInterface = this.#editorInterface;
    }

    #createUi() {
        // div class: tag_create_div
        //   text input class: tag_create_edit
        //   tag cancel button class: tag_create_button
        //      cancel button image class: tag_create_image, cross.svg
        //   tag create button class: tag_create_button
        //      create button image class: tag_create_image, plus.svg
    }
}

class TagObject {
    #tagString;
    #editorInterface;

    constructor(editorInterface, tagString) {
        this.#editorInterface = editorInterface;
        this.#tagString = tagString;
    }

    #createUi() {
        // div class: tag_div
        //    div without class, just tagString
        //    image with class: tag_remove_image, cross-circle.svg + hover?
    }

    remove() {
        this.#editorInterface.removeTag(this);
    }

    getString() {
        return this.#tagString;
    }
}

export {TagEditor}