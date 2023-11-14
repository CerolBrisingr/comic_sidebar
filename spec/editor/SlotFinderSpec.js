import { SlotFinder } from "../../scripts/editor/tag_editor.js";

describe("SlotFinder", function() {
    let filledList;
    let singleItem;
    let shortList;
    let slot;

    beforeEach(function() {
        singleItem = [];
        singleItem.push(new TagDummy("aaaa"));

        shortList = [];
        shortList.push(new TagDummy("aaaa"));
        shortList.push(new TagDummy("cccc"));

        filledList = [];
        filledList.push(new TagDummy("aaaa"));
        filledList.push(new TagDummy("cccc"));
        filledList.push(new TagDummy("eeee"));
        filledList.push(new TagDummy("gggg"));
        filledList.push(new TagDummy("iiii"));
    });

    it("should work well with a single item", function() {
        slot = SlotFinder.findTagSlot("aaaa", singleItem);
        expect(slot).toBe(0);
        
        slot = SlotFinder.findTagSlot("AAAA", singleItem);
        expect(slot).toBe(0);
        
        slot = SlotFinder.findTagSlot("aaab", singleItem);
        expect(slot).toBe(1);
    });
    
    it("should work well with two items", function() {
        slot = SlotFinder.findTagSlot("aaaa", shortList);
        expect(slot).toBe(0);
        
        slot = SlotFinder.findTagSlot("AAAA", shortList);
        expect(slot).toBe(0);
        
        slot = SlotFinder.findTagSlot("aaab", shortList);
        expect(slot).toBe(1);
        
        slot = SlotFinder.findTagSlot("dddd", shortList);
        expect(slot).toBe(2);
    });

    it("should work well with many items", function() {
        slot = SlotFinder.findTagSlot("aaaa", filledList);
        expect(slot).toBe(0);
        
        slot = SlotFinder.findTagSlot("AAAA", filledList);
        expect(slot).toBe(0);
        
        slot = SlotFinder.findTagSlot("aaab", filledList);
        expect(slot).toBe(1);
        
        slot = SlotFinder.findTagSlot("dddd", filledList);
        expect(slot).toBe(2);

        slot = SlotFinder.findTagSlot("iiij", filledList);
        expect(slot).toBe(5);
    });
});

class TagDummy {
    #string;

    constructor(label) {
        this.#string = label;
    }

    getString() {
        return this.#string;
    }
}