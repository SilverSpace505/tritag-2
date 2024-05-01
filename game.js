
var pxs = 4

var ts = {x: 16*pxs, y: 16*pxs}
var cs = {x: 10, y: 10}
var rd = {x: 2, y: 2}

var player = new Player(0, 0)
var playerDrawer = new Player(0, 0)

var baseColours = {
    red: [255, 0, 0],
    yellow: [225, 225, 0],
    green: [0, 255, 10],
    blue: [0, 150, 255]
}

player.colour = baseColours.blue

var camera = {x: player.x, y: player.y, zoom: 1}
var cameraZoom = 0.875

var chunks = {}
var loadC = 0
var sets = {}

var tiles = [
/*1*/  [0, 0],
/*2*/  [1, 0],
/*3*/  [0, 1],
/*4*/  [1, 1],
/*5*/  [2, 0],
/*6*/  [2, 1],
/*7*/  [0, 2],
/*8*/  [1, 2],
/*9*/  [2, 2],
]

var nsolid = [0]
var transparent = []
var hoverT = []

var coverDfs = {"1": 0.8}
var covers = {"1": {}}
var mergeCovers = [1]

var slopes = {
    "4": [-0.5, -0.5, 0.5, 0.5, -1], 
    "6": [0.5, -0.5, -0.5, 0.5, -1], 
    "8": [0.5, -0.5, -0.5, 0.5, 1], 
    "9": [-0.5, -0.5, 0.5, 0.5, 1], 
    
    "2": [0, -0.5, 0.5, 0.5, 3],
    "5": [0, -0.5,  -0.5, 0.5, -3],

    "3": [-0.5, 0, 0.5, -0.5, -2],
    "7": [-0.5, 0, 0.5, 0.5, 2],
}
var dlayers = [0, 1]
var clayers = [0]
var lbrightness = {"0": 1, "1": 1}
var lparallax = {"0": 1, "1": 1}

var races = {
    maze: {
        start: [350, 125],
        end: [2015, -500],
        name: "Maze",
        description: "go through the maze as fast as possible!"
    },
    opposites: {
        start: [-4250, 2450],
        end: [2850, -1950],
        name: "Opposites",
        description: "get to the other side of the map!"
    }
}
var raceNames = []
for (let raceN in races) {
    raceNames.push(races[raceN].name)
}
var bests = {}
var savedRaces = {}

var loadedBests = localStorage.getItem("bests")
if (loadedBests) {
    bests = JSON.parse(loadedBests)
}

var savedRaces = {}
var loadedRaces = localStorage.getItem("races")
if (loadedRaces) {
    savedRaces = JSON.parse(loadedRaces)
    for (let raceN in savedRaces) {
        let race = savedRaces[raceN]
        if (!(raceN in races)) {
            delete bests[raceN]
            delete savedRaces[raceN]
            localStorage.setItem("bests", JSON.stringify(bests))
            localStorage.setItem("races", JSON.stringify(savedRaces))
            continue
        }
        if (race.start.join(",") != races[raceN].start.join(",") || race.end.join(",") != races[raceN].end.join(",")) {
            delete bests[raceN]
            delete savedRaces[raceN]
            localStorage.setItem("bests", JSON.stringify(bests))
            localStorage.setItem("races", JSON.stringify(savedRaces))
            continue
        }
    }
}

var chat = []

function fillDecimals(number, decimals=2) {
    number = number.toString()
    if (!number.includes(".")) {
        number += "."
        for (let i = 0; i < decimals; i++) {
            number += "0"
        }
        return number
    }
    let parts = number.split(".")
    while (parts[1].length < decimals) {
        parts[1] += "0"
    }
    return parts[0] + "." + parts[1]
}

function chatMsg(msg, length=3) {
    chat.push([msg, length])
    playSoundV("click.wav", 0.2)
}

