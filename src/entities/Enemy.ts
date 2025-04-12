import { Character } from "./Character";

export class Enemy extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 50); // Default HP for enemies
    this.setTint(0xff0000); // Red tint for enemies
  }

  // Additional enemy-specific logic can go here
}
