import { getShowAll } from "./backup_import.js";
import { saveShowAll } from "./backup_export.js";

let millisecondsInADay = 1000*60*60*24;
let millisecondsInAnHour = 1000*60*60;
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
            case "duration":
                this.#rule = this.#getDurationFcn(schedule);
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

    #getDurationFcn(schedule) {
        const amount = schedule.getAmount();
        switch (schedule.getUnit()) {
            case "hours":
                return this.#getHourDurationFcn(amount);
            case "days":
                return this.#getDayDurationFcn(amount);
            case "weeks":
                return this.#getDayDurationFcn(amount * 7);
            case "months":
                return this.#getMonthDurationFcn(amount);
            default:
                throw new Error("Unknown duration unit");
        }
    }

    #getHourDurationFcn(amount) {
        amount = Math.max(1, amount);
        const distance = fromHours(amount);
        return (now, lastInteraction) => {
            const compareTime = now - distance;
            return compare(compareTime, lastInteraction);
        }
    }

    #getDayDurationFcn(amount) {
        amount = Math.max(1, amount);
        // startOfDay is already fulfilling 1 day distance
        const distance = fromDays(amount -1);
        return (now, lastInteraction) => {
            const compareTime = startOfDay(now) - distance;
            return compare(compareTime, lastInteraction);
        }
    }

    #getMonthDurationFcn(amount) {
        amount = Math.max(1, amount);
        return (now, lastInteraction) => {
            let compareTime = monthsAgo(now, amount) 
            compareTime += fromDays(1); // Interact on 10th, allow again on 10th
            return compare(compareTime, lastInteraction);
        }
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
            return compare(compareTime, lastInteraction);
        };
    }
}

function compare(compareTime, lastInteraction) {
    // TODO: replace this by first set of unit tests
    //console.log(`Difference in hours: ${(compareTime - lastInteraction)/1000/60/60}`);
    //console.log(`Difference in days:  ${(compareTime - lastInteraction)/1000/60/60/24}`);
    return compareTime > lastInteraction;
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

function monthsAgo(now, amount) {
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();
    // apply duration
    year -= Math.floor(amount / 12);
    month -= amount % 12;
    // Fix negative month
    if (month < 1) {
        year -= 1;
        month += 12;
    }
    // Make sure that month has date, otherwise use 1st of next month
    let daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
        month +=1;
        day = 1;
        // December has 31 days, will not jump years this way
    }
    return new Date(year, month, day).getTime();
}

function dayOfWeek(now) {
    return now.getDay(); // 0 = Sunday .. 6 = Saturday
}

function fromHours(timespan) {
    return timespan * millisecondsInAnHour;
}

function fromDays(timespan) {
    return timespan * millisecondsInADay;
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