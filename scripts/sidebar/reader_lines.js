import { openUrlInMyTab, dissectUrl } from "../shared/url.js";

class ReaderLine {
    #managerInterface;
    #settingsButton;
    #expandButton;
    #link;
    #frame;
    #bookmarkContainer;

    constructor(managerInterface, label) {
        this.#managerInterface = managerInterface;
        this.#buildFrame();

        this.#addExpandButton();
        this.#addLink(label);
        this.#addSettingsButton();

        this.#addBookmarkContainer();
        this.collapse();
    }

    #buildFrame() {
        this.#frame = buildLine();
        this.#frame.classList.add("reader");
    }

    #addExpandButton() {
        this.#expandButton = new IconButton("../../icons/chevron_right.svg", "icon_button_expand");
        this.#expandButton.appendTo(this.#frame);
        this.#expandButton.setOnClick( () => {
            this.#toggleExpand();
        });
    }

    #addLink(label) {
        this.#link = IconLink.getReader(label);
        this.#link.appendTo(this.#frame);
    }

    #addSettingsButton() {
        this.#settingsButton = new IconButton("../../icons/settings.svg");
        this.#settingsButton.appendTo(this.#frame);
        this.#settingsButton.setOnClick( () => {
            this.#managerInterface.prepareReaderEdit();
        } );
    }

    #addBookmarkContainer() {
        this.#bookmarkContainer = document.createElement("div");
        this.#frame.appendChild(this.#bookmarkContainer);
    }

    #toggleExpand() {
        if (this.#bookmarkContainer.classList.contains('no_draw')) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    setLink(href) {
        this.#link.setLink(href);
    }

    expand () {
        this.#bookmarkContainer.classList.remove('no_draw');
        this.#expandButton.setIcon("../../icons/chevron_down.svg");
    }

    collapse () {
        this.#bookmarkContainer.classList.add('no_draw');
        this.#expandButton.setIcon("../../icons/chevron_right.svg");
    }

    appendTo(target) {
        target.appendChild(this.#frame);
        target.appendChild(this.#bookmarkContainer);
    }

    getBookmarkContainer() {
        return this.#bookmarkContainer;
    }
}

class AutoBookmarkLine {
    #frame;
    #link;
    #pinButton;
    #bookmark;
    #managerInterface;

    constructor(managerInterface, bookmark, prefix) {
        this.#managerInterface = managerInterface;
        this.#bookmark = bookmark;
        this.#buildFrame();
        this.#addLink(bookmark.href, prefix);
        this.#addPinButton();
    }

    #buildFrame() {
        this.#frame = buildLine();
        this.#frame.classList.add("auto_bookmark");
    }

    #addLink(href, prefix) {
        this.#link = IconLink.getAutoBookmark(href, getBookmarkLabel(href, prefix));
        this.#link.appendTo(this.#frame);
    }

    #addPinButton() {
        this.#pinButton = new IconButton("../../icons/pin_fill.svg");
        this.#pinButton.appendTo(this.#frame);
        this.#pinButton.setOnClick( () => {
            this.#managerInterface.requestPinBookmark(this.#bookmark);
        });
    }

    appendTo(target) {
        target.appendChild(this.#frame);
    }
}

class ManualBookmarkLine {
    #frame;
    #managerInterface;
    #editLabel;
    #bookmark;
    #unPinButton;

    constructor(managerInterface, bookmark, prefix) {
        this.#managerInterface = managerInterface;
        this.#bookmark = bookmark;
        this.#buildFrame();

        this.#addEditLabel(prefix);
        this.#addUnPinButton();
    }