function gameTickT() {
    ticks++

    loadC -= tdelta

    if (loadC <= 0) {
        loadC = 0.1
        let pc = {x: Math.floor(player.x/ts.x/cs.x), y: Math.floor(-player.y/ts.y/cs.y)}
        let nearby = []
        let oldx = rd.x
        let oldy = rd.y
        rd.x = canvas.width/camera.zoom / (cs.x*ts.x)
        rd.y = canvas.height/camera.zoom / (cs.y*ts.y)
        rd.x = Math.ceil(rd.x)
        rd.y = Math.ceil(rd.y)
        for (let x = -rd.x; x < rd.x+1; x++) {
            for (let y = -rd.y; y < rd.y+1; y++) {
                let c = (pc.x+x)+","+(pc.y+y)
                nearby.push(c)
                if (!(c in chunks)) {
                    chunks[c] = {}
                    if (c in sets) {
                        for (let set of sets[c]) {
                            setTileR(set[0], set[1], set[2], set[3])
                        }
                    }
                }
            }
        }
        rd.x = oldx
        rd.y = oldy
        for (let chunk in chunks) {
            if (!nearby.includes(chunk)) {
                delete chunks[chunk]
            }
        }
    }

    let set = 0
    let offs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    let t = 0
    let ospread = [...spread]
    for (let pos of ospread) {
        let pos2 = pos.split(",").map(a => parseInt(a))
        for (let off of offs) {
            t = getTile(pos2[0]+off[0], pos2[1]+off[1], spreadl)
            if (t != spreadt && t == spreadb) {
                if (setTile(pos2[0]+off[0], pos2[1]+off[1], spreadl, spreadt)) {
                    spread.push([pos2[0]+off[0], pos2[1]+off[1]].join(","))
                    set++
                }
            }
        }
    }
    if (set <= 0) {
        spread = []
        spreadt = 0
        spreadb = 0
        spreadl = 0
    }  

    player.tick()
    player.particlesTick()

    if (editor) return

    if (player.racing) {
        player.time += tdelta
    }
    
    let interacted = false
    for (let raceN in races) {
        let race = races[raceN]
        if (utils.rect2dc(race.start[0], race.start[1], 70, 70, player.x, player.y, 50, 50)) {
            interacted = true
            if (!player.interacting) {
                player.racing = !player.racing
                if (player.racing) {
                    player.time = 0
                    player.race = raceN
                    chatMsg("Started Race: " + race.name)
                } 
                if (!player.racing) {
                    chatMsg("Canceled Race: " + race.name)
                    player.showTime = 0
                }
            }
            
        }
        if (utils.rect2dc(race.end[0], race.end[1], 70, 70, player.x, player.y, 50, 50)) {
            interacted = true
            if (!player.interacting) {
                if (player.racing) {
                    if (player.race == raceN) {
                        chatMsg("Finished " + race.name + "! Your time was " + Math.round(player.time*100)/100, 10)
                        if (!(raceN in bests)) {
                            bests[raceN] = -1
                        } 
                        if (player.time < bests[raceN] || bests[raceN] == -1) {
                            if (bests[raceN] != -1) {
                                chatMsg("NEW BEST! previous best was " + Math.round(bests[raceN]*100)/100, 10)
                            }
                            bests[raceN] = Math.round(player.time*100)/100
                            localStorage.setItem("bests", JSON.stringify(bests))
                        }
                        savedRaces[raceN] = {start: race.start, end: race.end}
                        localStorage.setItem("races", JSON.stringify(savedRaces))
                        player.racing = false
                    } else {
                        chatMsg("Wrong finish", 10)
                    }
                } else {
                    chatMsg("This is the end of the " + race.name + " race, go to the start to race.")
                }
            }
        }
    }
    player.interacting = interacted

    if (jKeysT["KeyR"] && player.race != "") {
        player.x = races[player.race].start[0]
        player.y = races[player.race].start[1]
        player.racing = false
        player.interacting = false
    }

}

