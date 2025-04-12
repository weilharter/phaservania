import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";

const PLATFORM_VERTICAL_POSITION = 550;
const WORLD_BOUNDS_WIDTH = 2000;

const PLAYER_GLOBAL_COOLDOWN = 100;
const PLAYER_GRAVITY_Y = 2000;
const PLAYER_JUMP_VELOCITY_Y = -900;
const PLAYER_MOVEMENT_SPEED = 300;

const MAX_ENEMIES = 10;
const ENEMY_GLOBAL_COOLDOWN = 1000;
const ENEMY_SPAWN_RATE = 500;
const ENEMY_MOVEMENT_SPEED = 100;

export class Game extends Scene {
  player: Phaser.Physics.Arcade.Sprite;
  playerHp: number = 100;
  playerIsInvincible: boolean = false; // New property for invincibility
  platforms: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  spells: Phaser.Physics.Arcade.Group;
  characters: Phaser.Physics.Arcade.Group;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  keyboardKeys: any;
  healthBar: Phaser.GameObjects.Graphics;
  playerCanAttack: boolean = true; // Cooldown flag for player attacks
  attackKey: Phaser.Input.Keyboard.Key; // Key for attacking

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("sky", "assets/background/sky.png");
    this.load.image("ground", "assets/platform.png");

    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.spritesheet("spell", "assets/spell.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    // Background
    this.add
      .tileSprite(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT, "sky")
      .setOrigin(0, 0);

    // Player
    this.player = this.physics.add.sprite(100, 400, "dude");
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(PLAYER_GRAVITY_Y);

    // Expand world bounds
    this.physics.world.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Platforms
    this.platforms = this.physics.add.group({
      immovable: true,
      allowGravity: false,
    });
    this.createPlatforms();

    // Enemies
    this.enemies = this.physics.add.group();

    // Spells
    this.spells = this.physics.add.group();

    // Characters group
    this.characters = this.physics.add.group();
    this.characters.add(this.player);

    // Physics
    this.physics.add.collider(this.characters, this.platforms);
    this.physics.add.collider(this.spells, this.platforms, (spell) => {
      spell.destroy(); // Destroy the spell on collision with platforms
    });
    this.physics.add.collider(this.characters, this.characters);
    this.physics.add.overlap(
      this.spells,
      this.characters,
      this.handleSpellCollision,
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

    // Enemy spawn timer
    this.time.addEvent({
      delay: ENEMY_SPAWN_RATE, // Spawn an enemy every ENEMY_SPAWN_RATE milliseconds
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true, // Keep spawning enemies
    });
  }

  createPlatforms() {
    const platformWidth = 400; // Width of each platform
    const numPlatforms = Math.ceil(WORLD_BOUNDS_WIDTH / platformWidth) + 1; // Calculate how many platforms are needed

    for (let i = 0; i < numPlatforms; i++) {
      this.platforms
        .create(
          i * platformWidth,
          PLATFORM_VERTICAL_POSITION + Phaser.Math.Between(-10, 10),
          "ground"
        )
        .setScale(1)
        .refreshBody();
    }
  }

  createAnimations() {
    if (!this.anims.exists("left")) {
      this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists("front")) {
      this.anims.create({
        key: "front",
        frames: [{ key: "dude", frame: 4 }],
        frameRate: 20,
      });
    }

    if (!this.anims.exists("right")) {
      this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Add the spell animation
    if (!this.anims.exists("spellAnim")) {
      this.anims.create({
        key: "spellAnim",
        frames: this.anims.generateFrameNumbers("spell", { start: 0, end: 5 }), // Adjust frame range as needed
        frameRate: 40,
        repeat: 0,
      });
    }

    this.player.anims.play("front");
  }

  handleMovement() {
    if (this.input.keyboard) {
      if (this.cursorKeys.left.isDown || this.keyboardKeys.A.isDown) {
        this.player.setVelocityX(-PLAYER_MOVEMENT_SPEED);
      } else if (this.cursorKeys.right.isDown || this.keyboardKeys.D.isDown) {
        this.player.setVelocityX(PLAYER_MOVEMENT_SPEED);
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play("front");
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
    } else {
      this.player.anims.play("right", true);
    }
  }

  castPlayerSpell() {
    if (!this.playerCanAttack) return;

    this.playerCanAttack = false;

    // Determine direction based on the player's facing direction
    const direction = this.player.anims.currentAnim?.key == "left" ? -1 : 1; // -1 for left, 1 for right
    const spellXOffset = direction * 20; // Offset the spell's starting position based on direction

    // Y-offsets for multiple projectiles (optional)
    const offsets = [-50, -70, -30]; // Adjust as needed for spread

    offsets.forEach((offset) => {
      // Create the spell
      const spell = this.spells.create(
        this.player.x + spellXOffset, // Adjust starting X position
        this.player.y + offset, // Adjust Y position for spread
        "spell"
      );

      // Play the spell animation
      spell.anims.play("spellAnim");

      // Set velocity based on direction
      const speed = 1500; // Adjust the speed as needed
      spell.setVelocityX(direction * speed);
      spell.owner = "player"; // Tag the spell as a player spell

      // Destroy the spell after 2 seconds
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

    // Determine spawn side (left or right)
    const spawnFromLeft = Phaser.Math.Between(0, 1) === 0;

    let spawnX;
    do {
      // Spawn position within world bounds near player
      spawnX = spawnFromLeft
        ? Phaser.Math.Between(0, WORLD_BOUNDS_WIDTH / 2) // Left half of the world
        : Phaser.Math.Between(WORLD_BOUNDS_WIDTH / 2, WORLD_BOUNDS_WIDTH); // Right half of the world
    } while (Math.abs(spawnX - this.player.x) < 450); // Ensure enemy spawns at least 200px away from the player

    const spawnY = PLATFORM_VERTICAL_POSITION - 50; // Spawn above the platform

    // Create the enemy
    const enemy = this.enemies.create(spawnX, spawnY, "dude");
    enemy.setCollideWorldBounds(true); // Keep enemies within world bounds
    enemy.anims.play("front");
    enemy.hp = 100; // Add HP to the enemy
    enemy.isEnemy = true; // Tag as an enemy
    enemy.setTint(0xff0000); // Red tint for enemies

    this.characters.add(enemy); // Add to the characters group

    // Schedule the next enemy spawn
    this.time.addEvent({
      delay: Phaser.Math.Between(ENEMY_SPAWN_RATE, ENEMY_SPAWN_RATE * 2), // Randomize spawn delay
      callback: this.spawnEnemies,
      callbackScope: this,
    });

    // Enemy attack timer
    this.time.addEvent({
      delay: ENEMY_GLOBAL_COOLDOWN,
      callback: () => this.enemyAttack(enemy),
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
    const spell = this.spells.create(enemy.x, enemy.y - 50, "spell");
    spell.setVelocity(direction.x * 1000, direction.y * 1000); // Set velocity towards the player
    spell.setGravityY(0);
    spell.setTint(0xff0000); // Red tint
    spell.owner = "enemy"; // Tag the spell as an enemy spell

    spell.anims.play("spellAnim");

    // Cleanup spells
    this.time.delayedCall(2000, () => {
      spell.destroy();
    });
  }

  handleSpellCollision(
    spell: Phaser.Physics.Arcade.Image,
    target: Phaser.Physics.Arcade.Sprite
  ) {
    if (spell.owner === "player" && target.isEnemy) {
      target.hp -= 200; // Reduce enemy HP
      if (target.hp <= 0) {
        target.destroy(); // Destroy the enemy if HP is 0
      }
    } else if (spell.owner === "enemy" && target === this.player) {
      if (!this.playerIsInvincible) {
        this.playerHp -= 5; // Reduce player HP
        this.updateHealthBar();
        this.evaluateGameOver();

        // Make the player blink
        this.playerIsInvincible = true;
        this.tweens.add({
          targets: this.player,
          alpha: 0,
          duration: 100,
          ease: "Linear",
          yoyo: true,
          repeat: 5, // Blink 5 times
          onComplete: () => {
            this.player.setAlpha(1); // Ensure player is fully visible after blinking
          },
        });

        // Grant invincibility for 1 second
        this.time.delayedCall(1000, () => {
          this.playerIsInvincible = false;
        });
      }
    }
    spell.destroy(); // Destroy the spell after collision
  }

  updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1); // Red color for health
    this.healthBar.fillRect(16, 16, this.playerHp * 2, 20); // Width proportional to HP
    this.healthBar.lineStyle(1, 0x000); // White border
    this.healthBar.strokeRect(16, 16, 200, 20); // Fixed border width
  }

  evaluateGameOver() {
    if (this.playerHp <= 0) {
      this.scene.stop();
      this.playerHp = 100;
      this.scene.start("GameOver"); // End the game if HP is 0
    }
  }

  update() {
    this.handleMovement();

    // Handle player attack while pointer is pressed
    if (this.input.activePointer.isDown) {
      this.castPlayerSpell();
    }

    // Ensure enemies keep moving
    this.enemies
      .getChildren()
      .forEach((enemy: Phaser.Physics.Arcade.Sprite) => {
        if (enemy.active) {
          const directionX = this.player.x > enemy.x ? 1 : -1; // Move towards the player's X position
          enemy.setVelocityX(directionX * ENEMY_MOVEMENT_SPEED);
        }
      });
  }
}
