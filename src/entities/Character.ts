export class Character extends Phaser.Physics.Arcade.Sprite {
  hp: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    hp: number = 100
  ) {
    super(scene, x, y, texture);
    this.hp = hp; // Initialize HP
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true); // Prevent character from leaving the world bounds
  }

  hit(damage: number) {
    this.hp -= damage; // Reduce HP
    if (this.hp <= 0) {
      this.destroy(); // Destroy the character if HP is 0
    }
  }
}
