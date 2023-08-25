import { getShowAll } from "./backup_import.js";
import { saveShowAll } from "./backup_export.js";

class Scheduler {
    #showAllInterface;
    #dayFactor = 1.0/(1000*60*60*24);

    constructor(readerData, showAllInterface) {
        this.#showAllInterface = showAllInterface;
        // Import ruleset
    }

    canShow(lastInteraction) {
        if (this.#showAllInterface.getValue()){
            // Scheduler is deactivated
            return true;
        }
        const now = new Date();
        const wasYesterday = (this.#startOfDay(now) - lastInteraction) > 0;
        return wasYesterday;
    }

    #startOfDay(now) {
        let start = new Date(now.getTime());
        start.setHours(0, 0, 0, 0);
        return start.getTime();
    }

    #toSeconds(timespan) {
        return timespan/1000;
    }

    #toDays(timespan) {
        return timespan * this.#dayFactor;
    }
}

class ShowAllInterface {
    #showAllUi;
    #showAll;
    #updateFcn;

    constructor(showAll = undefined) {
        this.#showAllUi = showAll;
        this.#setUpButton();
        this.#initValue();
    }

    setUpdateFcn(updateFcn) {
        this.#updateFcn = updateFcn;
    }

    async #initValue() {
        const value = await getShowAll();
        this.#showAll = value;
        this.#setShowAllVisuals(value);
    }

    #setUpButton() {
        this.#showAllUi.icon.style.visibility = "visible";
        this.#showAllUi.button.onclick = () => {
            this.setValue(!this.#showAll);
        };
    }

    #setShowAllVisuals(value) {
        if (!this.#showAllUi)
            return;
        if (value) {
            this.#setTrueVisuals();
        } else {
            this.#setFalseVisuals();
        }
        this.#triggerUpdate();
    }

    #setTrueVisuals() {
        this.#showAllUi.icon.src = "../../icons/eye.svg";
        this.#showAllUi.label.innerText = "Showing hidden";
    }

    #setFalseVisuals() {
        this.#showAllUi.icon.src = "../../icons/eye-slash.svg";
        this.#showAllUi.label.innerText = "Show hidden";

    }

    #triggerUpdate() {
        if (this.#updateFcn !== undefined)
            this.#updateFcn();
    }

    getValue() {
        return this.#showAll;
    }

    setValue(value) {
        value = Boolean(value);
        this.#showAll = value;
        this.#setShowAllVisuals(value);
        saveShowAll(value);
    }
}

export {Scheduler, ShowAllInterface}