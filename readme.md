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
    
### SprigganSpriteSheet

Combines a PNG image and JSON file describing the sprite frames within it.  The
".png" and ".json" extensions are added automatically.

This is to be given directly to SprigganSprite, and contents may vary by
platform.

    // Loads both "path/to/sprite/sheet.png" and "path/to/sprite/sheet.json"
    contentManager.get(SprigganSpritesheet, "path/to/sprite/sheet")

### SprigganViewport

Represents a virtual display.  Created with a fixed resolution which is then
scaled to fit the user's display or browser window.

    var width = 320  // pixels
    var height = 240 // pixels
    var viewport = new SprigganViewport(width, height)
    viewport.pause() // Pauses every group and/or sprite inside.
    viewport.resume() // Unpauses every group and/or sprite inside.
    viewport.dispose() // Deletes the viewport.
    
### SprigganGroup

Represents a group of SprigganSprites and/or SprigganGroups in a 
SprigganViewport.  This allows them to be controlled as a single object.

    var group = new SprigganGroup(viewportOrGroup)
    
    group.pause() // Pauses every group and/or sprite inside.
    group.resume() // Unpauses every group and/or sprite inside.
    
    group.dispose() // Deletes the group.
    
### SprigganSprite

Displays a frame of a SprigganSpriteSheet inside a SprigganViewport or 
SprigganGroup.
    
    var sprite = new SprigganSprite(viewportOrGroup, contentManager, urlToSpriteSheet)
    
    sprite.play("animation name", function(){
        // Called when the animation has completed.
        // Not called if the animation is interrupted by another call to .play or .loop.
    })
    
    sprite.loop("animation name")
    
    sprite.pause() // Pauses any animation/movement.
                   // Changes in animation/movement will be frozen until resumed.
    sprite.resume() // Unpauses any animation/movement.
    
    sprite.dispose() // Deletes the sprite.
    
### SprigganTimer

Implements a pausable timer.

    /* This 900msec timer does not start until resumed. */

    var timer = new SprigganTimer(0.9, {
        paused: function() {
            console.log("Paused; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
        },
        resumed: function() {
            console.log("Resumed; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
        },
        completed: function() {
            console.log("Completed; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
        }
    })
    
    /* timer.elapsedMilliseconds() returns the number of milliseconds passed. */
    /* timer.elapsedSeconds() returns the number of milliseconds passed. */
    /* timer.progress() returns 0.0 at the start and 1.0 at the end. */
    
    console.log("Created; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
    
    timer.resume()
    
    console.log("Started; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
    
    setTimeout(function(){
        console.log("Check; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
        timer.pause()
        
        /* After pausing, the timer stops updating until it is resumed. */
        
        console.log("Check; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
        setTimeout(function(){
            
            /* These values will not have changed as the timer is paused. */
            console.log("Check; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
            
            timer.resume()
            
            /* The timer is now running again. */
            
            console.log("Check; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
            setTimeout(function(){
                
                /* These values will have changed as the timer is running. */
                
                console.log("Check; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
                setTimeout(function(){
                    
                    /* The timer will complete before this. */
                    /* As such, the values logged will indicate the end of the timer. */
                    
                    console.log("Check; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
                }, 400)
            }, 400)
        }, 400)
    }, 400)
    
    /* Output varies, but should be approximately:
        Created; 0msec (0)
        Resumed; 0msec (0)
        Started; 0msec (0)
        Check; 431msec (0.47888888888888886)
        Paused; 431msec (0.47888888888888886)
        Check; 431msec (0.47888888888888886)
        Check; 431msec (0.47888888888888886)
        Resumed; 431msec (0.47888888888888886)
        Check; 435msec (0.48333333333333334)
        Check; 846msec (0.94)
        Completed; 900msec (1)
        Check; 900msec (1)
    */