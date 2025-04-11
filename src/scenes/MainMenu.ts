import { Scene, GameObjects } from "phaser";

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.background = this.add.image(centerX, centerY, "background");

    this.logo = this.add.image(centerX, centerY - 84, "logo");

    this.title = this.add
      .text(centerX, centerY + 76, "Main Menu", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    const enterKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );
    enterKey?.once("down", () => {
      this.scene.start("Game");
    });
  }
}
