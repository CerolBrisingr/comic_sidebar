import { UrlListener } from "../shared/url_listener.js"
import { HTML } from "../shared/html.js";

class TabSelector {

    constructor(addSiteButton, addSiteDropdown, fktFinalize) {
        this.#setUpButton(addSiteButton, addSiteDropdown, fktFinalize);
    }

    #buildFinalizeFkt(addSiteDropdown, fktFinalize) {
        return (tab) => {
            addSiteDropdown.style.display = "none";
            fktFinalize(tab);
        }
    }

    #setUpButton(addSiteButton, addSiteDropdown, fktFinalize) {
        // TODO:
        // Early assessment opens a few necessary steps:
        // * Sort by last use
        // * Add search bar, some users have an excessive amount of tabs
        // * Set maximum length with scroll bar, same reason
        fktFinalize = this.#buildFinalizeFkt(addSiteDropdown, fktFinalize);
        addSiteButton.onclick = async () => {
            HTML.removeChildElements(addSiteDropdown);
            const tabs = await UrlListener.listAllTabs();
            for (const tab of tabs) {
                new TabOption(tab, addSiteDropdown, fktFinalize);
            }
            addSiteDropdown.style.display = "flex";
        };
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
        const field = HTML.insertElement(dropdown, "div");
        HTML.addCssProperty(field, "dropdown_option");
        HTML.addSpan(field, this.#tab.getTitle());
        field.onclick = () => {
            this.#finalize();
        }
    }

    #finalize() {
        this.#fktFinalize(this.#tab);
    }
}

export { TabSelector }