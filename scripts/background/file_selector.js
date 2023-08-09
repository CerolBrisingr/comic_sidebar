class FileSelector {
    #buttonLoadBackup;
    #fktHandover;
    #inputElement;
    
    constructor(buttonLoadBackup, fktHandover) {
        this.#buttonLoadBackup = buttonLoadBackup;
        this.#fktHandover = fktHandover;
        this.#buildInputElement();
    }
    
    #buildInputElement() {
        this.#inputElement = document.createElement("input");
        this.#inputElement.type = "file";
        this.#inputElement.style.display = 'none';
        this.#inputElement.addEventListener('change', (event) => {
            this.#fktHandover(event.target.files[0]);
        });    
        this.#buttonLoadBackup.onclick = () => {
            this.#inputElement.click();
        }
        this.#buttonLoadBackup.innerText = "what's wrong?";
    }
}

export {FileSelector}