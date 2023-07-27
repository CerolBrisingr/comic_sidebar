import {ComicManager, ComicManagerDummy} from "./comic_manager.js"

class ComicSidebar {
    constructor(container, comicEditor) {
        this.comicManagerList = [];
        this.comicEditor = comicEditor;
        this.currentManager = new ComicManagerDummy();
        this.container = container;
    }
    
    importComicDataList (comicDataList){
        let visualsList = [];
        this.comicManagerList.length = 0; // keep object permanence
        for (let comicData of comicDataList) {
            let newManager = new ComicManager(comicData, this.comicEditor);
            if (!newManager.valid)
                continue;
            this.comicManagerList.push(newManager);
            visualsList.push(newManager.visuals);
        }
        container.replaceChildren(...visualsList);
    }
    
    registerPage(url) {
        comicManager = this.selectCorrespondingManager(url);
        if (!comicManager.valid)
            return;
        comicManager.addAutomatic(url);
    }
    
    selectCorrespondingManager(url) {
        if (this.currentManager.urlIsCompatible(url))
            return currentManager;
        let sidebar = this;
        for (let comicManager of this.comicManagerList) {
            if (comicManager.urlIsCompatible(url)) {
                sidebar.updateCurrentManager(comicManager);
                return comicManager;
            }
        this.updateCurrentManager(new ComicManagerDummy());
        return new ComicManagerDummy();
        }
    }
    
    updateCurrentManager(newManager) {
        this.currentManager.collapse();
        newManager.expand();
        this.currentManager = newManager;
    }
}

export {ComicSidebar}