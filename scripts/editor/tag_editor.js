class TagEditor {
    #readerData;
    #container;
    #tags;
    #addTagButton;
    #createInterface;
    #tagBuilder;

    constructor(readerData) {
        this.#readerData = readerData;
        let tagData = this.#readerData.getTags();
        let editorInterface = new EditorInterface(this);
        this.#setUpTags(tagData, editorInterface);
        this.#setUpTagAdder(tagData, editorInterface);
    }

    #setUpTags(tagData, editorInterface) {
        this.#container = document.getElementById("reader_tags");
        this.#tags = [];
        for (let tag of tagData) {
            this._addTagObject(editorInterface, tag);
        }
    }

    #setUpTagAdder(tagData, editorInterface) {
        // For now: just button to add a new tag (id: tag_add_button)
        // later: dropdown menu with "add tag" and all existing tags that are not listed yet
        this.#addTagButton = document.getElementById("tag_add_button");
        this.#addTagButton.addEventListener("click", () => {
            this.#tagBuilder = new TagCreator(editorInterface);
        })
    }

    removeCreateInterface() {
        if (this.#createInterface !== undefined) {
            this.#container.removeChild(this.#createInterface);
            this.#createInterface = undefined;
        }
    }

    installCreateInterface(createInterface) {
        this.removeCreateInterface();
        this.#createInterface = createInterface;
        let objects = [createInterface].concat(...this.#container.children);
        this.#container.replaceChildren(...objects);
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

    removeCreateInterface() {
        this.#tagEditor.removeCreateInterface();
    }

    addCreateInterface(createButton) {
        this.#tagEditor.installCreateInterface(createButton);
    }

    removeTag(tagObject) {
        return this.#tagEditor._removeTag(tagObject);
    }
}

class TagCreator {
    #editorInterface;
    #ui;

    constructor(editorInterface) {
        this.#editorInterface = editorInterface;
        this.#createUi();
        this.#editorInterface.addCreateInterface(this.#ui);
    }

    #createUi() {
        // div class: tag_create_div
        this.#ui = document.createElement("div");
        this.#ui.classList.add("tag_create_div");

        //   text input class: tag_create_edit
        let input = document.createElement("input");
        input.type = "text";
        input.classList.add("tag_create_edit");
        this.#ui.appendChild(input);

        let cancel = this.#createButton("../../icons/cross.svg");
        this.#ui.appendChild(cancel);
        cancel.addEventListener('click', () => {
            this.#editorInterface.removeCreateInterface();
        })

        let create = this.#createButton("../../icons/plus.svg");
        this.#ui.appendChild(create);
        create.addEventListener('click', () => {
            this.#editorInterface.removeCreateInterface();
        })

        return this.#ui;
    }

    #createButton(image_path) {
        //   tag cancel button class: tag_create_button
        //      cancel button image class: tag_create_image, cross.svg
        //   tag create button class: tag_create_button
        //      create button image class: tag_create_image, plus.svg
        let button = document.createElement("button");
        button.classList.add("tag_create_button");

        let image = document.createElement("img");
        image.classList.add("tag_create_image");
        image.src = image_path;
        button.appendChild(image);

        return button;
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