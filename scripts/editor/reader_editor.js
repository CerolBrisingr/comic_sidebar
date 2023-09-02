import {dissectUrl} from "../shared/url.js"

class ReaderEditor {
    #timestamp;

    constructor(fullFrame, fullLink, label, prefix, linkLabel, textMsg, errorMsg, cancelBtn, okBtn, startDel, confirmDel) {
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
        let fktStartDel = () => {this.#triggerDelete();};
        this.startDeleteBtn = new HideShowButton(startDel, fktStartDel, false);
        let fktConfirmDel = () => {this.#confirmDelete();};
        this.confirmDeleteBtn = new HideShowButton(confirmDel, fktConfirmDel, false);
        
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
    
    #triggerDelete() {
        if (this.startDeleteBtn.getLabel() === "Delete") {
            this.#setDeleteSectionVisibility("armed");
        } else {
            this.#setDeleteSectionVisibility("idle");
        }
    }
    
    #confirmDelete() {
        this.terminate();
    }
    
    #setInvisible() {
        this.fullFrame.classList.add("no_draw");
    }
    
    #setVisible() {
        this.fullFrame.classList.remove("no_draw");
    }
    
    #setDeleteSectionVisibility(mode) {
        switch (mode) {
            case "idle":
                this.startDeleteBtn.setLabel("Delete");
                this.startDeleteBtn.setVisible(true);
                this.confirmDeleteBtn.setVisible(false);
                break;
            case "off":
                this.startDeleteBtn.setVisible(false);
                this.confirmDeleteBtn.setVisible(false);
                break;
            case "armed":
                this.startDeleteBtn.setLabel("Cancel");
                this.startDeleteBtn.setVisible(true);
                this.confirmDeleteBtn.setVisible(true);
                break;
            default:
                this.startDeleteBtn.setVisible(false);
                this.confirmDeleteBtn.setVisible(false);
        }
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
    
    importLink(data, fktFinalize) {
        if (!this.isOpen) {
            console.log("Editor already in use!")
            return;
        }
        this.occupyEditor(fktFinalize);

        this.okBtn.innerText = "Add Reader";
        this.#timestamp = data.time;
        
        let urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined) {
            this.disableInterface();
            this.setUserMessage("Error: ", "Invalid Link provided");
            return;
        }
        this.favIcon = data.favIcon;
        this.fullLink = data.url;
        this.label = urlPieces.host;
        this.setUserMessage("", "");
        this.enableInterface();
        this.#setDeleteSectionVisibility("off");
        this.prefix = urlPieces.base_url;
    }
    
    updateLink(readerData, fktFinalize) {
        if (!this.isOpen) {
            console.log("Editor already in use!")
            return;
        }
        this.occupyEditor(fktFinalize);

        this.okBtn.innerText = "Update Reader";
        this.#timestamp = undefined;
        
        let url = readerData.getMostRecentAutomaticUrl();
        if (url === undefined) {
            this.openEditor();
            return;
        }
        this.favIcon = undefined;
        this.fullLink = url;
        this.label = readerData.getLabel();
        this.setUserMessage("", "");
        this.enableInterface();
        this.#setDeleteSectionVisibility("idle");
        this.prefix = readerData.getPrefixMask();
    }
    
    finalize() {
        let readerEssentials = this.gatherData();
        this.fktFinalize(readerEssentials);
        this.openEditor();
    }
    
    terminate() {
        let readerEssentials = {deleteMe: true};
        this.fktFinalize(readerEssentials);
        this.openEditor();
    }
    
    gatherData() {
        return {
            url: this.fullLink,
            label: this.label,
            prefix_mask: this.prefix,
            time: this.#timestamp,
            favIcon: this.favIcon,
            schedule: "none"
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

class HideShowButton {
    #objButton;
    
    constructor(objButton, fktClick, isVisible) {
        this.#objButton = objButton;
        objButton.onclick = fktClick;
        this.setVisible(isVisible);
    }
    
    setVisible(isVisible) {
        if (isVisible) {
            this.#setVisible();
        } else {
            this.#setInvisible();
        }
    }
    
    setLabel(newLabel) {
        this.#objButton.innerText = newLabel;
    }
    
    getLabel() {
        return this.#objButton.innerText;
    }
    
    #setInvisible() {
        this.#objButton.style.display = "none";
    }
    
    #setVisible() {
        this.#objButton.style.removeProperty("display");
    }
}

export {ReaderEditor}