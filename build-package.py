from zipfile import ZipFile
import glob
import json

def getVersionString():
    with open("manifest.json") as source:
        data = json.load(source)
        versionString = data["version"]
        versionString = versionString.replace(".", "_")
        return versionString

def addFolder(path, myzip):
    paths = glob.glob(path + "/**", recursive=True)
    for path in paths:
        myzip.write(path)

versionString = getVersionString()
with ZipFile("../webReader-" + versionString + ".xpi", "w") as myzip:
    addFolder("editor", myzip)
    addFolder("icons", myzip)
    addFolder("options", myzip)
    addFolder("popup", myzip)
    addFolder("scripts", myzip)
    addFolder("sidebar", myzip)
    myzip.write("manifest.json")
