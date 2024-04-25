
class Player {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = 0
        this.vy = 0
        this.angle = Math.PI
        this.speed = 2000
        this.angleSpeed = Math.PI*2
        this.flipping = 0
        this.maxFlips = 4
        this.shiftMultiply = 2
        this.flips = 0
        this.rotated = 0
        this.lx = this.x
        this.ly = this.y
        this.langle = this.angle
        this.vix = this.x
        this.viy = this.y
        this.viangle = this.angle
        this.lagx = 0
        this.lagy = 0
        this.lagflips = 0
        this.flipA = 0
        this.decreaseA = 0
        this.lflips = 0
        this.colourN = "blue"
        this.colour = [0, 0, 0]
        this.shifting = false
        this.flipx = 0
        this.flipy = 0
        this.shadowCooldown = 0
        this.dashing = false
        this.ldx = null
        this.ldy = null
        this.h = 1
        this.covers = {}
        this.splits = 4
        this.slope = 1
        this.slopeAmt = 0.1
        this.cPoints = []
        this.colliding = []
        this.fixD = 16
        this.username = ""
        this.flippingCooldown = 0
        
        this.width = 50
        this.height = 50
        this.time = 0
    }
    tick() {
        if (Math.sqrt((this.x-this.lx)**2 + (this.y-this.ly)**2) < this.speed*tdelta/2) {
            if (this.dashing) {
                this.ldx = null
                this.ldy = null
            }
            this.dashing = false
        }

        this.lx = this.x
        this.ly = this.y
        this.langle = this.angle

        let mx = 0
        let my = 0

        this.shifting = Boolean(keysT["ShiftLeft"])

        if (this.shifting) {
            this.speed /= this.shiftMultiply
            this.angleSpeed *= this.shiftMultiply
        }

        if (keysT["KeyW"] && !editor) {
            this.vx -= Math.sin(this.angle)*this.speed*tdelta
            this.vy -= Math.cos(this.angle)*this.speed*tdelta
            mx -= Math.sin(this.angle)
            my -= Math.cos(this.angle)
        }
        if (keysT["KeyS"] && !editor) {
            this.vx += Math.sin(this.angle)*this.speed*tdelta/2
            this.vy += Math.cos(this.angle)*this.speed*tdelta/2
            mx += Math.sin(this.angle)/2
            my += Math.cos(this.angle)/2
        }

        var still = mx == 0 && my == 0
        this.flipping -= tdelta
        
        if (keysT["KeyA"] && !editor) {
            this.angle -= this.angleSpeed*tdelta
            this.rotated -= this.angleSpeed*tdelta
            this.flipping = Math.max(0.1, this.flipping)
        }
        if (keysT["KeyD"] && !editor) {
            this.angle += this.angleSpeed*tdelta
            this.rotated += this.angleSpeed*tdelta
            this.flipping = Math.max(0.1, this.flipping)
        }

        if (keysT["KeyW"] && editor) {
            this.vy += this.speed*10*tdelta
        }
        if (keysT["KeyS"] && editor) {
            this.vy -= this.speed*10*tdelta
        }
        if (keysT["KeyD"] && editor) {
            this.vx += this.speed*10*tdelta
        }
        if (keysT["KeyA"] && editor) {
            this.vx -= this.speed*10*tdelta
        }

        if (jKeysT["Space"] && this.flips > 0) {
            this.vx += mx*this.speed
            this.vy += my*this.speed
            this.flips -= 1
            this.dashing = true
            if (this.ldx == null) this.ldx = this.x
            if (this.ldy == null) this.ldy = this.y
            if (this.flips < 0) this.flips = 0
        }

        if (this.shifting) {
            this.speed *= this.shiftMultiply
            this.angleSpeed /= this.shiftMultiply
        }

        if (this.flipping <= 0) {
            this.rotated = 0
        }

        if (Math.abs(this.rotated) >= Math.PI*1.75) {
            let dir = this.rotated / Math.abs(this.rotated)
            // if (this.flips < 4) {
            //     this.flipA = 1
            //     // particles.push(new Wave(this.x, this.y, 50*su, -3, [this.colour[0], this.colour[1], this.colour[2], 1]))
            // }
            this.flips += 1
            if (this.flips > this.maxFlips) {
                this.flips = this.maxFlips
            }
            this.rotated -= Math.PI*2*dir
            this.flipping = 2
        }

        if (this.flipping <= 0) {
            this.flipping = 0
            this.flips -= tdelta/3
            if (this.flips < 0) {
                this.flips = 0
            }
        }

        this.cPoints = []
        this.cPoints.push(rv2(0, -0.25, this.angle))
        this.cPoints.push(rv2(-0.4, -0.5, this.angle))
        this.cPoints.push(rv2(0.4, -0.5, this.angle))
        this.cPoints.push(rv2(...intp2(-0.4, -0.5, 0, -0.25, 0.5), this.angle))
        this.cPoints.push(rv2(...intp2(0.4, -0.5, 0, -0.25, 0.5), this.angle))

        this.cPoints.push(rv2(...intp2(-0.4, -0.5, 0, 0.5, 0.33), this.angle))
        this.cPoints.push(rv2(...intp2(0.4, -0.5, 0, 0.5, 0.33), this.angle))

        // this.cPoints.push(rv2(...intp2(-0.4, -0.5, 0, 0.5, 0.5), this.angle))
        // this.cPoints.push(rv2(...intp2(0.4, -0.5, 0, 0.5, 0.5), this.angle))

        this.cPoints.push(rv2(...intp2(-0.4, -0.5, 0, 0.5, 0.66), this.angle))
        this.cPoints.push(rv2(...intp2(0.4, -0.5, 0, 0.5, 0.66), this.angle))
        
        this.cPoints.push(rv2(0, 0.5, this.angle))

        this.vx = lerp(this.vx, 0, tdelta*60*(1 - (editor ? 0.8 : 0.95)))
        this.vy = lerp(this.vy, 0, tdelta*60*(1 - (editor ? 0.8 : 0.95)))

        // this.vy += 500*tdelta

        this.x += this.vx*tdelta
        this.y += this.vy*tdelta

        // this.isColliding2()

        if (this.isColliding()) {
            this.fixCollision()
        }

        // this.move(this.vx*tdelta, this.vy*tdelta, 1)

        this.covers = {}
        for (let cover in covers) {
            this.covers[cover] = getTile(Math.floor(this.x/ts.x), Math.floor(this.y/ts.y), cover)
        }

        let w = tilesImg.width*su*6
        let h = 128*su*6
        if (editor && !ui.hovered(canvas.width - w/2-10*su, h/2+10*su, w, h)) {
            let mw = {x: (mouse.x - canvas.width/2) / camera.zoom / lparallax[sLayer] + camera.x, y: ((canvas.height-mouse.y) - canvas.height/2) / camera.zoom / lparallax[sLayer] + camera.y}
            if (mouse.rdown && getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer) != 0) {
                if (keys["KeyB"]) {
                    spreadb = getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer)
                    spreadt = 0
                    spreadl = sLayer
                    spread = []
                    spread.push([Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y)].join(","))
                }
                setTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer, 0)
            }
            if (mouse.ldown && getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer) != selected) {
                if (keys["KeyB"]) {
                    spreadb = getTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer)
                    spreadt = selected
                    spreadl = sLayer
                    spread = []
                    spread.push([Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y)].join(","))
                }
                setTile(Math.floor(mw.x/ts.x), Math.floor(mw.y/ts.y), sLayer, selected)
            }
        }
    }
    particlesTick() {
        if (this.flippingCooldown != -1) this.flippingCooldown -= tdelta
        this.shadowCooldown -= tdelta
        if ((this.shifting || this.dashing || this.flipping > 0) && this.shadowCooldown <= 0) {
            this.shadowCooldown = 1/20
            if (this.shifting) {
                particles.push(new PShadow(this.x, this.y, this.viangle, 1, 1, [this.colour[0], this.colour[1], this.colour[2], 0.5]))
            } else if (this.flipping > 0) {
                if (this.flippingCooldown <= 0 && this.flippingCooldown != -1) {
                    this.flippingCooldown = 0.3
                    // let sound = playSound("flipping.wav", 0.1)
                    // sound.addEventListener("loadedmetadata", () => {
                    //     this.flippingCooldown = sound.duration-0.5
                    // })
                }
                particles.push(new PShadow(this.x, this.y, this.viangle, 1, 0.5, [this.colour[0], this.colour[1], this.colour[2], 0.35]))
            }
            if (this.dashing) {
                particles.push(new Line(this.ldx, this.ldy, this.x, this.y, 30, 1, [this.colour[0], this.colour[1], this.colour[2], 0.5]))
                this.ldx = this.x
                this.ldy = this.y
            }
        }

        if (Math.ceil(this.flips) < Math.ceil(this.lflips)) {
            this.decreaseA = 1
            playSoundV("dash.wav", 0.5)
            particles.push(new Wave(this.x, this.y, 80, 3, [this.colour[0], this.colour[1], this.colour[2], 0.5]))
        }

        if (Math.ceil(this.flips) > Math.ceil(this.lflips)) {
            this.flipA = 1
            playSoundV("flipped.wav", 0.25)
            particles.push(new Wave(this.x, this.y, 80, -3, [this.colour[0], this.colour[1], this.colour[2], 1]))
        }
        this.lflips = this.flips
    }
    isColliding() {
        if (editor) return false
        for (let point of this.cPoints) {
            if (isCollidingPoint(this.x+point[0]*this.width, this.y+point[1]*this.height)) return true
        }
        return false
    }
    isColliding2() {
        let collided = false
        this.colliding = []
        for (let point of this.cPoints) {
            let check = isCollidingPoint(this.x+point[0]*this.width, this.y+point[1]*this.height)
            this.colliding.push(check)
            if (check) collided = true
        }
        return collided
    }
    isCollidingFloor() {
        if (editor) return false
        for (let point of this.cPoints.slice(0, this.splits)) {
            if (!this.ball) {
                if (isCollidingPoint(this.x+point[0]*this.width, this.y+point[1]*this.height)) return true
            } else {
                if (isCollidingPoint(this.x+point[0]*this.width, this.y-6*this.size+point[1]*12*this.size)) return true
            }
        }
        return false
    }
    tp(x, y) {
        this.x = x
        this.y = y
        this.vix = x
        this.viy = y
        this.lx = this.vix
        this.ly = this.viy
    }
    fixCollision() {
        let d = this.fixD*2
        let found = false
        for (let i = 0; i < 8; i++) {
            this.x += Math.sin(i * (Math.PI*2/8)) * this.fixD
            this.y += Math.cos(i * (Math.PI*2/8)) * this.fixD
            if (!this.isColliding()) {
                found = true
                this.x -= Math.sin(i * (Math.PI*2/8)) * this.fixD
                this.y -= Math.cos(i * (Math.PI*2/8)) * this.fixD
                break
            }
            this.x -= Math.sin(i * (Math.PI*2/8)) * this.fixD
            this.y -= Math.cos(i * (Math.PI*2/8)) * this.fixD
        }
        if (found) {
            while (true) {
                d /= 2
                let collided = 0
                for (let i = 0; i < 8; i++) {
                    this.x += Math.sin(i * (Math.PI*2/8)) * d
                    this.y += Math.cos(i * (Math.PI*2/8)) * d
                    if (this.isColliding()) {
                        collided += 1
                    }
                    this.x -= Math.sin(i * (Math.PI*2/8)) * d
                    this.y -= Math.cos(i * (Math.PI*2/8)) * d
                } 
                if (collided >= 8) break
            }
        } else {
            d = 0
        }
        while (this.isColliding()) {
            d += 1
            for (let i = 0; i < 8; i++) {
                this.x += Math.sin(i * (Math.PI*2/8)) * d
                this.y += Math.cos(i * (Math.PI*2/8)) * d
                if (!this.isColliding()) {
                    this.vx += Math.sin(i * (Math.PI*2/8)) * d * 2
                    this.vy += Math.cos(i * (Math.PI*2/8)) * d * 2
                    return
                }
                this.x -= Math.sin(i * (Math.PI*2/8)) * d
                this.y -= Math.cos(i * (Math.PI*2/8)) * d
            }
        }
    }
    move(x, y, steps) {
        steps = Math.round(steps)
        for (let i = 0; i < steps; i++) {
            this.x += x / steps
            if (this.isColliding()) {
                this.y += this.slope * Math.abs(x / steps)
                if (!this.isColliding()) {
                    this.y -= this.slope * Math.abs(x / steps)
                    while (this.isColliding()) {
                        this.y += this.slopeAmt
                    }
                } else {
                    this.y -= this.slope * Math.abs(x / steps) * 2
                    if (!this.isColliding()) {
                        this.y += this.slope * Math.abs(x / steps)
                        while (this.isColliding()) {
                            this.y -= this.slopeAmt
                        }
                    } else {
                        this.y += this.slope * Math.abs(x / steps)
                        this.x -= x / steps
                        this.vx = 0
                        break
                    }
                }
            }
        }
        for (let i = 0; i < steps; i++) {
            this.y += y / steps
            if (this.isColliding()) {
                this.x += this.slope * Math.abs(y / steps)
                if (!this.isColliding()) {
                    this.x -= this.slope * Math.abs(y / steps)
                    while (this.isColliding()) {
                        this.x += this.slopeAmt
                    }
                } else {
                    this.x -= this.slope * Math.abs(y / steps) * 2
                    if (!this.isColliding()) {
                        this.x += this.slope * Math.abs(y / steps)
                        while (this.isColliding()) {
                            this.x -= this.slopeAmt
                        }
                    } else {
                        this.x += this.slope * Math.abs(y / steps)
                        if (y < 0) this.floor = 0.1
                        this.y -= y / steps
                        this.vy = 0
                        break
                    }
                }
            }
        }
    }
    draw() {
        this.vix = this.lx*(1-accumulator/tdelta) + this.x*(accumulator/tdelta)
        this.viy = this.ly*(1-accumulator/tdelta) + this.y*(accumulator/tdelta)
        this.viangle = this.langle*(1-accumulator/tdelta) + this.angle*(accumulator/tdelta)

        this.flipx = this.vix+rv2(0, -12.5, this.viangle)[0]
        this.flipy = this.viy+rv2(0, -12.5, this.viangle)[1]

        this.lagx = lerp(this.lagx, this.flipx, delta*15)
        this.lagy = lerp(this.lagy, this.flipy, delta*15)
        this.flipA -= delta
        if (this.flipA < 0) this.flipA = 0
        this.decreaseA -= delta
        if (this.decreaseA < 0) this.decreaseA = 0

        // ui.text(...tsc(this.vix, this.viy-40), 20*camera.zoom, "Silver", {align: "center"})

        var colour = this.colour
        var lighting = 0.2

        ctx.save()
        ctx.translate(tsc(this.vix, this.viy)[0], tsc(this.vix, this.viy)[1]+scenesD["game"].y)
        ctx.rotate(this.viangle)

        ctx.beginPath()
        ctx.moveTo(0, 25*camera.zoom)
        ctx.lineTo(-20*camera.zoom, -25*camera.zoom)
        ctx.lineTo(0, -12.5*camera.zoom)
        ctx.lineTo(20*camera.zoom, -25*camera.zoom)
        ctx.closePath()

        ctx.save()
        ctx.clip()

        ctx.rotate(-this.viangle)

        ui.rect(0, -17*camera.zoom-scenesD["game"].y, 100*camera.zoom, 25*camera.zoom, [colour[0]+colour[0]*lighting, colour[1]+colour[1]*lighting, colour[2]+colour[2]*lighting, 1])

        ui.rect(0, 17*camera.zoom-scenesD["game"].y, 100*camera.zoom, 25*camera.zoom, [colour[0]-colour[0]*lighting, colour[1]-colour[1]*lighting, colour[2]-colour[2]*lighting, 1])

        ui.rect(0, 0-scenesD["game"].y, 100*camera.zoom, 18*camera.zoom, [colour[0], colour[1], colour[2], 1])

        ctx.restore()

        ctx.lineWidth = 3.5*camera.zoom
        ctx.strokeStyle = "white"
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, -12.5*camera.zoom)

        ctx.rotate(-this.viangle)
        ctx.translate((this.lagx-this.vix)*camera.zoom, -(this.lagy-this.viy)*camera.zoom-scenesD["game"].y)
        // ctx.rotate(this.viangle)

        ctx.lineTo(0, 0+scenesD["game"].y)
        ctx.stroke()

        let radius = 10*camera.zoom + Math.sin(Math.min((1-this.flipA)*2, 1)*Math.PI)*5*camera.zoom - Math.sin(Math.min((1-this.decreaseA)*2, 1)*Math.PI)*5*camera.zoom

        ui.circle(0, 0, radius, [255, 255, 255, 1])

        let factor =  Math.min(this.flips/this.maxFlips + Math.abs(this.rotated)/(Math.PI*1.5)/this.maxFlips, 1)

        ctx.beginPath()
        ctx.arc(0, 0, radius*0.65, 0, factor*Math.PI*2)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fillStyle = `rgba(${colour[0]*factor*1.5}, ${colour[1]*factor*1.5}, ${colour[2]*factor*1.5}, 0.5)`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(0, 0, radius*0.65, 0, this.flips/this.maxFlips*Math.PI*2)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fillStyle = `rgb(${colour[0]*(this.flips/4)*1.5}, ${colour[1]*(this.flips/4)*1.5}, ${colour[2]*(this.flips/4)*1.5})`
        ctx.fill()

        ctx.restore()

        // let i = 0
        // for (let point of this.cPoints) {
        //     ui.rect(...tsc(this.vix+point[0]*this.width, this.viy+point[1]*this.height), 10*camera.zoom, 10*camera.zoom, this.colliding[i] ? [255, 0, 0, 1] : [0, 255, 0, 1])
        //     i++
        // }

        if (keys["KeyU"]) {
            let res = 50
            let size = 5
            for (let x = -0.5; x < 0.5; x += 1/res) {
                for (let y = -0.5; y < 0.5; y += 1/res) {
                    let colliding = isCollidingPoint(this.x+x*this.width*size, this.y+y*this.height*size)
                    if (colliding) {
                        ui.rect(...tsc(this.x+x*this.width*size, this.y+y*this.height*size), this.width*size/res*camera.zoom, this.height*size/res*camera.zoom, [255, 0, 0, 1])
                    }
                }
            }
        }

        // console.log(this.username)
        ui.text(...tsc(this.vix, this.viy+55), 25*camera.zoom, this.username, {align: "center"})
    }
}