class ScheduleEditor {
    #ruleRadios;

    constructor(readerSchedule, fcnUpdate) {
        this.#ruleRadios = document.getElementsByName("schedule");
        this.#importSchedule(readerSchedule.returnAsObject(), fcnUpdate);
    }

    #importSchedule(rule, fcnUpdate) {
        for (const element of this.#ruleRadios) {
            element.checked = (element.value === rule);
            element.onChange = () => {this.#updateSchedule(fcnUpdate);};
        }
    }

    #updateSchedule(fcnUpdate) {
        fcnUpdate(this.#gatherSelectedSchedule());
    }

    #gatherSelectedSchedule() {
        for (const element of this.#ruleRadios) {
            if (element.checked) {
                console.log(element.value);
                return element.value;
            }
        }
        return "none";
    }
}

export {ScheduleEditor}