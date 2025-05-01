class HTML {
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

    static addSpacer(parent) {
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
}

export { HTML }