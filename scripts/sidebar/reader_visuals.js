import {dissectUrl, openUrlInMyTab} from "../shared/url.js"
import {BookmarkButton} from "./bookmark_button.js"

class ReaderVisuals {
    #parentInterface;
    #listing;
    #bookmarkList;
    #bookmarkButtonList = [];
    
    constructor(readerData, parentInterface) {
        this.#parentInterface = parentInterface;
        this.#createListing();
        this.updateListing(readerData);
    }
    
    #createListing() {
        this.#listing = document.createElement("li");
        this.#listing.classList.add('comic_listing');
    }
    
    getListing() {
        return this.#listing;
    }
    
    updateListing(readerData) {
        this.#listing.replaceChildren();
        this.#createBaseLink(readerData.getLabel());
        this.#addEditReaderButton();
        this.#addExpandReaderButton();
        this.#createBookmarkList(readerData.getPrefixMask());
        this.updateReaderUrls(readerData);
        
        this.#enableBookmarkExpansion();
    }
    
    #createBaseLink(readerLabel) {
        this.baseLink = Object.assign(document.createElement("a"), {href:"#", innerText:readerLabel});
        this.baseLink.onclick = () => {
            openUrlInMyTab(this.baseLink.href);
            return false;
            }
        this.#listing.appendChild(this.baseLink);
    }
    
    #addEditReaderButton() {
        let editButton = createSettingsButton();
        this.#listing.appendChild(editButton);
        editButton.onclick = () => {
            this.#parentInterface.prepareReaderEdit();
        }
    }
    
    #addExpandReaderButton() {
        let expandInterface = createImgButton("../../icons/chevron_right.svg");
        this.expandIcon = expandInterface.img;
        this.expandButton = expandInterface.button;
        this.expandButton.classList.add('first_button');
        this.#listing.appendChild(this.expandButton);
    }
    
    #createBookmarkList(parentElement, myId) {
        this.#bookmarkList = Object.assign(document.createElement("ul"), {id:encodeURI(myId)});
        this.#listing.appendChild(this.#bookmarkList);
    }
    
    updateReaderUrls(readerData) {
        this.#bookmarkList.replaceChildren();
        this.#addBookmarks(readerData, readerData.getAutomaticBookmarks(), "auto");
        this.#addBookmarks(readerData, readerData.getPinnedBookmarks(), "manual");
        this.#updateBaseLink(readerData);
    }
    
    #updateBaseLink(readerData) {
        let automaticBookmarks = readerData.getAutomaticBookmarks();
        if (automaticBookmarks.length == 0) {
            this.baseLink.href = "#";
            return;
        }
        let lastAutomatic = automaticBookmarks.slice(-1);
        this.baseLink.href = lastAutomatic[0].href;
    }
    
    #addBookmarks(readerData, bookmarkList, strMeta) {
        this.#bookmarkButtonList.length = 0;
        for (let bookmark of bookmarkList) {
            let prefix = readerData.getPrefixMask(); 
            let bookmarkButton = new BookmarkButton(
                bookmark, prefix, strMeta, this.#parentInterface);
            if (!bookmarkButton.isValid())
                return;
            let bookmarkObject = buildBookmarkObject(bookmarkButton);
            if (strMeta === "manual") {
                bookmarkObject.appendChild(this.#createEditBookmarkButton(bookmarkButton));
                bookmarkObject.appendChild(this.#createUnpinUrlButton(bookmark));
                this.#bookmarkButtonList.push(bookmarkButton);
            } else {
                bookmarkObject.appendChild(this.#createPinUrlButton(bookmark));
                
            }
            this.#bookmarkList.appendChild(bookmarkObject);
        }
    }
    
    updateManualLabel(url, newLabel) {
        for (let bookmarkButton of this.#bookmarkButtonList) {
            if (bookmarkButton.linkMatches(url))
                bookmarkButton.updateLabel(newLabel);
        }
    }
    
    #createEditBookmarkButton(bookmarkButton) {
        let editButton = createEditButton();
        editButton.onclick = () => {
            bookmarkButton.editButtonClicked();
        }
        return editButton;
    }
    
    #createPinUrlButton(bookmark) {
        let pinButton = createPinButton();
        pinButton.onclick = () => {
            this.#parentInterface.requestPinBookmark(bookmark);
        }
        return pinButton;
    }
    
    #createUnpinUrlButton(bookmark) {
        let pinButton = createUnPinButton();
        pinButton.onclick = () => {
            this.#parentInterface.requestUnpinBookmark(bookmark);
        }
        return pinButton;
    }
    
    expand () {
        this.#bookmarkList.classList.add('visible');
        this.expandIcon.src = "../../icons/chevron_down.svg";
    }
    
    collapse () {
        this.#bookmarkList.classList.remove('visible');
        this.expandIcon.src = "../../icons/chevron_right.svg";
    }
    
    #enableBookmarkExpansion() {
            this.expandButton.onclick = () => {
            if (this.#bookmarkList.classList.contains('visible')) {
                this.collapse();
            } else {
                this.expand();
            }
        }
    }
}

function createSettingsButton() {
    let editButton = createImgButton('../../icons/settings.svg');
    editButton.button.classList.add('second_button');
    return editButton.button;
}

function createEditButton() {
    let editButton = createImgButton('../../icons/edit.svg');
    editButton.button.classList.add('second_button');
    return editButton.button;
}

function createPinButton() {
    let pinButton = createImgButton('../../icons/pin_fill.svg');
    pinButton.button.classList.add('first_button');
    return pinButton.button;
}

function createUnPinButton() {
    let pinButton = createImgButton('../../icons/pin_slash.svg');
    pinButton.button.classList.add('first_button');
    return pinButton.button;
}

function createImgButton(source) {
    let imgButton = document.createElement("button");
    imgButton.classList.add("icon_button");
    
    let pic = document.createElement("img");
    pic.src = source;
    pic.classList.add("icon");
    imgButton.appendChild(pic);
    
    return {button: imgButton, img: pic};
}

function buildBookmarkObject(bookmarkButton) {
    let listEntry = document.createElement("li");
    listEntry.appendChild(bookmarkButton.getHtmlRoot());
    return listEntry;
}

export {ReaderVisuals}