import { ListeningPort } from "../background/listening_port.js";

class ReaderEditorControl {
    constructor() {
        throw new Error("Static class, do not instantiate!")
    }
    
    static port;
    static fktFinalize;

    static setUpController() {
        ReaderEditorControl.port = new ListeningPort(ReaderEditorControl.receive, "editor_form");
    }

    static receive(message) {
        if (message === "setUp") {
            // Trigger event for custom listener in awaitSetup()
            const evt = new Event("myEvent");
            window.dispatchEvent(evt);
            return;
        }
        if (message.hasOwnProperty("data")) {
            ReaderEditorControl.fktFinalize(message.data);
            return;
        }
    }

    static async createNewEditorWindow() {
        ReaderEditorControl.port.sendMessage("close"); // close any open windows
        let createData = {
            type: "detached_panel",
            url: "../../editor/editor.html",
            width: 500,
            height: 300
          };
        browser.windows.create(createData);
        await ReaderEditorControl.awaitSetup();
    }

    static async awaitSetup() {
        /* awaitSetup
        Setting up a listener to a custom event and awaiting trigger.
        Event will be dispatched once the editor setup script issues
        it's finished confirmation message.
        */
        return new Promise((resolve) => {
            const listener = () => {
                window.removeEventListener("myEvent", listener);
                resolve();
            }
            window.addEventListener("myEvent", listener);
        })
    }

    static async #startEditor(command, data, fktFinalize) {
        if (ReaderEditorControl.port === undefined)
            return;
        await ReaderEditorControl.createNewEditorWindow();
        ReaderEditorControl.fktFinalize = fktFinalize;
        ReaderEditorControl.port.sendMessage({[command]: data});
    }
    
    static async createReaderEntry(data, fktFinalize) {
        ReaderEditorControl.#startEditor("import", data, fktFinalize);
    }
    
    static async updateReaderEntry(readerObjectLike, fktFinalize) {
        ReaderEditorControl.#startEditor("update", readerObjectLike, fktFinalize);
    }
    
}


export {ReaderEditorControl}