import { Scene } from "phaser";

const MAX_BOMBS = 5;
const VELOCITY_X = 800;

export class Game extends Scene {
  player: Phaser.Physics.Arcade.Sprite;
  playerHealth: number = 100;
  stars: Phaser.Physics.Arcade.Group;
  bombs: Phaser.Physics.Arcade.Group;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  spaceKey: Phaser.Input.Keyboard.Key;
  score: number = 0;
  gameOver: boolean = false;
  scoreText: Phaser.GameObjects.Text;
  hpText: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // Background
    this.add.image(400, 300, "sky");

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
    // this.platforms.create(600, 400, "ground");
    // this.platforms.create(50, 250, "ground");
    // this.platforms.create(750, 220, "ground");

    // Player
    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setCollideWorldBounds(true);

    // Player animations
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

    if (!this.input.keyboard) {
      throw new Error("Keyboard input not available");
    }

    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Stars
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      bounceY: 0.2,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    // Bombs
    this.bombs = this.physics.add.group();
    for (let i = 0; i < 4; i++) {
      const x =
        this.player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      const bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(false);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = true;
      bomb.body.onWorldBounds = true;
    }

    // Create a container for the UI
    this.scoreText = this.add.text(0, 3, "Score: 0", {
      fontSize: "32px",
      stroke: "black",
    });
    this.hpText = this.add.text(0, 35, "HP: 100", {
      fontSize: "32px",
      stroke: "black",
    });

    // Colliders
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.stars,
      (player, star) =>
        this.collectStar(
          player as Phaser.GameObjects.GameObject,
          star as Phaser.GameObjects.GameObject
        ),
      undefined,
      this
    );
    this.physics.add.collider(
      this.player,
      this.bombs,
      (player, bomb) =>
        this.hitBomb(
          player as Phaser.GameObjects.GameObject,
          bomb as Phaser.GameObjects.GameObject
        ),
      undefined,
      this
    );
  }

  update() {
    if (this.gameOver) {
      this.scene.start("GameOver", { score: this.score });
      this.scene.stop();
      this.gameOver = false;
      return;
    }

    this.hpText.setText("HP: " + this.playerHealth);

    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-VELOCITY_X);
      this.player.anims.play("left", true);
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(VELOCITY_X);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("front");
    }

    if (
      (this.cursorKeys.up.isDown || this.spaceKey.isDown) &&
      this.player.body?.touching.down
    ) {
      this.player.setVelocityY(-900);
    }
  }

  collectStar(
    _player: Phaser.GameObjects.GameObject,
    star: Phaser.GameObjects.GameObject
  ) {
    const starBody = star as Phaser.Physics.Arcade.Image;
    starBody.disableBody(true, true);

    // Update score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    if (this.stars.countActive(true) === 0) {
      this.stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
        const star = child as Phaser.Physics.Arcade.Image;
        star.enableBody(true, star.x, 0, true, true);
        return null;
      });

      if (this.bombs.countActive(true) < MAX_BOMBS) {
        for (let i = 0; i < 5; i++) {
          const x =
            this.player.x < 400
              ? Phaser.Math.Between(400, 800)
              : Phaser.Math.Between(0, 400);

          const bomb = this.bombs.create(x, 16, "bomb");
          bomb.setBounce(1);
          bomb.setCollideWorldBounds(false);
          bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
          bomb.allowGravity = true;
          bomb.body.onWorldBounds = true;
        }
      }
    }
  }

  hitBomb(
    player: Phaser.GameObjects.GameObject,
    _bomb: Phaser.GameObjects.GameObject
  ) {
    this.playerHealth -= 5;
    const playerBody = player as Phaser.Physics.Arcade.Sprite;

    // Set tint to red
    playerBody.setTint(0xff0000);
    playerBody.anims.play("front");

    // Create a timer to clear the tint after 0.5 seconds
    this.time.delayedCall(100, () => {
      playerBody.clearTint();
    });

    if (this.playerHealth <= 0) {
      this.physics.pause();
      this.gameOver = true;
    }
  }
}
