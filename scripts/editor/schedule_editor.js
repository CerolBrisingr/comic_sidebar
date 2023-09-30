class ScheduleEditor {
    #always;
    #duration;
    #weekly;
    #monthly;
    #hiatus;

    constructor(readerSchedule) {
        let myInterface = new EditorInterface(this);
        this.#always = new BasicEditor("always", "always_frame", readerSchedule.getAlwaysOption(), myInterface);
        this.#duration = new DurationEditor("duration", "duration_frame", readerSchedule.getDurationOption(), myInterface);
        this.#weekly = new WeeklyEditor("weekly", "weekly_frame", readerSchedule.getWeeklyOption(), myInterface);
        this.#monthly = new MonthlyEditor("monthly", "monthly_frame", readerSchedule.getMonthlyOption(), myInterface);
        this.#hiatus = new HiatusEditor(readerSchedule.getHiatusOption(), myInterface);
        this.updateActivityChecks();
        this.updateAvailability();
    }

    updateActivityChecks() {
        // States of schedules are linked, corresponding visuals are not
        this.#always.updateActiveState();
        this.#duration.updateActiveState();
        this.#weekly.updateActiveState();
        this.#monthly.updateActiveState();
    }

    updateAvailability() {
        // Signal blocking character of hiatus
        if (this.#hiatus.isActive()) {
            this.#always.disableInteraction();
            this.#duration.disableInteraction();
            this.#weekly.disableInteraction();
            this.#monthly.disableInteraction();
        } else {
            this.#always.enableInteraction();
            this.#duration.enableInteraction();
            this.#weekly.enableInteraction();
            this.#monthly.enableInteraction();
        }
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

    updateAvailability() {
        this.#scheduleEditor.updateAvailability();
    }

}

class BasicEditor {
    // Covers interaction with active state and corresponding UI elements

    constructor(checkbox, div, schedule, parentInterface) {
        this._checkbox = document.getElementById(checkbox);
        this._div = document.getElementById(div);
        this._schedule = schedule;
        this._interface = parentInterface;
        this._checkbox.addEventListener("click", (evt) => {
            this._schedule.setActive();
            // Seems like you cannot listen to the state of the scheduler.
            // Going via ScheduleEditor then, update all others manually.
            this._interface.updateActivityChecks();
        });
    }

    updateActiveState() {
        // Update UI using schedule state
        if (this._schedule.isActive()) {
            this._checkbox.checked = true;
            this._expand();
        } else {
            this._checkbox.checked = false;
            this._collapse();
        }
    }

    enableInteraction() {
        // TODO: allow user interaction
        this.updateActiveState();
    }

    disableInteraction() {
        // TODO: disable user interaction
        this._collapse();
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
        // Update UI from schedule data
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
        // Update UI from schedule data
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
        // Adjust schedule to toggle state
        if (value) {
            this._schedule.addDay(day);
        } else {
            this._schedule.removeDay(day);
        }
    }

    #setUpDayList() {
        // Adjust toggle states to schedule
        for (let day of this._schedule.getDays()) {
            let toggle = this.#days.get(day);
            toggle.setValue(true);
        }
    }
}

class ToggleText {
    #span;
    #ident; // Store for easier debugging
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
        // Adjust UI to display state of #value
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
        // Update UI from schedule data
        this.#dayList.value = String(this._schedule.getDays());
    }

    #adaptDayList() {
        // Replace schedule by content of UI input
        this._schedule.clearDays();
        let days = this.#dayList.value.split(",");
        for (let day of days) {
            this._schedule.addDay(Number(day));
        }
    }

}

class Hiatus {
    #active;
    #schedule;
    #interface;
    #checkbox;
    #div;

    constructor(schedule, parentInterface) {
        this.#checkbox = document.getElementById("hiatus");
        this.#div = document.getElementById("hiatus_frame");
        this.#schedule = schedule;
        this.#interface = parentInterface;
        this.#updateInterface();
        this.#checkbox.addEventListener("click", (evt) => {
            this.#schedule.setState(evt.value);
            // Seems like you cannot listen to the state of the scheduler.
            // Going via ScheduleEditor then, update all others manually.
            this.#interface.updateAvailability();
        });
    }

    isActive() {
        return this.#active;
    }

    #updateInterface() {
        // read active state
        // read targetDate
        // targetDate in past?
        //  -> targetDate tomorrow
        //  -> active state false
        // set checkmark
        // set timing fields
    }
}

export {ScheduleEditor}