class SiteRecognitionEditor {

    #parentDiv
    #uiUpdateTrigger

    constructor(parentDiv, siteRecognition, uiUpdateTrigger) {
        this.#parentDiv = parentDiv;
        this.#uiUpdateTrigger = uiUpdateTrigger;
        this.#buildInterface(siteRecognition);
    }

    #buildInterface(siteRecognition) {
        for (let site of siteRecognition.getSites()) {
            this.#assembleSiteEditor(site);
        }
    }

    #assembleSiteEditor(site) {
        let frame = HTML.insertElement(this.#parentDiv, "div");
        HTML.addCssProperty(frame, "spans");
        frame.innerText = site.getLastUrl();
    }

}

class HTML {
    static insertElement(parent, strType) {
        let element = document.createElement(strType);
        parent.appendChild(element);
        return element;
    }

    static addCssProperty(element, strName) {
        element.classList.add(strName);
    }
}

export {SiteRecognitionEditor}