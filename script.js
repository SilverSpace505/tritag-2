
utils.setup()
utils.setStyles()
utils.setGlobals()
utils.ignoreSafeArea()
ui.textShadow.bottom = "auto"
ui.setFont("font", "font.ttf")

var su = 0
var lastTime = 0
var delta = 0

var time = 0

var ticks = 0
var tickRate = 100
var tdelta = 1/tickRate
var itickRate = 60
var itdelta = 1/itickRate
var tps = 0
var fps = 0
var lastTickTime = 0
var accumulator = 0
var iaccumulator = 0
var jKeysT = {}
var keysT = {}
var jKeysT2 = {}
var fps2 = 0

var selected = 1
var sLayer = 0
var newSets = {}

var baseVolume = 0.2

var editor = false

function transformColours(r, g, b, a, set={}) {
    if (r+","+g+","+b+","+a in set) {
        return set[r+","+g+","+b+","+a].split(",").map(a => parseInt(a))
    }
    return [r, g, b, a]
}

var tilesImg = ui.newImg("tiles.png")
var tilesLoaded = false
var tilesImgB = {}
var players = {}

var usernameT = new ui.TextBox("Username")
var colourButton = new ui.Button("rect", "Colour")

var spread = []
var spreadt = 0
var spreadl = 0
var spreadb = 0
var particles = []

var sendDT = 0

var username = "Unnamed"

var editorBG = new ui.Canvas()

var saveData = localStorage.getItem("platformer-save")
if (saveData) {
    saveData = JSON.parse(saveData)
    if ("colour" in saveData) {
        // player.colour = saveData.colour
    }
    if ("username" in saveData) {
        usernameT.text = saveData.username
    }
}

var lastSave = ""

function saveGame() {
    let newSave = JSON.stringify({
        colour: player.colour,
        username: usernameT.text,
        savedSets: savedNewSets
    })
    if (newSave != lastSave) localStorage.setItem("platformer-save", newSave)
    lastSave = newSave
}

function rv2(x, y, angle) {
    angle *= -1
    angle += Math.PI
    return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)]
}

function intp2(x1, y1, x2, y2, i) {
    return [x1*(1-i)+x2*i, y1*(1-i)+y2*i]
}

tilesImg.onload = () => {
    
    for (let layer in lbrightness) {
        tilesImgB[layer] = ui.shadeImg(tilesImg, (r, g, b, a) => {
            r *= lbrightness[layer]
            g *= lbrightness[layer]
            b *= lbrightness[layer]
            return [r, g, b, a]
        })
    }

    tilesLoaded = true
}

let dot = false

var tCanvas = document.createElement("canvas")
var tCtx = tCanvas.getContext("2d")

function saveWorld() {
    console.log(JSON.stringify(sets))
}

function gDir(v) {
    return v / Math.abs(v)
}

let blast = new Audio("tone (1).wav")
blast.preload = "auto"
blast.volume = 0.5
blast.loop = true

let music = new Audio("music.mp3")
music.preload = "auto"
music.loop = true
music.volume = 0.5

var audios = {}
var audiosPlayed = false
var loadedAudios = 0
var totalAudios = 0
var loadingA = 1

function loadSound(path, amount) {
    audios[path] = []
    for (let i = 0; i < amount; i++) {
        let sound = new Audio(path)
        sound.preload = "auto"
        sound.preservesPitch = true
        sound.volume = 0
        sound.playbackRate = 1
        sound.loaded = false
        // sound.play()
        sound.addEventListener("loadedmetadata", () => {
            sound.loaded = true
            if (loadedAudios < totalAudios) {
                loadedAudios += 1
                console.log(Math.round(loadedAudios/totalAudios*100)+"% Loaded")
            } 
        })
        totalAudios += 1
        // sound.play()
        audios[path].push(sound)
    }
}

loadSound("flipped.wav", 5)
loadSound("dash.wav", 5)
loadSound("play.wav", 1)
loadSound("click.wav", 2)

function getSound(path) {
    if (path in audios) {
        for (let i = 0; i < audios[path].length; i++) {
            if (audios[path][i].paused) {
                let sound = audios[path][i]
                sound.volume = 0
                sound.playbackRate = 1
                sound.preservesPitch = true
                sound.currentTime = 0
                sound.load()
                return sound
            }
        }
    }
    console.log("uh oh")
    let sound = new Audio(path)
    sound.preload = "auto"
    return sound
}

function playSound(path, volume=1) {
    let sound = getSound(path)
    sound.volume = volume*baseVolume
    sound.play()
    return sound
}

function playSoundA(path, volume, pitch) {
    let sound = getSound(path)
    sound.preservesPitch = false
    sound.playbackRate = pitch
    sound.volume = volume*baseVolume
    sound.play()
    return sound
}

function playSoundV(path, volume=1, pitch=1, pitchV=0.25) {
    playSound(path, volume)
    // playSoundA(path, volume, pitch+(Math.random()*2-1)*pitchV)
}

var blastCooldown = 0
var musicCooldown = 0

var offC = new ui.Canvas()

