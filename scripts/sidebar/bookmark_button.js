import {dissectUrl, openUrlInMyTab} from "../shared/url.js"

class BookmarkButton {
    #container = undefined;
    #clickLink = undefined;
    #labelEdit = undefined;
    #prefix;
    #managerInterface;
    #bookmark;
    
    constructor(bookmark, prefix, strMeta, managerInterface) {
        this.#bookmark = bookmark;
        this.#prefix = prefix;
        this.#managerInterface = managerInterface;
        if (!this.#verifyInput(strMeta))
            return;
        this.#buildLink(strMeta);
        this.#buildEditor();
        this.#buildContainer();
    }
    
    linkMatches(url) {
        return (url === this.#bookmark.href);
    }
    
    isValid() {
        return !(this.#container === undefined);
    }
    
    getHtmlRoot() {
        return this.#container;
    }
    
    editButtonClicked() {
        // Clicked once: start editor
        // Clicked again: apply changes
        if (this.#labelEdit.classList.contains("no_draw")) {
            this.#showEditor();
            this.#labelEdit.select();
        } else {
            this.#requestUpdate();
        }
    }
    
    #requestUpdate() {
        this.#showLabel();
        let newValue = this.#labelEdit.value;
        newValue.trim();
        if (newValue === this.#clickLink.innerText) {
            console.log("Nothing changed, stepping out");
            return;
        }
        this.#managerInterface.requestBookmarkLabelUpdate(this.#bookmark, newValue);
    }
    
    updateLabel(newValue) {
        if (newValue == "") {
            this.#removeLabel();
            return;
        }
        this.#bookmark.setLabel(newValue);
        this.#clickLink.innerText = newValue;
        this.#managerInterface.saveProgress();
    }
    
    #removeLabel() {
        this.#bookmark.setLabel(undefined);
        let autoLabel = this.#getAutomaticLabel();
        this.#clickLink.innerText = autoLabel;
    }
    
    #showEditor() {
        this.#clickLink.classList.add("no_draw");
        this.#labelEdit.classList.remove("no_draw");
        this.#labelEdit.value = this.#bookmark.getLabel("< Edit Label Here >");
    }
    
    #showLabel() {
        this.#clickLink.classList.remove("no_draw");
        this.#labelEdit.classList.add("no_draw");
    }
    
    #verifyInput(strMeta) {
        if (!(typeof this.#bookmark.href === "string"))
            return false;
        if (dissectUrl(this.#bookmark.href, this.#prefix, true) === undefined)
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

    #buildLink(strMeta) {
        let myHref = encodeURI(this.#bookmark.href);
        let myStrMeta = encodeURI(strMeta);
        let myLink = document.createElement("a")
        myLink.href = myHref;
        myLink.innerText = this.#getAutomaticLabel();
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
        myEdit.classList.add("edit_comic", "no_draw");
        myEdit.onkeydown = (event) => {
            if (event.key == "Enter") {
                this.#requestUpdate();
            }
            if (event.key == "Escape") {
                this.#showLabel();
            }
        }
        
        this.#labelEdit = myEdit;
    }
    
    #getAutomaticLabel() {
        let linkPieces = dissectUrl(this.#bookmark.href, this.#prefix, true);
        return this.#bookmark.getLabel(linkPieces.tail);
    }
}

export {BookmarkButton}