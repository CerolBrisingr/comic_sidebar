import {dissectUrl} from "./bookmarks.js"

class ComicVisuals {
    constructor(comicData) {
        this.editButton = undefined;
        this.createListing();
        this.updateListing(comicData);
    }
    
    createListing() {
        this.listing = document.createElement("li");
        this.listing.classList.add('comic_listing');
    }
    
    updateListing(comicData) {
        this.listing.replaceChildren();
        this.#createBaseLink(comicData.label);
        this.#addEditButton();
        this.#addExpandButton();
        this.#createBookmarkList(comicData.base_url);
        this.updateComicUrls(comicData);
        
        this.#enableBookmarkExpansion();
    }
    
    #createBaseLink(comicLabel) {
        this.baseLink = Object.assign(document.createElement("a"), {href:"#", innerText:comicLabel});
        this.listing.appendChild(this.baseLink);
    }
    
    #addEditButton() {
        this.editButton = createSvgButton('M0.1,0.1 0.9,0.1 0.1,0.9 0.9,0.9z');
        this.editButton.classList.add('edit_button');
        this.listing.appendChild(this.editButton);
    }
    
    #addExpandButton() {
        this.expandButton = createSvgButton('M0.3,0.1 0.3,0.9 0.8,0.5z');
        this.expandButton.setAttribute("aria-expanded",false);
        this.listing.appendChild(this.expandButton);
    }
    
    #createBookmarkList(parentElement, myId) {
        this.bookmarkList = Object.assign(document.createElement("ul"), {id:encodeURI(myId)});
        this.listing.appendChild(this.bookmarkList);
    }
    
    updateComicUrls(comic) {
        this.bookmarkList.replaceChildren();
        this.#addBookmarks(comic, comic.automatic, "auto");
        this.#addBookmarks(comic, comic.manual, "manual");
    }
    
    #addBookmarks(bookmarkParent, bookmarkList, strMeta) {
        for (let bookmark of bookmarkList) {
            let prefix = bookmarkParent.base_url;
            let bookmarkObject = buildBookmarkObject(bookmark, prefix, strMeta);
            if (bookmarkObject === undefined)
                continue;
            this.bookmarkList.appendChild(bookmarkObject);
        }
    }
    
    #enableBookmarkExpansion() {
            this.expandButton.onclick = () => {
            this.bookmarkList.classList.toggle('visible');
            if (this.bookmarkList.classList.contains('visible')) {
                this.expandButton.setAttribute('aria-expanded', 'true');
            } else {
                this.expandButton.setAttribute('aria-expanded', 'false');
            }
        }
    }
}

function createSvgButton(pathString, viewBox='0 0 1 1') {
    let svgButton = document.createElement("button");
    
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, "viewBox", viewBox);
    svgButton.appendChild(svg);
    
    let path = document.createElementNS('http://www.w3.org/2000/svg', "path");
    path.setAttributeNS(null, "d", pathString);
    svg.append(path);
    
    return svgButton;
}

function buildBookmarkObject(bookmark, prefix, strMeta) {
    if (!(typeof bookmark.href === "string"))
        return;
    if (!(typeof strMeta === "string"))
        return;
    let myLink = buildLink(bookmark.href, prefix, strMeta);
    if (myLink === undefined)
        return;
    let listEntry = document.createElement("li");
    listEntry.appendChild(myLink);
    return listEntry;
}

function buildLink(href, prefix, strMeta) {
    let myHref = encodeURI(href);
    let linkPieces = dissectUrl(href, prefix, true);
    if (linkPieces === undefined)
        return;
    let myStrMeta = encodeURI(strMeta);
    let myLink = document.createElement("a")
    myLink.href = myHref;
    myLink.innerText = linkPieces.tail;
    myLink.classList.add(myStrMeta);
    myLink.onclick = function() {
        openUrlInMyTab(myHref);
        return false;
    }
    return myLink;
}

function openUrlInMyTab(url) {
    let test = dissectUrl(url);
    if (test === undefined)
        return;
    browser.tabs.update({url: url});
}

export {ComicVisuals}