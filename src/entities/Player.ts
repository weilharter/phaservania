import { PLAYER_GRAVITY_Y } from "../scenes/Game";
import { Character } from "./Character";

export class Player extends Character {
  isInvincible: boolean = false; // Flag to track invincibility
  isLevelUpEffectActive: boolean = false; // Flag to track level-up effect
  levelUpEffect: Phaser.GameObjects.Sprite | null = null; // Reference to the level-up effect sprite

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 100); // Default HP for the player
    this.setGravityY(PLAYER_GRAVITY_Y); // Apply gravity to the player
  }

  hit(damage: number) {
    if (this.isInvincible) return; // Ignore damage if invincible

    this.hp -= damage; // Reduce HP
    this.showDamageNumber(this.x, this.y, damage); // Show damage number
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

  triggerLevelUpEffect() {
    if (this.isLevelUpEffectActive) return; // Prevent multiple effects

    // Add a shiny overlay sprite
    this.levelUpEffect = this.scene.add.sprite(this.x, this.y, "levelUpEffect");
    this.levelUpEffect.setScale(0.6); // Scale the effect to fit the player
    this.levelUpEffect.setDepth(10); // Ensure it appears above other objects
    this.levelUpEffect.play("levelUpAnim"); // Play the level-up animation

    this.scene.sound.play("lightning-shield", { volume: 1, loop: true });

    // Follow the player during the effect
    const followPlayer = this.scene.time.addEvent({
      delay: 16, // Update every frame (~60 FPS)
      callback: () => {
        if (this.levelUpEffect) {
          this.levelUpEffect.setPosition(this.x, this.y);
        }
        this.isLevelUpEffectActive = true; // Flag to indicate the effect is active
        this.isInvincible = true; // Make the player invincible during the effect
      },
      callbackScope: this,
      loop: true,
    });

    // End the effect after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      this.scene.sound.stopByKey("lightning-shield");
      followPlayer.remove(false); // Stop following the player
      if (this.levelUpEffect) {
        this.levelUpEffect.destroy(); // Remove the effect
        this.levelUpEffect = null;
      }
      this.isLevelUpEffectActive = false; // Reset the flag
      this.isInvincible = false; // Remove invincibility
    });
  }
}
