import { PrefixSelector } from "./prefix_selector.js"
import { ReaderData } from "../shared/reader_data.js";
import { ReaderVisuals } from "../sidebar/reader_visuals.js";
import { OpenUrlCtrl } from "../shared/url.js";

class Editor {
    #prefixInfo;
    #prefixEdit;
    
    #reader;
    #preview;
    #fcnFinalize;

    constructor() {
        // Wait for instructions
    }

    createReaderEntry(data, fcnFinalize) {
        this.#fcnFinalize = fcnFinalize;
        this.#reader = ReaderData.buildForEditor(data);
        this.#preview = ReaderVisuals.makePreview(this.#reader);
        this.#setUpPrefixHandling(data.url);
        this.#setUpPreview(data.favIcon);
        this.#setUpLabelInput();
    }

    #setUpPrefixHandling(url) {
        this.#prefixInfo = document.getElementById("prefix_output");
        this.#prefixEdit = new PrefixSelector(url, (prefix) => {this.#prefixUpdate(prefix);});
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
            this.#reader.setLabel(labelInput.value);
            this.#preview.updateLabelOnly(labelInput.value);
        });
    }
}

export {Editor}