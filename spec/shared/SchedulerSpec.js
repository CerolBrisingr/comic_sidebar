import { Scheduler } from "../../scripts/shared/scheduler.js";
import { ReaderSchedule } from "../../scripts/shared/reader_schedule.js";

describe('Scheduler', function() {
    let readerSchedule;
    let scheduler;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        let showAll = new ShowAllInterfaceStub();
        scheduler = new Scheduler(readerSchedule, showAll);
    });

    it('should be possible to build one', function() {
        expect(scheduler).not.toBeUndefined();
    });

    it('should always show on default', function() {
        expect(scheduler.canShow(new Date().getTime() + 1000)).toBeTrue();
    });

    it('should call _findRule', function() {
        spyOn(scheduler, '_findRule');
        scheduler.updateRuleset(readerSchedule);
        expect(scheduler._findRule).toHaveBeenCalledTimes(1);
    });
});


describe('Show All', function() {
    let readerSchedule;
    let scheduler;
    let showAll;
    let lastInteraction;
    let now;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        showAll = new ShowAllInterfaceStub();
        let duration = readerSchedule.getDurationOption();
        duration.setActive();
        duration.setUnit('weeks');
        duration.setAmount(1);
        scheduler = new Scheduler(readerSchedule, showAll);
    });

    it('should be possible to hide things', function(){
        showAll.setValue(false);
        lastInteraction = new Date().getTime() - toDays(1);
        expect(scheduler.canShow(lastInteraction)).toBeFalse();
    });

    it('should be possible to ignore schedule', function(){
        showAll.setValue(true);
        lastInteraction = new Date().getTime() - toDays(1);
        expect(scheduler.canShow(lastInteraction)).toBeTrue();
    });

    it('A clear schedule should push through anyway', function() {
        showAll.setValue(false);
        lastInteraction = new Date().getTime() - toDays(10);
        expect(scheduler.canShow(lastInteraction)).toBeTrue();
    });

    it('A clear schedule should surely work with showAll', function() {
        showAll.setValue(true);
        lastInteraction = new Date().getTime() - toDays(10);
        expect(scheduler.canShow(lastInteraction)).toBeTrue();
    });

});

function toDays(amount) {
    return amount * 1000 * 60 * 60 * 24;
}

describe('Duration Option', function() {
    let readerSchedule;
    let durationSchedule;
    let scheduler;
    let lastInteraction;
    let now;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        durationSchedule = readerSchedule.getDurationOption();
        durationSchedule.setActive();
        let showAll = new ShowAllInterfaceStub();
        scheduler = new Scheduler(readerSchedule, showAll);
    });

    it('should call _getDurationFcn', function() {
        spyOn(scheduler, '_getDurationFcn');
        scheduler.updateRuleset(readerSchedule);
        expect(scheduler._getDurationFcn).toHaveBeenCalledTimes(1);
    });

    it('should work well with 2 hours', function() {
        durationSchedule.setUnit('hours');
        durationSchedule.setAmount(2);
        scheduler.updateRuleset(readerSchedule);

        expect(durationSchedule.getUnit()).toBe('hours');
        expect(durationSchedule.getAmount()).toBe(2);
        
        lastInteraction = new Date(2000, 0, 1, 10).getTime();

        now = new Date(2000, 0, 1, 10, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2000, 0, 1, 12, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        now = new Date(2000, 0, 1, 11, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
    });

    it('should work well with 3 days', function() {
        durationSchedule.setUnit('days');
        durationSchedule.setAmount(3);
        scheduler.updateRuleset(readerSchedule);

        expect(durationSchedule.getUnit()).toBe('days');
        expect(durationSchedule.getAmount()).toBe(3);

        lastInteraction = new Date(2000, 0, 1, 10).getTime();

        now = new Date(2000, 0, 2);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2000, 0, 4, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        now = new Date(2000, 0, 3, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
    });

    it('should work well with 4 weeks', function() {
        durationSchedule.setUnit('weeks');
        durationSchedule.setAmount(4);
        scheduler.updateRuleset(readerSchedule);

        expect(durationSchedule.getUnit()).toBe('weeks');
        expect(durationSchedule.getAmount()).toBe(4);

        lastInteraction = new Date(2000, 6, 2, 10).getTime();

        now = new Date(2000, 6, 3, 4);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2000, 6, 30, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        now = new Date(2000, 6, 29, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
    });
    
    it('should work well with 2 months', function() {
        durationSchedule.setUnit('months');
        durationSchedule.setAmount(2);
        scheduler.updateRuleset(readerSchedule);

        expect(durationSchedule.getUnit()).toBe('months');
        expect(durationSchedule.getAmount()).toBe(2);

        lastInteraction = new Date(2000, 6, 2, 10).getTime();

        now = new Date(2000, 6, 3, 4);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2000, 8, 2, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        now = new Date(2000, 8, 1, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
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