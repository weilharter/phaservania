import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";
import { Enemy } from "../entities/Enemy";

const PLATFORM_VERTICAL_POSITION = 315;
const WORLD_BOUNDS_WIDTH = 2000;

const PLAYER_GLOBAL_COOLDOWN = 250;
const PLAYER_GRAVITY_Y = 2000;
const PLAYER_JUMP_VELOCITY_Y = -450; // Adjusted for smaller height
const PLAYER_MOVEMENT_SPEED = 200; // Adjusted for smaller width

const MAX_ENEMIES = 30; // Reduced due to smaller world size
const ENEMY_GLOBAL_COOLDOWN = 1000;
const ENEMY_SPAWN_RATE = 50;
const ENEMY_MOVEMENT_SPEED = 50; // Adjusted for smaller world

export class Game extends Scene {
  level: number = 1;
  levelXp: number = 0;
  xpToNextLevel: number = 2000;
  isLevelUpEffectActive: boolean = false;
  player: Phaser.Physics.Arcade.Sprite;
  playerHp: number = 100;
  playerIsInvincible: boolean = false;
  platforms: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  spells: Phaser.Physics.Arcade.Group;
  characters: Phaser.Physics.Arcade.Group;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  keyboardKeys: any;
  healthBar: Phaser.GameObjects.Graphics;
  experienceBar: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;
  playerCanAttack: boolean = true;
  attackKey: Phaser.Input.Keyboard.Key;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("sky", "assets/background/sky.png");
    this.load.image("ground", "assets/platform.png");

    this.load.spritesheet("charmodel", "assets/char-idle.png", {
      frameWidth: 19,
      frameHeight: 34,
    });
    this.load.spritesheet("projectile-spell", "assets/projectiles.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("levelUpEffect", "assets/lightning-shield.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    // Background
    this.add
      .tileSprite(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT, "sky")
      .setOrigin(0, 0);

    // Player
    this.player = this.physics.add.sprite(
      WORLD_BOUNDS_WIDTH / 2,
      HEIGHT - 60,
      "charmodel"
    );
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(PLAYER_GRAVITY_Y);

    // Expand world bounds
    this.physics.world.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);

    // Camera
    this.cameras.main.startFollow(this.player, true, 5, 5);

    // Platforms
    this.platforms = this.physics.add.group({
      immovable: true,
      allowGravity: false,
    });
    this.createPlatforms();

    // Enemies
    this.enemies = this.physics.add.group({
      classType: Enemy, // Use the Enemy class for this group
      runChildUpdate: true, // Automatically call `update` on each enemy
    });

    // Spells
    this.spells = this.physics.add.group();

    // Characters group
    this.characters = this.physics.add.group();
    this.characters.add(this.player);

    // Physics
    this.physics.add.collider(this.characters, this.platforms);
    this.physics.add.overlap(this.spells, this.platforms, (spell) => {
      spell.destroy(); // Destroy the spell on collision with platforms
    });
    this.physics.add.overlap(
      this.spells,
      this.characters,
      this.handleSpellCollision,
      undefined,
      this
    );
    // Handle collisions between enemies and the player
    this.physics.add.overlap(
      this.enemies,
      this.player,
      (playerObj, enemyObj) => {
        const enemy = enemyObj as Enemy;
        const player = playerObj as Phaser.Physics.Arcade.Sprite;

        if (!this.playerIsInvincible) {
          const damage = Phaser.Math.Between(5, 15);
          this.handlePlayerDamage(damage);
        }

        if (this.isLevelUpEffectActive) {
          this.hitTarget(enemy, 9999); // Call the hitTarget method to handle enemy damage
        }
      },
      undefined,
      this
    );

    // Animations
    this.createAnimations();

