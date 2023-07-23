import {Bookmark, BookmarkData, dissectUrl} from "./bookmarks.js"

function buildComicLists(data, container) {
    let newList = [];
    for (let comic of data) {
        addComicToList(newList, comic);
    }
    container.replaceChildren(...newList);
}

function updateComicList(unorderedList, comicBookmark) {
    unorderedList.replaceChildren();
    addBookmarks(unorderedList, comicBookmark, comicBookmark.automatic, "auto");
    addBookmarks(unorderedList, comicBookmark, comicBookmark.manual, "manual");
}

function addComicToList(newList, comic) {
    let clickField = createClickField("#", comic.label);
    if (clickField === undefined)
        return;
    newList.push(clickField);
    addExpandButton(clickField, comic);
    let bookmarkList = createSubList(clickField, comic.base_url);
    if (bookmarkList === undefined)
        return;
    updateComicList(bookmarkList, comic);
    makeInteractive(bookmarkList);
}

function appendComicToPanel(container, bookmarkData) {
    let shortList = [];
    addComicToList(shortList, bookmarkData);
    if (shortList.length == 0) {
        console.log("Could not build new list entry. Might be bad!");
        return;
    }
    container.appendChild(shortList[0]);
}

function openUrlInMyTab(url) {
    let test = dissectUrl(url);
    if (test === undefined)
        return;
    browser.tabs.update({url: url});
}

function createSubList(parentElement, myId) {
    if (!(typeof myId === "string"))
        return;
    let unorderedList = Object.assign(document.createElement("ul"), {id:encodeURI(myId)});
    parentElement.appendChild(unorderedList);
    return unorderedList;
}

function makeInteractive(obj) {
    obj.classList.add('submenu');
}

function addBookmarks(parentElement, bookmarkParent, bookmarkList, strMeta) {
    for (let bookmark of bookmarkList) {
        let prefix = bookmarkParent.base_url;
        let bookmarkObject = buildBookmarkObject(bookmark, prefix, strMeta);
        if (bookmarkObject === undefined)
            continue;
        parentElement.appendChild(bookmarkObject);
    }
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

function createClickField(myHref, myInnerText) {
    if (!(typeof myHref === "string") || !(typeof myInnerText === "string"))
        return;
    let listEntry = document.createElement("li");
    let myLink = Object.assign(document.createElement("a"), {href:encodeURI(myHref), innerText:myInnerText});
    listEntry.appendChild(myLink);
    return listEntry;
}

function addExpandButton(clickField, comic) {
    let editButton = document.createElement("button");
    editButton.setAttribute("aria-expanded",false);
    clickField.appendChild(editButton);
    
    let span = document.createElement("span");
    span.classList.add("visually-hidden");
    span.innerText = "Untermenü aufklappen";
    editButton.appendChild(span);
    
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, "viewBox", '0 0 1 1');
    editButton.appendChild(svg);
    
    let path = document.createElementNS('http://www.w3.org/2000/svg', "path");
    path.setAttributeNS(null, "d", 'M0.3,0.1 0.3,0.9 0.8,0.5z');
    svg.append(path);
}

export {buildComicLists, updateComicList, appendComicToPanel}