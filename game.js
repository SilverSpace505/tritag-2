
var pxs = 4

var ts = {x: 16*pxs, y: 16*pxs}
var cs = {x: 10, y: 10}
var rd = {x: 2, y: 2}

var player = new Player(0, 150)

var baseColours = {
    red: [204, 0, 0, 1],
    yellow: [204, 198, 0, 1],
    green: [0, 204, 10, 1],
    blue: [0, 109, 204, 1]
}

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

    if (saveData) {
        if ("savedSets" in saveData) {
            loadNewSets(JSON.parse(saveData.savedSets))
            newSets = JSON.parse(saveData.savedSets)
            savedNewSets = saveData.savedSets
        }
    }
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

function gameTick() {
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
}