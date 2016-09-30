# SprigganJS

A "vanilla" JavaScript library for creating simple, event-driven pixel art games
in your browser.

## API

### Startup

Once initialized, SprigganJS will call the "SprigganBoot" function.  A
SprigganContentManager is given as the argument; a simple loading screen will be
shown for it.  The returned function will be called when the content manager has 
loaded and the simple loading screen has been removed.

    function SprigganBoot(contentManager) {
        // contentManager and this are equivalent here.
    
        contentManager
            .add(SprigganJson, "path/to/json/file")
            .add(SprigganSpriteSheet, "path/to/sprite/sheet")
            
        return function(referenceToContentManager) {
            // contentManager, referenceToContentManager and this are equivalent here. 
        
            alert("All content has loaded and can be used here.")
        }
    }

### Error handling

In the event of an unhandled exception or error (such as a failure to load),
SprigganJS will display the error message and stop.

To trigger this yourself, all you need to do is throw an Error:

    throw new Error("This is the problem which occurred")

### SprigganContentManager

This class handles the lifespan of content - waiting for it to load, loading the
same file only once at a time, handling errors, disposing of it all when no
longer required.

Generally, it is used as such:

    var contentManager = new SprigganContentManager({
        progress: function(loaded, total, referenceToContentManager) {
            // contentManager, referenceToContentManager and this are equivalent here. 
        
            console.log(loaded + " out of " + total + " have been loaded")
        },
        loaded: function(referenceToContentManager) {
            // contentManager, referenceToContentManager and this are equivalent here. 
            
            console.log("All content has been loaded")
            console.log(this.get(SprigganJson, "path/to/json/file"))
            this.dispose()
        }
        // Errors trigger the error handler.
    })
    .add(SprigganJson, "path/to/json/file")
    .add(SprigganSpriteSheet, "path/to/sprite/sheet")
    
#### Content

To implement custom content types, create a function similar to the following:

    function YourContentType(url, successCallback) {
        /* perform asynchronous work */
            successCallback(theValueWhichWasLoaded)
        /* perform asynchronous work */
        
        return function() {
            /* called once when disposed
               only called once
               only called after loading */
        }
    }
    
### SprigganText

Reads the text from a file as a string.

    function SprigganBoot(contentManager) {
        contentManager.add(SprigganText, "path/to/text/file")
        return function() {
            alert(contentManager.get(SprigganText,  "path/to/text/file"))
        }
    }
    
### SprigganJson

Reads the text from a file as a JSON object.

    function SprigganBoot(contentManager) {
        contentManager.add(SprigganJson, "path/to/json/file")
        return function() {
            alert(contentManager.get(SprigganJson, "path/to/json/file")["this"])
            alert(contentManager.get(SprigganJson, "path/to/json/file")["and"])
        }
    }

### SprigganViewport

Represents a virtual display.  Created with a fixed resolution which is then
scaled to fit the user's display or browser window.

    var width = 320  // pixels
    var height = 240 // pixels
    new SprigganViewport(width, height)