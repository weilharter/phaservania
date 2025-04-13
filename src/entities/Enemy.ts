import { Character } from "./Character";
import { Player } from "./Player";

export const ENEMY_GLOBAL_COOLDOWN = 10000;
export const ENEMY_MOVEMENT_SPEED = 100; // Adjusted for smaller world

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

  chasePlayer(player: Player) {
    if (this.active) {
      const direction = new Phaser.Math.Vector2(
        player.x - this.x,
        player.y - this.y
      ).normalize();

      // Flip the enemy sprite based on the horizontal direction
      if (direction.x < 0) {
        this.setFlipX(true); // Face left
      } else {
        this.setFlipX(false); // Face right
      }

      const distanceToPlayer = Math.abs(player.x - this.x);
      if (distanceToPlayer < 30) {
        // Move away from the player if too close
        // const directionX = player.x > this.x ? -1 : 1; // Move away from the player's X position
        this.anims.play("char-attack", true);
        // this.setVelocityX(directionX * ENEMY_MOVEMENT_SPEED);
      } else if (distanceToPlayer > 100) {
        // Move closer to the player if too far
        const directionX = player.x > this.x ? 1 : -1; // Move towards the player's X position
        this.anims.play("char-running", true);
        this.setVelocityX(directionX * ENEMY_MOVEMENT_SPEED);
      }
      // Make the enemy jump randomly
      if (this.body?.touching.down && Phaser.Math.Between(0, 200) === 0) {
        this.anims.play("char-jump", true);
        this.setVelocityY(Phaser.Math.Between(-200, -800));
        // this.castSpellTowardsPlayer(player);
      }
    }
  }

  // Additional enemy-specific logic can go here
}
