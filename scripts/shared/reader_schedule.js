class ReaderSchedule {
    #alwaysOn;
    #duration;
    #weekly;
    #monthly;
    #hiatus;

    constructor(scheduleObject) {
        const scheduleInterface = new ScheduleInterface(this);
        this.#alwaysOn = new AlwaysOn(scheduleInterface);
        this.#duration = new ScheduleDuration(scheduleInterface);
        this.#weekly = new WeeklyReset(scheduleInterface);
        this.#monthly = new MonthlyReset(scheduleInterface);
        this.#hiatus = new Hiatus();
        this.updateSchedule(scheduleObject);
    }

    updateSchedule(scheduleObject) {
        this.#alwaysOn.setActive(); // Make sure at least one is active in the end
        if (scheduleObject === undefined)
            return;
        this.#alwaysOn.updateWith(scheduleObject.always_on);
        this.#duration.updateWith(scheduleObject.duration);
        this.#weekly.updateWith(scheduleObject.weekly);
        this.#monthly.updateWith(scheduleObject.monthly);
        this.#hiatus.updateWith(scheduleObject.hiatus);
    }

    #scheduleVariants() {
        return [this.#alwaysOn, this.#duration, this.#weekly, this.#monthly];
    }

    getAlwaysOption() {
        return this.#alwaysOn;
    }

    getDurationOption() {
        return this.#duration;
    }

    getWeeklyOption() {
        return this.#weekly;
    }

    getMonthlyOption() {
        return this.#monthly;
    }

    singleOut(activeSchedule) {
        // Deactivate any schedule option that is not "activeSchedule"
        // Should be triggered by this one schedule going active
        for (const schedule of this.#scheduleVariants()) {
            if (schedule !== activeSchedule)
                schedule._deselect();
        }
    }

    getActiveSchedule() {
        for (const schedule of this.#scheduleVariants()) {
            if (schedule.isActive()) {
                return schedule;
            }
        }
        throw new Error("No active schedule. This should not happen!")
    }

    returnAsObject() {
        return {
            always_on: this.#alwaysOn.returnAsObject(),
            duration: this.#duration.returnAsObject(),
            weekly: this.#weekly.returnAsObject(),
            monthly: this.#monthly.returnAsObject(),
            hiatus: this.#hiatus.returnAsObject()
        };
    }
}

class BasicSchedule {
    // Class handles active state link with other schedule options 
    // and guarantees the "type" interface
    _type = "basic";
    _scheduleInterface;
    _isActive = false;

    constructor(scheduleInterface) {
        this._scheduleInterface = scheduleInterface;
    }

    getType() {
        return this._type;
    }

    isActive() {
        return this._isActive;
    }

    updateWith() {
        throw new Error("Missing implementation");
    }

    setActive() {
        // Set active and trigger deselection of all other entries
        this._isActive = true;
        this._scheduleInterface.singleOut(this);
    }

    _deselect() {
        // Set schedule option to inactive
        // Leave use of this method to ReaderSchedule.singleOut()
        this._isActive = false;
    }
}

class AlwaysOn extends BasicSchedule {
    // Most simple schedule, basically no schedule

    constructor(scheduleInterface) {
        super(scheduleInterface);
    }

    updateWith(object) {
        if (object)
            this.setActive();
        this._type = "always";
    }

    returnAsObject() {
        return this._isActive;
    }
}

class ScheduleDuration extends BasicSchedule{
    // Select a timespan, unit and amount
    #amount = 1;
    #unit = new TimeUnit();

    constructor(scheduleInterface) {
        super(scheduleInterface);
        this._type = "duration";
    }

    updateWith(object) {
        if (object === undefined)
            return;
        if (object.active)
            this.setActive();
        this.setAmount(object.amount);
        this.#unit.updateUnit(object.unit);
    }

    setAmount(amount) {
        if (amount === undefined)
            return;
        if (amount < 1)
            amount = 1;
        this.#amount = amount;
    }

    getAmount() {
        return this.#amount;
    }

    setUnit(unit) {
        this.#unit.updateUnit(unit);
    }

