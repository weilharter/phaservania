import { PLAYER_GRAVITY_Y } from "../scenes/Game";
import { Character } from "./Character";

export class Player extends Character {
  isInvincible: boolean = false; // Flag to track invincibility

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 100); // Default HP for the player
    this.setGravityY(PLAYER_GRAVITY_Y); // Apply gravity to the player
  }

  hit(damage: number) {
    if (this.isInvincible) return; // Ignore damage if invincible

    this.hp -= damage; // Reduce HP
    if (this.hp <= 0) {
      // Handle player death logic here (e.g., game over)
    }

    // Make the player invincible for 1 second
    this.isInvincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5, // Make the player semi-transparent to indicate invincibility
      duration: 100,
      ease: "Linear",
      yoyo: true,
      repeat: 5, // Blink 5 times
      onComplete: () => {
        this.setAlpha(1); // Reset alpha to fully visible
      },
    });

    // Reset invincibility after 1 second
    this.scene.time.delayedCall(1000, () => {
      this.isInvincible = false;
    });
  }

  // Additional player-specific logic can go here
}
