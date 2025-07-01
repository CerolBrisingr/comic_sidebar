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

describe('Weekly', function() {
    let readerSchedule;
    let weeklySchedule;
    let scheduler;
    let lastInteraction;
    let now;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        weeklySchedule = readerSchedule.getWeeklyOption();
        weeklySchedule.setActive();
        let showAll = new ShowAllInterfaceStub();
        scheduler = new Scheduler(readerSchedule, showAll);
    });

    it('should call _getWeeklyFcn', function() {
        spyOn(scheduler, '_getWeeklyFcn');
        scheduler.updateRuleset(readerSchedule);
        expect(scheduler._getWeeklyFcn).toHaveBeenCalledTimes(1);
    });

    it('works with single reset day', function() {
        // Monday is default
        expect(weeklySchedule.getDays()).toEqual(['monday']);

        lastInteraction = new Date(2023, 5, 3, 13, 0).getTime(); // SA

        now = new Date(2023, 5, 4, 23, 59); // SO
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2023, 5, 5, 0, 1); // MO
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it('does fall back to 7 days', function() {
        weeklySchedule.setDays([]);
        expect(weeklySchedule.getDays()).toEqual([]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2023, 5, 3, 13, 0).getTime(); // SA

        now = new Date(2023, 5, 9, 23, 59); // FR
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2023, 5, 10, 0, 1); // SA
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it('uses the nearest reset available', function() {
        weeklySchedule.addDay('wednesday');
        expect(weeklySchedule.getDays()).toEqual(['monday', 'wednesday']);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2023, 5, 5, 13, 0).getTime(); // MO

        now = new Date(2023, 5, 6, 23, 59); // TU
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();

        now = new Date(2023, 5, 7, 0, 1); // WE
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });
});

describe('Monthly', function() {
    let readerSchedule;
    let monthlySchedule;
    let scheduler;
    let lastInteraction;
    let now;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        monthlySchedule = readerSchedule.getMonthlyOption();
        monthlySchedule.setActive();
        let showAll = new ShowAllInterfaceStub();
        scheduler = new Scheduler(readerSchedule, showAll);
    });

    it('should call _getMonthlyFcn', function() {
        spyOn(scheduler, '_getMonthlyFcn');
        scheduler.updateRuleset(readerSchedule);
        expect(scheduler._getMonthlyFcn).toHaveBeenCalledTimes(1);
    });

    it('should fall back to same day in last month', function() {
        monthlySchedule.setDays([]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2020, 1, 12, 0, 1).getTime();
        now = new Date(2020, 2, 11, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 2, 12, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
        
        lastInteraction = new Date(2020, 5, 12, 0, 1).getTime();
        now = new Date(2020, 6, 11, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 6, 12, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it('should behave for day 31', function() {
        monthlySchedule.setDays([31]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2020, 1, 12, 0, 1).getTime();
        now = new Date(2020, 1, 29, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 2, 1, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        lastInteraction = new Date(2020, 5, 12, 0, 1).getTime();
        now = new Date(2020, 5, 30, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 5, 31, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it('should behave for day 1', function() {
        monthlySchedule.setDays([1]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2020, 0, 12, 0, 1).getTime();
        now = new Date(2020, 0, 31, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 1, 1, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        lastInteraction = new Date(2020, 0, 1, 0, 1).getTime();
        now = new Date(2020, 0, 31, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 1, 1, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it('should behave for day 15', function() {
        monthlySchedule.setDays([15]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2020, 0, 1, 0, 1).getTime();
        now = new Date(2020, 0, 14, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 0, 15, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        lastInteraction = new Date(2020, 0, 31, 0, 1).getTime();
        now = new Date(2020, 1, 14, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 1, 15, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it('should behave for multiple days', function() {
        monthlySchedule.setDays([10, 15, 20]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = new Date(2020, 0, 1, 0, 1).getTime();
        now = new Date(2020, 0, 9, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 0, 10, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        lastInteraction = new Date(2020, 0, 11, 0, 1).getTime();
        now = new Date(2020, 0, 14, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 0, 15, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        lastInteraction = new Date(2020, 0, 17, 0, 1).getTime();
        now = new Date(2020, 0, 19, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 0, 20, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();

        lastInteraction = new Date(2020, 0, 25, 0, 1).getTime();
        now = new Date(2020, 1, 9, 23, 59);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
        now = new Date(2020, 1, 10, 0, 1);
        expect(scheduler.isScheduled(now, lastInteraction)).toBeTrue();
    });

    it ('should no longer show this ahead of time', function () {
        monthlySchedule.setDays([9]);
        scheduler.updateRuleset(readerSchedule);

        lastInteraction = 1749490292518;    // 9.6.2025
        now = new Date(2025, 6, 1, 10, 0);  // 1.7.2025
        expect(scheduler.isScheduled(now, lastInteraction)).toBeFalse();
    });
});

describe('Hiatus', function() {
    let readerSchedule;
    let hiatusSchedule;
    let scheduler;
    let lastInteraction;
    let now;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
        hiatusSchedule = readerSchedule.getHiatusOption();
        let showAll = new ShowAllInterfaceStub();
        scheduler = new Scheduler(readerSchedule, showAll);
        hiatusSchedule.setActive();
    });

    it('should call isActiveValid()', function() {
        spyOn(hiatusSchedule, 'isActiveValid');
        scheduler.updateRuleset(readerSchedule);
        expect(hiatusSchedule.isActiveValid).toHaveBeenCalledTimes(1);
    });

    it('should never look for follow up on passed hiatus', function() {
        spyOn(hiatusSchedule, 'setFollowUp');
        let now = new Date().getTime();
        hiatusSchedule.setTarget(now - toDays(2));
        scheduler.updateRuleset(readerSchedule);

        expect(hiatusSchedule.setFollowUp).toHaveBeenCalledTimes(0);
    });

    it('should look for follow up on still active hiatus', function() {
        spyOn(hiatusSchedule, 'setFollowUp');
        let now = new Date().getTime();
        hiatusSchedule.setTarget(now + toDays(2));
        try {
            // Spy on getFollowUp() returns 'undefined' and causes problems
            scheduler.updateRuleset(readerSchedule);
        } catch(error) {}

        expect(hiatusSchedule.setFollowUp).toHaveBeenCalledTimes(1);
    });

    it('should allow follow up on passed hiatus', function() {
        let now = new Date().getTime();
        hiatusSchedule.setTarget(now - toDays(2));
        scheduler.updateRuleset(readerSchedule);

        expect(scheduler.isScheduled(new Date(now), now)).toBeTrue();
        expect(hiatusSchedule.isActive()).toBeFalse();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('always');
    });

    it('should block follow up on active hiatus', function() {
        let now = new Date().getTime();
        hiatusSchedule.setTarget(now + toDays(2));
        scheduler.updateRuleset(readerSchedule);

        expect(scheduler.isScheduled(new Date(now), now)).toBeFalse();
        expect(hiatusSchedule.isActive()).toBeTrue();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('hiatus');
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