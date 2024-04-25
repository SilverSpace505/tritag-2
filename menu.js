
var playButton = new ui.Button("rect", "Play")
playButton.bgColour = [127, 127, 127, 0.5]

function menuTick() {
    ui.text(canvas.width/2, 75*su, 100*su, "Tritag 2", {align: "center"})

    playButton.set(canvas.width/2, canvas.height/2, 300*su, 100*su)
    playButton.textSize = 75*su
    playButton.basic()
    playButton.draw()

    if (playButton.hovered() && tscene != "game" && mouse.lclick) {
        playButton.click()
        playSoundV("play.wav", 0.5)
        setScene("game")
    }
}