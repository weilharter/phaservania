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
    this.showDamageNumber(this.x, this.y, damage, "#ffff00");
    if (this.hp <= 0) {
      this.destroy(); // Destroy the character if HP is 0
    }
  }

  showDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: string = "#ff0000"
  ) {
    // Create the damage number text
    const damageText = this.scene.add.text(x, y, `${damage}`, {
      font: "16px Arial",
      color: color,
      stroke: "#000000",
      strokeThickness: 2,
    });

    // Animate the text to move upward and fade out
    this.scene.tweens.add({
      targets: damageText,
      y: y - 30, // Move upward
      alpha: 1, // Fade out
      duration: 350, // Animation duration
      ease: "Power1",
      onComplete: () => {
        damageText.destroy(); // Destroy the text after the animation
      },
    });
  }
}
