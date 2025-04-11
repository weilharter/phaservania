import { Scene } from "phaser";

export class Game extends Scene {
  player: Phaser.Physics.Arcade.Sprite;
  stars: Phaser.Physics.Arcade.Group;
  bombs: Phaser.Physics.Arcade.Group;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  spaceKey: Phaser.Input.Keyboard.Key;
  score: number = 0;
  gameOver: boolean = false;
  scoreText: Phaser.GameObjects.Text;

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
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    // Player
    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setCollideWorldBounds(true);

    // Player animations
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    // Input
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Stars
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate((child: Phaser.GameObjects.GameObject) => {
      const star = child as Phaser.Physics.Arcade.Image;
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    // Bombs
    this.bombs = this.physics.add.group();

    // Score
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      fill: "#000",
    });

    // Colliders
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this
    );
    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      undefined,
      this
    );
  }

  update() {
    if (this.gameOver) {
      return;
    }

    const speed = 800;
    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play("left", true);
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (
      (this.cursorKeys.up.isDown || this.spaceKey.isDown) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-900);
    }
  }

  collectStar(
    player: Phaser.GameObjects.GameObject,
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
      });

      const x =
        this.player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      const bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  hitBomb(
    player: Phaser.GameObjects.GameObject,
    bomb: Phaser.GameObjects.GameObject
  ) {
    this.physics.pause();

    const playerBody = player as Phaser.Physics.Arcade.Sprite;
    playerBody.setTint(0xff0000);
    playerBody.anims.play("turn");

    // this.gameOver = true;
  }
}
