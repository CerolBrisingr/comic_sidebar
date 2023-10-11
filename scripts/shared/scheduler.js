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
        this.#rule = this._findRule(schedule);
    }

    _findRule(schedule) {
        switch (schedule.getType()) {
            case "duration":
                return this._getDurationFcn(schedule);
            case "weekly":
                return this._getWeeklyFcn(schedule);
            case "monthly":
                return this._getMonthlyFcn(schedule);
            case "hiatus":
                return this._getHiatusFcn(schedule);
            default: // defaults to "always"
                return () => {return true;};
        }
    }

    canShow(lastInteraction) {
        if (this.#showAllInterface.getValue()){
            // Ignore schedule, show!
            return true;
        }
        return this.isScheduled(new Date(), lastInteraction);
    }

    isScheduled(time, lastInteraction) {
        return this.#rule(time, lastInteraction);
    }

    _getDurationFcn(schedule) {
        const amount = schedule.getAmount();
        switch (schedule.getUnit()) {
            case "hours":
                return this._getHourDurationFcn(amount);
            case "days":
                return this._getDayDurationFcn(amount);
            case "weeks":
                return this._getDayDurationFcn(amount * 7);
            case "months":
                return this._getMonthDurationFcn(amount);
            default:
                throw new Error("Unknown duration unit");
        }
    }

    _getHourDurationFcn(amount) {
        amount = Math.max(1, amount);
        const distance = fromHours(amount);
        return (now, lastInteraction) => {
            const compareTime = now - distance;
            return compare(compareTime, lastInteraction);
        }
    }

    _getDayDurationFcn(amount) {
        amount = Math.max(1, amount);
        return (now, lastInteraction) => {
            const compareTime = daysBack(now, amount);
            return compare(compareTime, lastInteraction);
        }
    }

    _getMonthDurationFcn(amount) {
        amount = Math.max(1, amount);
        return (now, lastInteraction) => {
            const compareTime = monthsBack(now, amount);
            return compare(compareTime, lastInteraction);
        }
    }

    _getWeeklyFcn(schedule) {
        let numDays = [];
        for (let day of schedule.getDays()) {
            let numDay = weekdayMap.get(day);
            if (numDay !== undefined)
                numDays.push(numDay);
        }
        return (now, lastInteraction) => {
            // Add one day to move to start of day
            const dayDelta = minWeekDaySpan(now, numDays) + 1;
            const compareTime = daysBack(now, dayDelta);
            return compare(compareTime, lastInteraction);
        };
    }

    _getMonthlyFcn(schedule) {
        return (now, lastInteraction) => {
            const compareTime =  nearestMonthlyReset(now, schedule);
            return compare(compareTime, lastInteraction);
        }
    }

    _getHiatusFcn(schedule) {
        const followUpFcn = this._findRule(schedule.getFollowUp());
        return (now, lastInteraction) => {
            if (now.getTime() > schedule.getTarget())
                return followUpFcn(now, lastInteraction);
            return false;
        }
    }
}

function compare(compareTime, lastInteraction) {
    return compareTime >= lastInteraction;
}

function daysBack(now, nDays) {
    // Date() handles overflow
    nDays -= 1; // One day off for going to start of day
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate() - nDays;
    return new Date(year, month, day).getTime();
}

function monthsBack(now, nMonths) {
    // Date() handles overflow
    let year = now.getFullYear();
    let month = now.getMonth() - nMonths;
    let day = now.getDate() + 1; // One day off for going to start of day
    return new Date(year, month, day).getTime();
}

function minWeekDaySpan(now, numDays) {
    // Get number of days since last weekly update date
    let distance = 6;
    let today = dayOfWeek(now);
    for (let day of numDays) {
        let thisDist = mod(today - day, 7);
        if (thisDist < distance)
            distance = thisDist;
    }
    return distance;
}

function nearestMonthlyReset(now, schedule) {
    // Get number of days since last monthly update date
    let year = now.getFullYear();
    let month = now.getMonth();
    let date = now.getDate();
    let daysInLastMonth = daysInPreviousMonth(year, month);
    let target = new Date(1, 0, 1); // Unused backup

    let days = schedule.getDays();
    if(days.length === 0) {
        // Full month back if unset
        date = Math.min(daysInLastMonth, date);
        return new Date(year, month-1, date + 1).getTime();
    }

    for (let day of days) {
        let thisTarget;
        if (date >= day) {
            thisTarget = new Date(year, month, day);
        } else if (day > daysInLastMonth) {
            thisTarget = new Date(year, month, 1);
        } else {
            thisTarget = new Date(year, month - 1, day + 1);
        }
        if (thisTarget > target)
            target = thisTarget;
    }
    return target.getTime();
}

function daysInPreviousMonth(year, month) {
    // TODO unit test edge cases
    return new Date(year, month, 0).getDate();
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