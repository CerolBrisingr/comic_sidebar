import { SiteRecognitionEditor } from "./site_recognition_editor.js";
import { ReaderData } from "../shared/reader_data.js";
import { ReaderVisuals } from "../sidebar/reader_visuals.js";
import { OpenUrlCtrl } from "../shared/url.js";
import { ImageAdjuster } from "../shared/fav_icon_manager.js";
import { ScheduleEditor } from "./schedule_editor.js";
import { TagEditorEditor } from "../shared/tag_editor.js";
import { HideableHint } from "../shared/hideable_hint.js";
import { HTML } from "../shared/html.js";

class Editor {    
    #reader;
    #preview;
    #fcnFinalize;

    #siteRecognitionEditor;
    #errorView;

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
        this.#setUpSiteRecognitionEditor();
        const imageAdjuster = new ImageAdjuster();
        const favIcon = await imageAdjuster.apply(data.favIcon);
        this.#setUpHints();
        this.#setUpPreview(favIcon);
        this.#setUpLabelInput();
        this.#setUpScheduleEditor();
        this.#setUpTagEditor(data.knownTags);
        this.#setUpCreationExit();
        this.#setUpErrorView();
    }

    updateReaderEntry(readerObjectLike, fcnFinalize) {
        this.#fcnFinalize = fcnFinalize;
        this.#reader = ReaderData.buildForEditor(readerObjectLike);
        this.#preview = ReaderVisuals.makePreview(this.#reader);
        this.#setUpSiteRecognitionEditor();
        this.#setUpHints();
        this.#setUpPreview(readerObjectLike.favIcon);
        this.#setUpLabelInput();
        this.#setUpScheduleEditor();
        this.#setUpTagEditor(readerObjectLike.knownTags);
        this.#setUpUpdateExit();
        this.#setUpErrorView();
    }

    #setUpErrorView() {
        this.#errorView = {
            frame: HTML.findElementById("error_message_frame"),
            message: HTML.findElementById("error_message")
        }
        this.#errorView.frame.style.display = "none";
    }

    #showError(errorMessage) {
        this.#errorView.frame.style.display = "block";
        this.#errorView.message.innerText = errorMessage;
        HTML.scrollIntoView(this.#errorView.frame);
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

    #setUpHints() {
        new HideableHint("prefix");
        new HideableHint("preview");
        new HideableHint("schedule");
    }

    #setUpScheduleEditor() {
        new ScheduleEditor(this.#reader.getSchedule());
    }

    #setUpTagEditor(knownTags) {
        new TagEditorEditor(this.#reader, knownTags);
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

    #fetchErrorMessage() {
        return this.#siteRecognitionEditor.fetchErrorMessage();
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
        const errorMessage = this.#fetchErrorMessage();
        if (errorMessage !== undefined) {
            this.#showError(errorMessage);
            return;
        }
        // Successful confiuration. Send data
        let readerObjectLike = this.#reader.returnAsObject();
        readerObjectLike.favIcon = this.#preview.getFavIcon();
        readerObjectLike.url = this.#reader.getMostRecentAutomaticUrl();
        this.#fcnFinalize(readerObjectLike);
    }

    #setUpSiteRecognitionEditor() {
        const addTabDropdown = {
            button: document.getElementById("add_site_identification"),
            dropdown: document.getElementById("add_site_identification_dropdown")
        }
        this.#siteRecognitionEditor = new SiteRecognitionEditor(
            document.getElementById("site_identificators"),
            addTabDropdown,
            this.#reader.getRecognitionObject(),
            () => {this.#preview.updateReaderUrls(this.#reader);}
        );
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