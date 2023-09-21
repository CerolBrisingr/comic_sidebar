class ReaderSchedule {
    #alwaysOn;
    #duration;
    #weekly;
    #monthly;

    constructor(scheduleObject) {
        const scheduleInterface = new ScheduleInterface(this);
        this.#alwaysOn = new AlwaysOn(scheduleInterface);
        this.#duration = new ScheduleDuration(scheduleInterface);
        this.#weekly = new WeeklyReset(scheduleInterface);
        this.#monthly = new MonthlyReset(scheduleInterface);
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
            monthly: this.#monthly.returnAsObject()
        };
    }
}

class BasicSchedule {
    _type = "basic";
    _scheduleInterface;
    _isActive = true;

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
    #amount = 1;
    #unit = new TimeUnit();

    constructor(scheduleInterface) {
        super(scheduleInterface);
        this._deselect();
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
    #possibleDays = ["monday", "tuesday", "wednesday", 
        "thursday", "friday", "saturday", "sunday"];
    #days = new Set(["monday"]);

    constructor(scheduleInterface) {
        super(scheduleInterface);
        this._deselect();
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

    #dayAllowed(day) {
        return (this.#possibleDays.includes(day));
    }

    returnAsObject() {
        return {
            active: this._isActive,
            days: Array.from(this.#days)
        };
    }

}

class MonthlyReset extends BasicSchedule {
    #minDay = 1;
    #maxDay = 31;
    #days = new Set([1]);

    constructor(scheduleInterface) {
        super(scheduleInterface);
        this._deselect();
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

    #dayAllowed(day) {
        return ((day >= this.#minDay) && (day <= this.#maxDay));
    }

    returnAsObject() {
        return {
            active: this._isActive,
            days: Array.from(this.#days)
        };
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