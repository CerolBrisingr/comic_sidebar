import {ReaderLine, AutoBookmarkLine, ManualBookmarkLine} from "./reader_lines.js"
class ReaderVisuals {
    #managerInterface;
    #listing;

    #readerLine;
    #bookmarkContainer;
    #manualBookmarkLines = [];

    static makePreview(readerData) {
        return new ReaderVisuals(readerData, new InterfaceDummy());
    }
    
    constructor(readerData, managerInterface) {
        this.#managerInterface = managerInterface;
        this.#createListing();
        this.updateListing(readerData);
    }
    
    #createListing() {
        this.#listing = document.createElement("div");
        this.#listing.classList.add('comic_listing');
    }
    
    getListing() {
        return this.#listing;
    }
    
    updateListing(readerData, favIcon=undefined) {
        this.#listing.replaceChildren();
        this.#addReaderLine(readerData.getLabel(), favIcon);
        this.updateReaderUrls(readerData);
    }

    updateFavIcon(src) {
        this.#readerLine.updateFavIcon(src);
    }

    getFavIcon() {
        return this.#readerLine.getFavIcon();
    }

    #addReaderLine(readerLabel, favIcon) {
        this.#readerLine = new ReaderLine(this.#managerInterface, readerLabel, favIcon);
        this.#readerLine.appendTo(this.#listing);
        this.#bookmarkContainer = this.#readerLine.getBookmarkContainer();
    }

    updateLabelOnly(label) {
        this.#readerLine.setLabel(label);
    }
    
    updateReaderUrls(readerData) {
        this.#bookmarkContainer.replaceChildren();
        this.#manualBookmarkLines.length = 0;
        let siteRecognition = readerData.getRecognitionInterface();
        this.#addBookmarks(siteRecognition, readerData.getAutomaticBookmarks(), "auto");
        this.#addBookmarks(siteRecognition, readerData.getPinnedBookmarks(), "manual");
        this.#updateBaseLink(readerData);
    }
    
    #updateBaseLink(readerData) {
        let automaticBookmarks = readerData.getAutomaticBookmarks();
        if (automaticBookmarks.length == 0) {
            this.#readerLine.setLink("#");
            return;
        }
        let lastAutomatic = automaticBookmarks.slice(-1);
        this.#readerLine.setLink(lastAutomatic[0].href);
    }
    
    #addBookmarks(recognitionInterface, bookmarkList, strMeta) {
        for (let bookmark of bookmarkList) {
            let bookmarkLine;
            if (strMeta === "manual") {
                bookmarkLine = new ManualBookmarkLine(this.#managerInterface, bookmark, recognitionInterface);
                this.#manualBookmarkLines.push(bookmarkLine);
            } else {
                bookmarkLine = new AutoBookmarkLine(this.#managerInterface, bookmark, recognitionInterface);
            }
            bookmarkLine.appendTo(this.#bookmarkContainer);
        }
    }
    
    updateManualLabel(url, newLabel) {
        for (let bookmarkLine of this.#manualBookmarkLines) {
            if (bookmarkLine.linkMatches(url))
                bookmarkLine.updateLabel(newLabel);
        }
    }
    
    expand () {
        this.#readerLine.expand();
    }
    
    collapse () {
        this.#readerLine.collapse();
    }
}

class InterfaceDummy {
    saveProgress() {}
    prepareReaderEdit() {}
    requestPinBookmark() {}
    requestUnpinBookmark() {}
    requestBookmarkLabelUpdate() {}
}

export {ReaderVisuals}