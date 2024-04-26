
function settingsTick() {
    ui.text(canvas.width/2, 75*su, 100*su, "Settings", {align: "center"})

    backButton.set(canvas.width/2, canvas.height-100*su, 200*su, 75*su)
    backButton.textSize = 50*su
    backButton.basic()
    backButton.draw()

    if (backButton.hovered() && tscene != "menu" && mouse.lclick) {
        backButton.click()
        playSoundV("click.wav", 0.5)
        setScene("menu")
    }
}