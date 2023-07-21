import {dissectUrl} from "./bookmarks.js"

class NewComicInput {
    constructor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn) {
        for (let arg of arguments) {
            if (arg === undefined) {
                throw("Constructor input incomplete, cannot build NewComicInput instance");
            }
        }
        
        this.fullFrame = fullFrame;
        
        this.fullLinkObject = fullLink;
        this.labelObject = label;
        this.prefixObject = prefix;
        this.linkLabelObject = linkLabel;
        
        this.textMsgObject = textMsg;
        this.errorMsgObject = errorMsg;
        
        this.cancelBtn = cancelBtn;
        this.cancelBtn.onclick = () => {
            this.setDummyValues();
            this.okBtn.disabled = true;
            this.setInvisible();
        }
        this.okBtn = okBtn;
        
        this.prefixObject.addEventListener("input", () => {this.updateLinkLabel()});
        this.setDummyValues();
        this.setInvisible();
    }
    
    set fullLink(newText) {
        this.fullLinkObject.innerText = newText;
    }
    get fullLink() {
        return this.fullLinkObject.innerText;
    }
    set label(newText) {
        this.labelObject.value = newText;
    }
    get label() {
        return this.labelObject.value;
    }
    set prefix(newText) {
        this.prefixObject.value = newText;
        this.updateLinkLabel();
    }
    get prefix() {
        return this.prefixObject.value;
    }
    set linkLabel(newText) {
        this.linkLabelObject.innerText = newText;
    }
    get linkLabel() {
        return this.linkLabelObject.innerText;
    }
    
    setUserMessage(textMsg, errorMsg) {
        this.textMsgObject.innerText = textMsg;
        this.errorMsgObject.innerText = errorMsg;
    }
    
    setInvisible() {
        this.fullFrame.style.display = "none";
    }
    
    setVisible() {
        this.fullFrame.style.removeProperty("display");
    }
    
    setDummyValues() {
        this.importLink("https://www.somecomic.com/archives/comic/page_1234/");
    }
    
    disableInterface() {
        this.fullLink = "invalid";
        this.label = "";
        this.prefix = "";
        this.linkLabel = "";
        this.okBtn.disabled = true;
        this.labelObject.disabled = true;
        this.prefixObject.disabled = true;
    }
    
    enableInterface() {
        this.okBtn.disabled = false;
        this.labelObject.disabled = false;
        this.prefixObject.disabled = false;
    }
    
    importLink(url) {
        let urlPieces = dissectUrl(url);
        if (urlPieces === undefined) {
            this.disableInterface();
            this.setUserMessage("Error: ", "Invalid Link provided");
            return;
        }
        this.fullLink = url;
        this.label = urlPieces.host;
        this.setUserMessage("", "");
        this.enableInterface();
        this.prefix = urlPieces.base_url;
    }
    
    updateLinkLabel() {
        let urlPieces = dissectUrl(this.fullLink, this.prefix);
        if (urlPieces === undefined) {
            this.okBtn.disabled = true;
            this.setUserMessage("Error: ", "Incompatible prefix. Prefix must be start of URL")
            return;
        }
        this.linkLabel = urlPieces.tail;
        this.okBtn.disabled = false;
        this.setUserMessage("", "");
        return;
    }
}

export {NewComicInput}