    getUnit() {
        return this.#unit.getUnit();
    }

    returnAsObject() {
        return {
            active: this._isActive,
            amount: this.#amount,
            unit: this.#unit.getUnit()
        }
    }
}

class TimeUnit {
    #possibleUnits = ["hours", "days", "weeks", "months"];
    #unit = "days";

    updateUnit(unit) {
        if (unit === undefined)
            return;
        if (this.#possibleUnits.includes(unit)) {
            this.#unit = unit;
        } else {
            console.log("Invalid scheduling duration");
        }
    }

    getUnit() {
        return this.#unit;
    }
}

class WeeklyReset  extends BasicSchedule {
    // Gather days of the week, avoid duplications
    #possibleDays = ["monday", "tuesday", "wednesday", 
        "thursday", "friday", "saturday", "sunday"];
    #days = new Set(["monday"]);

    constructor(scheduleInterface) {
        super(scheduleInterface);
        this._type = "weekly";
    }

    updateWith(object) {
        if (object === undefined)
            return;
        if (object.active)
            this.setActive();
        this.setDays(object.days);
    }

    setDays(days) {
        this.#days.clear();
        if (!Array.isArray(days))
            return;
        for (let day of days) {
            this.addDay(day);
        }
    }

    addDay(day) {
        if (!this.#dayAllowed(day))
            return;
        this.#days.add(day);
    }

    hasDay(day) {
        return this.#days.has(day);
    }

    removeDay(day) {
        this.#days.delete(day);
    }

    getDays() {
        return Array.from(this.#days);
    }

    #dayAllowed(day) {
        return (this.#possibleDays.includes(day));
    }

    returnAsObject() {
        return {
            active: this._isActive,
            days: this.getDays()
        };
    }

}

class MonthlyReset extends BasicSchedule {
    // Gather days in a month, avoid duplication
    #minDay = 1;
    #maxDay = 31;
    #days = new Set([1, 15]);

    constructor(scheduleInterface) {
        super(scheduleInterface);
        this._type = "monthly";
    }

    updateWith(object) {
        if (object === undefined)
            return;
        if (object.active)
            this.setActive();
        this.setDays(object.days);
    }

    setDays(days) {
        this.clearDays();
        if (!Array.isArray(days))
            return;
        for (let day of days) {
            this.addDay(day);
        }
    }

    clearDays() {
        this.#days.clear();
    }

    addDay(day) {
        if (!this.#dayAllowed(day))
            return;
        this.#days.add(day);
    }

    hasDay(day) {
        return this.#days.has(day);
    }

    removeDay(day) {
        this.#days.delete(day);
    }

    #dayAllowed(day) {
        return ((day >= this.#minDay) && (day <= this.#maxDay));
    }

    getDays() {
        return Array.from(this.#days).sort(sortNumbers);
    }

    returnAsObject() {
        return {
            active: this._isActive,
            days: this.getDays()
        };
    }
}

class Hiatus extends BasicSchedule {
    #targetDate = 0;

    constructor() {
        super(undefined);
        this._type = "hiatus";
    }

    updateWith(object) {
        if (object.active)
            this.setActive();
        this.setTarget(object.target_date);
    }

    setActive() {
        // This one works independently
        this._isActive = true;
    }

    setTarget(date) {
        if (date === undefined)
            return;
        // We don't want a date object
        if (typeof date.getTime === "function")
            date = date.getTime(); 
        this.#targetDate = date;
    }

    getTarget() {
        return this.#targetDate;
    }

    returnAsObject() {
        return {
            active: this._isActive,
            target_date: this.getTarget()
        };
    }
}

function sortNumbers(a, b) {
    if (a > b) {
        return 1;
    } else if (a == b) {
        return 0;
    } else {
        return -1;
    }
}
class ScheduleInterface {
    #readerSchedule;

    constructor(readerSchedule) {
        this.#readerSchedule = readerSchedule;
    }

    singleOut(target) {
        // Make sure all others are not active
        this.#readerSchedule.singleOut(target);
    }
}

export {ReaderSchedule}