import { dissectUrl } from "../shared/url.js";

// TODO: refactor once transition is complete

class PrefixSelector {
    #main;
    #edge;
    #trail;
    #prefixLine;
    
    #url;
    #fcnUpdate;
    #iSplit;
    #minIndex;

    #mouseDown = false;

    constructor(url, prefix_mask, fcnUpdate, ui = undefined) {
        this.#url = url;
        this.#fcnUpdate = fcnUpdate;
        this.#collectUi(ui);
        this.#setUpSpans(prefix_mask);
        this.#setUpInteractions();
    }

    #collectUi(ui) {
        if (ui === undefined) {
            this.#main = document.getElementById("prefix_main");
            this.#edge = document.getElementById("prefix_edge");
            this.#trail = document.getElementById("prefix_trail");
            this.#prefixLine = document.getElementById("prefix_line");
        } else {
            this.#main = ui.main;
            this.#edge = ui.edge;
            this.#trail = ui.trail;
            this.#prefixLine = ui.prefixLine;
        }
    }

    #setUpSpans(prefix_mask) {
        let urlPieces = dissectUrl(this.#url);
        if (urlPieces === undefined)
            return;
        this.#iSplit = prefix_mask.length - 1;
        this.#minIndex = urlPieces.base_url.length - 1;
        
        this.#updateLine();
        this.#sendUpdate();
    }

    #setUpInteractions() {
        const fctKeyAction = (evt) => {
            this.#reactToKey(evt.code);
        }
        const fctMouseMove = (evt) => {
            this.#catchPosition(evt);
        }

        this.#prefixLine.addEventListener("mousedown", (evt) => {
            // Start tracking only when dragging on prefix selection elements
            if (!this.#checkBounds(evt))
                return;
            fctMouseMove(evt);
            document.addEventListener("mousemove", fctMouseMove);
            this.#mouseDown = true;
            this.#prefixLine.focus();
        });
        document.addEventListener("mouseup", () => {
            // Stop tracking whereever the mouse is let loose
            // Could dynamically add and remove this one
            document.removeEventListener("mousemove", fctMouseMove);
            if (this.#mouseDown) {
                // Only change focus if there is actually an event going on
                this.#prefixLine.focus();
                this.#mouseDown = false;
            }
        });
        this.#prefixLine.addEventListener("focus", () => {
            document.addEventListener('keydown', fctKeyAction);
        });
        this.#prefixLine.addEventListener("blur", () => {
            document.removeEventListener('keydown', fctKeyAction);
        });
    }

    #checkBounds(evt) {
        // Positions before start of text or after end of text are out of bounds
        // Clicking before or after the text should not elicit a reaction
        let mainBox = this.#main.getBoundingClientRect();
        let edgeBox = this.#edge.getBoundingClientRect();
        let trailBox = this.#trail.getBoundingClientRect();
        // With multiple lines, any element can form the right border
        // Be left of the rightmost one
        let inBounds = evt.x <= trailBox.right;
        inBounds |= evt.x <= edgeBox.right;
        inBounds |= evt.x <= mainBox.right;
        // The main/prefix is part of the left border in any way
        inBounds &= evt.x >= mainBox.left;
        return inBounds;
    }

    #reactToKey(key) {
        if (key === "ArrowRight") {
            this.#iSplit = Math.min(this.#url.length, this.#iSplit + 1);
        } else if (key === "ArrowLeft") {
            this.#iSplit = Math.max(this.#minIndex, this.#iSplit - 1);
        } else {
            return;
        }
        this.#updateLine();
        this.#sendUpdate();
    }

    #hasRoomAbove() {
        // Can the edge still move at least one row up?
        let box_main = this.#main.getBoundingClientRect();
        let box_edge = this.#edge.getBoundingClientRect();
        return Math.abs(box_main.top - box_edge.top) > 0.1;
    }

    #hasRoomBelow() {
        // Can the edge still move at least one row down?
        let box_edge = this.#edge.getBoundingClientRect();
        let box_tail = this.#trail.getBoundingClientRect();
        return Math.abs(box_tail.bottom - box_edge.bottom) > 0.1;
    }
    
    #updateLine() {
        const iSplit = this.#iSplit;
        this.#main.innerText = this.#url.slice(0, iSplit);
        this.#edge.innerText = this.#url.slice(iSplit, iSplit + 1); 
        this.#trail.innerText = this.#url.slice(iSplit + 1);
    }

    #sendUpdate() {
        // Info shows the currently selected text
        let selectedPrefix = this.#url.slice(0, this.#iSplit + 1);
        this.#fcnUpdate(selectedPrefix);
    }

    #decideDirection(target) {
        // returns [stepSize, fcnVerifyStillRunning]
        let box = this.#edge.getBoundingClientRect();
        const reachedEnd = (index) => {return index < this.#url.length};
        const reachedStart = (index) => {return index > this.#minIndex -1};
        if (box.top > target.y && this.#hasRoomAbove()) {
            return [-1, reachedStart];
        } else if (box.bottom < target.y && this.#hasRoomBelow()) {
            return [1, reachedEnd];
        }
        if (box.right < target.x) {
            return [1, reachedEnd];
        } else if (box.left > target.x) {
            return [-1, reachedStart];
        } else {
            return [0, undefined];
        }
    }

    #foundPosition(target, box) {
        if (!this.#rowMatches(target, box))
            return false;
        return this.#columnMatches(target, box);
    }

    #rowMatches(target, box) {
        if (target.y > box.bottom && this.#hasRoomBelow())
            return false;
        if (target.y < box.top && this.#hasRoomAbove())
            return false;
        return true;
    }

    #columnMatches(target, box) {
        return ((box.left <= target.x) & (box.right >= target.x));
    }
    
    #catchPosition(target) {
        let [iStep, fcnStillRun] = this.#decideDirection(target);
        if (iStep === 0)
            return;
        for (let iPos = this.#iSplit; fcnStillRun(iPos); iPos += iStep) {
            this.#iSplit = iPos;
            this.#updateLine();
            let box = this.#edge.getBoundingClientRect();
            if (this.#foundPosition(target, box)) {
                break;
            }
        }
        this.#sendUpdate();
    }
}

export {PrefixSelector}