import { ReaderSchedule } from "../../scripts/shared/reader_schedule.js";

describe('Reader Schedule', function() {
    let readerSchedule;

    beforeEach(function() {
        readerSchedule = new ReaderSchedule();
      });

    it('should be able to create instance from undefined', function() {
        expect(readerSchedule).not.toBeUndefined();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('always');
    });

    it('should be able to select the duration schedule', function() {
        let duration = readerSchedule.getDurationOption();
        duration.setActive();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('duration');
    });

    it('should be able to select the weekly schedule', function() {
        let weekly = readerSchedule.getWeeklyOption();
        weekly.setActive();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('weekly');
    });

    it('should be able to select the monthly schedule', function() {
        let monthly = readerSchedule.getMonthlyOption();
        monthly.setActive();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('monthly');
    });

    it('should ignore an old hiatus', function() {
        let hiatus = readerSchedule.getHiatusOption();
        hiatus.setTarget(new Date().getTime() - 9000);
        hiatus.setActive();
        expect(readerSchedule.getActiveSchedule().getType()).not.toBe('hiatus');
        expect(readerSchedule.getActiveSchedule().getType()).toBe('always');
        expect(hiatus.isActive()).toBeFalse();
    });

    it('should use an active hiatus', function() {
        let hiatus = readerSchedule.getHiatusOption();
        hiatus.setTarget(new Date().getTime() + 9000);
        hiatus.setActive();
        expect(readerSchedule.getActiveSchedule().getType()).toBe('hiatus');
        expect(hiatus.isActive()).toBeTrue();
    });
});

describe('Weekly Schedule', function() {
    let weeklySchedule;

    beforeEach(function() {
        let readerSchedule = new ReaderSchedule();
        weeklySchedule = readerSchedule.getWeeklyOption();
    });

    it('monday is default', function() {
        expect(weeklySchedule.hasDay('monday')).toBeTrue();
        expect(weeklySchedule.hasDay('tuesday')).toBeFalse();
        expect(weeklySchedule.getDays()).toEqual(['monday']);
    });

    it('does not allow addition of invalid days', function() {
        weeklySchedule.addDay('someday');
        expect(weeklySchedule.hasDay('someday')).toBeFalse();
        expect(weeklySchedule.getDays()).toEqual(['monday']);

        weeklySchedule.setDays(['tuesday', 'friday', 'someday']);
        expect(weeklySchedule.hasDay('someday')).toBeFalse();
        expect(weeklySchedule.getDays().includes('someday')).toBeFalse();
        expect(weeklySchedule.getDays()).toEqual(['tuesday', 'friday']);
    });

    it('Can remove a day', function() {
        weeklySchedule.removeDay('someday');
        expect(weeklySchedule.hasDay('monday')).toBeTrue();

        weeklySchedule.removeDay('monday');
        expect(weeklySchedule.hasDay('monday')).toBeFalse();
    });
});

describe('Monthly Schedule', function() {
    let monthlySchedule;

    beforeEach(function() {
        let readerSchedule = new ReaderSchedule();
        monthlySchedule = readerSchedule.getMonthlyOption();
    });

    it('defaults apply', function() {
        expect(monthlySchedule.hasDay(1)).toBeTrue();
        expect(monthlySchedule.hasDay(15)).toBeTrue();
        expect(monthlySchedule.hasDay(31)).toBeFalse();
        expect(monthlySchedule.getDays()).toEqual([1, 15]);
    });

    it('can clear days', function() {
        monthlySchedule.clearDays();
        expect(monthlySchedule.getDays()).toEqual([]);
    });

    it('can add valid days', function() {
        monthlySchedule.clearDays();
        monthlySchedule.addDay(12);
        expect(monthlySchedule.hasDay(12)).toBeTrue();
        expect(monthlySchedule.hasDay(11)).toBeFalse();

        monthlySchedule.addDay(31);
        expect(monthlySchedule.hasDay(31)).toBeTrue();
    });

    it('can remove single days', function() {
        monthlySchedule.removeDay(31);
        expect(monthlySchedule.getDays()).toEqual([1, 15]);

        monthlySchedule.removeDay(1);
        expect(monthlySchedule.getDays()).toEqual([15]);
    });
    
    it('does not allow addition of invalid days', function() {
        monthlySchedule.clearDays();
        monthlySchedule.addDay(0);
        expect(monthlySchedule.getDays()).toEqual([]);

        monthlySchedule.addDay(32);
        expect(monthlySchedule.getDays()).toEqual([]);

        monthlySchedule.setDays([0, 2, 10, 32]);
        expect(monthlySchedule.getDays()).toEqual([2, 10]);
    });
});