
var playButton = new ui.Button("rect", "Play")
playButton.bgColour = [127, 127, 127, 0.5]

var settingsButton = new ui.Button("rect", "Settings")
settingsButton.bgColour = [127, 127, 127, 0.5]

var leaderboardButton = new ui.Button("rect", "Leaderboard")
leaderboardButton.bgColour = [127, 127, 127, 0.5]

var infoButton = new ui.Button("rect", "Information")
infoButton.bgColour = [127, 127, 127, 0.5]

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

    settingsButton.set(canvas.width/2, canvas.height/2+85*su, 300*su, 50*su)
    settingsButton.textSize = 40*su
    settingsButton.basic()
    settingsButton.draw()
}