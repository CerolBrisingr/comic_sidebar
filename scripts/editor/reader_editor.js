import {dissectUrl} from "../shared/url.js"
import { ReaderSchedule } from "../shared/reader_data.js";

class ReaderEditor {
    #timestamp;

    constructor(fullLink, label, prefix, linkLabel, textMsg, errorMsg,
            cancelBtn, okBtn, startDel, confirmDel, schedule) {
        for (let arg of arguments) {
            if (arg === undefined) {
                throw("Constructor input incomplete, cannot build ReaderEditor instance");
            }
        }
        this.schedule = schedule;
        
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
            window.close();
        }
        this.okBtn = okBtn;
        this.okBtn.onclick = () => {
            this.finalize();
        }
        let fktStartDel = () => {this.#triggerDelete();};
        this.startDeleteBtn = new HideShowButton(startDel, fktStartDel, false);
        let fktConfirmDel = () => {this.#confirmDelete();};
        this.confirmDeleteBtn = new HideShowButton(confirmDel, fktConfirmDel, false);
        
        this.prefixObject.addEventListener("input", () => {this.updateLabelPreview()});
        this.openEditor();
    }

    importSchedule(schedule) {
        for (const element of this.schedule) {
            element.checked = (element.value === schedule);
        }
    }

    gatherSelectedSchedule() {
        for (const element of this.schedule) {
            if (element.checked)
                return element.value;
        }
        return "none";
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
        this.updateLabelPreview();
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
    
    createReaderEntry(data, fktFinalize) {
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
        const schedule = new ReaderSchedule();
        this.importSchedule(schedule.returnAsObject());
        this.setUserMessage("", "");
        this.enableInterface();
        this.#setDeleteSectionVisibility("off");
        this.prefix = urlPieces.base_url;
    }
    
    updateReaderEntry(readerObjectLike, fktFinalize) {
        if (!this.isOpen) {
            console.log("Editor already in use!")
            return;
        }
        this.occupyEditor(fktFinalize);

        this.okBtn.innerText = "Update Reader";
        this.#timestamp = undefined;
        
        let url = readerObjectLike.mostRecentAutomaticUrl;
        if (url === undefined) {
            this.openEditor();
            return;
        }
        this.favIcon = undefined;
        this.fullLink = url;
        this.label = readerObjectLike.label;
        this.importSchedule(readerObjectLike.schedule);
        this.setUserMessage("", "");
        this.enableInterface();
        this.#setDeleteSectionVisibility("idle");
        this.prefix = readerObjectLike.prefix_mask;
    }
    
    finalize() {
        // Successful confiuration. Send data
        let readerObjectLike = this.gatherData();
        this.fktFinalize(readerObjectLike);
        this.openEditor();
    }
    
    terminate() {
        // User confirmed delete option. Send order
        let readerEssentials = {deleteMe: true};
        this.fktFinalize(readerEssentials);
        this.openEditor();
    }
    
    gatherData() {
        // Building readerObjectLike object
        // Can be used for loading intstanciating ReaderData()
        // Has extra properties depending on context
        return {
            url: this.fullLink,
            label: this.label,
            prefix_mask: this.prefix,
            time: this.#timestamp,
            favIcon: this.favIcon,
            schedule: this.gatherSelectedSchedule()
        }
    }
    
    occupyEditor(fktFinalize) {
        this.fktFinalize = fktFinalize;
        this.isOpen = false;
    }
    
    openEditor() {
        this.fktFinalize = () => {};
        this.isOpen = true;
    }
    
    updateLabelPreview() {
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