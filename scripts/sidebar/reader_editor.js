import {dissectUrl} from "../shared/url.js"

class ReaderEditor {
    constructor() {
        throw new Error("Static class, do not instantiate!")
    }
    
    static editor;
    
    static setUpEditor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn) {
        ReaderEditor.editor = new Editor(fullFrame,
            fullLink,
            label,
            prefix,
            linkLabel,
            textMsg,
            errorMsg,
            cancelBtn,
            okBtn);
    }
    
    static importLink(url, fktFinalize) {
        if (ReaderEditor.editor === undefined)
            return;
        ReaderEditor.editor.importLink(url, fktFinalize);
    }
    
    static updateLink(readerData, fktFinalize) {
        if (ReaderEditor.editor === undefined)
            return;
        ReaderEditor.editor.updateLink(readerData, fktFinalize);
    }
    
}

class Editor {
    constructor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn) {
        for (let arg of arguments) {
            if (arg === undefined) {
                throw("Constructor input incomplete, cannot build ReaderEditor instance");
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
            this.okBtn.disabled = true;
            this.openEditor();
        }
        this.okBtn = okBtn;
        this.okBtn.onclick = () => {
            this.finalize();
        }
        
        this.prefixObject.addEventListener("input", () => {this.updateLinkLabel()});
        this.openEditor();
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
    
    #setInvisible() {
        this.fullFrame.style.display = "none";
    }
    
    #setVisible() {
        this.fullFrame.style.removeProperty("display");
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
    
    importLink(url, fktFinalize) {
        if (!this.isOpen) {
            console.log("Editor already in use!")
            return;
        }
        this.occupyEditor(fktFinalize);
        this.okBtn.innerText = "Add Reader";
        
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
    
    updateLink(readerData, fktFinalize) {
        if (!this.isOpen) {
            console.log("Editor already in use!")
            return;
        }
        this.occupyEditor(fktFinalize);
        this.okBtn.innerText = "Update Reader";
        
        let url = readerData.getMostRecentAutomaticUrl();
        if (url === undefined) {
            this.openEditor();
            return;
        }
        
        this.fullLink = url;
        this.label = readerData.getLabel();
        this.setUserMessage("", "");
        this.enableInterface();
        this.prefix = readerData.getPrefixMask();
    }
    
    finalize() {
        let readerEssentials = this.gatherData();
        this.fktFinalize(readerEssentials);
        this.openEditor();
    }
    
    gatherData() {
        return {
            initialUrl: this.fullLink,
            label: this.label,
            prefix: this.prefix
        }
    }
    
    occupyEditor(fktFinalize) {
        this.#setVisible();
        this.fktFinalize = fktFinalize;
        this.isOpen = false;
    }
    
    openEditor() {
        this.#setInvisible();
        this.fktFinalize = () => {};
        this.isOpen = true;
    }
    
    updateLinkLabel() {
        let urlPieces = dissectUrl(this.fullLink, this.prefix);
        if (urlPieces === undefined) {
            this.okBtn.disabled = true;
            this.setUserMessage("Error: ", "Incompatible prefix. Prefix must be start of URL")
            return;
        }
        if (!this.prefix.startsWith(urlPieces.base_url)) {
            this.okBtn.disabled = true;
            this.setUserMessage("Error: ", "Incompatible prefix. Must contain origin URL \"" + urlPieces.base_url + "\" at the very least");
            return;
        }
        this.linkLabel = urlPieces.tail;
        this.okBtn.disabled = false;
        this.setUserMessage("", "");
        return;
    }
}

export {ReaderEditor}