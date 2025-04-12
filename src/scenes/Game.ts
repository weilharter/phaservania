import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";

const PLATFORM_VERTICAL_POSITION = 550;
const WORLD_BOUNDS_WIDTH = 2000;

const PLAYER_GRAVITY_Y = 2000;
const PLAYER_JUMP_VELOCITY_Y = -900;
const PLAYER_MOVEMENT_SPEED = 300;

const MAX_ENEMIES = 5;

export class Game extends Scene {
  player: Phaser.Physics.Arcade.Sprite;
  platforms: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  lastPlatformX = 0;
  lastEnemySpawnX = 0;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  farBuildings: Phaser.GameObjects.TileSprite;
  buildings: Phaser.GameObjects.TileSprite;
  foreground: Phaser.GameObjects.TileSprite;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("ground", "assets/platform.png");
    this.load.image("enemy", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.image("sky", "assets/background/sky.png");
    // this.load.image("far-buildings", "assets/background/far-buildings.png");
    // this.load.image("buildings", "assets/background/buildings.png");
    // this.load.image("foreground", "assets/background/foreground.png");
  }

  create() {
    this.add
      .tileSprite(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT, "sky")
      .setOrigin(0, 0);
    // // Parallax Background Layers
    // this.add
    //   .tileSprite(0, 0, 500, HEIGHT, "bg")
    //   .setOrigin(0, 0)
    //   .setScale(5)
    //   .setScrollFactor(0); // Farthest background
    // this.farBuildings = this.add
    //   .tileSprite(0, 0, 500, HEIGHT, "far-buildings")
    //   .setOrigin(0, 0)
    //   .setScale(5)
    //   .setScrollFactor(0);
    // this.buildings = this.add
    //   .tileSprite(0, 0, 500, HEIGHT, "buildings")
    //   .setOrigin(0, 0)
    //   .setScale(5)
    //   .setScrollFactor(0);
    // this.foreground = this.add
    //   .tileSprite(0, 0, 500, HEIGHT, "foreground")
    //   .setOrigin(0, 0)
    //   .setScale(5)
    //   .setScrollFactor(0);

    // Player
    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(PLAYER_GRAVITY_Y);

    // Expand world bounds
    this.physics.world.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT);

    // Kamera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setLerp(1, 0);

    // Plattformen
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

    // Gegner
    this.enemies = this.physics.add.group();

    // Physik
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, () =>
      this.scene.start("GameOver")
    );

    // 🎞️ Animations
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

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // Player movement
    const speed = PLAYER_MOVEMENT_SPEED;
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("front");
    }

    // Jumping
    if (
      (this.cursors.space?.isDown || this.cursors.up?.isDown) &&
      this.player.body?.touching.down
    ) {
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY_Y);
    }

    // Parallax Scrolling
    // this.farBuildings.tilePositionX = this.cameras.main.scrollX * 0.2; // Slowest layer
    // this.buildings.tilePositionX = this.cameras.main.scrollX * 0.5; // Medium speed
    // this.foreground.tilePositionX = this.cameras.main.scrollX * 0.8; // Fastest layer

    // Recycle platforms
    this.platforms.children.iterate((plat: Phaser.GameObjects.GameObject) => {
      const platform = plat as Phaser.Physics.Arcade.Sprite;
      if (platform.x + platform.width < this.player.x - 400) {
        platform.x = this.lastPlatformX + 400;
        platform.y = PLATFORM_VERTICAL_POSITION + Phaser.Math.Between(-5, 5);
        // platform.y = PLATFORM_VERTICAL_POSITION + Phaser.Math.Between(-50, 50);
        platform.body.updateFromGameObject();
        this.lastPlatformX = platform.x;
      }
    });

    // Gegner spawnen
    if (this.player.x > this.lastEnemySpawnX + 600) {
      const enemy = this.enemies.create(this.player.x + 400, 200, "enemy");
      enemy.setBounce(1);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocityX(-100);
      this.lastEnemySpawnX = this.player.x;
    }
  }
}
