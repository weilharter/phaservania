import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";

const PLATFORM_VERTICAL_POSITION = 550;
const WORLD_BOUNDS_WIDTH = 2000;

const PLAYER_GRAVITY_Y = 2000;
const PLAYER_JUMP_VELOCITY_Y = -900;
const PLAYER_MOVEMENT_SPEED = 300;

const MAX_ENEMIES = 1;
const ENEMY_SPAWN_RATE = 1000;
const ENEMY_MOVEMENT_SPEED = 200;
const ENEMY_SPAWN_DISTANCE = 600;

export class Game extends Scene {
  player: Phaser.Physics.Arcade.Sprite;
  platforms: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  spells: Phaser.Physics.Arcade.Group;
  characters: Phaser.Physics.Arcade.Group;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  keyboardKeys: any;
  playerHp: number = 100;
  healthBar: Phaser.GameObjects.Graphics;
  playerCanAttack: boolean = true; // Cooldown flag for player attacks
  attackKey: Phaser.Input.Keyboard.Key; // Key for attacking

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("ground", "assets/platform.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.image("sky", "assets/background/sky.png");
    this.load.image("spell", "assets/bomb.png");
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
    this.physics.add.collider(
      this.characters,
      this.characters,
      this.handlePlayerEnemyCollision,
      undefined,
      this
    );
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

    this.player.anims.play("front");
  }

  handleMovement() {
    if (this.input.keyboard) {
      if (this.cursorKeys.left.isDown || this.keyboardKeys.A.isDown) {
        this.player.setVelocityX(-PLAYER_MOVEMENT_SPEED);
        this.player.anims.play("left", true);
      } else if (this.cursorKeys.right.isDown || this.keyboardKeys.D.isDown) {
        this.player.setVelocityX(PLAYER_MOVEMENT_SPEED);
        this.player.anims.play("right", true);
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

      // Handle player attack
      if (this.keyboardKeys.F.isDown) {
        this.castPlayerSpell();
      }
    }
  }

  castPlayerSpell() {
    if (!this.playerCanAttack) return;
    this.playerCanAttack = false;
    const spell = this.spells.create(
      this.player.x + 50,
      this.player.y,
      "spell"
    );
    spell.setVelocityX(this.player.flipX ? -300 : 300);
    spell.setGravityY(0);
    spell.setBounce(0.2);
    spell.owner = "player"; // Tag the spell as a player spell

    this.time.delayedCall(1000, () => {
      this.playerCanAttack = true;
    });
  }

  spawnEnemies() {
    if (this.enemies.countActive(true) < MAX_ENEMIES) {
      const enemy = this.enemies.create(this.player.x + 400, 200, "dude");
      enemy.setBounce(0.1);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocityX(
        Phaser.Math.Between(-ENEMY_MOVEMENT_SPEED, ENEMY_MOVEMENT_SPEED)
      );
      enemy.anims.play("left");
      enemy.hp = 100; // Add HP to the enemy
      enemy.isEnemy = true; // Tag as an enemy

      this.characters.add(enemy); // Add to the characters group

      this.time.addEvent({
        delay: Phaser.Math.Between(1500, 3000),
        callback: () => this.enemyAttack(enemy),
        callbackScope: this,
        loop: true,
      });
    }
  }

  enemyAttack(enemy: Phaser.Physics.Arcade.Sprite) {
    if (!enemy.active) return;
    const spell = this.spells.create(enemy.x, enemy.y - 50, "spell");
    spell.setVelocityX(-200);
    spell.setGravityY(0);
    spell.owner = "enemy"; // Tag the spell as an enemy spell
  }

  handleSpellCollision(
    spell: Phaser.Physics.Arcade.Image,
    target: Phaser.Physics.Arcade.Sprite
  ) {
    if (spell.owner === "player" && target.isEnemy) {
      target.hp -= 30; // Reduce enemy HP
      if (target.hp <= 0) {
        target.destroy(); // Destroy the enemy if HP is 0
      }
    } else if (spell.owner === "enemy" && target === this.player) {
      this.playerHp -= 10; // Reduce player HP
      this.updateHealthBar();
      this.evaluateGameOver();
    }
    spell.destroy(); // Destroy the spell after collision
  }

  handlePlayerEnemyCollision(
    player: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite
  ) {
    const bounceBackVelocity = 500;
    if (player.x < enemy.x) {
      player.setVelocityX(-bounceBackVelocity); // Push left
    } else {
      player.setVelocityX(bounceBackVelocity); // Push right
    }
    this.playerHp -= 5; // Reduce player HP on collision
    this.updateHealthBar();
    this.evaluateGameOver();
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
  }
}
