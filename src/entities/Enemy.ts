export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.hp = 50; // Default HP
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true); // Keep enemies within world bounds
    this.setTint(0xff0000); // Red tint for enemies
  }

  hit(damage: number) {
    this.hp -= damage; // Reduce HP
    if (this.hp <= 0) {
      this.destroy(); // Destroy the enemy if HP is 0
    }
  }
}
