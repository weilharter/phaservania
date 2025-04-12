import { Character } from "./Character";
import { Player } from "./Player";

const ENEMY_GLOBAL_COOLDOWN = 3000;

export class Enemy extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 50); // Default HP for enemies
    this.setTint(0xff0000); // Red tint for enemies
  }

  castSpellTowardsPlayer(player: Player) {
    if (!this.active) return;

    // Calculate direction vector towards the player
    const direction = new Phaser.Math.Vector2(
      player.x - this.x,
      player.y - this.y
    ).normalize();

    // Create the spell
    const spell = this.scene.spells.create(
      this.x,
      this.y - 60,
      "projectile-spell"
    );
    spell.setVelocity(direction.x * 1000, direction.y * 1000); // Set velocity towards the player
    const gravity = -500; // Negative gravity to make the arrow fly farther
    spell.setGravityY(gravity);
    spell.setTint(0xff0000); // Red tint
    spell.setScale(0.5);
    spell.owner = Enemy; // Tag the spell as an enemy spell

    spell.anims.play("spellAnim");

    // Cleanup spells
    this.scene.time.delayedCall(ENEMY_GLOBAL_COOLDOWN, () => {
      spell.destroy();
    });
  }

  // Additional enemy-specific logic can go here
}
