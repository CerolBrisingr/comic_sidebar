import { UrlListener } from "../shared/url_listener.js"

class TabSelector {
    #button;
    #fktFinalize;

    constructor(addSiteButton, fktFinalize) {
        this.#button = addSiteButton;
        this.#fktFinalize = fktFinalize;
        this.#setUpButton();
    }

    #setUpButton() {
        // TODO:
        // Early assessment opens a few necessary steps:
        // * Sort by last use
        // * Add search bar, some users have an excessive amount of tabs
        // * Set maximum length with scroll bar, same reason
        this.#button.onclick = async () => {
            const tabs = await UrlListener.listAllTabs();
            for (const tab of tabs) {
                tab.print();
            }
            this.#sendTab(tabs[0]);
        };
    }

    #sendTab(tab) {
        this.#fktFinalize(tab);
    }
}

export { TabSelector }