    #buildFrame() {
        this.#frame = buildLine();
        this.#frame.classList.add("manual_bookmark");
    }

    #addEditLabel(prefix) {
        this.#editLabel = new EditableLabel(this.#managerInterface, this.#bookmark, prefix);
        this.#editLabel.appendTo(this.#frame);
    }

    updateLabel(newValue) {
        this.#editLabel.updateLabel(newValue);
    }

    #addUnPinButton() {
        this.#unPinButton = new IconButton("../../icons/pin_slash.svg");
        this.#unPinButton.appendTo(this.#frame);
        this.#unPinButton.setOnClick( () => {
            this.#managerInterface.requestUnpinBookmark(this.#bookmark);
        });
    }

    linkMatches(url) {
        return (url === this.#bookmark.href);
    }

    getHtmlRoot() {
        return this.#frame;
    }

    appendTo(target) {
        target.appendChild(this.#frame);
    }
}

class EditableLabel {
    #managerInterface;
    #bookmark;
    #prefix;

    #container;
    #container_link;
    #container_edit;
    #link;
    #editButton;
    #input;

    constructor(managerInterface, bookmark, prefix) {
        this.#bookmark = bookmark;
        this.#prefix = prefix;
        this.#managerInterface = managerInterface;
        this.#buildContainers();
        this.#addLink();
        this.#addInput();
        this.#addEditButton();
    }

    #addLink() {
        this.#link = IconLink.getManualBookmark(this.#bookmark.href, this.#extractLabel());
        this.#link.addClass("labelled_link");
        this.#link.appendTo(this.#container_link);
    }

    #addInput() {
        let myEdit = document.createElement("input");
        myEdit.classList.add("label_input");
        myEdit.setAttribute("type", "text");
        myEdit.onkeydown = (event) => {
            if (event.key == "Enter") {
                this.#requestUpdate();
            }
            if (event.key == "Escape") {
                this.#showLabel();
            }
        }

        let img = document.createElement("img");
        img.src = "../../icons/bookmark-fill.svg";
        img.classList.add("bookmark_icon");
        
        this.#input = myEdit;
        this.#container_edit.appendChild(img);
        this.#container_edit.appendChild(this.#input);
    }

    #addEditButton() {
        this.#editButton = new IconButton("../../icons/edit.svg");
        this.#editButton.setOnClick( () => {
            this.#editButtonClicked();
        });
    }

    #editButtonClicked() {
        // Clicked once: start editor
        // Clicked again: apply changes
        if (this.#container_edit.classList.contains("no_draw")) {
            this.#showEditor();
            this.#input.select();
        } else {
            this.#requestUpdate();
        }
    }

    #showEditor() {
        this.#editButton.setIcon("../../icons/edit_squiggle.svg");
        this.#container_link.classList.add("no_draw");
        this.#container_edit.classList.remove("no_draw");
        this.#input.value = this.#bookmark.getLabel("< Edit Label Here >");
    }

    #showLabel() {
        this.#editButton.setIcon("../../icons/edit.svg");
        this.#container_link.classList.remove("no_draw");
        this.#container_edit.classList.add("no_draw");
    }
    
    #requestUpdate() {
        this.#showLabel();
        let newValue = this.#input.value;
        newValue.trim();
        if (newValue === this.#link.getLabel()) {
            console.log("Nothing changed, stepping out");
            return;
        }
        this.#managerInterface.requestBookmarkLabelUpdate(this.#bookmark, newValue);
    }

    #buildContainers() {
        this.#container = document.createElement("div");
        this.#container.classList.add("edit_link");
        this.#container_edit = document.createElement("div");
        this.#container_edit.classList.add("edit_link_editor");
        this.#container_edit.classList.add("no_draw");
        this.#container_link = document.createElement("div");
        this.#container_link.classList.add("edit_link_link");

        this.#container.appendChild(this.#container_edit);
        this.#container.appendChild(this.#container_link);
    }

    #extractLabel() {
        let linkPieces = dissectUrl(this.#bookmark.href, this.#prefix, true);
        return this.#bookmark.getLabel(linkPieces.tail);
    }

    updateLabel(newValue) {
        if (newValue == "") {
            this.#removeLabel();
            return;
        }
        this.#bookmark.setLabel(newValue);
        this.#link.setLabel(newValue);
        this.#managerInterface.saveProgress();
    }
    
    #removeLabel() {
        this.#bookmark.setLabel(undefined);
        this.#link.setLabel(this.#extractLabel());
    }

    appendTo(target) {
        target.appendChild(this.#container);
        this.#editButton.appendTo(target);
    }
}

class IconLink {
    #icon;
    #link;
    #label;

    static getReader(label) {
        let href = "#";
        let iconLink = new IconLink(href, label, "../../icons/globe.svg");
        iconLink.addImgClass("thumbnail_icon");
        return iconLink;
    }

    static getAutoBookmark(href, label) {
        let iconLink = new IconLink(href, label, "../../icons/bookmark.svg");
        iconLink.addImgClass("bookmark_icon");
        return iconLink;
    }

    static getManualBookmark(href, label) {
        let iconLink = new IconLink(href, label, "../../icons/bookmark-fill.svg");
        iconLink.addImgClass("bookmark_icon");
        return iconLink;
    }

    constructor(href, label, imgPath) {
        this.#link = document.createElement("a");
        this.#icon = document.createElement("img");
        this.#label = document.createElement("div");
        this.#link.appendChild(this.#icon);
        this.#link.appendChild(this.#label);

        this.#label.classList.add("gridline_label");

        this.#link.href = String(href);
        this.#link.onclick = () => {
            openUrlInMyTab(this.#link.href);
            return false;
            }

        this.#link.classList.add("undecorated_link")
        this.#label.innerText = String(label);

        this.#icon.src = String(imgPath);
    }

    setImg(imgPath) {
        this.#icon.src = String(imgPath);
    }

    addImgClass(strClass) {
        this.#icon.classList.add(String(strClass));
    }

    addLabelClass(strClass) {
        this.#label.classList.add(String(strClass));
    }

    addClass(strClass) {
        this.#link.classList.add(strClass);
    }

    removeClass(strClass) {
        this.#link.classList.remove(strClass);
    }

    setLabel(label) {
        this.#label.innerText = String(label);
    }

    getLabel() {
        return this.#label.innerText;
    }

    setLink(href) {
        this.#link.href = String(href);
    }

    appendTo(target) {
        target.appendChild(this.#link);
    }
}

class IconButton {
    #icon;
    #button;

    constructor(iconPath, buttonClass = "icon_button") {
        this.#button = document.createElement("button");
        this.#icon = document.createElement("img");
        this.#button.appendChild(this.#icon);

        this.#button.classList.add(buttonClass);

        this.#icon.src = String(iconPath);
        this.#icon.classList.add("button_icon");
    }

    setOnClick(fkt) {
        this.#button.onclick = fkt;
    }

    setIcon(iconPath) {
        this.#icon.src = iconPath;
    }

    appendTo(target) {
        target.appendChild(this.#button);
    }
}

function getBookmarkLabel(href, prefix) {
    let urlPieces = dissectUrl(href, prefix);
    return urlPieces.tail;
}

function buildLine() {
    let line = document.createElement("div");
    line.classList.add("gridline");
    return line;
}

export {ReaderLine, AutoBookmarkLine, ManualBookmarkLine}