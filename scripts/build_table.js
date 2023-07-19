import {Bookmark, BookmarkData} from "./bookmarks.js"

function buildComicLists(data, container) {
    let newList = [];
    for (let comic of data) {
        addComicToList(newList, comic);
    }
    container.replaceChildren(...newList);
}

function updateComicList(unorderedList, comicBookmark) {
    unorderedList.replaceChildren();
    addBookmarks(unorderedList, comicBookmark.automatic, "auto");
    addBookmarks(unorderedList, comicBookmark.manual, "manual");
}

function addComicToList(newList, comic) {
    let clickField = createClickField("#", comic.label);
    if (clickField === undefined)
        return;
    newList.push(clickField);
    let bookmarkList = createSubList(clickField, comic.base_url);
    if (bookmarkList === undefined)
        return;
    updateComicList(bookmarkList, comic);
    makeInteractive(bookmarkList);
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
    obj.insertAdjacentHTML('beforebegin',
            `
        <button aria-expanded="false">
            <span class="visually-hidden">Untermenü aufklappen</span>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
              <path d='M0.3,0.1 0.3,0.9 0.8,0.5z' />
            </svg>
        </button>
    `);
}

function addBookmarks(parentElement, bookmarkList, strMeta) {
    for (let bookmark of bookmarkList) {
        let bookmarkObject = buildBookmarkObject(bookmark, strMeta);
        if (bookmarkObject === undefined)
            continue;
        parentElement.appendChild(bookmarkObject);
    }
}

function buildBookmarkObject(bookmark, strMeta) {
    if (!(typeof bookmark.href === "string"))
        return;
    if (!(typeof strMeta === "string"))
        return;
    let myHref = encodeURI(bookmark.href);
    let listEntry = document.createElement("li");
    let myStrMeta = encodeURI(strMeta);
    let myLink = Object.assign(document.createElement("a"), {href:myHref, innerText:myHref});
    myLink.classList.add(myStrMeta)
    listEntry.appendChild(myLink);
    return listEntry;
}

function createClickField(myHref, myInnerText) {
    if (!(typeof myHref === "string") || !(typeof myInnerText === "string"))
        return;
    let listEntry = document.createElement("li");
    let myLink = Object.assign(document.createElement("a"), {href:encodeURI(myHref), innerText:encodeURI(myInnerText)});
    listEntry.appendChild(myLink);
    return listEntry;
}

export {buildComicLists, updateComicList}