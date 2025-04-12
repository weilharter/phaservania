import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";

import { Game, Types } from "phaser";

export const WIDTH = 640;
export const HEIGHT = 320;

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  pixelArt: true,
  zoom: 6, // 320×6 = 1920, 180×6 = 1080
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // render: {
  //   pixelArt: false, // wichtig für scharfe Pixel
  //   antialias: false,
  // },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 2000 },
      debug: false,
    },
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

export default new Game(config);
