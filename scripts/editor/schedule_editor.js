class ScheduleEditor {
    #always;
    #duration;
    #weekly;
    #monthly;
    #schedule;

    constructor(readerSchedule) {
        this.#schedule = readerSchedule;
        let myInterface = new EditorInterface(this);
        this.#always = new BasicEditor("always", "always_frame", readerSchedule.getAlwaysOption(), myInterface);
        this.#duration = new BasicEditor("duration", "duration_frame", readerSchedule.getDurationOption(), myInterface);
        this.#weekly = new BasicEditor("weekly", "weekly_frame", readerSchedule.getWeeklyOption(), myInterface);
        this.#monthly = new BasicEditor("monthly", "monthly_frame", readerSchedule.getMonthlyOption(), myInterface);
        this.updateActivityChecks();
    }

    updateActivityChecks() {
        this.#always.updateState();
        this.#duration.updateState();
        this.#weekly.updateState();
        this.#monthly.updateState();
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

    updateState() {
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

export {ScheduleEditor}