function gameTick() {
    jKeysT2 = {...jKeysT2, ...jKeys}

    for (let player in playerData) {
        if (id != player && !(player in players)) {
            players[player] = new Player(0, 0)
            players[player].lastu = time
            players[player].lflipping = 0
            players[player].lflips2 = 0
            players[player].lrotated = 0
            players[player].lx2 = 0
            players[player].ly2 = 0
            players[player].langle2 = 0
        }
    }

    for (let player in players) {
        if (id == player || !(player in playerData)) {
            delete players[player]
        } else {
            let factor = Math.min(Math.max((time - players[player].lastu), 0), 0.1)*10
            players[player].colour = playerData[player].colour
            players[player].x = lerp(players[player].lx2, playerData[player].x, factor)
            players[player].y = lerp(players[player].ly2, playerData[player].y, factor)
            players[player].angle = lerp(players[player].langle2, playerData[player].angle, factor)
            players[player].flipping = lerp(players[player].lflipping, playerData[player].flipping, factor)
            players[player].rotated = lerp(players[player].lrotated, playerData[player].rotated, factor)
            players[player].lx = players[player].x; players[player].ly = players[player].y; players[player].langle = players[player].angle
            if (!playerData[player].dashing && players[player].dashing) {
                players[player].ldx = null
                players[player].ldy = null
            }
            if (playerData[player].dashing && !players[player].dashing) {
                if (players[player].ldx == null) players[player].ldx = players[player].x
                if (players[player].ldy == null) players[player].ldy = players[player].y
            }
            players[player].dashing = playerData[player].dashing
            players[player].shifting = playerData[player].shifting
            players[player].username = playerData[player].username
            for (let key in players[player]) {
                if (isNaN(players[player][key]) && !players[player][key] && !Array.isArray(players[player][key]) && key != "ldx" && key != "ldy") {
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
        gameTickT()
        for (let player in players) {
            players[player].flips = playerData[player].flips
            players[player].particlesTick()
            let factor = Math.min(Math.max((time - players[player].lastu), 0), 0.1)*10
            players[player].flips = lerp(players[player].lflips2, playerData[player].flips, factor)
        }
        jKeysT = {}
        lastTickTime = time
        tps++
        accumulator -= tdelta
    }

    if (jKeys["Tab"]) {
        editor = !editor
        // if (editor) {
        //     sets = JSON.parse(savedSets)
        // } else {
        //     savedSets = JSON.stringify(sets)
        //     newSets = JSON.parse(savedNewSets)
        //     loadNewSets(newSets)
        // }
        // chunks = {}
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

    for (let layer of dlayers) {
        if (layer < 1 && (layer == sLayer || !editor || !keys["KeyF"])) drawLayer(layer)
    }

    for (let raceN in races) {
        let race = races[raceN]
        ui.circle(...tsc(race.start[0], race.start[1]), 35*camera.zoom, [255, 0, 0, 1])
        ui.text(...tsc(race.start[0], race.start[1]+10), 20*camera.zoom, race.name + " \nSTART", {align: "center"})
        ui.circle(...tsc(race.end[0], race.end[1]), 35*camera.zoom, [0, 255, 0, 1])
        ui.text(...tsc(race.end[0], race.end[1]+10), 20*camera.zoom, race.name + " \nEND", {align: "center"})
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].tick()
        if (particles[i].dead) {particles.splice(i, 1); i--; continue}
        particles[i].draw()
    }

    for (let player in players) {
        players[player].draw()
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
        
        if (jKeys["KeyG"]) {
            chatMsg(Math.round(mw.x) + ", " + Math.round(mw.y))
        }

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
    if (player.showTime > 0) username += " | " + races[player.race].name + " | " + fillDecimals(Math.round(player.time*100)/100)

    usernameT.set(canvas.width - 160*su, 35*su, 300*su, 50*su)
    usernameT.outlineSize = 10*su
    usernameT.hover()
    usernameT.draw()

    colourButton.bgColour = [player.colour[0], player.colour[1], player.colour[2], 1]
    colourButton.set(canvas.width - 350*su, 35*su, 50*su, 50*su)
    colourButton.textSize = 20*su
    colourButton.basic()
    colourButton.draw()

    if (colourButton.hovered() && mouse.lclick) {
        colourButton.click()
        playSoundV("click.wav", 0.5, 1, 0.25)
        let coloursl = Object.keys(baseColours)
        let i = coloursl.indexOf(player.colourN)
        i++
        if (i > 3) {
            i = 0
        }
        player.colourN = coloursl[i]
        player.colour = baseColours[coloursl[i]]
    }

    if (Math.floor(new Date().getTime()/100) > sendDT) {
        sendDT = Math.floor(new Date().getTime()/100)
        sendData()
    }

    if (keys["KeyQ"]) {
        ui.text(20*su, 35*su, 50*su, fps2)
    }

    for (let i = 0; i < chat.length; i++) {
        chat[i][1] -= delta
        if (chat[i][1] <= 0) {
            chat.splice(i, 1)
            i--
        }
    }

    for (let i in chat) {
        let y = canvas.height - 50*su - (chat.length-i)*30*su
        ctx.globalAlpha = Math.min(chat[i][1], 1)
        ui.text(50*su, y, 30*su, chat[i][0])
    }

    if (player.racing) {
        player.raceA = lerp(player.raceA, 1, delta*10)
        player.showTime = 5
    } else {
        player.raceA = lerp(player.raceA, 0, delta*10)
        player.showTime -= delta
        if (player.raceA < 0.001) {
            player.raceA = 0
        }
    }

    ctx.globalAlpha = player.raceA
    ui.text(30*su, 100*su, 50*su, Math.round(player.time*100)/100)
    if (player.race in bests) ui.text(30*su, 100*su+35*su, 20*su, "Best: " + Math.round(bests[player.race]*100)/100)
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
    ui.img(canvas.width/2-scenesD["game"].x, canvas.height/2-scenesD["game"].y, canvas.width, canvas.height, tCanvas, "none", false)
    ctx.globalCompositeOperation = "source-over"
}

function isCollidingPoint(x, y) {
    for (let clayer of clayers) {
        let t = getTile(Math.floor(x/ts.x), Math.floor(y/ts.y), clayer)
        if (t in slopes) {
            let rx = x/ts.x - Math.floor(x/ts.x) - 0.5
            let ry = y/ts.y - Math.floor(y/ts.y) - 0.5
            if (
            (rx >= Math.min(slopes[t][0], slopes[t][2]) || (slopes[t][0] > slopes[t][2] && !slopes[t][5])) && 
            (ry >= Math.min(slopes[t][1], slopes[t][3]) || (slopes[t][4] == -1 && !slopes[t][6])) && 
            (rx <= Math.max(slopes[t][0], slopes[t][2]) || (slopes[t][0] < slopes[t][2] && !slopes[t][5])) &&
            (ry <= Math.max(slopes[t][1], slopes[t][3]) || (slopes[t][4] == 1 && !slopes[t][6]))) {
                if (slopes[t][4] == 0) {
                    return true
                } else {
                    let rex = Math.abs((rx - slopes[t][0]) / (slopes[t][2] - slopes[t][0]))
                    let rey = Math.abs((ry - slopes[t][1]) / (slopes[t][3] - slopes[t][1]))
                    let rc = ry
                    let min = Math.min(slopes[t][1], slopes[t][3])
                    let dis = Math.abs(slopes[t][3] - slopes[t][1])
                    let re = rex

                    if (slopes[t][4] == 2) {
                        re = Math.abs(re - 0.5) * 2
                    }
                    if (slopes[t][4] == -2) {
                        re = 1 - Math.abs(re - 0.5) * 2
                    }

                    if (slopes[t][4] == -3) {
                        re = rey
                        rc = rx
                        re = 1 - Math.abs(re - 0.5) * 2
                        min = Math.min(slopes[t][0], slopes[t][2])
                        dis = Math.abs(slopes[t][2] - slopes[t][0])
                    }   
                    if (slopes[t][4] == 3) {
                        re = rey
                        rc = rx
                        re = Math.abs(re - 0.5) * 2
                        min = Math.min(slopes[t][0], slopes[t][2])
                        dis = Math.abs(slopes[t][2] - slopes[t][0])
                    }      

                    if (slopes[t][4] / Math.abs(slopes[t][4]) == -1) {
                        if (rc <= min + re * dis) return true
                    } else if (slopes[t][4] / Math.abs(slopes[t][4]) == 1) {
                        if (rc >= min + re * dis) return true
                    }
                }
            }
        } else {
            if (!nsolid.includes(t)) return true
        }
    }
    return false
}

function setTile(x, y, l,  v, newS=true) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in sets) {
        let poses = sets[c].map(set => set[0]+","+set[1]+","+set[2])
        if (poses.includes(x+","+y+","+l)) {
            if (v == 0) {
                sets[c].splice(poses.indexOf(x+","+y+","+l), 1)
            } else {
                sets[c][poses.indexOf(x+","+y+","+l)][3] = v
            }
        } else if (v != 0) {
            sets[c].push([x, y, l, v])
        }
    } else if (v != 0) {
        sets[c] = [[x, y, l, v]]
    }

    if (newS && !editor) {
        if (c in newSets) {
            let poses = newSets[c].map(set => set[0]+","+set[1]+","+set[2])
            if (poses.includes(x+","+y+","+l)) {
                newSets[c][poses.indexOf(x+","+y+","+l)][3] = v
            } else {
                newSets[c].push([x, y, l, v])
            }
        } else {
            newSets[c] = [[x, y, l, v]]
        }
        savedNewSets = JSON.stringify(newSets)
    }

    if (c in chunks) {
        setTileR(x, y, l, v)
        return true
    } else {
        return false
    }
}

var moveLayers = {}
var savedSets = {}
var savedNewSets = {}

var totalCollect = 1

fetch('world.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    return response.text()
  })
  .then(fileContent => {
    let startTime = new Date().getTime()
    let loaded = JSON.parse(fileContent)
    totalCollect = 0
    for (let chunk in loaded) {
        for (let set of loaded[chunk]) {
            if (set[2] in moveLayers) set[2] = moveLayers[set[2]]
            if (set[2] in lbrightness) setTile(set[0], set[1], set[2], set[3], false)
            if (set[2] == 0 && hoverT.includes(set[3])) totalCollect++
        }
    }
    savedSets = JSON.stringify(sets)
    console.log("World loaded in", new Date().getTime() - startTime+"ms")

    // if (saveData) {
    //     if ("savedSets" in saveData) {
    //         loadNewSets(JSON.parse(saveData.savedSets))
    //         newSets = JSON.parse(saveData.savedSets)
    //         savedNewSets = saveData.savedSets
    //     }
    // }
  })
  .catch(error => {
    console.error("Error fetching the file:", error)
  })

function loadNewSets(newSets={}) {
    for (let chunk in newSets) {
        for (let set of newSets[chunk]) {
            setTile(set[0], set[1], set[2], set[3], false)
        }
    }
}

function loadChunk(x, y) {
    let chunk = {}
    for (let x2 = 0; x2 < cs.x; x2++) {
        for (let y2 = 0; y2 < cs.y; y2++) {
            chunk.push(0)
        }
    }
    return chunk
}

function makeLayer() {
    let layer = []
    for (let x2 = 0; x2 < cs.x; x2++) {
        for (let y2 = 0; y2 < cs.y; y2++) {
            layer.push(0)
        }
    }
    return layer
}

function getTile(x, y, l) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in chunks) {
        if (l in chunks[c]) return chunks[c][l][(x - Math.floor(x/cs.x)*cs.x) * cs.y + (-y - Math.floor(-y/cs.y)*cs.y)]
    }
    return 0
}

function setTileR(x, y, l, v) {
    let c = Math.floor(x/cs.x)+","+Math.floor(-y/cs.y)
    if (c in chunks) {
        if (!(l in chunks[c])) chunks[c][l] = makeLayer()
        chunks[c][l][(x - Math.floor(x/cs.x)*cs.x) * cs.y + (-y - Math.floor(-y/cs.y)*cs.y)] = v
    }
}