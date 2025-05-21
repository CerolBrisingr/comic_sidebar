import { UrlListener } from "../shared/url_listener.js"
import { HTML } from "../shared/html.js";

const EXCEPTION_TAG = "add_site_interactive_part";

class TabSelector {
    #button;
    #dropdown;
    #isOpen = false;

    constructor(addSiteDropdown, fktFinalize) {
        this.#importUi(addSiteDropdown);
        this.#setUpButton(fktFinalize);
    }

    #importUi(addSiteDropdown) {
        this.#button = addSiteDropdown.button;
        this.#dropdown = addSiteDropdown.dropdown;
    }

    #buildFinalizeFkt(fktFinalize) {
        return (tab) => {
            this.#closeDropdown();
            fktFinalize(tab);
        }
    }

    #setUpButton(fktFinalize) {
        // TODO:
        // Early assessment opens a few necessary steps:
        // * Sort by last use
        // * Add search bar, some users have an excessive amount of tabs
        // * Set maximum length with scroll bar, same reason
        fktFinalize = this.#buildFinalizeFkt(fktFinalize);
        this.#button.onclick = async () => {
            if (this.#isOpen) {
                this.#closeDropdown();
            } else {
                this.#openDropdown(fktFinalize);
            }
        };
        HTML.addCssProperty(this.#button, EXCEPTION_TAG);
        this.#button.onblur = (evt) => {this.#onBlur(evt)};
    }

    async #openDropdown(fktFinalize) {
        this.#isOpen = true;
        const tabs = await UrlListener.listAllTabs();
        for (const tab of tabs) {
            new TabOption(tab, this.#dropdown, fktFinalize);
        }
        this.#dropdown.style.display = "flex";
    }

    #onBlur(evt) {
        // TODO: Set as onblur event on all exceptions as well

        // Certain elements can take focus without closing the 
        // dropdown menu. Those elements must invoke this onblur
        // event themselves. 
        // Example: sort modifier, search bar
        if (evt.relatedTarget == null) {
            return; }
        if (!evt.relatedTarget.classList.contains(EXCEPTION_TAG)) {
            this.#closeDropdown(); }
        return;
        
    }

    #closeDropdown() {
        this.#isOpen = false;
        this.#dropdown.style.display = "none";
        HTML.removeChildElements(this.#dropdown);
    }
}

class TabOption {
    #fktFinalize;
    #tab;

    constructor(tab, dropdown, fktFinalize) {
        this.#fktFinalize = fktFinalize;
        this.#tab = tab;
        this.#buildOption(dropdown);
    }

    #buildOption(dropdown) {
        const button = HTML.insertElement(dropdown, "button");
        HTML.addCssProperty(button, "dropdown_option");
        HTML.addCssProperty(button, EXCEPTION_TAG); // blur kills dropdown too early otherwise
        HTML.addText(button, this.#tab.getTitle());
        button.onclick = () => {
            this.#finalize();
        }
    }

    #finalize() {
        this.#fktFinalize(this.#tab);
    }
}

export { TabSelector }