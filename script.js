
utils.setup()
utils.setStyles()
utils.setGlobals()

var delta = 0
var su = 0
var lastTime = 0

var tickRate = 100
var tdelta = 1/tickRate

var player = new Player(0, 0)
var accumulator = 0

var camera = {x: 0, y: 0, zoom: 1}

function cv2(x, y) {
    return [(x-camera.x)*camera.zoom+canvas.width/2, (y-camera.y)*camera.zoom+canvas.height/2]
}

function tick() {
    player.tick()

    if (player.x > border) {
        player.x = border; player.vx *= -1
    }
    if (player.x < -border) {
        player.x = -border; player.vx *= -1
    }

    if (player.y > border) {
        player.y = border; player.vy *= -1
    }
    if (player.y < -border) {
        player.y = -border; player.vy *= -1
    }

    jKeysT = {}
}

function rv2(x, y, angle) {
    return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)]
}

var particles = []
var jKeysT = {}

var border = 500

function update(timestamp) {
    requestAnimationFrame(update)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    camera.zoom = su

    jKeysT = {...jKeysT, ...jKeys}

    camera.x = lerp(camera.x, player.vix, delta*10)
    camera.y = lerp(camera.y, player.viy, delta*10)

    accumulator += delta
    var startTime = performance.now()
    while (accumulator > tdelta && performance.now() - startTime < 1000/120) {
        tick()
        accumulator -= tdelta
    }

  

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [0, 0, 0, 1])

    for (let i = 0; i < particles.length; i++) {
        particles[i].tick()
        if (particles[i].dead) {particles.splice(i, 1); i--; continue}
        particles[i].draw()
    }

    player.draw()

    input.updateInput()
}

requestAnimationFrame(update)