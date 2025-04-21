class SiteRecognitionEditor {

    #parentDiv
    #siteRecognition
    #uiUpdateTrigger

    constructor(parentDiv, siteRecognition, uiUpdateTrigger) {
        this.#parentDiv = parentDiv;
        this.#siteRecognition = siteRecognition;
        this.#uiUpdateTrigger = uiUpdateTrigger;
    }
}

export {SiteRecognitionEditor}