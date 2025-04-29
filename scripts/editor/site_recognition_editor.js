import { PrefixSelector } from "./prefix_selector.js";
import { UrlListener } from "../shared/url_listener.js";
import { TabSelector } from "./tab_selector.js";

class SiteRecognitionEditor {

    #parentDiv;
    #uiUpdateTrigger;
    #siteEditors = [];

    constructor(parentDiv, addSiteButton, siteRecognition, uiUpdateTrigger) {
        this.#parentDiv = parentDiv;
        this.#uiUpdateTrigger = uiUpdateTrigger;
        this.#buildInterface(siteRecognition);
        this.#buildExtensionFunctionality(addSiteButton);
    }

    #buildInterface(siteRecognition) {
        for (let site of siteRecognition.getSites()) {
            this.#setUpLabel(this.#parentDiv);
            this.#siteEditors.push(new SiteEditor(
                this.#parentDiv,
                site, 
                this.#uiUpdateTrigger));
        };
    }

    #buildExtensionFunctionality(addSiteButton) {
        const fktAddSite = (tab) => {
            this.#addSite(tab)
        }
        new TabSelector(addSiteButton, fktAddSite);
    }

    #addSite(tab) {
        console.log(tab);
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

// TODO: make this it's own module
class HTML {
    static insertElement(parent, strType) {
        let element = document.createElement(strType);
        parent.appendChild(element);
        return element;
    }

    static addCssProperty(element, strName) {
        element.classList.add(strName);
    }

    static addSpan(parent, strText, strClass = undefined) {
        let span = HTML.insertElement(parent, "span");
        if (strClass !== undefined) {
            HTML.addCssProperty(span, strClass);
        }
        span.innerText = strText;
        return span;
    }

    static addSpacer(parent) {
        return HTML.addText(parent, '\u00A0');
    }

    static addText(parent, strText) {
        const text = document.createTextNode(strText);
        parent.appendChild(text);
        return text;
    }
}

export {SiteRecognitionEditor}