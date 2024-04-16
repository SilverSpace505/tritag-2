
utils.setup()
utils.setStyles()
utils.setGlobals()
// ui.setFont("font", "font.ttf")

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

var selected = 1
var sLayer = 0
var newSets = {}

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

function drawLayer(layer, cover={}, defaultA=1) {
    if (!tilesLoaded) return
    tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height)
    let oCtx = ctx
    ctx = tCtx
    for (let chunk in chunks) {
        if (layer in chunks[chunk]) {
            let pos = chunk.split(",").map(a => parseInt(a))
            for (let x = 0; x < cs.x; x++) {
                for (let y = 0; y < cs.y; y++) {
                    let tile = chunks[chunk][layer][x*cs.y+y]
                    if (tile != 0) {
                        ctx.globalAlpha = 1
                        let a = defaultA
                        if (tile in cover) a = cover[tile]
                        let s = ((x+pos[0]*cs.x)*2+(y+pos[1]*cs.y))
                        if (hoverT.includes(tile)) y -= Math.sin(time*2+s) / 8
                        if (transparent.includes(tile) || a < 1) {
                            ctx.globalCompositeOperation = "destination-out"
                            ui.rect(Math.round(tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer])[0]), Math.round(tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer])[1]), Math.round((ts.x*camera.zoom*lparallax[layer]+1) / 2) * 2, Math.round((ts.y*camera.zoom*lparallax[layer]+1) / 2) * 2, [0, 0, 0, 1])
                            ctx.globalAlpha = a
                            ctx.globalCompositeOperation = "source-over"
                            ui.img(...tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer]), ts.x*camera.zoom*lparallax[layer]+1, ts.y*camera.zoom*lparallax[layer]+1, tilesImgB[layer], [tiles[tile-1][0]*16, tiles[tile-1][1]*16, 16, 16])
                        } else {
                            ui.img(...tsc((pos[0]*cs.x+x) * ts.x + ts.x/2, (-pos[1]*cs.y-y) * ts.y + ts.y/2, lparallax[layer]), ts.x*camera.zoom*lparallax[layer]+1, ts.y*camera.zoom*lparallax[layer]+1, tilesImgB[layer], [tiles[tile-1][0]*16, tiles[tile-1][1]*16, 16, 16])
                        }
                        if (hoverT.includes(tile)) y += Math.sin(time*2+s) / 8
                    }
                }
            }
        }
    }
    ctx = oCtx
    ui.img(canvas.width/2, canvas.height/2, canvas.width, canvas.height, tCanvas, "none", false)
    ctx.globalCompositeOperation = "source-over"
}

