window.onerror = function() {
    alert.apply(window, arguments)
    var element = document.getElementById("loading")
    if (element) document.body.removeChild(element)
    while (SprigganAllContentManagers.length) SprigganAllContentManagers[0].dispose()
}

function SprigganRemoveByValue(array, value) {
    for (var i = 0; i < array.length; i++) if (array[i] == value) {
        array.splice(i, 1)
        return
    }
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

function SprigganTimer(seconds, configuration) {   
    this.seconds = seconds
    this.milliseconds = seconds * 1000
    
    this.configuration = configuration
    this.started = null
    this.elapsed = 0
    this.done = false
    this.timeout = null
}

SprigganTimer.prototype.pause = function() {
    if (this.timeout) {
        this.elapsed += new Date().getTime() - this.started
        this.started = null
        clearTimeout(this.timeout)
        this.timeout = null
        if (this.configuration.paused) this.configuration.paused.call(this, this)
    }
}

SprigganTimer.prototype.resume = function() {
    if (!this.timeout && !this.done) {
        var timer = this
        this.timeout = setTimeout(function(){
            timer.done = true
            timer.timeout = null
            if (timer.configuration.completed) timer.configuration.completed.call(timer, timer)
        }, this.milliseconds - this.elapsedMilliseconds())
        this.started = new Date().getTime()
        if (this.configuration.resumed) this.configuration.resumed.call(this, this)
    }
}

SprigganTimer.prototype.elapsedMilliseconds = function() {
    if (this.done) return this.milliseconds
    return Math.min(this.milliseconds, this.elapsed + (this.timeout ? (new Date().getTime() - this.started) : 0))
}

SprigganTimer.prototype.elapsedSeconds = function() {
    return this.elapsedMilliseconds() / 1000
}

SprigganTimer.prototype.progress = function() {
    return this.seconds ? this.elapsedSeconds() / this.seconds : 1
}

var SprigganAllContentManagers = []

function SprigganContentManager(configuration) {
    this.completed = 0
    this.total = 0
    this.content = []
    this.configuration = configuration
    SprigganAllContentManagers.push(this)
}

SprigganMakeDisposable(SprigganContentManager, function(){
    SprigganRemoveByValue(SprigganAllContentManagers, this)
    while(this.content.length) {
        var content = this.content.pop()
        if (content.loaded) content.dispose()
    }
})

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
                content.loaded = true
                if (contentManager.disposed) {
                    content.dispose()
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

function SprigganJson(url, onSuccess) {
    return SprigganText(url, function(text){
        var value
        try {
            if (window.JSON)
                value = JSON.parse(text) // Chrome, Firefox, Edge.
            else
                value = eval("(" + text + ")") // IE.
        } catch(e) {
            throw new Error("Failed to parse \"" + url + "\" as JSON")
        }
        onSuccess(value)
    })
}

function SprigganImage(url, onSuccess) {
    var image = new Image()
    image.onload = function() {
        onSuccess(image)
    }
    image.onerror = function() {
        throw new Error("Failed to load \"" + url + "\" as a PNG image")
    }
    image.src = url
    return function() {}
}

function SprigganSpriteSheet(url, onSuccess) {
    var json, image
    
    var disposeJson = new SprigganJson(url + ".json", function(value){
        json = value
        CheckFullyLoaded()
    })
    
    var disposeImage = new SprigganImage(url + ".png", function(value){
        image = value
        CheckFullyLoaded()
    })
    
    var sprites = []
    
    function CheckFullyLoaded() {
        if (!json) return
        if (!image) return
        
        var value = {
            animations: {},
            image: image.cloneNode(true),
            sprites: sprites
        }
        
        value.image.style.touchAction = "manipulation" // Improves responsiveness on IE/Edge on touchscreens.
        
        if ("imageRendering" in value.image.style) {
            value.image.style.imageRendering = "pixelated" // Chrome.
            value.image.style.imageRendering = "-moz-crisp-edges" // Firefox.
        } else if ("msInterpolationMode" in value.image.style) {
            value.image.style.msInterpolationMode = "nearest-neighbor" // IE.
        } else {
            // Workaround for Edge as it always uses linear interpolation; scale up 4x in a canvas to ensure that the pixels stay mostly square.
            var canvas = document.createElement("CANVAS")
            canvas.width = image.width * 4
            canvas.height = image.height * 4
            var context = canvas.getContext("2d")
            context.msImageSmoothingEnabled = false
            context.drawImage(image, 0, 0, image.width * 4, image.height * 4)
            value.image.src = canvas.toDataURL("image/png")
        }
        
        value.image.style.position = "absolute"
        value.image.style.width = image.width + "em"
        value.image.style.height = image.height + "em"
        
        for (var key in json.animations) {
            var animation = json.animations[key]
            var converted = []
            for (var i = 0; i < animation.length; i++) {
                var frame = json.frames[animation[i]]
                converted.push({
                    imageLeft: -frame[0] + "em",
                    imageTop: -frame[1] + "em",
                    wrapperWidth: (1 + frame[2] - frame[0]) + "em",
                    wrapperHeight: (1 + frame[3] - frame[1]) + "em",
                    wrapperMarginLeft: (frame[0] - frame[4]) + "em",
                    wrapperMarginTop: (frame[1] - frame[5]) + "em",
                    duration: frame[6]
                })
            }
            value.animations[key] = converted
        }
        
        onSuccess(value)
    }
    
    return function() {
        disposeJson()
        disposeImage()
        while (sprites.length) sprites[0].dispose()
    }
}

function SprigganMakeConstructable(type, onConstruction) {
    type.prototype.construct = function() {
        for (var i = 0; i < this.onConstruction.length; i++) this.onConstruction[i].call(this, this)
    }
    type.prototype.onConstruction = []
    if (onConstruction) type.onConstruction.push(onConstruction)
}

function SprigganMakeDisposable(type, onDisposal) {
    type.prototype.disposed = false
    
    type.prototype.onDisposal = []
    if (onDisposal) type.prototype.onDisposal.push(onDisposal)
    
    type.prototype.dispose = function() {
        if (this.disposed) return
        this.disposed = true
        for (var i = 0; i < this.onDisposal.length; i++) this.onDisposal[i].call(this, this)
    }
}

function SprigganMakeElementWrapper(type) {
    type.prototype.onConstruction.push(function(){
        this.element = document.createElement("DIV")
    })
    type.prototype.onDisposal.push(function(){
        this.element.parentNode.removeChild(this.element)
    })
}

function SprigganMakeChild(type) {
    type.prototype.onConstruction.push(function(){
        this.parent.element.appendChild(this.element)
    })
    type.prototype.onDisposal.push(function(){
        SprigganRemoveByValue(this.parent.children, this)
    })
}

function SprigganMakeParent(type) {
    type.prototype.onConstruction.push(function(){
        this.children = []
    })
    type.prototype.onDisposal.push(function(){
        while (this.children.length) this.children[0].dispose()
    })
}

var SprigganAllViewports = []

window.onresize = function() {
    for (var i = 0; i < SprigganAllViewports.length; i++) SprigganAllViewports[i].resize()
}

function SprigganViewport(width, height) {
    this.width = width
    this.height = height
    this.construct()
    this.element.style.position = "fixed"
    this.element.style.width = width + "em"
    this.element.style.height = height + "em"
    this.element.style.overflow = "hidden"
    document.body.appendChild(this.element)
    
    this.resize()
    SprigganAllViewports.push(this)
}

SprigganViewport.prototype.resize = function() {
    var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    
    this.element.style.fontSize = Math.min(windowWidth / this.width, windowHeight / this.height) + "px"
        
    this.element.style.left = ((windowWidth - this.element.clientWidth) / 2) + "px"
    this.element.style.top = ((windowHeight - this.element.clientHeight) / 2) + "px"
}

SprigganMakeConstructable(SprigganViewport)
SprigganMakeDisposable(SprigganViewport, function() {
    SprigganRemoveByValue(SprigganAllViewports, this)
})
SprigganMakeParent(SprigganViewport)
SprigganMakeElementWrapper(SprigganViewport)

function SprigganGroup(parent) {
    this.parent = parent
    this.construct()
    this.element.style.position = "absolute"
    this.element.style.left = "0em"
    this.element.style.top = "0em"
}

SprigganMakeConstructable(SprigganGroup)
SprigganMakeDisposable(SprigganGroup)
SprigganMakeElementWrapper(SprigganGroup)
SprigganMakeParent(SprigganGroup)
SprigganMakeChild(SprigganGroup)

function SprigganSprite(parent, contentManager, spriteSheetUrl) {
    this.parent = parent
    this.construct()
    this.element.style.position = "absolute"
    this.element.style.left = "0em"
    this.element.style.top = "0em"
    this.element.style.overflow = "hidden"
    this.spriteSheet = contentManager.get(SprigganSpriteSheet, spriteSheetUrl)
    this.spriteSheet.sprites.push(this)
    this.imageElement = this.spriteSheet.image.cloneNode(true)
    this.element.appendChild(this.imageElement)
}

SprigganMakeConstructable(SprigganSprite)
SprigganMakeDisposable(SprigganSprite, function(){
    SprigganRemoveByValue(this.spriteSheet.sprites, this)
})
SprigganMakeElementWrapper(SprigganSprite)
SprigganMakeChild(SprigganSprite)

SprigganSprite.prototype.play = function(animationName, then) {
    var sprite = this
    var frames
    for (var key in sprite.spriteSheet.animations) {
        if (key != animationName) continue
        frames = sprite.spriteSheet.animations[key]
        break
    }
    if(!frames) throw new Error("Animation \"" + animationName + "\" does not exist in this SprigganSpriteSheet")
    var frame = 0
    function NextFrame() {
        if (frame == frames.length) {
            if (then) then()
            return
        }
        var currentFrame = frames[frame++]
        sprite.imageElement.style.left = currentFrame.imageLeft
        sprite.imageElement.style.top = currentFrame.imageTop
        sprite.element.style.width = currentFrame.wrapperWidth
        sprite.element.style.height = currentFrame.wrapperHeight
        sprite.element.style.marginLeft = currentFrame.wrapperMarginLeft
        sprite.element.style.marginTop = currentFrame.wrappedMarginTop
        new SprigganTimer(currentFrame.duration, {
            completed: NextFrame
        }).resume()
    }
    NextFrame()
}