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
})