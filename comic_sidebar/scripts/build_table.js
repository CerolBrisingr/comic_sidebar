import {Bookmark, Comic, dissectUrl} from "./bookmarks.js"

function buildComicLists(data, container, comicEditor) {
    let newList = [];
    for (let comic of data) {
        addComicToList(newList, comic, comicEditor);
    }
    container.replaceChildren(...newList);
}

function updateComicUrls(unorderedList, comic) {
    unorderedList.replaceChildren();
    addBookmarks(unorderedList, comic, comic.automatic, "auto");
    addBookmarks(unorderedList, comic, comic.manual, "manual");
}

function addComicToList(newList, comic, comicEditor) {
    let clickField = createClickField(comic.label);
    if (clickField === undefined)
        return;
    newList.push(clickField);
    updateComicListing(clickField, comic, comicEditor);
}

function updateComicListing(clickField, comic, comicEditor) {
    clickField.replaceChildren();
    addLink(clickField, comic.label);
    let editButton = addEditButton(clickField);
    let expandButton = addExpandButton(clickField);
    let bookmarkList = createSubList(clickField, comic.base_url);
    if (bookmarkList === undefined)
        return;
    updateComicUrls(bookmarkList, comic);
    makeExpandible(bookmarkList, expandButton);
    enableEditing(editButton, clickField, comic, comicEditor);
}

function appendComicToPanel(container, comic, comicEditor) {
    let shortList = [];
    addComicToList(shortList, comic, comicEditor);
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

function enableEditing(editButton, clickField, comic, comicEditor) {
    editButton.onclick = () => {
        let triggerFkt = () => {
            comic.update(comicEditor);
            updateComicListing(clickField, comic, comicEditor);
        }
        comicEditor.updateLink(comic, triggerFkt);
        comicEditor.setVisible();
    }
}

function editComicData(comic, comicEditor) {
    let triggerFkt = (comicEssentials) => {
        comic.update(comicEssentials);
        buildComicLists(comicData, container, comicEditor);
    }
    comicEditor.updateLink(comic, triggerFkt);
    comicEditor.setVisible();
}

function makeExpandible(bookmarkList, expandButton) {
    expandButton.onclick = () => {
        bookmarkList.classList.toggle('visible');
    }
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

function createClickField(comicLabel) {
    if (!(typeof comicLabel === "string"))
        return;
    let listEntry = document.createElement("li");
    return listEntry;
}

function addLink(listEntry, comicLabel) {
    listEntry.classList.add('comic_listing');
    let myLink = Object.assign(document.createElement("a"), {href:"#", innerText:comicLabel});
    listEntry.appendChild(myLink);
}

function addEditButton(clickField) {
    let editButton = document.createElement("button");
    editButton.classList.add('edit_button');
    clickField.appendChild(editButton);
    
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, "viewBox", '0 0 1 1');
    editButton.appendChild(svg);
    
    let path = document.createElementNS('http://www.w3.org/2000/svg', "path");
    path.setAttributeNS(null, "d", 'M0.1,0.1 0.9,0.1 0.1,0.9 0.9,0.9z');
    svg.append(path);
    return editButton;
}

function addExpandButton(clickField) {
    let expandButton = document.createElement("button");
    expandButton.setAttribute("aria-expanded",false);
    clickField.appendChild(expandButton);
    
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, "viewBox", '0 0 1 1');
    expandButton.appendChild(svg);
    
    let path = document.createElementNS('http://www.w3.org/2000/svg', "path");
    path.setAttributeNS(null, "d", 'M0.3,0.1 0.3,0.9 0.8,0.5z');
    svg.append(path);
    return expandButton;
}

export {buildComicLists, updateComicUrls, appendComicToPanel}