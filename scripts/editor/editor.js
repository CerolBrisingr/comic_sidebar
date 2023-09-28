import { PrefixSelector } from "./prefix_selector.js"
import { ReaderData } from "../shared/reader_data.js";
import { ReaderVisuals } from "../sidebar/reader_visuals.js";
import { OpenUrlCtrl } from "../shared/url.js";
import { ImageAdjuster } from "../shared/fav_icon_manager.js";
import { ScheduleEditor } from "./schedule_editor.js";

class Editor {
    #prefixInfo;
    #prefixEdit;
    
    #reader;
    #preview;
    #scheduler;
    #fcnFinalize;

    #cancel;
    #finalizer;
    #startDeleteBtn;
    #confirmDeleteBtn;

    constructor() {
        // Wait for instructions
    }

    async createReaderEntry(data, fcnFinalize) {
        this.#fcnFinalize = fcnFinalize;
        this.#reader = ReaderData.buildForEditorFromData(data);
        this.#preview = ReaderVisuals.makePreview(this.#reader);
        this.#setUpPrefixHandling(data.url);
        const imageAdjuster = new ImageAdjuster();
        const favIcon = await imageAdjuster.apply(data.favIcon);
        this.#setUpPreview(favIcon);
        this.#setUpLabelInput();
        this.#setUpScheduleEditor();
        this.#setUpCreationExit();
    }

    updateReaderEntry(readerObjectLike, fcnFinalize) {
        this.#fcnFinalize = fcnFinalize;
        this.#reader = ReaderData.buildForEditor(readerObjectLike);
        this.#preview = ReaderVisuals.makePreview(this.#reader);
        this.#setUpPrefixHandling(this.#reader.getMostRecentAutomaticUrl());
        this.#setUpPreview(readerObjectLike.favIcon);
        this.#setUpLabelInput();
        this.#setUpScheduleEditor();
        this.#setUpUpdateExit();
    }

    #setUpCreationExit() {
        this.#collectExitButtons();
        this.#setDeleteSectionVisibility("off");
        this.#finalizer.innerText = "Add Reader";
    }

    #setUpUpdateExit() {
        this.#collectExitButtons();
        this.#setDeleteSectionVisibility("idle");
        this.#finalizer.innerText = "Update Reader";
    }

    #setUpScheduleEditor() {
        this.#scheduler = new ScheduleEditor(this.#reader.getSchedule());
    }

    #collectExitButtons() {
        this.#cancel = document.getElementById("cancel");
        this.#cancel.onclick = () => {window.close();};
        this.#finalizer = document.getElementById("finalize");
        this.#finalizer.onclick = () => {this.#finalize();};
        let startDelete = document.getElementById("start_delete");
        let fcnStartDelete = () => {this.#triggerDelete();};
        this.#startDeleteBtn = new HideShowButton(startDelete, fcnStartDelete, false);
        let confirmDelete = document.getElementById("confirm_delete");
        let fcnConfirmDelte = () => {this.#confirmDelete();};
        this.#confirmDeleteBtn = new HideShowButton(confirmDelete, fcnConfirmDelte, false);
    }

    #triggerDelete() {
        if (this.#startDeleteBtn.getLabel() === "Delete") {
            this.#setDeleteSectionVisibility("armed");
        } else {
            this.#setDeleteSectionVisibility("idle");
        }
    }

    #confirmDelete() {
        // User confirmed delete option. Send order
        let deleteCommand = {deleteMe: true};
        this.#fcnFinalize(deleteCommand);
    }

    #finalize() {
        // Successful confiuration. Send data
        let readerObjectLike = this.#reader.returnAsObject();
        readerObjectLike.favIcon = this.#preview.getFavIcon();
        readerObjectLike.url = this.#reader.getMostRecentAutomaticUrl();
        this.#fcnFinalize(readerObjectLike);
    }

    #setUpPrefixHandling(url) {
        this.#prefixInfo = document.getElementById("prefix_output");
        this.#prefixEdit = new PrefixSelector(url, this.#reader.getPrefixMask(), (prefix) => {
            this.#prefixUpdate(prefix);
        });
    }

    #prefixUpdate(prefix) {
        this.#reader.setPrefixMask(prefix);
        this.#preview.updateReaderUrls(this.#reader);
        this.#prefixInfo.innerText = prefix;
    }

    #setUpPreview(favIcon) {
        const container = document.getElementById("preview_container");
        container.appendChild(this.#preview.getListing());
        OpenUrlCtrl.setOpenUrls(false);
        this.#preview.updateFavIcon(favIcon);
        this.#preview.expand();
    }

    #setUpLabelInput() {
        const labelInput = document.getElementById("label_box");
        labelInput.placeholder = this.#reader.getLabel();
        labelInput.addEventListener("input", () => {
            let text = labelInput.value.trim();
            if (text === "")
                text = labelInput.placeholder;
            this.#reader.setLabel(text);
            this.#preview.updateLabelOnly(text);
        });
    }

    #setDeleteSectionVisibility(mode) {
        switch (mode) {
            case "idle":
                this.#startDeleteBtn.setLabel("Delete");
                this.#startDeleteBtn.setVisible(true);
                this.#confirmDeleteBtn.setVisible(false);
                break;
            case "off":
                this.#startDeleteBtn.setVisible(false);
                this.#confirmDeleteBtn.setVisible(false);
                break;
            case "armed":
                this.#startDeleteBtn.setLabel("Cancel");
                this.#startDeleteBtn.setVisible(true);
                this.#confirmDeleteBtn.setVisible(true);
                break;
            default:
                this.#startDeleteBtn.setVisible(false);
                this.#confirmDeleteBtn.setVisible(false);
        }
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

export {Editor}