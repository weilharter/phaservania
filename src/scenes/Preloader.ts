import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");
    //  A simple progress bar. This is the outline of the bar.
    this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH - 172, 32)
      .setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      WIDTH / 2 - (WIDTH - 172) / 2 + 2,
      HEIGHT / 2,
      4,
      28,
      0xffffff
    );

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is WIDTH - 176 wide, so 100% = WIDTH - 176px)
      bar.width = 4 + (WIDTH - 176) * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.image("sky", "assets/background/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.audio("tap", "assets/audio/tap.wav");
    this.load.audio("music", "assets/audio/music.wav");
    this.load.audio("lightning-shield", "assets/audio/lightning-shield.wav");
    this.load.audio("jump", "assets/audio/jump.wav");

    // this.load.image("logo", "logo.png");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");
  }
}
