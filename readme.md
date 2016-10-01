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
    var viewport = new SprigganViewport(width, height, function(){
        // Called when the viewport is clicked.
    })
    viewport.pause() // Pauses every group and/or sprite inside.
    viewport.resume() // Unpauses every group and/or sprite inside.
    viewport.dispose() // Deletes the viewport.
    
### SprigganGroup

Represents a group of SprigganSprites and/or SprigganGroups in a 
SprigganViewport.  This allows them to be controlled as a single object.

    var group = new SprigganGroup(viewportOrGroup, function(){
        // Called when any sprite in the group is clicked.
    })
    
    group.move(20, 40) // Moves to 20 pixels from the left edge, 40 pixels from the top edge instantaneously.
    
    // Moves to 80 pixels from the left edge, 70 pixels from the top edge over the course of 0.4 seconds.
    group.moveOverSeconds(80, 70, 0.4, function() {
        // Called when the movement has completed.
        // Not called if the movement is interrupted by another call to .move, .moveOverSeconds, .moveAtPixelsPerSecond.
    })
    
    // Moves to 30 pixels from the left edge, 90 pixels from the top edge at a constant 25 pixels per second.
    group.moveAtPixelsPerSecond(30, 90, 25 function() {
        // Called when the movement has completed.
        // Not called if the movement is interrupted by another call to .move, .moveOverSeconds, .moveAtPixelsPerSecond.
    })
    
    group.pause() // Pauses every group and/or sprite inside.
    group.resume() // Unpauses every group and/or sprite inside.
    
    group.dispose() // Deletes the group.
    
### SprigganSprite

Displays a frame of a SprigganSpriteSheet inside a SprigganViewport or 
SprigganGroup.
    
    var sprite = new SprigganSprite(viewportOrGroup, contentManager, urlToSpriteSheet, function(){
        // Called when the sprite is clicked.
    })
    
    sprite.play("animation name", function(){
        // Called when the animation has completed.
        // Not called if the animation is interrupted by another call to .play or .loop.
    })
    
    sprite.loop("animation name")
    
    sprite.move(20, 40) // Moves to 20 pixels from the left edge, 40 pixels from the top edge instantaneously.
    
    // Moves to 80 pixels from the left edge, 70 pixels from the top edge over the course of 0.4 seconds.
    sprite.moveOverSeconds(80, 70, 0.4, function() {
        // Called when the movement has completed.
        // Not called if the movement is interrupted by another call to .move, .moveOverSeconds, .moveAtPixelsPerSecond.
    })
    
    // Moves to 30 pixels from the left edge, 90 pixels from the top edge at a constant 25 pixels per second.
    sprite.moveAtPixelsPerSecond(30, 90, 25 function() {
        // Called when the movement has completed.
        // Not called if the movement is interrupted by another call to .move, .moveOverSeconds, .moveAtPixelsPerSecond.
    })
    
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
        },
        progress: function() {
            console.log("Progress update; " + timer.elapsedMilliseconds() + "msec " + timer.elapsedSeconds() + "sec (" + timer.progress() + ")")
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
        Created; 0msec 0sec (0)
        Resumed; 0msec 0sec (0)
        Started; 2msec 0.002sec (0.0022222222222222222)
        Progress update; 71msec 0.071sec (0.07888888888888888)
        Progress update; 100msec 0.1sec (0.11111111111111112)
        Progress update; 151msec 0.152sec (0.1688888888888889)
        Progress update; 201msec 0.201sec (0.22333333333333333)
        Progress update; 256msec 0.256sec (0.28444444444444444)
        Progress update; 303msec 0.303sec (0.33666666666666667)
        Progress update; 357msec 0.357sec (0.3966666666666666)
        Progress update; 409msec 0.409sec (0.45444444444444443)
        Check; 412msec 0.412sec (0.45777777777777773)
        Paused; 413msec 0.413sec (0.45888888888888885)
        Check; 413msec 0.413sec (0.45888888888888885)
        Check; 413msec 0.413sec (0.45888888888888885)
        Resumed; 413msec 0.413sec (0.45888888888888885)
        Check; 414msec 0.414sec (0.45999999999999996)
        Progress update; 468msec 0.468sec (0.52)
        Progress update; 513msec 0.513sec (0.57)
        Progress update; 563msec 0.563sec (0.6255555555555555)
        Progress update; 633msec 0.633sec (0.7033333333333334)
        Progress update; 662msec 0.662sec (0.7355555555555556)
        Progress update; 712msec 0.712sec (0.7911111111111111)
        Progress update; 762msec 0.762sec (0.8466666666666667)
        Progress update; 812msec 0.812sec (0.9022222222222223)
        Check; 815msec 0.815sec (0.9055555555555554) 
        Progress update; 863msec 0.863sec (0.9588888888888889)
        Completed; 900msec 0.9sec (1)
        Check; 900msec 0.9sec (1)
    */