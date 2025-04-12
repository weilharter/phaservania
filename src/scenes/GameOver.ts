import { Scene } from "phaser";

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameover_text: Phaser.GameObjects.Text;
  score: number = 0;

  constructor() {
    super("GameOver");
  }

  init(data: { score: number }) {
    this.score = data.score;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xff0000);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setAlpha(0.5);

    this.gameover_text = this.add.text(
      centerX,
      centerY,
      `Game Over\nScore: ${this.score ?? 0}`,
      {
        fontFamily: "Arial Black",
        fontSize: 64,
        color: "#ffffff",
        stroke: "#000000",
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
  }
}
