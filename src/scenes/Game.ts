import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";
import { Player } from "../entities/Player";
import { Character } from "../entities/Character";
import { Enemy } from "../entities/Enemy";

export const PLATFORM_VERTICAL_POSITION = 315;
export const WORLD_BOUNDS_WIDTH = 2000;

export const PLAYER_GRAVITY_Y = 2000;
export const PLAYER_JUMP_VELOCITY_Y = -450; // Adjusted for smaller height
export const PLAYER_MOVEMENT_SPEED = 200; // Adjusted for smaller width

export const MAX_ENEMIES = 10; // Reduced due to smaller world size

export const ENEMY_SPAWN_RATE = 250;


export class Game extends Scene {
  player: Player;
  platforms: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  spells: Phaser.Physics.Arcade.Group;
  characters: Phaser.Physics.Arcade.Group;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  keyboardKeys: any;
  healthBar: Phaser.GameObjects.Graphics;
  experienceBar: Phaser.GameObjects.Graphics;
  levelText: Phaser.GameObjects.Text;

  attackKey: Phaser.Input.Keyboard.Key;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.spritesheet("char-idle", "assets/char-idle.png", {
      frameWidth: 120,
      frameHeight: 80,
    });
    this.load.spritesheet("char-running", "assets/char-running.png", {
      frameWidth: 120,
      frameHeight: 80,
    });
    this.load.spritesheet("projectile-spell", "assets/lightning-bolt.png", {
      frameWidth: 256,
      frameHeight: 128,
    });
    this.load.spritesheet("levelUpEffect", "assets/lightning-shield.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    // Background
    this.add.tileSprite(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT, "bg").setOrigin(0, 0);

    // Play background music
    const backgroundMusic = this.sound.add("music", {
      loop: true,
      volume: 1,
    });
    backgroundMusic.play();

    // Player
    this.player = new Player(
      this,
      WORLD_BOUNDS_WIDTH / 2,
      HEIGHT - 60,
      "char-idle"
    );
    this.cameras.main.startFollow(this.player, true, 5, 5);

    // Characters group
    this.characters = this.physics.add.group();
    this.characters.add(this.player);

    // Expand world bounds
    this.physics.world.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);

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

