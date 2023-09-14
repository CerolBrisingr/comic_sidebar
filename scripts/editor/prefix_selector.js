import { dissectUrl } from "../shared/url.js";

class PrefixSelector {
    #main;
    #edge;
    #trail;
    
    #url;
    #fcnUpdate;
    #iSplit;
    #minIndex;

    #mouseDown = false;

    constructor(url, fcnUpdate) {
        this.#url = url;
        this.#fcnUpdate = fcnUpdate;
        this.#setUpSpans();
        this.#setUpInteractions();
    }

    #setUpSpans() {
        let urlPieces = dissectUrl(this.#url);
        if (urlPieces === undefined)
            return;
        this.#iSplit = urlPieces.base_url.length - 1;
        this.#minIndex = this.#iSplit;
        
        this.#main = document.getElementById("prefix_main");
        this.#edge = document.getElementById("prefix_edge");
        this.#trail = document.getElementById("prefix_trail");
        
        this.#updateLine();
        this.#sendUpdate();
    }

    #setUpInteractions() {
        const fctKeyAction = (evt) => {
            this.#reactToKey(evt.code);
        }
        const fctMouseMove = (evt) => {
            this.#catchPosition(evt.x);
        }

        const line = document.getElementById("prefix_line");
        line.addEventListener("mousedown", (evt) => {
            // Start tracking only when dragging on prefix selection elements
            if (!this.#checkBounds(evt))
                return;
            fctMouseMove(evt);
            document.addEventListener("mousemove", fctMouseMove);
            this.#mouseDown = true;
            line.focus();
        });
        document.addEventListener("mouseup", () => {
            // Stop tracking whereever the mouse is let loose
            // Could dynamically add and remove this one
            document.removeEventListener("mousemove", fctMouseMove);
            if (this.#mouseDown) {
                // Only change focus if there is actually an event going on
                line.focus();
                this.#mouseDown = false;
            }
        });
        line.addEventListener("focus", () => {
            document.addEventListener('keydown', fctKeyAction);
        });
        line.addEventListener("blur", () => {
            document.removeEventListener('keydown', fctKeyAction);
        });
    }

    #checkBounds(evt) {
        // Positions before start of text or after end of text are out of bounds
        let trailBox = this.#trail.getBoundingClientRect();
        let mainBox = this.#main.getBoundingClientRect();
        let inBounds = evt.x <= trailBox.right;
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
        if (box.right < target) {
            return [1, (val) => {return val < this.#url.length;}];
        } else if (box.left > target) {
            return [-1, (val) => {return val > this.#minIndex -1;}];
        } else {
            return [0, undefined];
        }
    }
    
    #catchPosition(target) {
        let [iStep, fcnStillRun] = this.#decideDirection(target);
        if (iStep === 0)
            return;
        for (let iPos = this.#iSplit; fcnStillRun(iPos); iPos += iStep) {
            this.#iSplit = iPos;
            this.#updateLine();
            let box = this.#edge.getBoundingClientRect();
            if ((box.left <= target) & (box.right >= target)) {
                break;
            }
        }
        this.#sendUpdate();
    }
}

export {PrefixSelector}