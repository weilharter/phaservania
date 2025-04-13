import { PLAYER_GRAVITY_Y } from "../scenes/Game";
import { Character } from "./Character";

const PLAYER_GLOBAL_COOLDOWN = 800;

export class Player extends Character {
  level: number = 1;
  levelXp: number = 0;
  xpToNextLevel: number = 2000;
  isInvincible: boolean = false; // Flag to track invincibility
  isLevelUpEffectActive: boolean = false; // Flag to track level-up effect
  levelUpEffect: Phaser.GameObjects.Sprite | null = null; // Reference to the level-up effect sprite
  playerCanAttack: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 100); // Default HP for the player
    this.setGravityY(PLAYER_GRAVITY_Y); // Apply gravity to the player
  }

  hit(damage: number) {
    if (this.isInvincible) return; // Ignore damage if invincible

    this.hp -= damage; // Reduce HP
    this.scene.sound.play("tap", { volume: 0.5 });
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

  gainExperience(amount: number) {
    this.levelXp += amount;
    if (this.levelXp >= this.xpToNextLevel) {
      this.levelXp -= this.xpToNextLevel;
      this.level++;
      this.hp = 100; // Restore player HP on level-up
      this.xpToNextLevel += 5000; // Increase XP required for the next level

      // Trigger level-up effect
      this.triggerLevelUpEffect();
    }
  }

  triggerLevelUpEffect() {
    if (this.isLevelUpEffectActive) return; // Prevent multiple effects

    // Add a shiny overlay sprite
    this.levelUpEffect = this.scene.add.sprite(this.x, this.y, "levelUpEffect");
    this.levelUpEffect.setScale(1); // Scale the effect to fit the player
    this.levelUpEffect.setDepth(10); // Ensure it appears above other objects
    this.levelUpEffect.play("levelUpAnim"); // Play the level-up animation

    this.scene.sound.play("lightning-shield", { volume: 0.5, loop: true });

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
    this.scene.time.delayedCall(2000, () => {
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

  castPlayerSpell() {
    if (!this.playerCanAttack) return;

    this.playerCanAttack = false;

    // Determine direction based on the player's facing direction
    const direction = this.flipX ? -1 : 1; // -1 for left, 1 for right
    const spellXOffset = direction * 25; // Offset the spell's starting position based on direction

    // Y-offsets for multiple projectiles (optional)
    const offsets = [-30, -50, -60];

    offsets.forEach((offset) => {
      // Create the spell
      const spell = this.scene.spells.create(
        this.x + spellXOffset, // Adjust starting X position
        this.y + offset + 30, // Adjust Y position for spread
        "projectile-spell"
      );

      spell.setScale(0.6);
      spell.setAlpha(0.5);

      spell.flipX = this.flipX;

      // Play the spell animation
      spell.anims.play("spellAnim");

      // Set velocity and reduce gravity for a longer flight
      const speed = 300; // Moderate speed
      const gravity = -1900; // Negative gravity to make the arrow fly farther
      spell.setVelocityX(direction * speed);
      spell.setGravityY(gravity);
      spell.owner = Player; // Tag the spell as a player spell

      // Destroy the spell after 3 seconds
      this.scene.time.delayedCall(3000, () => {
        if (spell.active) spell.destroy();
      });
    });

    // Reset the attack cooldown
    this.scene.time.delayedCall(PLAYER_GLOBAL_COOLDOWN, () => {
      this.playerCanAttack = true;
    });
  }
}