    // Input
    if (this.input.keyboard) {
      this.cursorKeys = this.input.keyboard.createCursorKeys();
      this.keyboardKeys = this.input.keyboard?.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        F: Phaser.Input.Keyboard.KeyCodes.F,
      });
    }

    // Create the health bar
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0); // Make the health bar position absolute
    this.updateHealthBar();

    // Create the experience bar
    this.experienceBar = this.add.graphics();
    this.experienceBar.setScrollFactor(0); // Make the experience bar position absolute
    this.updateExperienceBar();

    // Create the level and XP text
    this.levelText = this.add.text(24, 60, "", {
      font: "16px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 1,
    });
    this.levelText.setScrollFactor(0); // Make the text position absolute
    this.updateLevelText();

    // Enemy spawn timer
    this.time.addEvent({
      delay: ENEMY_SPAWN_RATE, // Spawn an enemy every ENEMY_SPAWN_RATE milliseconds
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true, // Keep spawning enemies
    });
  }

  createPlatforms() {
    const platformWidth = 200; // Adjusted for smaller world
    const numPlatforms = Math.ceil(WORLD_BOUNDS_WIDTH / platformWidth) + 1; // Calculate how many platforms are needed

    // Create horizontal platforms
    for (let i = 0; i < numPlatforms; i++) {
      this.platforms
        .create(
          i * platformWidth,
          PLATFORM_VERTICAL_POSITION, // Adjusted for smaller height
          "ground"
        )
        .setScale(1)
        .refreshBody();
    }

    // Create vertical platforms at the left and right boundaries
    const platformHeight = HEIGHT; // Height of the vertical platforms
    const verticalPlatformWidth = 20; // Width of the vertical platforms

    // Left boundary platform
    this.platforms
      .create(0, HEIGHT / 2, "ground")
      .setScale(1, platformHeight / verticalPlatformWidth) // Scale to make it tall
      .setOrigin(0.5, 0.5)
      .refreshBody();

    // Right boundary platform
    this.platforms
      .create(WORLD_BOUNDS_WIDTH, HEIGHT / 2, "ground")
      .setScale(1, platformHeight / verticalPlatformWidth) // Scale to make it tall
      .setOrigin(0.5, 0.5)
      .refreshBody();
  }

  createAnimations() {
    if (!this.anims.exists("left")) {
      this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("charmodel", {
          start: 0,
          end: 11,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists("front")) {
      this.anims.create({
        key: "front",
        frames: this.anims.generateFrameNumbers("charmodel", {
          start: 0,
          end: 11,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists("right")) {
      this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("charmodel", {
          start: 0,
          end: 11,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Add the spell animation
    if (!this.anims.exists("spellAnim")) {
      this.anims.create({
        key: "spellAnim",
        frames: this.anims.generateFrameNumbers("projectile-spell", {
          start: 3,
          end: 5,
        }),
        frameRate: 12,
      });
    }

    // Add the level-up animation (placeholder)
    if (!this.anims.exists("levelUpAnim")) {
      this.anims.create({
        key: "levelUpAnim",
        frames: this.anims.generateFrameNumbers("levelUpEffect", {
          start: 0,
          end: 3,
        }),
        frameRate: 40,
        repeat: -1, // Loop the animation
      });
    }
  }

  handleMovement() {
    if (this.input.keyboard) {
      if (this.cursorKeys.left.isDown || this.keyboardKeys.A.isDown) {
        this.player.setVelocityX(-PLAYER_MOVEMENT_SPEED);
      } else if (this.cursorKeys.right.isDown || this.keyboardKeys.D.isDown) {
        this.player.setVelocityX(PLAYER_MOVEMENT_SPEED);
      } else {
        this.player.setVelocityX(0);
      }
      if (
        (this.cursorKeys.space?.isDown ||
          this.cursorKeys.up?.isDown ||
          this.keyboardKeys.W.isDown) &&
        this.player.body?.touching.down
      ) {
        this.player.setVelocityY(PLAYER_JUMP_VELOCITY_Y);
      }
    }
    const pointer = this.input.activePointer;
    if (pointer.worldX < this.player.x) {
      this.player.anims.play("left", true);
      this.player.flipX = true;
    } else {
      this.player.anims.play("right", true);
      this.player.flipX = false;
    }
  }

  castPlayerSpell() {
    if (!this.playerCanAttack) return;

    this.playerCanAttack = false;

    // Determine direction based on the player's facing direction
    const direction = this.player.anims.currentAnim?.key == "left" ? -1 : 1; // -1 for left, 1 for right
    const spellXOffset = direction * 25; // Offset the spell's starting position based on direction

    // Y-offsets for multiple projectiles (optional)
    const offsets = Array.from({ length: this.level }, (_, i) => -40 - i * 10); // Generate offsets based on level

    offsets.forEach((offset) => {
      // Create the spell
      const spell = this.spells.create(
        this.player.x + spellXOffset, // Adjust starting X position
        this.player.y + offset + 30, // Adjust Y position for spread
        "projectile-spell"
      );

      if (direction === -1) {
        spell.flipX = true;
      } else {
        spell.flipX = false;
      }

      // Play the spell animation
      spell.anims.play("spellAnim");

      // Set velocity and reduce gravity for a longer flight
      const speed = 1000; // Moderate speed
      const gravity = -3000; // Negative gravity to make the arrow fly farther
      spell.setVelocityX(direction * speed);
      spell.setGravityY(gravity);
      spell.owner = "player"; // Tag the spell as a player spell

      // Destroy the spell after 3 seconds
      this.time.delayedCall(2000, () => {
        if (spell.active) spell.destroy();
      });
    });

    // Reset the attack cooldown
    this.time.delayedCall(PLAYER_GLOBAL_COOLDOWN, () => {
      this.playerCanAttack = true;
    });
  }

  spawnEnemies() {
    if (this.enemies.countActive(true) >= MAX_ENEMIES) return;

    // Define spawn margins
    const margin = 100; // Margin from the left and right boundaries
    const spawnAreaStart = margin;
    const spawnAreaEnd = WORLD_BOUNDS_WIDTH - margin;

    // Determine spawn side (left or right)
    const spawnFromLeft = Phaser.Math.Between(0, 1) === 0;

    let spawnX;
    do {
      // Spawn position within the defined spawn area
      spawnX = spawnFromLeft
        ? Phaser.Math.Between(spawnAreaStart, WORLD_BOUNDS_WIDTH / 2) // Left half of the spawn area
        : Phaser.Math.Between(WORLD_BOUNDS_WIDTH / 2, spawnAreaEnd); // Right half of the spawn area
    } while (Math.abs(spawnX - this.player.x) < 100); // Ensure enemy spawns at least 300px away from the player

    const spawnY = PLATFORM_VERTICAL_POSITION - 40; // Spawn above the platform

    // Create the enemy
    const enemy = new Enemy(this, spawnX, spawnY, "charmodel");
    enemy.anims.play("front");
    this.enemies.add(enemy); // Add to the enemies group

    this.characters.add(enemy); // Add to the characters group

    // Make the enemy move left and right
    let direction = "left";
    this.time.addEvent({
      delay: 500, // Change direction every 500ms
      callback: () => {
        if (enemy.active) {
          direction = direction === "left" ? "right" : "left";
          enemy.anims.play(direction, true);
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  enemyAttack(enemy: Phaser.Physics.Arcade.Sprite) {
    if (!enemy.active) return;

    // Calculate direction vector towards the player
    const direction = new Phaser.Math.Vector2(
      this.player.x - enemy.x,
      this.player.y - enemy.y
    ).normalize();

    // Create the spell
    const spell = this.spells.create(enemy.x, enemy.y - 60, "projectile-spell");
    spell.setVelocity(direction.x * 1000, direction.y * 1000); // Set velocity towards the player
    const gravity = -1000; // Negative gravity to make the arrow fly farther
    spell.setGravityY(gravity);
    spell.setTint(0xff0000); // Red tint
    spell.owner = "enemy"; // Tag the spell as an enemy spell

    spell.anims.play("spellAnim");

    // Cleanup spells
    this.time.delayedCall(2000, () => {
      spell.destroy();
    });
  }

  handlePlayerDamage(damage: number) {
    // Make the player temporarily invincible
    this.playerIsInvincible = true;

    this.playerHp -= damage; // Reduce player HP
    this.showDamageNumber(this.player.x, this.player.y, damage);
    this.updateHealthBar();
    this.evaluateGameOver();

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 50,
      ease: "Linear",
      yoyo: true,
      repeat: 2, // Blink 5 times
      onComplete: () => {
        this.player.setAlpha(1); // Ensure player is fully visible after blinking
      },
    });

    // Grant invincibility for 1 second
    this.time.delayedCall(1000, () => {
      this.playerIsInvincible = false;
    });
  }

  hitTarget(target: Enemy, damage: number = 0) {
    if (damage === 0) {
      damage = this.calculateDamage(target); // Calculate damage if not provided
    }
    target.hit(damage); // Use the `hit` method to reduce HP
    this.showDamageNumber(target.x, target.y, damage, "#ffff00"); // Show damage number
    // FIXME: make player generic class & compatible with target.hp
    if (target.hp <= 0) {
      this.gainExperience(1000); // Gain 1000 XP for killing an enemy
    }
  }

  handleSpellCollision(
    spell: Phaser.Physics.Arcade.Image,
    target: Phaser.Physics.Arcade.Sprite
  ) {
    if (spell.owner === "player" && target instanceof Enemy) {
      this.hitTarget(target);
      spell.destroy();
    } else if (spell.owner === "enemy" && target === this.player) {
      if (!this.playerIsInvincible) {
        const damage = this.calculateDamage(this.player);
        this.handlePlayerDamage(damage); // Use the reusable method
      }
      spell.destroy();
    }
  }

  calculateDamage(character: Phaser.Physics.Arcade.Sprite): number {
    if (character === this.player) {
      // Damage range for enemies hitting the player
      return Phaser.Math.Between(5, 10);
    } else if (character instanceof Enemy) {
      // Damage range for the player hitting enemies
      return Phaser.Math.Between(100, 200);
    }
    return 0; // Default damage if character type is unknown
  }

  showDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: string = "#ff0000"
  ) {
    // Create the damage number text
    const damageText = this.add.text(x, y, `${damage}`, {
      font: "16px Arial",
      color: color,
      stroke: "#000000",
      strokeThickness: 2,
    });

    // Animate the text to move upward and fade out
    this.tweens.add({
      targets: damageText,
      y: y - 30, // Move upward
      alpha: 0.1, // Fade out
      duration: 500, // Animation duration
      ease: "Power1",
      onComplete: () => {
        damageText.destroy(); // Destroy the text after the animation
      },
    });
  }

  updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1); // Red color for health
    this.healthBar.fillRect(8, 8, this.playerHp * 0.8, 5); // Adjusted width and height
    this.healthBar.lineStyle(1, 0x000); // Black border
    this.healthBar.strokeRect(8, 8, 80, 5); // Adjusted fixed border width
  }

  updateExperienceBar() {
    this.experienceBar.clear();
    this.experienceBar.fillStyle(0x00ff00, 1); // Green color for experience

    // Correctly calculate the width of the experience bar
    const xpWidth = Math.min(80 * (this.levelXp / this.xpToNextLevel), 80); // Adjusted width
    this.experienceBar.fillRect(8, 16, xpWidth, 3); // Adjusted position and height
    this.experienceBar.lineStyle(1, 0x000); // Black border
    this.experienceBar.strokeRect(8, 16, 80, 3); // Adjusted fixed border width
  }

  updateLevelText() {
    this.levelText.setText(
      `Level: ${this.level}\nXP: ${this.levelXp} / ${this.xpToNextLevel}`
    );
    this.levelText.setFontSize(8); // Adjusted font size
    this.levelText.setPosition(8, 24); // Adjusted position
  }

  gainExperience(amount: number) {
    this.levelXp += amount;
    if (this.levelXp >= this.xpToNextLevel) {
      this.levelXp -= this.xpToNextLevel;
      this.level++;
      this.playerHp = 100; // Restore player HP on level-up
      this.xpToNextLevel += 5000; // Increase XP required for the next level

      // Trigger level-up effect
      this.triggerLevelUpEffect();
    }
    this.updateExperienceBar();
    this.updateLevelText(); // Update the text whenever XP changes
  }

  triggerLevelUpEffect() {
    // Add a shiny overlay sprite
    const levelUpEffect = this.add.sprite(
      this.player.x,
      this.player.y,
      "levelUpEffect"
    );
    levelUpEffect.setScale(0.6); // Scale the effect to fit the player
    levelUpEffect.setDepth(10); // Ensure it appears above other objects
    levelUpEffect.play("levelUpAnim"); // Play the level-up animation

    // Follow the player during the effect
    const followPlayer = this.time.addEvent({
      delay: 16, // Update every frame (~60 FPS)
      callback: () => {
        levelUpEffect.setPosition(this.player.x, this.player.y);
        this.isLevelUpEffectActive = true; // Flag to indicate the effect is active
        this.playerIsInvincible = true;
      },
      callbackScope: this,
      loop: true,
    });

    this.time.delayedCall(5000, () => {
      followPlayer.remove(false); // Stop following the player
      levelUpEffect.destroy(); // Remove the effect
      this.isLevelUpEffectActive = false; // Flag to indicate the effect is active
      this.playerIsInvincible = false;
    });
  }

  evaluateGameOver() {
    if (this.playerHp <= 0) {
      this.scene.stop();
      this.playerHp = 100;
      this.scene.start("GameOver", { level: this.level }); // End the game if HP is 0
    }
  }

  update() {
    this.handleMovement();
    this.updateHealthBar();
    this.evaluateGameOver();

    // Reset the player if they fall out of the world
    if (this.player.y > HEIGHT) {
      this.playerHp = 0; // Set HP to 0 to trigger game over
      this.evaluateGameOver();
    }

    // Handle player attack while pointer is pressed
    if (this.input.activePointer.isDown) {
      this.castPlayerSpell();
    }

    // Ensure enemies keep moving
    this.enemies
      .getChildren()
      .forEach((enemy: Phaser.Physics.Arcade.Sprite) => {
        if (enemy.active) {
          const distanceToPlayer = Math.abs(this.player.x - enemy.x);
          if (distanceToPlayer < 15) {
            // Move away from the player if too close
            const directionX = this.player.x > enemy.x ? -1 : 1; // Move away from the player's X position
            enemy.setVelocityX(directionX * ENEMY_MOVEMENT_SPEED);
          } else if (distanceToPlayer > 15) {
            // Move closer to the player if too far
            const directionX = this.player.x > enemy.x ? 1 : -1; // Move towards the player's X position
            enemy.setVelocityX(directionX * ENEMY_MOVEMENT_SPEED);
          } else {
            enemy.setVelocityX(0); // Stop moving if within the desired range
          }
          // Make the enemy jump randomly
          if (enemy.body?.touching.down && Phaser.Math.Between(0, 200) === 0) {
            enemy.setVelocityY(Phaser.Math.Between(-200, -800));
          }
        }
      });
  }
}
