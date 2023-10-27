import { getBoolean } from "./backup_import.js"
import { saveBoolean } from "./backup_export.js"

class HideableHint {
    #active = false;

    constructor(propertyName, divId, btnId) {
        if (btnId === undefined)
            return;
        this.init(propertyName, divId, btnId);
    }

    async init(propertyName, divId, btnId) {
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