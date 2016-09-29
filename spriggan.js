window.onerror = function() {
    alert.apply(window, arguments)
    var element = document.getElementById("loading")
    if (element) document.body.removeChild(element)
    while (SprigganAllContentManagers.length) SprigganAllContentManagers[0].dispose()
}

function SprigganSetLoadingText(text) {
    var element = document.getElementById("loading")
    if (!element) return
    element.textContent = text
}

SprigganSetLoadingText("Now loading scripts...")

window.onload = function() {
    SprigganSetLoadingText("Now loading content...")
    document.body.style.transition = "background 0.5s linear, color 0.5s linear"
    document.body.style.color = "white"
    document.body.style.background = "black"
    var callback
    var contentManager = new SprigganContentManager({
        progress: function(loaded, total) {
            SprigganSetLoadingText("Now loading content... (" + loaded + "/" + total + ")")
        },
        loaded: function() {
            document.body.removeChild(document.getElementById("loading"))
            callback.call(contentManager, contentManager)
        }
    })
    callback = SprigganBoot.call(contentManager, contentManager)
}

var SprigganAllContentManagers = []

function SprigganContentManager(configuration) {
    this.disposed = false
    this.completed = 0
    this.total = 0
    this.content = []
    this.configuration = configuration
    SprigganAllContentManagers.push(this)
}

SprigganContentManager.prototype.dispose = function() {
    if (this.disposed) throw new Error("This SprigganContentManager has already been disposed")
    this.disposed = true
    SprigganAllContentManagers.splice(SprigganAllContentManagers.indexOf(this), 1)
    while (this.content.length) this.content.pop().dispose()
}

SprigganContentManager.prototype.find = function(url) {
    if (this.disposed) throw new Error("This SprigganContentManager has been disposed of")
    for (var i = 0; i < this.content.length; i++) {
        var content = this.content[i]
        if (content.url == url) return content
    }
    return null
}

SprigganContentManager.prototype.get = function(type, url) {
    var content = this.find(url)
    if (this.completed != this.total) throw new Error("This ContentManager has not finished loading")
    if (!content) throw new Error("No content named \"" + url + "\" was loaded into this SprigganContentManager")
    if (content.type != type) throw new Error("Content \"" + url + "\" was loaded as a \"" + content.type.name + "\", but was accessed as a \"" + type.name + "\"")
    return content.value
}

SprigganContentManager.prototype.add = function(type, url) {
    var existing = this.find(url)
    if (this.completed) throw new Error("Cannot add content to a SprigganContentManager once content has loaded")
    if (existing) {
        if (existing.type != type) throw new Error("Content \"" + url + "\" was first loaded as a \"" + existing.type.name + "\", but was loaded again as a \"" + type.name + "\"")
    } else {
        this.total++
        var contentManager = this
        var content = {
            url: url,
            type: type,
            dispose: type(url, function(value) { 
                contentManager.completed++
                if (contentManager.disposed) {
                    content.dispose()
                    contentManager.content.splice(contentManager.content.indexOf(content), 1)
                } else {
                    content.value = value
                    if (contentManager.configuration.progress) 
                        contentManager.configuration.progress.call(contentManager, contentManager.completed, contentManager.total, contentManager)
                    if (contentManager.completed == contentManager.total && contentManager.configuration.loaded) 
                        contentManager.configuration.loaded.call(contentManager, contentManager)
                }
            })
        }
        this.content.push(content)
    }
}

function SprigganText(url, onSuccess) {
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
        if (request.readyState != 4) return
        if (request.status >= 200 && request.status <= 299)
            onSuccess(request.responseText)
        else throw new Error("Failed to download \"" + url + "\" as text; HTTP status code " + request.status + " was returned")
    }
    request.open("GET", url, true)
    request.send()
    return function() {}
}