import { getBoolean } from "./backup_import.js"
import { saveBoolean } from "./backup_export.js"

class HideableHint {
    #active = false;

    constructor(hintName) {
        if (hintName === undefined)
            return;
        this.init(hintName);
    }

    async init(hintName) {
        const propertyName = "show_" + hintName + "_hint";
        const divId = hintName + "_hint";
        const btnId = hintName + "_hint_dismiss";
        this.#active = await getBoolean(propertyName, true);
        if (this.#active) {
            let div = document.getElementById(divId);
            let btn = document.getElementById(btnId);

            div.style.display = "block";
            btn.addEventListener("click", () => {
                div.style.display = "none";
                saveBoolean(propertyName, false);
            });
        }
    }

    isActive() {
        return this.#active;
    }
}

export {HideableHint}