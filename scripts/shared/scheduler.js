import { getShowAll } from "./backup_import.js";
import { saveShowAll } from "./backup_export.js";

let milliSecondsInADay = 1000*60*60*24;
let weekdayMap = new Map([
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6]
])

function mod(x, m) {
    return ((x % m) + m) % m;
}

class Scheduler {
    #showAllInterface;
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
            case "weekly":
                this.#rule = this.#getWeeklyFcn(schedule);
                break;
            default:
                this.#rule = (now, lastInteraction) => {
                    const compareTime = startOfDay(now);
                    return compareTime > lastInteraction;
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

    #getWeeklyFcn(schedule) {
        let numDays = [];
        for (let day of schedule.getDays()) {
            let numDay = weekdayMap.get(day);
            if (numDay !== undefined)
                numDays.push(numDay);
        }
        return (now, lastInteraction) => {
            const compareTime = startOfDay(now) - fromDays(minWeekDaySpan(now, numDays));
            return compareTime > lastInteraction;
        };
    }
}

function startOfHour(now) {
    let start = new Date(now.getTime());
    start.setHours(now.getHours(), 0, 0, 0);
    return start.getTime();
}

function startOfDay(now) {
    let start = new Date(now.getTime());
    start.setHours(0, 0, 0, 0);
    return start.getTime();
}

function minWeekDaySpan(now, numDays) {
    // Get number of days since last update date
    let distance = 7;
    let today = dayOfWeek(now);
    for (let day of numDays) {
        let thisDist = mod(today - day, 7);
        if (thisDist < distance)
            distance = thisDist;
    }
    return distance;
}

function dayOfWeek(now) {
    return now.getDay(); // 0 = Sunday .. 6 = Saturday
}

function fromDays(timespan) {
    return timespan * milliSecondsInADay;
}

function toSeconds(timespan) {
    return timespan/1000;
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