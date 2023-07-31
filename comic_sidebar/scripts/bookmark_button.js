import {dissectUrl, openUrlInMyTab} from "./url.js"

class BookmarkButton {
    #container = undefined;
    #clickLink = undefined;
    #labelEdit = undefined;
    #bookmark;
    
    constructor(bookmark, prefix, strMeta) {
        this.#bookmark = bookmark;
        if (!this.#verifyInput(prefix, strMeta))
            return;
        this.#buildLink(prefix, strMeta);
        this.#buildEditor();
        this.#buildContainer();
    }
    
    isValid() {
        return !(this.#container === undefined);
    }
    
    getHtmlRoot() {
        return this.#container;
    }
    
    edit() {
        this.#clickLink.classList.toggle("no_draw");
        this.#labelEdit.classList.toggle("no_draw");
        if (this.#clickLink.classList.contains("no_draw")) {
            this.#showEditor();
            this.#labelEdit.select();
        } else {
            this.#showLabel();
        }
    }
    
    #showEditor() {
        this.#clickLink.classList.add("no_draw");
        this.#labelEdit.classList.remove("no_draw");
    }
    
    #showLabel() {
        this.#clickLink.classList.remove("no_draw");
        this.#labelEdit.classList.add("no_draw");
    }
    
    #verifyInput(prefix, strMeta) {
        if (!(typeof this.#bookmark.href === "string"))
            return false;
        if (dissectUrl(this.#bookmark.href, prefix, true) === undefined)
            return false;
        if (!(typeof strMeta === "string"))
            return false;
        return true;
    }
    
    #buildContainer() {
        if (this.#clickLink === undefined)
            return;
        this.#container = document.createElement("div");
        this.#container.appendChild(this.#clickLink);
        this.#container.appendChild(this.#labelEdit);
    }

    #buildLink(prefix, strMeta) {
        let myHref = encodeURI(this.#bookmark.href);
        let linkPieces = dissectUrl(this.#bookmark.href, prefix, true);
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
    
    #buildEditor() {
        let myEdit = document.createElement("input");
        myEdit.setAttribute("type", "text");
        myEdit.setAttribute("value", this.#bookmark.getLabel("< Edit Label Here >"));
        myEdit.classList.add("edit_comic", "no_draw");
        
        this.#labelEdit = myEdit;
    }
}

export {BookmarkButton}