    // Physics
    this.physics.add.collider(this.characters, this.platforms);
    this.physics.add.overlap(this.spells, this.platforms, (spell) => {
      this.time.delayedCall(1000, () => {
        if (spell.active) {
          spell.destroy(); // Destroy the spell after 1 second if it still exists
        }
      });
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
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (!this.player.isInvincible) {
          const damage = Phaser.Math.Between(5, 15);
          this.handlePlayerDamage(damage);
        }
        if (this.player.isLevelUpEffectActive) {
          this.hitTarget(enemy, 9999);
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
    if (!this.anims.exists("char-idle")) {
      this.anims.create({
        key: "char-idle",
        frames: this.anims.generateFrameNumbers("char-idle", {
          start: 0,
          end: 9,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists("char-running")) {
      this.anims.create({
        key: "char-running",
        frames: this.anims.generateFrameNumbers("char-running", {
          start: 0,
          end: 9,
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
          start: 0,
          end: 3,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Add the level-up animation
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
    try {
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
          this.sound.play("jump", { volume: 0.2 });
          this.player.setVelocityY(PLAYER_JUMP_VELOCITY_Y);
        }
      }
      const pointer = this.input.activePointer;
      if (pointer.worldX < this.player.x) {
        this.player.anims.play("char-running", true);
        this.player.flipX = true;
      } else {
        this.player.anims.play("char-running", true);
        this.player.flipX = false;
      }
    } catch (error) {}
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

    const spawnY = PLATFORM_VERTICAL_POSITION - 500; // Spawn above the platform

    // Create the enemy
    const enemy = new Enemy(this, spawnX, spawnY, "char-idle");
    // enemy.anims.play("char-running");
    this.enemies.add(enemy); // Add to the enemies group
    this.characters.add(enemy); // Add to the characters group

    // // Make the enemy move left and right
    // let direction = "left";
    // this.time.addEvent({
    //   delay: 500, // Change direction every 500ms
    //   callback: () => {
    //     if (enemy.active) {
    //       direction = direction === "left" ? "right" : "left";
    //       enemy.anims.play(direction, true);
    //     }
    //   },
    //   callbackScope: this,
    //   loop: true,
    // });
  }

  handlePlayerDamage(damage: number) {
    this.player.hit(damage); // Use the `hit` method from the `Character` base class
    this.updateHealthBar();
    this.evaluateGameOver();
  }

  hitTarget(target: Character, damage: number = 0) {
    if (damage === 0) {
      damage = this.calculateDamage(target); // Calculate damage if not provided
    }
    target.hit(damage); // Use the `hit` method to reduce HP

    if (target.hp <= 0 && target instanceof Enemy) {
      this.gainExperience(1000); // Gain 1000 XP for killing an enemy
    }
  }

  handleSpellCollision(
    spell: Phaser.Physics.Arcade.Image,
    target: Phaser.Physics.Arcade.Sprite
  ) {
    if (spell.owner === Player && target instanceof Enemy) {
      this.hitTarget(target);
      spell.destroy();
    } else if (spell.owner === Enemy && target instanceof Player) {
      this.hitTarget(target);
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

  updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1); // Red color for health
    this.healthBar.fillRect(8, 8, this.player.hp * 0.8, 5); // Adjusted width and height
    this.healthBar.lineStyle(1, 0x000); // Black border
    this.healthBar.strokeRect(8, 8, 80, 5); // Adjusted fixed border width
  }

  updateExperienceBar() {
    this.experienceBar.clear();
    this.experienceBar.fillStyle(0x00ff00, 1); // Green color for experience

    // Correctly calculate the width of the experience bar
    const xpWidth = Math.min(
      80 * (this.player.levelXp / this.player.xpToNextLevel),
      80
    ); // Adjusted width
    this.experienceBar.fillRect(8, 16, xpWidth, 3); // Adjusted position and height
    this.experienceBar.lineStyle(1, 0x000); // Black border
    this.experienceBar.strokeRect(8, 16, 80, 3); // Adjusted fixed border width
  }

  updateLevelText() {
    this.levelText.setText(
      `Level: ${this.player.level}\nXP: ${this.player.levelXp} / ${this.player.xpToNextLevel}`
    );
    this.levelText.setFontSize(8); // Adjusted font size
    this.levelText.setPosition(8, 24); // Adjusted position
  }

  gainExperience(amount: number) {
    this.player.gainExperience(amount); // Delegate to the Player class
    this.updateExperienceBar();
    this.updateLevelText(); // Update the text whenever XP changes
  }

  evaluateGameOver() {
    if (this.player.hp <= 0) {
      this.scene.stop();
      this.player.hp = 100;
      this.scene.start("GameOver", { level: this.player.level }); // Use player's level
      this.sound.stopAll();
    }
  }

  chasePlayer() {
    // Ensure enemies keep moving
    this.enemies.getChildren().forEach((enemy: Enemy) => {
      enemy.chasePlayer(this.player);
    });
  }

  gameOverOnFallOutOfWorld() {
    // Reset the player if they fall out of the world
    if (this.player.y > HEIGHT) {
      this.player.hp = 0; // Set HP to 0 to trigger game over
      this.evaluateGameOver();
    }
  }

  handleCastSpells() {
    // Handle player attack while pointer is pressed
    if (this.input.activePointer.isDown) {
      this.player.castPlayerSpell();
    }
  }

  update() {
    this.evaluateGameOver();
    this.handleMovement();
    this.handleCastSpells();
    this.chasePlayer();
    this.updateHealthBar();
    this.gameOverOnFallOutOfWorld();
  }
}
