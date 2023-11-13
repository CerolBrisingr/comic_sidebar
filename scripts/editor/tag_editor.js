class TagEditor {
    #readerData;
    #container;
    #tagBuilder = new TagCreatorDummy();
    #tags;
    #addTagButton;
    #myInterface;

    constructor(readerData) {
        this.#readerData = readerData;
        let tagData = this.#readerData.getTags();
        this.#myInterface = new EditorInterface(this);
        this.#setUpTags(tagData);
        this.#setUpTagAdder(tagData);
        this.updateTagContainer();
    }

    #setUpTags(tagData) {
        this.#container = document.getElementById("reader_tags");
        this.#tags = [];
        for (let tag of tagData) {
            this.#addTagObject(tag);
        }
    }

    #setUpTagAdder(tagData) {
        // For now: just button to add a new tag (id: tag_add_button)
        // later: dropdown menu with "add tag" and all existing tags that are not listed yet
        this.#addTagButton = document.getElementById("tag_add_button");
        this.#addTagButton.addEventListener("click", () => {
            this.#tagBuilder = new TagCreator(this.#myInterface);
            this.updateTagContainer();
        });
    }

    removeCreateInterface() {
        this.#tagBuilder = new TagCreatorDummy();
    }

    updateTagContainer() {
        let list = [this.#addTagButton];
        if (this.#tagBuilder.isValid())
            list.push(this.#tagBuilder.getUi());
        for (let tag of this.#tags) {
            list.push(tag.getUi());
        }
        this.#container.replaceChildren(...list);
    }

    removeTag(tagObject) {
        let wasRemoved = this.#readerData.removeTag(tagObject.getString());
        let iFound = this.#tags.indexOf(tagObject);
        if (iFound === -1)
            return false;
        this.#tags.splice(iFound, 1);
        return wasRemoved;
    }

    addTag(tagString) {
        let addedTag = this.#readerData.addTag(tagString);
        if (addedTag !== "") {
            // addTag() will return emtpy string if rejected
            this.#addTagObject(addedTag);
            return true;
        }
        return false;
    }

    #addTagObject(tagString) {
        this.#tags.push(new TagObject(this.#myInterface, tagString));
    }
}

class EditorInterface {
    #tagEditor;

    constructor(tagEditor) {
        this.#tagEditor = tagEditor;
    }

    removeCreateInterface() {
        this.#tagEditor.removeCreateInterface();
        this.#tagEditor.updateTagContainer();
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
            // Next: add new tag UI in any case
            if (this.#editorInterface.createTag(input.value))
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

export {TagEditor}