import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";

const PLATFORM_VERTICAL_POSITION = 550;
const WORLD_BOUNDS_WIDTH = 2000;

const PLAYER_GRAVITY_Y = 2000;
const PLAYER_JUMP_VELOCITY_Y = -900;
const PLAYER_MOVEMENT_SPEED = 300;

const ENEMY_MOVEMENT_SPEED = 200;
const ENEMY_SPAWN_DISTANCE = 600;

export class Game extends Scene {
  player: Phaser.Physics.Arcade.Sprite;
  platforms: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  lastPlatformX = 0;
  lastEnemySpawnX = 0;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  keyboardKeys: any;
  playerHp: number = 100;
  healthBar: Phaser.GameObjects.Graphics;

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
    for (let i = 0; i < 5; i++) {
      const platform = this.platforms
        .create(
          i * 400,
          PLATFORM_VERTICAL_POSITION + Phaser.Math.Between(-10, 10),
          "ground"
        )
        .setScale(1)
        .refreshBody();
      this.lastPlatformX = platform.x;
    }

    // Enemies
    this.enemies = this.physics.add.group();

    // Physics
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision,
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
      });
    }

    // Create the health bar
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0); // Make the health bar position absolute
    this.updateHealthBar();
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
    }
  }

  recyclePlatforms() {
    this.platforms.children.iterate((plat: Phaser.GameObjects.GameObject) => {
      const platform = plat as Phaser.Physics.Arcade.Sprite;
      if (platform.x + platform.width < this.player.x - 400) {
        platform.x = this.lastPlatformX + 400;
        platform.y = PLATFORM_VERTICAL_POSITION + Phaser.Math.Between(-5, 5);
        platform.body?.updateFromGameObject();
        this.lastPlatformX = platform.x;
      }
      return null;
    });
  }

  spawnEnemies() {
    if (this.player.x > this.lastEnemySpawnX + ENEMY_SPAWN_DISTANCE) {
      const enemy = this.enemies.create(this.player.x + 400, 200, "dude");
      enemy.setBounce(0.2);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocityX(-200);
      enemy.anims.play("left"); // Default animation
      this.lastEnemySpawnX = this.player.x;
    }

    // Enemy movement logic
    this.enemies.children.iterate((enemy: Phaser.GameObjects.GameObject) => {
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
      enemySprite.setTintFill(0x000);
      enemySprite.setAlpha(1); // 50% opacity
      if (!enemySprite.body) return null;
      if (enemySprite.body.velocity.x < 0) {
        enemySprite.anims.play("left", true);
      } else if (enemySprite.body.velocity.x > 0) {
        enemySprite.anims.play("right", true);
      }
      return null;
    });
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

    this.playerHp -= 10; // Reduce HP
    this.updateHealthBar(); // Update the health bar

    if (this.playerHp <= 0) {
      this.scene.stop();
      this.playerHp = 100;
      this.scene.start("GameOver"); // End the game if HP is 0
    }
  }

  updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1); // Red color for health
    this.healthBar.fillRect(16, 16, this.playerHp * 2, 20); // Width proportional to HP
    this.healthBar.lineStyle(1, 0x000); // White border
    this.healthBar.strokeRect(16, 16, 200, 20); // Fixed border width
  }

  update() {
    this.handleMovement();
    this.recyclePlatforms();
    this.spawnEnemies();
  }
}
