function ConvertAnimation(animation, grunt, done, filename) {
    switch (animation.direction) {
        case "forward":
            var output = []
            for (var i = animation.from; i <= animation.to; i++)
                output.push(i)
            return {
                result: output
            }
        case "reverse":
            var output = []
            for (var i = animation.to; i >= animation.from; i--)
                output.push(i)
            return {
                result: output
            }
        case "pingpong":
            var output = []
            for (var i = animation.from; i <= animation.to; i++)
                output.push(i)
            for (var i = animation.to - 1; i > animation.from; i--)
                output.push(i)
            return {
                result: output
            }
        default:
            return {
                error: "Animation direction \"" + animation.direction + "\" is not implemented in animation \"" + animation.name + "\""
            }
    }
}

function ConvertFrame(frame) {
    return [
        frame.frame.x, 
        frame.frame.y, 
        frame.frame.x + frame.frame.w - 1, 
        frame.frame.y + frame.frame.h - 1, 
        frame.frame.x + (frame.sourceSize.w / 2) - frame.spriteSourceSize.x, 
        frame.frame.y + (frame.sourceSize.h / 2) - frame.spriteSourceSize.y,
        frame.duration / 1000
    ]
}

function ConvertFile(json, filename, then, grunt, done) {
    json = JSON.parse(json)
    var output = {
        frames: json.frames.map(ConvertFrame),
        animations: {}
    }
    if (!json.meta.frameTags.length) {
        grunt.log.error("No animations have been defined in file \"", filename, "\"")
        done()
        return
    }
    var failed = false
    json.meta.frameTags.forEach(function(animation){
        if (failed) return
        var converted = ConvertAnimation(animation)
        if (converted.error) {
            grunt.log.error(converted.error, " in file \"", filename, "\"")
            done()
            failed = true
            return
        }
        else output.animations[animation.name] = converted.result
    })
    if (!failed) then(JSON.stringify(output))
}

var fs = require("fs")
function DeleteIfExists(file, then, grunt, done) {
    fs.unlink(file, function(err){
        if (err && err.code != "ENOENT") {
            grunt.log.error("Failed to delete \"", file, "\"; ", err)
            done()
        } else then()
    })
}

function EnsureExists(file, then, grunt, done) {
    fs.stat(file, function(err){
        if (err) {
            grunt.log.error("Failed to ensure that \"", file, "\" exists; ", err)
            done()
        } else then()
    })
}

function ReadFile(file, then, grunt, done) {
    fs.readFile(file, function(err, content){
        if (err) {
            grunt.log.error("Failed to read \"", file, "\"; ", err)
            done()
        } else then(content)
    })
}

function WriteFile(file, content, then, grunt, done) {
    fs.writeFile(file, content, function(err) {
        if (err) {
            grunt.log.error("Failed to write \"", file, "\"; ", err)
            done()
        } else then()
    })
}

var child_process = require("child_process")
function RunAseprite(input, png, json, then, grunt, done) {
    child_process.spawn("aseprite", [
        "--batch", 
        "--sheet", png, 
        "--trim", "--shape-padding", "1",
        "--data", json,
        "--format", "json-array",
        "--list-tags",
        input]).on("exit", function(status){
            if (status != 0) {
                grunt.log.error("Failed to invoke Aseprite to convert \"", input, "\" to \"", png, "\" and \"", json, "\"; error code ", status, " was encountered")
                done()
            } else then()
        })
}

var mkdirp = require("mkdirp")
function EnsureDirectoryExists(path, then, grunt, done) {
    var dirName = require("path").dirname(path)
    mkdirp(dirName, function(err) {
        if (err) {
            grunt.log.error("Failed to create directory \"", dirName, "\"; ", err)
            done()
        } else then()
    })
}

function RunFile(src, dest, grunt, done) {
    var destJsonTemp = dest + ".temp.json"
    var destJson = dest + ".json"
    var destPng = dest + ".png"        
    
    EnsureDirectoryExists(dest, DeletePng, grunt, done)
    function DeletePng(){ DeleteIfExists(destPng, DeleteTemporaryJson, grunt, done) }    
    function DeleteTemporaryJson(){ DeleteIfExists(destJsonTemp, DeleteGeneratedJson, grunt, done) }    
    function DeleteGeneratedJson(){ DeleteIfExists(destJson, InvokeAseprite, grunt, done) }    
    function InvokeAseprite() { RunAseprite(src, destPng, destJsonTemp, ReadTemporaryJson, grunt, done) }
    function EnsurePngExists() { EnsureExists(destPng, EnsureTemporaryJsonExists, grunt, done) }
    function EnsureTemporaryJsonExists() { EnsureExists(destJsonTemp, ReadTemporaryJson, grunt, done) }
    function ReadTemporaryJson() { ReadFile(destJsonTemp, ConvertJson, grunt, done) }
    function ConvertJson(json) { ConvertFile(json, src, WriteGeneratedJson, grunt, done) }
    function WriteGeneratedJson(json) { WriteFile(destJson, json, DeleteTemporaryJsonWhenGeneratedJsonWritten, grunt, done) }
    function DeleteTemporaryJsonWhenGeneratedJsonWritten() { DeleteIfExists(destJsonTemp, done, grunt, done) }
}

function RunTask(grunt) {
    if (!this.files.length) {
        grunt.log.warn("No .ase files were found to convert to SprigganJSContentSpriteSheets")
        return
    }
    var failure = null
    this.files.forEach(function(filePair){
        if (failure) return
        if (!filePair.src.length) failure = "No .ase file provided to generate SprigganJSContentSpriteSheet \"" + filePair.dest + "\""
        if (filePair.src.length > 1) failure = "Multiple .ase files (" + (filePair.src.map(function(src){ return "\"" + src + "\"" })).join(", ") + ") conflict over SprigganJSContentSpriteSheet \"" + filePair.dest + "\""
    })
    if (failure) {
        grunt.log.error(failure)
        return
    }
    var done = this.async()
    remaining = 0
    function PartDone() {
        remaining--
        if (!remaining) done()
    }
    this.files.forEach(function(filePair) {
        filePair.src.forEach(function(src) {
            remaining++
            RunFile(src, filePair.dest, grunt, PartDone)
        })
    })
}

module.exports = function(grunt) {
    grunt.registerMultiTask("sprigganjs-aseprite", "Converts .ASE files to .PNG/.JSON pairs which can be imported as SprigganJSContentSpriteSheets", function(){
        var as = this
        RunTask.call(as, grunt)
    })
}