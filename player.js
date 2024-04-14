
class Player {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = 0
        this.vy = 0
        this.angle = Math.PI
        this.speed = 1000
        this.angleSpeed = Math.PI*2
        this.flipping = 0
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
        this.colour = [0, 127, 255]
        this.shifting = false
        this.flipx = 0
        this.flipy = 0
        this.shadowCooldown = 0
        this.dashing = false
        this.ldx = null
        this.ldy = null
    }

    tick() {
        if (Math.sqrt((this.x-this.lx)**2 + (this.y-this.ly)**2) < this.speed*tdelta) {
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

        this.shifting = keys["ShiftLeft"]

        if (this.shifting) {
            this.speed /= 2
            this.angleSpeed *= 2
        }

        if (keys["KeyW"]) {
            this.vx += Math.sin(-this.angle)*this.speed*tdelta
            this.vy += Math.cos(-this.angle)*this.speed*tdelta
            mx += Math.sin(-this.angle)
            my += Math.cos(-this.angle)
        }
        if (keys["KeyS"]) {
            this.vx -= Math.sin(-this.angle)*this.speed*tdelta/2
            this.vy -= Math.cos(-this.angle)*this.speed*tdelta/2
            mx -= Math.sin(-this.angle)/2
            my -= Math.cos(-this.angle)/2
        }

        var still = mx == 0 && my == 0
        this.flipping -= tdelta
        
        if (keys["KeyA"]) {
            this.angle -= this.angleSpeed*tdelta
            this.rotated -= this.angleSpeed*tdelta
            this.flipping = Math.max(0.1, this.flipping)
        }
        if (keys["KeyD"]) {
            this.angle += this.angleSpeed*tdelta
            this.rotated += this.angleSpeed*tdelta
            this.flipping = Math.max(0.1, this.flipping)
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
            this.speed *= 2
            this.angleSpeed /= 2
        }

        if (this.flipping <= 0) {
            this.rotated = 0
        }

        if (Math.abs(this.rotated) >= Math.PI*1.75) {
            let dir = this.rotated / Math.abs(this.rotated)
            if (this.flips < 4) {
                this.flipA = 1
                particles.push(new Wave(this.x, this.y, 50*su, -3, [this.colour[0], this.colour[1], this.colour[2], 1]))
            }
            this.flips += 1
            if (this.flips > 4) {
                this.flips = 4
            }
            this.rotated -= Math.PI*2*dir
            this.flipping = 2
        }

        if (this.flipping <= 0) {
            this.flips -= tdelta/3
            if (this.flips < 0) {
                this.flips = 0
            }
        }

        this.shadowCooldown -= tdelta
        if ((this.shifting || this.dashing || this.flipping > 0) && this.shadowCooldown <= 0) {
            this.shadowCooldown = 1/20
            if (this.shifting) {
                particles.push(new PShadow(this.x, this.y, this.viangle, 1, 1, [this.colour[0], this.colour[1], this.colour[2], 0.5]))
            } else if (this.flipping > 0) {
                particles.push(new PShadow(this.x, this.y, this.viangle, 1, 0.5, [this.colour[0], this.colour[1], this.colour[2], 0.35]))
            }
            if (this.dashing) {
                particles.push(new Line(this.ldx, this.ldy, this.x, this.y, 30, 1, [this.colour[0], this.colour[1], this.colour[2], 0.5]))
                this.ldx = this.x
                this.ldy = this.y
            }
        }

        this.vx *= 0.99
        this.vy *= 0.99

        // this.vy += 500*tdelta

        this.x += this.vx*tdelta
        this.y += this.vy*tdelta

        if (Math.ceil(this.flips) < Math.ceil(this.lflips)) {
            this.decreaseA = 1
            particles.push(new Wave(this.x, this.y, 50*su, 3, [this.colour[0], this.colour[1], this.colour[2], 0.5]))
        }
        this.lflips = this.flips
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

        // ui.text(...cv2(this.vix, this.viy-40), 20*camera.zoom, "Silver", {align: "center"})

        var colour = this.colour
        var lighting = 0.2

        ctx.save()
        ctx.translate(...cv2(this.vix, this.viy))
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

        ui.rect(0, -17*camera.zoom, 100*camera.zoom, 25*camera.zoom, [colour[0]+colour[0]*lighting, colour[1]+colour[1]*lighting, colour[2]+colour[2]*lighting, 1])

        ui.rect(0, 17*camera.zoom, 100*camera.zoom, 25*camera.zoom, [colour[0]-colour[0]*lighting, colour[1]-colour[1]*lighting, colour[2]-colour[2]*lighting, 1])

        ui.rect(0, 0, 100*camera.zoom, 18*camera.zoom, [colour[0], colour[1], colour[2], 1])

        ctx.restore()

        ctx.lineWidth = 3.5*camera.zoom
        ctx.strokeStyle = "white"
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, -12.5*camera.zoom)

        ctx.rotate(-this.viangle)
        ctx.translate((this.lagx-this.vix)*camera.zoom, (this.lagy-this.viy)*camera.zoom)
        // ctx.rotate(this.viangle)

        ctx.lineTo(0, 0)
        ctx.stroke()

        let radius = 10*camera.zoom + Math.sin(Math.min((1-this.flipA)*2, 1)*Math.PI)*5*camera.zoom - Math.sin(Math.min((1-this.decreaseA)*2, 1)*Math.PI)*5*camera.zoom

        ui.circle(0, 0, radius, [255, 255, 255, 1])

        let factor =  Math.min(this.flips/4 + Math.abs(this.rotated)/(Math.PI*1.5)/4, 1)

        ctx.beginPath()
        ctx.arc(0, 0, radius*0.65, 0, factor*Math.PI*2)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fillStyle = `rgba(${colour[0]*factor*1.5}, ${colour[1]*factor*1.5}, ${colour[2]*factor*1.5}, 0.5)`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(0, 0, radius*0.65, 0, this.flips/4*Math.PI*2)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fillStyle = `rgb(${colour[0]*(this.flips/4)*1.5}, ${colour[1]*(this.flips/4)*1.5}, ${colour[2]*(this.flips/4)*1.5})`
        ctx.fill()

        ctx.restore()
    }
}