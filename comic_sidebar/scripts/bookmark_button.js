import {dissectUrl, openUrlInMyTab} from "./url.js"

class BookmarkButton {
    #container = undefined;
    #clickLink = undefined;
    #bookmark;
    
    constructor(bookmark, prefix, strMeta) {
        this.#bookmark = bookmark;
        if (!this.#verifyInput(strMeta))
            return;
        this.#buildLink(prefix, strMeta);
        this.#buildContainer();
    }
    
    isValid() {
        return !(this.#container === undefined);
    }
    
    getHtmlRoot() {
        return this.#container;
    }
    
    edit() {
        console.log("TODO: Not implemented yet");
    }
    
    #verifyInput(strMeta) {
        if (!(typeof this.#bookmark.href === "string"))
            return;
        if (!(typeof strMeta === "string"))
            return;
    }
    
    #buildContainer() {
        if (this.#clickLink === undefined)
            return;
        this.#container = document.createElement("div");
        this.#container.appendChild(this.#clickLink);
    }

    #buildLink(prefix, strMeta) {
        let myHref = encodeURI(this.#bookmark.href);
        let linkPieces = dissectUrl(this.#bookmark.href, prefix, true);
        if (linkPieces === undefined)
            return;
        let myStrMeta = encodeURI(strMeta);
        let myLink = document.createElement("a")
        myLink.href = myHref;
        myLink.innerText = this.#bookmark.getLabel(linkPieces.tail);
        myLink.classList.add(myStrMeta);
        myLink.onclick = function() {
            openUrlInMyTab(myHref);
            return false;
        }
        this.#clickLink = myLink;
    }
}

export {BookmarkButton}