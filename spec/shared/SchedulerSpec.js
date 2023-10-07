import { Scheduler } from "../../scripts/shared/scheduler.js";
import { ReaderSchedule } from "../../scripts/shared/reader_schedule.js";

describe('Scheduler', function() {
    let readerSchedule;
    let scheduler;
    let showAll;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        showAll = new ShowAllInterfaceStub();
        scheduler = new Scheduler(readerSchedule, showAll);
    });

    it('should be possible to build one', function() {
        expect(scheduler).not.toBeUndefined();
        expect(scheduler.canShow()).toBeTrue();
    });
});

class ShowAllInterfaceStub {
    #showAll;

    constructor(showAll = false) {
        this.setValue(showAll);
    }

    setValue(value) {
        this.#showAll = Boolean(value);
    }

    getValue() {
        return this.#showAll;
    }
}