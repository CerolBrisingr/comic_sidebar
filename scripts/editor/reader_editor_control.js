import { ListeningPort } from "../background/listening_port.js";

class ReaderEditorControl {
    constructor() {
        throw new Error("Static class, do not instantiate!")
    }
    
    static port;
    static fktFinalize;

    static setUpController() {
        console.log("Setting up editor controller");
        ReaderEditorControl.port = new ListeningPort(ReaderEditorControl.receive, "editor_form");
    }

    static receive(message) {
        if (message === "setUp") {
            const evt = new Event("myEvent");
            window.dispatchEvent(evt);
            return;
        }
        if (message.hasOwnProperty("data")) {
            console.log("create/update");
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
        return new Promise((resolve) => {
            const listener = () => {
                window.removeEventListener("myEvent", listener);
                resolve();
            }
            window.addEventListener("myEvent", listener);
        })
    }
    
    static async importLink(data, fktFinalize) {
        if (ReaderEditorControl.port === undefined)
            return;
        await ReaderEditorControl.createNewEditorWindow();
        ReaderEditorControl.fktFinalize = fktFinalize;
        ReaderEditorControl.port.sendMessage({import: data});
    }
    
    static async updateLink(readerObjectLike, fktFinalize) {
        if (ReaderEditorControl.port === undefined)
            return;
        await ReaderEditorControl.createNewEditorWindow();
        ReaderEditorControl.fktFinalize = fktFinalize;
        ReaderEditorControl.port.sendMessage({update: readerObjectLike});
    }
    
}


export {ReaderEditorControl}