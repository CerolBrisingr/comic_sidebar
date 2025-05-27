class HTML {

    static findElementById(id) {
        return document.getElementById(id);
    }

    static insertElement(parent, strType) {
        let element = document.createElement(strType);
        parent.appendChild(element);
        return element;
    }

    static addCssProperty(element, strName) {
        element.classList.add(strName);
    }

    static addSpan(parent, strText, strClass = undefined) {
        let span = HTML.insertElement(parent, "span");
        if (strClass !== undefined) {
            HTML.addCssProperty(span, strClass);
        }
        span.innerText = strText;
        return span;
    }

    static addSpacerText(parent) {
        return HTML.addText(parent, '\u00A0');
    }

    static addText(parent, strText) {
        const text = document.createTextNode(strText);
        parent.appendChild(text);
        return text;
    }

    static removeChildElements(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.lastChild);
        }
    }

    static removeElement(parent, element) {
        parent.removeChild(element);
    }

    static scrollIntoView(element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

export { HTML }