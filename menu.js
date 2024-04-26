
var playButton = new ui.Button("rect", "Play")
playButton.bgColour = [127, 127, 127, 0.5]

var settingsButton = new ui.Button("rect", "Settings")
settingsButton.bgColour = [127, 127, 127, 0.5]

var leaderboardButton = new ui.Button("rect", "Leaderboard")
leaderboardButton.bgColour = [127, 127, 127, 0.5]

var infoButton = new ui.Button("rect", "Information")
infoButton.bgColour = [127, 127, 127, 0.5]

var backButton = new ui.Button("rect", "Back")
backButton.bgColour = [255, 0, 0, 0.5]

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

    infoButton.set(canvas.width/2, canvas.height/2+85*su, 300*su, 50*su)
    infoButton.textSize = 40*su
    infoButton.basic()
    infoButton.draw()

    leaderboardButton.set(canvas.width/2, canvas.height/2+85*su+60*su, 300*su, 50*su)
    leaderboardButton.textSize = 40*su
    leaderboardButton.basic()
    leaderboardButton.draw()

    settingsButton.set(canvas.width/2, canvas.height/2+85*su+60*su*2, 300*su, 50*su)
    settingsButton.textSize = 40*su
    settingsButton.basic()
    settingsButton.draw()

    if (infoButton.hovered() && tscene == "menu" && mouse.lclick) {
        infoButton.click()
        playSoundV("click.wav", 0.5)
        setScene("info")
    }

    if (settingsButton.hovered() && tscene == "menu" && mouse.lclick) {
        settingsButton.click()
        playSoundV("click.wav", 0.5)
        setScene("settings")
    }

    if (leaderboardButton.hovered() && tscene == "menu" && mouse.lclick) {
        leaderboardButton.click()
        playSoundV("click.wav", 0.5)
        setScene("leaderboard")
    }
}