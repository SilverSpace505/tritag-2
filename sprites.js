
class Wave {
    constructor(x, y, size, speed, colour) {
        this.x = x
        this.y = y
        this.size = size
        this.csize = 0
        this.speed = speed
        this.colour = colour
        this.dead = false
        this.ogsize = size
        if (this.speed < 0) {
            this.csize = size
            this.size = 0
        }
    }
    tick() {
        this.csize = lerp(this.csize, this.size, tdelta*Math.abs(this.speed))
        if (Math.abs(this.csize-this.size) < 0.01) {
            this.dead = true
        }
    }
    draw() {
        ui.circle(...tsc(this.x, this.y), this.csize*camera.zoom, [0, 0, 0, 0], {outlineSize: 7.5*camera.zoom, outlineColour: [this.colour[0], this.colour[1], this.colour[2], this.colour[3]*(1-Math.abs(0.5-this.csize/this.ogsize)*2)]})
    }
}

class PShadow {
    constructor(x, y, angle, size, lifetime, colour) {
        this.x = x
        this.y = y
        this.angle = angle
        this.size = size
        this.ogsize = size
        this.lifetime = lifetime
        this.time = 0
        this.colour = colour
        this.dead = false
    }
    tick() {
        this.time += delta
        if (this.time >= this.lifetime) this.dead = true
        this.size = Math.min((this.lifetime-this.time)/this.lifetime*2, 1) * this.ogsize
    }
    draw() {
        ctx.save()
        ctx.translate(tsc(this.x, this.y)[0], tsc(this.x, this.y)[1]+scenesD["game"].y)
        ctx.rotate(this.angle)

        ctx.beginPath()
        ctx.moveTo(0, 25*this.size*camera.zoom)
        ctx.lineTo(-20*this.size*camera.zoom, -25*this.size*camera.zoom)
        ctx.lineTo(0, -12.5*this.size*camera.zoom)
        ctx.lineTo(20*this.size*camera.zoom, -25*this.size*camera.zoom)
        ctx.closePath()

        ctx.fillStyle = `rgba(${this.colour[0]}, ${this.colour[1]}, ${this.colour[2]}, ${this.colour[3]*(1-this.time/this.lifetime)})`
        ctx.fill()

        ctx.restore()
    }
}

class Line {
    constructor(x1, y1, x2, y2, size, lifetime, colour) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.size = size
        this.lifetime = lifetime
        this.time = 0
        this.colour = colour
        this.dead = false
    }
    tick() {
        this.time += delta
        if (this.time >= this.lifetime) this.dead = true
    }
    draw() {
        ui.line(...tsc(this.x1, this.y1), ...tsc(this.x2, this.y2), this.size*camera.zoom, [this.colour[0], this.colour[1], this.colour[2], this.colour[3]*(1-this.time/this.lifetime)])
    }
}