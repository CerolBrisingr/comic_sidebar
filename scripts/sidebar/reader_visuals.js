import {ReaderLine, AutoBookmarkLine, ManualBookmarkLine} from "./reader_lines.js"
class ReaderVisuals {
    #managerInterface;
    #listing;

    #readerLine;
    #bookmarkContainer;
    #manualBookmarkLines = [];
    
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
    
    updateListing(readerData) {
        this.#listing.replaceChildren();
        this.#addReaderLine(readerData.getLabel());
        this.updateReaderUrls(readerData);
    }

    #addReaderLine(readerLabel) {
        this.#readerLine = new ReaderLine(this.#managerInterface, readerLabel);
        this.#readerLine.appendTo(this.#listing);
        this.#bookmarkContainer = this.#readerLine.getBookmarkContainer();
    }
    
    updateReaderUrls(readerData) {
        this.#bookmarkContainer.replaceChildren();
        this.#manualBookmarkLines.length = 0;
        let prefix = readerData.getPrefixMask();
        this.#addBookmarks(prefix, readerData.getAutomaticBookmarks(), "auto");
        this.#addBookmarks(prefix, readerData.getPinnedBookmarks(), "manual");
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
    
    #addBookmarks(prefix, bookmarkList, strMeta) {
        for (let bookmark of bookmarkList) {
            let bookmarkLine;
            if (strMeta === "manual") {
                bookmarkLine = new ManualBookmarkLine(this.#managerInterface, bookmark, prefix);
                this.#manualBookmarkLines.push(bookmarkLine);
            } else {
                bookmarkLine = new AutoBookmarkLine(this.#managerInterface, bookmark, prefix);
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

export {ReaderVisuals}