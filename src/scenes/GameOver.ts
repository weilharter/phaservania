import { Scene } from "phaser";

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameover_text: Phaser.GameObjects.Text;
  level: number = 0;

  constructor() {
    super("GameOver");
  }

  init(data: { level: number }) {
    this.level = data.level;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xff0000);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setAlpha(0.5);

    this.scene.stop("Game");

    this.gameover_text = this.add.text(
      centerX,
      centerY,
      `\nLevel Reached: ${this.level || 0}`,
      {
        fontFamily: "Arial Black",
        fontSize: 30,
        color: "#fff",
        stroke: "#000",
        strokeThickness: 8,
        align: "center",
      }
    );
    this.gameover_text.setOrigin(0.5);

    const spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    spaceKey?.once("down", () => {
      this.scene.start("MainMenu");
    });
    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