var scene = "menu"
var tscene = "menu"
var switchA = 0
var switchTA = 0
var scenes = ["menu", "game", "info", "settings", "leaderboard"]
var scenesD = {}
for (let scene of scenes) {
    scenesD[scene] = {show: false, x: 0, y: 0}
}
scenesD[scene].show = true

function transitionAnimation(scene, tscene, a) {
    if (tscene == "game") {
        scenesD[scene].y = -a*canvas.height
        scenesD[tscene].y = (1-a)*canvas.height
    }
    if (tscene == "info") {
        scenesD[scene].x = a*canvas.width
        scenesD[tscene].x = -(1-a)*canvas.width
    }
    if (tscene == "settings") {
        scenesD[scene].x = -a*canvas.width
        scenesD[tscene].x = (1-a)*canvas.width
    }
    if (tscene == "leaderboard") {
        scenesD[scene].y = a*canvas.height
        scenesD[tscene].y = -(1-a)*canvas.height
    }


    if (tscene == "menu") {
        if (scene == "info") {
            scenesD[scene].x = -a*canvas.width
            scenesD[tscene].x = (1-a)*canvas.width
        }
        if (scene == "settings") {
            scenesD[scene].x = a*canvas.width
            scenesD[tscene].x = -(1-a)*canvas.width
        }
        if (scene == "leaderboard") {
            scenesD[scene].y = -a*canvas.height
            scenesD[tscene].y = (1-a)*canvas.height
        }
    }
}

function setScene(nscene) {
    if (switchTA == 1) {
        scenesD[scene].show = false
        scenesD[scene].x = 0
        scenesD[scene].y = 0
        scene = tscene
        scenesD[scene].x = 0
        scenesD[scene].y = 0
    }
    tscene = nscene
    scenesD[nscene].show = true
    switchA = switchTA == 1 ? 1 - switchA : 0
    switchTA = 1
    transitionAnimation(scene, tscene, switchA)
}

function update(timestamp) {

    requestAnimationFrame(update)
    dot = !dot
    // if (!dot) return
    fps++
    
    utils.getDelta(timestamp)
    ui.resizeCanvas()
    tCanvas.width = canvas.width
    tCanvas.height = canvas.height
    ui.getSu()
    input.setGlobals()

    // if (mouse.lclick && !audiosPlayed) {
    //     for (let path in audios) {
    //         for (let sound of audios[path]) {
    //             sound.volume = 0
    //             sound.play()
    //         }
    //     }
    //     setTimeout(() => {
    //         for (let path in audios) {
    //             for (let sound of audios[path]) {
    //                 sound.pause()
    //             }
    //         }
    //     }, 100)
    // }

    player.username = username

    // if (musicCooldown != -1) musicCooldown -= delta

    // if (musicCooldown <= 0 && musicCooldown != -1) {
    //     musicCooldown = -1
    //     let sound = playSound("music.mp3", 0.5)
    //     sound.addEventListener("loadedmetadata", () => {
    //         musicCooldown = sound.duration-0.5
    //     })
    // }
  
    if (wConnect && !document.hidden) {
        connectToServer()
        wConnect = false
    }

    
    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [0, 0, 0, 1])

    switchA = lerp(switchA, switchTA, (switchA*0.75+0.25) * delta * 5)
    if (switchA > 0.999 && switchTA == 1) {
        switchTA = 0
        switchA = 0
        scenesD[scene].show = false
        scene = tscene
        scenesD[scene].x = 0
        scenesD[scene].y = 0
    }
    if (switchA > 0) {
        transitionAnimation(scene, tscene, switchA)
    }

    for (let scene of scenes) {
        if (scenesD[scene].show) {
            offC.set(canvas.width/2+scenesD[scene].x, canvas.height/2+scenesD[scene].y, canvas.width, canvas.height)
            ui.setC(offC)
            if (scene == "menu") {
                menuTick()
            } else if (scene == "game") {
                gameTick()
            } else if (scene == "info") {
                infoTick()
            } else if (scene == "settings") {
                settingsTick()
            } else if (scene == "leaderboard") {
                leaderboardTick()
            }
            ui.setC()
        }
    }

    if (loadingA > 0.01) {
        ctx.globalAlpha = loadingA
        ui.text(20*su, 80*su, 50*su, Math.round(loadedAudios/totalAudios*100)+"% Loaded")
        ctx.globalAlpha = 1
    }

    if (loadedAudios >= totalAudios) {
        loadingA = lerp(loadingA, 0, delta*15)
    }

    saveGame()

    input.updateInput()
}

requestAnimationFrame(update)

input.scroll = (x, y) => {
    if (editor && editorBG.hovered()) {
        editorBG.scroll(x, y)
    }
}

input.checkInputs = (event) => {
    input.cistart()

    usernameT.checkFocus(event)

    input.ciend()
}

function tsc(x, y, parallax=1) {
    return [(x-camera.x)*parallax*camera.zoom + canvas.width/2, (-y+camera.y)*parallax*camera.zoom + canvas.height/2]
}

setInterval(() => {
    console.log(tps, fps)
    fps2 = fps
    tps = 0
    fps = 0
}, 1000)