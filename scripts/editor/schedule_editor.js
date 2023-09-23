class ScheduleEditor {
    #always;
    #duration;
    #weekly;
    #monthly;

    constructor(readerSchedule) {
        let myInterface = new EditorInterface(this);
        this.#always = new BasicEditor("always", "always_frame", readerSchedule.getAlwaysOption(), myInterface);
        this.#duration = new DurationEditor("duration", "duration_frame", readerSchedule.getDurationOption(), myInterface);
        this.#weekly = new WeeklyEditor("weekly", "weekly_frame", readerSchedule.getWeeklyOption(), myInterface);
        this.#monthly = new MonthlyEditor("monthly", "monthly_frame", readerSchedule.getMonthlyOption(), myInterface);
        this.updateActivityChecks();
    }

    updateActivityChecks() {
        // States of schedules are linked, corresponding viusals are not
        this.#always.updateActiveState();
        this.#duration.updateActiveState();
        this.#weekly.updateActiveState();
        this.#monthly.updateActiveState();
    }
}

class EditorInterface {
    #scheduleEditor;

    constructor(scheduleEditor) {
        this.#scheduleEditor = scheduleEditor;
    }

    updateActivityChecks() {
        this.#scheduleEditor.updateActivityChecks();
    }

}

class BasicEditor {
    constructor(checkbox, div, schedule, parentInterface) {
        this._checkbox = document.getElementById(checkbox);
        this._div = document.getElementById(div);
        this._schedule = schedule;
        this._interface = parentInterface;
        this._checkbox.addEventListener("click", (evt) => {
            this._schedule.setActive();
            // Seems like you cannot listen to the state of the scheduler.
            // Doing it this way then.
            this._interface.updateActivityChecks();
        });
    }

    updateActiveState() {
        if (this._schedule.isActive()) {
            this._checkbox.checked = true;
            this._expand();
        } else {
            this._checkbox.checked = false;
            this._collapse();
        }
    }

    _expand() {
        this._div.classList.remove("no_draw");
    }

    _collapse() {
        this._div.classList.add("no_draw");
    }
}

class DurationEditor extends BasicEditor {
    #inputNumber;
    #selectUnit;

    constructor(checkbox, div, schedule, parentInterface) {
        super(checkbox, div, schedule, parentInterface);
        this.#setUpNumberInput();
        this.#setUpUnitSelection();
    }

    #setUpNumberInput() {
        this.#inputNumber = document.getElementById("duration_number");
        this.#updateNumberInput();
        this.#inputNumber.addEventListener("change", () => {
            const amount = this.#inputNumber.valueAsNumber;
            if (!Number.isNaN(amount)) {
                this._schedule.setAmount(amount);
            }
            this.#updateNumberInput();
        });
    }

    #updateNumberInput() {
        this.#inputNumber.value = String(this._schedule.getAmount());
    }

    #setUpUnitSelection() {
        this.#selectUnit = document.getElementById("duration_unit");
        this.#updateSelectedUnit();
        this.#selectUnit.addEventListener("change", () => {
            this._schedule.setUnit(this.#selectUnit.value);
            this.#updateSelectedUnit();
        });
    }

    #updateSelectedUnit() {
        this.#selectUnit.value = this._schedule.getUnit();
    }
}

class WeeklyEditor extends BasicEditor{
    #days = new Map();

    constructor(checkbox, div, schedule, parentInterface) {
        super(checkbox, div, schedule, parentInterface);
        this.#gatherSpans();
        this.#setUpDayList();
    }

    #gatherSpans() {
        this.#addSpan("monday", "week_mo");
        this.#addSpan("tuesday", "week_tu");
        this.#addSpan("wednesday", "week_we");
        this.#addSpan("thursday", "week_th");
        this.#addSpan("friday", "week_fr");
        this.#addSpan("saturday", "week_sa");
        this.#addSpan("sunday", "week_su");
    }

    #addSpan(day, ident) {
        this.#days.set(day, new ToggleText(ident, (value) => {
            this.#updateDay(day, value);
        }));
    }

    #updateDay(day, value) {
        if (value) {
            this._schedule.addDay(day);
        } else {
            this._schedule.removeDay(day);
        }
    }

    #setUpDayList() {
        for (let day of this._schedule.getDays()) {
            let toggle = this.#days.get(day);
            toggle.setValue(true);
        }
    }
}

class ToggleText {
    #span;
    #ident;
    #fcnUpdate;
    #value = false;

    constructor(ident, fcnUpdate) {
        this.#ident = ident;
        this.#span = document.getElementById(ident);
        this.#fcnUpdate = fcnUpdate;
        this.#updateSpan();
        this.#span.addEventListener("click", () => {
            this.#value = !this.#value;
            this.#updateSpan();
            this.#fcnUpdate(this.#value);
        });
    }

    #updateSpan() {
        if (this.#value) {
            this.#span.style.color = "black";
        } else {
            this.#span.style.color = "lightgray";
        }
    }

    setValue(value) {
        this.#value = value;
        this.#updateSpan();
    }
}

class MonthlyEditor extends BasicEditor{
    #dayList;

    constructor(checkbox, div, schedule, parentInterface) {
        super(checkbox, div, schedule, parentInterface);
        this.#setUpDayList();
    }

    #setUpDayList() {
        this.#dayList = document.getElementById("month_days");
        this.#updateDayList();
        this.#dayList.addEventListener("change", () => {
            this.#adaptDayList();
            this.#updateDayList();
        });
    }

    #updateDayList() {
        this.#dayList.value = String(this._schedule.getDays());
    }

    #adaptDayList() {
        this._schedule.clearDays();
        let days = this.#dayList.value.split(",");
        for (let day of days) {
            this._schedule.addDay(Number(day));
        }
    }

}

export {ScheduleEditor}