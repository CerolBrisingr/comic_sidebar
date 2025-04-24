import { PrefixSelector } from "./prefix_selector.js";

class SiteRecognitionEditor {

    #parentDiv
    #uiUpdateTrigger
    #siteEditors = []

    constructor(parentDiv, siteRecognition, uiUpdateTrigger) {
        this.#parentDiv = parentDiv;
        this.#uiUpdateTrigger = uiUpdateTrigger;
        this.#buildInterface(siteRecognition);
    }

    #buildInterface(siteRecognition) {
        for (let site of siteRecognition.getSites()) {
            this.#siteEditors.push(new SiteEditor(
                this.#parentDiv,
                site, 
                this.#uiUpdateTrigger));
        }
    }

}

class SiteEditor {
    #site
    #frame
    #updateTrigger
    #controls

    constructor(parent, site, updateTrigger) {
        this.#site = site;
        this.#updateTrigger = updateTrigger;
        this.#setUpFrame(parent);
        this.#createIcon();
        this.#setUpControls();
    }

    #setUpFrame(parent) {
        this.#frame = HTML.insertElement(parent, "div");
        HTML.addCssProperty(this.#frame, "spans");
        this.#frame.tabindex = "0";
    }

    #createIcon() {
        let icon = HTML.insertElement(this.#frame, "img");
        HTML.addCssProperty(icon, "field_type_icon");
        icon.src = "../../icons/edit.svg";
        HTML.addSpacer(this.#frame);
        return icon;
    }

    #setUpControls() {
        let group = HTML.insertElement(this.#frame, "div");
        let ui = {
            main: HTML.addSpan(group, "-main-", "prefix_main"),
            edge: HTML.addSpan(group, "-edge-", "prefix_edge"),
            trail: HTML.addSpan(group, "-tail-", "prefix_trail"),
            prefixLine: this.#frame
        }
        this.#controls = new PrefixSelector(
            this.#site.getLastUrl(), 
            this.#site.getPrefix(), 
            (prefix) => {this.#receiveNewPrefix(prefix)},
            ui);
    }

    #receiveNewPrefix(prefix) {
        this.#site.updatePrefix(prefix);
        this.#updateTrigger();
    }
}

// TODO: make own module and make use more widespread
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
        const space = document.createTextNode('\u00A0');
        parent.appendChild(space);
        return space;
    }
}

export {SiteRecognitionEditor}