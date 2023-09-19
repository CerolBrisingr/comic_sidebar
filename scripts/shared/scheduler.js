import { getShowAll } from "./backup_import.js";
import { saveShowAll } from "./backup_export.js";

class Scheduler {
    #showAllInterface;
    #dayFactor = 1.0/(1000*60*60*24);
    #rule;

    constructor(readerSchedule, showAllInterface) {
        this.#showAllInterface = showAllInterface;
        this.updateRuleset(readerSchedule);
    }

    updateRuleset(readerSchedule) {
        const schedule = readerSchedule.getActiveSchedule();
        switch (schedule.getType()) {
            case "always":
                this.#rule = () => {return true;};
                break;
            default:
                this.#rule = (now, lastInteraction) => {
                    return (this.#startOfDay(now) - lastInteraction) > 0;
                }
                break;
        }
    }

    canShow(lastInteraction) {
        if (this.#showAllInterface.getValue()){
            // Scheduler is deactivated
            return true;
        }
        const now = new Date();
        return this.#rule(now, lastInteraction);
    }

    #lastWeekday(now, intDay) {
        // Get time of previous named weekday
        // Just writing some methods. Probably need end of day for this
        let timeToday = this.#startOfDay(now);
        let today = now.getDay(); // 0 = Sunday .. 6 = Saturday
    }

    #startOfHour(now) {
        let start = new Date(now.getTime());
        start.setHours(now.getHours(), 0, 0, 0);
        return start.getTime();
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