import {dissectUrl, openUrlInMyTab} from "./url.js"
import {BookmarkButton} from "./bookmark_button.js"

class ComicVisuals {
    #managerInterface;
    
    constructor(comicData, managerInterface) {
        this.#createListing();
        this.updateListing(comicData);
        this.#managerInterface = managerInterface;
    }
    
    #createListing() {
        this.listing = document.createElement("li");
        this.listing.classList.add('comic_listing');
    }
    
    updateListing(comicData) {
        this.listing.replaceChildren();
        this.#createBaseLink(comicData.label);
        this.#addEditComicButton();
        this.#addExpandComicButton();
        this.#createBookmarkList(comicData.base_url);
        this.updateComicUrls(comicData);
        
        this.#enableBookmarkExpansion();
    }
    
    #createBaseLink(comicLabel) {
        this.baseLink = Object.assign(document.createElement("a"), {href:"#", innerText:comicLabel});
        this.baseLink.onclick = () => {
            openUrlInMyTab(this.baseLink.href);
            return false;
            }
        this.listing.appendChild(this.baseLink);
    }
    
    #addEditComicButton() {
        let editButton = createEditButton();
        this.listing.appendChild(editButton);
        editButton.onclick = () => {
            this.#managerInterface.editComic();
        }
    }
    
    #addExpandComicButton() {
        this.expandButton = createSvgButton('M0.3,0.1 0.3,0.9 0.8,0.5z');
        this.expandButton.setAttribute("aria-expanded",false);
        this.expandButton.classList.add('first_button');
        this.listing.appendChild(this.expandButton);
    }
    
    #createBookmarkList(parentElement, myId) {
        this.bookmarkList = Object.assign(document.createElement("ul"), {id:encodeURI(myId)});
        this.listing.appendChild(this.bookmarkList);
    }
    
    updateComicUrls(comicData) {
        this.bookmarkList.replaceChildren();
        this.#addBookmarks(comicData, comicData.automatic, "auto");
        this.#addBookmarks(comicData, comicData.manual, "manual");
        this.#updateBaseLink(comicData);
    }
    
    #updateBaseLink(comicData) {
        if (comicData.automatic.length == 0) {
            this.baseLink.href = "#";
            return;
        }
        let lastAutomatic = comicData.automatic.slice(-1);
        this.baseLink.href = lastAutomatic[0].href;
    }
    
    #addBookmarks(comicData, bookmarkList, strMeta) {
        for (let bookmark of bookmarkList) {
            let prefix = comicData.base_url; 
            let bookmarkButton = new BookmarkButton(bookmark, prefix, strMeta);
            if (!bookmarkButton.isValid())
                return;
            let bookmarkObject = buildBookmarkObject(bookmarkButton);
            if (strMeta === "manual") {
                bookmarkObject.appendChild(this.#createEditBookmarkButton(bookmarkButton));
                bookmarkObject.appendChild(this.#createUnpinUrlButton(bookmark));
            } else {
                bookmarkObject.appendChild(this.#createPinUrlButton(bookmark));
                
            }
            this.bookmarkList.appendChild(bookmarkObject);
        }
    }
    
    #createEditBookmarkButton(bookmarkButton) {
        let editButton = createEditButton();
        editButton.onclick = () => {
            bookmarkButton.edit();
        }
        return editButton;
    }
    
    #createPinUrlButton(bookmark) {
        let pinButton = createPinButton();
        pinButton.onclick = () => {
            this.#managerInterface.pinBookmark(bookmark);
        }
        return pinButton;
    }
    
    #createUnpinUrlButton(bookmark) {
        let pinButton = createPinButton();
        pinButton.onclick = () => {
            this.#managerInterface.unpinBookmark(bookmark);
        }
        return pinButton;
    }
    
    expand () {
        this.bookmarkList.classList.add('visible');
        this.expandButton.setAttribute('aria-expanded', 'true');
    }
    
    collapse () {
        this.bookmarkList.classList.remove('visible');
        this.expandButton.setAttribute('aria-expanded', 'false');
    }
    
    #enableBookmarkExpansion() {
            this.expandButton.onclick = () => {
            if (this.bookmarkList.classList.contains('visible')) {
                this.collapse();
            } else {
                this.expand();
            }
        }
    }
}

function createEditButton() {
    let editButton = createSvgButton('M0.1,0.1 0.9,0.1 0.1,0.9 0.9,0.9z');
    editButton.classList.add('svg_button');
    editButton.classList.add('second_button');
    return editButton;
}

function createPinButton() {
    let pinButton = createSvgButton('M0.3,0.9 0.9,0.3 0.7,0.1z');
    pinButton.classList.add('svg_button');
    pinButton.classList.add('first_button');
    return pinButton;
}

function createSvgButton(pathString, viewBox='0 0 1 1') {
    let svgButton = document.createElement("button");
    
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, "viewBox", viewBox);
    svgButton.appendChild(svg);
    
    let path = document.createElementNS('http://www.w3.org/2000/svg', "path");
    path.setAttributeNS(null, "d", pathString);
    svg.append(path);
    
    return svgButton;
}

function buildBookmarkObject(bookmarkButton) {
    let listEntry = document.createElement("li");
    listEntry.appendChild(bookmarkButton.getHtmlRoot());
    return listEntry;
}

export {ComicVisuals}