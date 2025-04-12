import { Scene, GameObjects } from "phaser";

export class MainMenu extends Scene {
  background: GameObjects.Image;
  title: GameObjects.Text;
  subtitle: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.background;

    this.subtitle = this.add
      .text(centerX, centerY, "PRESS SPACE OR TAP TO START", {
        fontFamily: "Arial Black",
        fontSize: 30,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    // Start game on space key press
    const spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    spaceKey?.once("down", () => {
      this.scene.start("Game");
    });

    // Start game on pointer (mouse or touch) click
    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });
  }
}
