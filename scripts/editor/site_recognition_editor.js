import { PrefixSelector } from "./prefix_selector.js";
import { HTML } from "../shared/html.js"
import { TabSelector } from "./tab_selector.js";
import { SiteRecognition } from "../shared/site_recognition.js";

class SiteRecognitionEditor {

    #parentDiv;
    #siteRecognition;
    #uiUpdateTrigger;
    #siteEditors = [];

    constructor(parentDiv, addSiteButton, addSiteDropdown, siteRecognition, uiUpdateTrigger) {
        this.#parentDiv = parentDiv;
        this.#uiUpdateTrigger = uiUpdateTrigger;
        this.#siteRecognition = siteRecognition;
        this.#buildInterface(siteRecognition);
        this.#buildExtensionFunctionality(addSiteButton, addSiteDropdown);
    }

    #buildInterface(siteRecognition) {
        for (let site of siteRecognition.getSites()) {
            this.#addSite(site);
        };
    }

    #addSite(site) {
        this.#setUpLabel(this.#parentDiv);
        this.#siteEditors.push(new SiteEditor(
            this.#parentDiv,
            site, 
            this.#uiUpdateTrigger));
    }

    #buildExtensionFunctionality(addSiteButton, addSiteDropdown) {
        const fktAddSite = (tab) => {
            this.#createSiteForTab(tab)
        }
        new TabSelector(addSiteButton, addSiteDropdown, fktAddSite);
    }

    #createSiteForTab(tab) {
        const site = this.#siteRecognition.createSiteFromTab(tab);
        if (site === undefined)
            return;
        this.#addSite(site);
    }

    #setUpLabel(parent) {
        const label = HTML.insertElement(parent, "label");
        HTML.addCssProperty(label, "div_label");
        HTML.addText(label, "I recognize myself due to..");
    }

}

class SiteEditor {
    #site;
    #frame;
    #prefixControl;
    #updateTrigger;

    #prefixEval;

    constructor(parent, site, updateTrigger) {
        this.#site = site;
        this.#updateTrigger = updateTrigger;
        this.#setUpFrame(parent);

        this.#introduceEvaluation(this.#frame);
        this.#buildUrlEvaluation(this.#frame);

        // Needs to happen late since it has to initially set the eval elements
        this.#finalizeControls();
    }

    #setUpFrame(parent) {
        this.#frame = HTML.insertElement(parent, "div");
        HTML.addCssProperty(this.#frame, "config_container");

        this.#prefixControl = HTML.insertElement(this.#frame, "div");
        HTML.addCssProperty(this.#prefixControl, "spans");
        this.#prefixControl.tabindex = "0";

        const icon = this.#createIcon(this.#prefixControl);
        icon.src = "../../icons/edit.svg";
    }

    #createIcon(parent) {
        let icon = HTML.insertElement(parent, "img");
        HTML.addCssProperty(icon, "field_type_icon");
        HTML.addSpacer(parent);
        return icon;
    }

    #finalizeControls() {
        let group = HTML.insertElement(this.#prefixControl, "div");
        let ui = {
            main: HTML.addSpan(group, "-main-", "prefix_main"),
            edge: HTML.addSpan(group, "-edge-", "prefix_edge"),
            trail: HTML.addSpan(group, "-tail-", "prefix_trail"),
            prefixLine: this.#prefixControl
        }
        new PrefixSelector(
            this.#site.getLastUrl(), 
            this.#site.getPrefix(), 
            (prefix) => {this.#receiveNewPrefix(prefix)},
            ui);
    }

    #introduceEvaluation(parent) {
        const span = HTML.insertElement(parent, "span");
        const text = HTML.insertElement(span, "b");
        text.innerText = "How does this match up?"
    }

    #buildUrlEvaluation(parent) {
        const frame = HTML.insertElement(parent, "div");
        HTML.addCssProperty(frame, "spans");

        const icon = this.#createIcon(frame);
        icon.src = "../../icons/information.svg";

        const group = HTML.insertElement(frame, "div");
        this.#prefixEval = HTML.addSpan(group, "-prefix-", "prefix_main");
        HTML.addSpan(group, "****", "prefix_trail");
    }

    #receiveNewPrefix(prefix) {
        this.#site.updatePrefix(prefix);
        this.#prefixEval.innerText = prefix;
        this.#updateTrigger();
    }
}

export {SiteRecognitionEditor}