function gDir(v) {
    return v / Math.abs(v)
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

    jKeysT2 = {...jKeysT2, ...jKeys}

    if (wConnect && !document.hidden) {
        connectToServer()
        wConnect = false
    }

    for (let player in playerData) {
        if (id != player && !(player in players)) {
            players[player] = {x: 0, lx: 0, ly: 0, y: 0, frame: 1, angle: 0, h: 1, langle: 0, lh: 1, lastu: time}
        }
    }

    for (let player in players) {
        if (id == player || !(player in playerData)) {
            delete players[player]
        } else {
            playerData[player].framesT += delta
            while (playerData[player].framesT > 1/10 / playerData[player].framesA && playerData[player].frames.length > 1) {
                playerData[player].frames.splice(0, 1)
                playerData[player].framesT -= 1/10 / playerData[player].framesA
            }
            if (time - players[player].lastu < 0.1) {
                players[player].x += (playerData[player].x - players[player].lx) * delta*10
                players[player].y += (playerData[player].y - players[player].ly) * delta*10
                players[player].angle += (playerData[player].angle - players[player].langle) * delta*10
                players[player].frame = playerData[player].frames[0]
                players[player].h += (playerData[player].h - players[player].lh) * delta*10
            }

            for (let key in players[player]) {
                if (isNaN(players[player][key])) {
                    players[player][key] = 0
                }
            }
        }
    }

    iaccumulator += delta
    let startTime = performance.now()
    var ticked = false
    while (iaccumulator > itdelta && performance.now() - startTime < 1000/120) {
        keysT = keys
        jKeysT = jKeysT2
        iaccumulator -= itdelta
        ticked = true
    }

    if (ticked) {
        jKeysT2 = {}
    }

    time += delta
    accumulator += delta
    startTime = performance.now()
    while ((accumulator >= tdelta || keys["KeyT"]) && performance.now() - startTime < Math.min(1000/120)) {
        gameTick()
        jKeysT = {}
        lastTickTime = time
        tps++
        accumulator -= tdelta
    }

    if (jKeys["Tab"]) {
        editor = !editor
        if (editor) {
            sets = JSON.parse(savedSets)
        } else {
            savedSets = JSON.stringify(sets)
            newSets = JSON.parse(savedNewSets)
            loadNewSets(newSets)
        }
        chunks = {}
    }
    // editor = false

    if (keys["KeyT"]) {
        accumulator = 0
    }

    if (keys["Minus"]) {
        cameraZoom *= 0.99
    }
    if (keys["Equal"]) {
        cameraZoom *= 1.01
    }

    if (!editor) cameraZoom = Math.min(Math.max(cameraZoom, 0.875), 5)

    camera.zoom = lerp(camera.zoom, su*cameraZoom, delta*10)
    if (time < 0.1) camera.zoom = su*cameraZoom

    camera.x = lerp(camera.x, player.vix, delta*10)
    camera.y = lerp(camera.y, player.viy, delta*10)

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [0, 0, 0, 1])

    for (let layer of dlayers) {
        if (layer < 1 && (layer == sLayer || !editor || !keys["KeyF"])) drawLayer(layer)
    }

    for (let player in players) {
        ui.text(...tsc(players[player].x, players[player].y + (26*pxs/2 + 20) * players[player].h), 25*camera.zoom, playerData[player].username, {align: "center"})
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].tick()
        if (particles[i].dead) {particles.splice(i, 1); i--; continue}
        particles[i].draw()
    }

    player.draw()

    for (let cover in player.covers) {
        if (player.covers[cover] == 0) continue
        if (!(player.covers[cover] in covers[cover])) covers[cover][player.covers[cover]] = coverDfs[cover]
        covers[cover][player.covers[cover]] = lerp(covers[cover][player.covers[cover]], 0, delta*10)
    }

    for (let cover in covers) {
        if (mergeCovers.includes(parseInt(cover)) && player.covers[cover] != 0) continue
        for (let tile in covers[cover]) {
            if (tile == player.covers[cover]) continue
            covers[cover][tile] = lerp(covers[cover][tile], coverDfs[cover], delta*10)
            if (covers[cover][tile] > coverDfs[cover]-0.01) delete covers[cover][tile]
        }
    }

    for (let layer of dlayers) {
        let cover = {}
        let defaultA = 1
        if (layer in covers) {
            cover = covers[layer]
            defaultA = coverDfs[layer]
            if (mergeCovers.includes(layer)) {
                let smallest = Math.min(...Object.values(covers[layer]), coverDfs[layer])
                defaultA = smallest
                cover = {}
            }
        }
        if (layer >= 1 && (layer == sLayer || !editor || !keys["KeyF"])) drawLayer(layer, cover, defaultA)
        ctx.globalAlpha = 1
    }

    if (editor) {
        let mw = {x: (mouse.x - canvas.width/2) / camera.zoom / lparallax[sLayer] + camera.x, y: ((canvas.height-mouse.y) - canvas.height/2) / lparallax[sLayer] / camera.zoom + camera.y}
        
        if (!ui.hovered(canvas.width - 64*su*6/2-10*su, 128*su*6/2+10*su, 64*su*6, 128*su*6)) {
            ctx.globalAlpha = 0.5
            ui.img(...tsc(Math.floor(mw.x/ts.x)*ts.x+ts.x/2, Math.floor(mw.y/ts.y)*ts.y+ts.y/2, lparallax[sLayer]), ts.x*camera.zoom*lparallax[sLayer], ts.y*camera.zoom*lparallax[sLayer], tilesImgB[sLayer], [tiles[selected-1][0]*16, tiles[selected-1][1]*16, 16, 16])
            ui.text(...tsc(Math.floor(mw.x/ts.x)*ts.x+ts.x, Math.floor(mw.y/ts.y)*ts.y+ts.y, lparallax[sLayer]), 20*camera.zoom, sLayer.toString())
            ctx.globalAlpha = 1
        }
       
        let w = tilesImg.width * su * 6
        let h = tilesImg.height * su * 6

        editorBG.set(canvas.width - w/2-10*su, 128*su*6/2+10*su + 60*su, w, 128*su*6)
        editorBG.bounds.minY = 128*su*6 - h
        editorBG.colour = [0, 0, 0, 0.25]
        
        editorBG.draw()
        ui.setC(editorBG)

        ui.img(w/2, h/2, w, h, tilesImg)

        ui.rect(tiles[selected-1][0]*16*6*su + 16*3*su, tiles[selected-1][1]*16*6*su + 16*3*su, 16*6*su, 16*6*su, [0, 0, 0, 0], 5*su, [255, 255, 255, 0.5])

        if (jKeys["KeyE"] && (sLayer+1) in lbrightness) {
            sLayer += 1
        }
        if (jKeys["KeyQ"] && (sLayer-1) in lbrightness) {
            sLayer -= 1
        }

        if (jKeys["ArrowRight"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0] + 1,y:tiles[selected-1][1]}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }
        if (jKeys["ArrowLeft"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0] - 1,y:tiles[selected-1][1]}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }
        if (jKeys["ArrowUp"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0],y:tiles[selected-1][1] - 1}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }
        if (jKeys["ArrowDown"]) {
            let poses = tiles.map(a => a[0]+","+a[1])
            let p = {x:tiles[selected-1][0],y:tiles[selected-1][1] + 1}
            if (poses.includes(p.x+","+p.y)) selected = poses.indexOf(p.x+","+p.y)+1
        }

        if (ui.hovered(canvas.width - w/2-10*su, h/2+10*su+60*su, w, h)) {
            let tx = Math.floor((mouse.x - (canvas.width - w-10*su)) / (16*6*su))
            let ty = Math.floor((mouse.y - 10*su - editorBG.off.y - 60*su) / (16*6*su))
            let poses = tiles.map(a => a[0]+","+a[1])
            if (!mouse.ldown && poses.includes(tx+","+ty)) {
                ui.rect(tx*16*6*su + 16*3*su, ty*16*6*su + 16*3*su, 16*6*su, 16*6*su, [255, 255, 255, 0.1])
            }
            if (mouse.lclick) {
                if (poses.includes(tx+","+ty)) selected = poses.indexOf(tx+","+ty)+1
            }
        }

        if (jKeys["KeyR"]) {
            navigator.clipboard.writeText(JSON.stringify(sets)).then(() => console.log("World Copied"))
        }

        editorBG.drawScroll({x: 5*su, y: 5*su}, 5*su)
        editorBG.drawBorder(10*su, [0, 0, 0, 0.1])
        ui.setC()
    }

    usernameT.text = usernameT.text.substring(0, 15)

    username = usernameT.text.length > 0 ? usernameT.text : "Unnamed"

    usernameT.set(canvas.width - 160*su, 35*su, 300*su, 50*su)
    usernameT.outlineSize = 10*su
    usernameT.hover()
    usernameT.draw()

    colourButton.bgColour = baseColours[player.colour]
    colourButton.set(canvas.width - 350*su, 35*su, 50*su, 50*su)
    colourButton.textSize = 20*su
    colourButton.basic()
    colourButton.draw()

    if (colourButton.hovered() && mouse.lclick) {
        colourButton.click()
        let coloursl = Object.keys(baseColours)
        let i = coloursl.indexOf(player.colour)
        i++
        if (i > 3) {
            i = 0
        }
        // player.colour = coloursl[i]
    }

    saveGame()

    if (Math.floor(new Date().getTime()/100) > sendDT) {
        sendDT = Math.floor(new Date().getTime()/100)
        sendData()
    }

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
    tps = 0
    fps = 0
}, 1000)