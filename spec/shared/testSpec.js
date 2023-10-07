import { ReaderData } from "../../scripts/shared/reader_data.js";

describe("ReaderData", function() {
    let object = readerObject();
    let readerData;

    it('should be able to construct from this', function() {
        readerData = ReaderData.buildForEditor(object);

        expect(readerData).not.toBeUndefined();
        expect(readerData.getLabel()).toBe(object.label);
    });
});

function readerObject() {
    return {
        prefix_mask: "www.xkcd.com",
        label: "XKCD",
        automatic: [
            {href: "www.xkcd.com/123/"}
        ]
    }
}