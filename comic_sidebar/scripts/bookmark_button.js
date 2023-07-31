import {dissectUrl, openUrlInMyTab} from "./url.js"

class BookmarkButton {
    #container = undefined;
    #clickLink = undefined;
    
    constructor(bookmark, prefix, strMeta) {
        this.#buildLink(bookmark, prefix, strMeta);
        this.#buildContainer();
    }
    
    isValid() {
        return !(this.#container === undefined);
    }
    
    getHtmlRoot() {
        return this.#container;
    }
    
    #buildContainer() {
        if (this.#clickLink === undefined)
            return;
        this.#container = document.createElement("div");
        this.#container.appendChild(this.#clickLink);
    }

    #buildLink(bookmark, prefix, strMeta) {
        let myHref = encodeURI(bookmark.href);
        let linkPieces = dissectUrl(bookmark.href, prefix, true);
        if (linkPieces === undefined)
            return;
        let myStrMeta = encodeURI(strMeta);
        let myLink = document.createElement("a")
        myLink.href = myHref;
        myLink.innerText = bookmark.getLabel(linkPieces.tail);
        myLink.classList.add(myStrMeta);
        myLink.onclick = function() {
            openUrlInMyTab(myHref);
            return false;
        }
        this.#clickLink = myLink;
    }
}

export {BookmarkButton}