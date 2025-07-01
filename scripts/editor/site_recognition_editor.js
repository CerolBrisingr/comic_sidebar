import { PrefixSelector } from "./prefix_selector.js";
import { HTML } from "../shared/html.js"
import { TabSelector } from "./tab_selector.js";

class SiteRecognitionEditor {

    #parentDiv;
    #siteRecognition;
    #uiUpdateTrigger;
    #siteEditors = [];

    constructor(parentDiv, addSiteDropdown, siteRecognition, uiUpdateTrigger) {
        this.#parentDiv = parentDiv;
        this.#uiUpdateTrigger = uiUpdateTrigger;
        this.#siteRecognition = siteRecognition;
        this.#buildInterface(siteRecognition);
        this.#buildExtensionFunctionality(addSiteDropdown);
    }

    fetchErrorMessage() {
        const sites = this.#siteRecognition.getCurrentSites();
        if (sites.length == 0) {
            return "Missing a site recognition module. Import a tab and create one!";
        }
        // Test all pairs against each other
        for (let id1 = 0; id1 < sites.length - 1; id1++) {
            if (!sites[id1].isValid()) continue;
            for (let id2 = 1; id2 < sites.length; id2++) {
                if (!sites[id2].isValid()) continue;
                if (id1 == id2) continue;
                if (sites[id1].overlapsWith(sites[id2])) {
                    return this.#buildOverlapErrorMessage(id1, id2);
                }
                if (sites[id2].overlapsWith(sites[id1])) {
                    return this.#buildOverlapErrorMessage(id2, id1);
                }
            }
        }
        return undefined;
    }

    #buildOverlapErrorMessage(id1, id2) {
        return `Site recognition module ${id1 +1} overlaps with module ${id2 + 1}`;
    }

    #buildInterface(siteRecognition) {
        for (let site of siteRecognition.getCurrentSites()) {
            console.log(site.returnAsObject());
            this.#addSite(site);
        };
    }

    #addSite(site) {
        if (!site.isValid()) return;
        const fktRemoveMe = (siteEditorToRemove) => {
            this.#removeSiteEditor(siteEditorToRemove);
        }
        this.#siteEditors.push(new SiteEditor(
            this.#parentDiv,
            site, 
            this.#uiUpdateTrigger,
            fktRemoveMe
        ));
    }

    #removeSiteEditor(siteEditorToRemove) {        
        const index = this.#siteEditors.indexOf(siteEditorToRemove);
        if (index > -1) {                       // only splice array when item is found
            this.#siteEditors.splice(index, 1); // remove one element
        }
        this.#siteRecognition.removeSite(siteEditorToRemove.getSite());
    }

    #buildExtensionFunctionality(addSiteDropdown) {
        const fktAddSite = (tab) => {
            this.#createSiteForTab(tab)
        }
        new TabSelector(addSiteDropdown, fktAddSite);
    }

    #createSiteForTab(tab) {
        const site = this.#siteRecognition.createSiteFromTab(tab.returnAsObject());
        if (site === undefined)
            return;
        this.#addSite(site);
    }

}

class SiteEditor {
    #parent;
    #site;
    #frame;
    #prefixControl;
    #label;

    #fktUpdate;
    #fktDelete;

    #prefixEval;

    constructor(parent, site, fktUpdate, fktDelete) {
        this.#parent = parent;
        this.#site = site;
        this.#fktUpdate = fktUpdate;
        this.#fktDelete = fktDelete;

        this.#setUpLabel(parent);
        this.#setUpFrame(parent);

        this.#introduceEvaluation(this.#frame);
        this.#buildUrlEvaluation(this.#frame);

        this.#buildTitleControl(this.#frame);

        // Needs to happen late since it has to initially set the eval elements
        this.#finalizeControls();
    }

    getSite() {
        return this.#site;
    }

    #setUpLabel(parent) {
        this.#label = HTML.insertElement(parent, "label");
        HTML.addCssProperty(this.#label, "selector_label");
        const labelText = HTML.insertElement(this.#label, "div");
        HTML.addCssProperty(labelText, "selector_div_label");
        HTML.addText(labelText, "Site recognition set");
        this.#setUpRemoval(this.#label);
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

    #setUpRemoval(parent) {
        const spacer = HTML.insertElement(parent, "div");
        HTML.addCssProperty(spacer, "selector_label_spacer");
        const button = HTML.insertElement(parent, "button");
        HTML.addCssProperty(button, "selector_delete_btn");
        button.innerText = "remove";
        button.onclick = () => {
            this.#removeMe();
        }
    }

    #removeMe() {
        this.#fktDelete(this);
        HTML.removeElement(this.#parent, this.#frame);
        HTML.removeElement(this.#parent, this.#label);
    }

    #createIcon(parent) {
        let icon = HTML.insertElement(parent, "img");
        HTML.addCssProperty(icon, "field_type_icon");
        HTML.addSpacerText(parent);
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

    #buildTitleControl(parent) {
        const frame = HTML.insertElement(parent, "div");
        HTML.addText(frame, this.#site.getLastTitle());
    }

    #receiveNewPrefix(prefix) {
        this.#site.updatePrefix(prefix);
        this.#prefixEval.innerText = prefix;
        this.#fktUpdate();
    }
}

export {SiteRecognitionEditor}