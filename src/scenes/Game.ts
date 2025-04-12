import { Scene } from "phaser";
import { HEIGHT, WIDTH } from "../main";

const PLATFORM_VERTICAL_POSITION = 550;
const WORLD_BOUNDS_WIDTH = 2000;

const PLAYER_GLOBAL_COOLDOWN = 500;
const PLAYER_GRAVITY_Y = 2000;
const PLAYER_JUMP_VELOCITY_Y = -900;
const PLAYER_MOVEMENT_SPEED = 300;

const MAX_ENEMIES = 10;
const ENEMY_GLOBAL_COOLDOWN = 1000;
const ENEMY_SPAWN_RATE = 500;
const ENEMY_MOVEMENT_SPEED = 100;

abstract class Character extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  isPlayer: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    hp: number,
    isPlayer: boolean
  ) {
    super(scene, x, y, texture);
    this.hp = hp;
    this.isPlayer = isPlayer;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
  }

  takeDamage(amount: number) {
    if (this.isPlayer) {
      // Player-specific damage logic (with invincibility)
      const player = this as Player; // Type assertion for clarity
      if (!player.isInvincible) {
        player.hp -= amount;
        player.isInvincible = true;

        // Blink effect for invincibility
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 100,
          ease: "Linear",
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            this.setAlpha(1);
            player.isInvincible = false;
          },
        });

        if (player.hp <= 0) {
          this.onDeath();
        }
      }
    } else {
      // NPC-specific damage logic (no invincibility)
      this.hp -= amount;
      if (this.hp <= 0) {
        this.onDeath();
      }
    }
  }

  protected abstract onDeath(): void;
}

class Player extends Character {
  isInvincible: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dude", 100, true); // `isPlayer` is true for Player
    this.setGravityY(PLAYER_GRAVITY_Y);
  }

  protected onDeath() {
    this.scene.scene.stop();
    this.scene.scene.start("GameOver");
  }
}

class Enemy extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dude", 100, false); // `isPlayer` is false for Enemy
    this.setTint(0xff0000); // Red tint for enemies
  }

  protected onDeath() {
    this.destroy();
  }
}

class Spell extends Phaser.Physics.Arcade.Sprite {
  owner: "player" | "enemy";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    owner: "player" | "enemy"
  ) {
    super(scene, x, y, "spell");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.owner = owner;
    this.anims.play("spellAnim");
  }
}

export class Game extends Scene {
  player: Player;
  enemies: Phaser.Physics.Arcade.Group;
  spells: Phaser.Physics.Arcade.Group;
  platforms: Phaser.Physics.Arcade.Group;
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
    this.load.spritesheet("spell", "assets/projectiles.png", {
      frameWidth: 63,
      frameHeight: 63,
    });
  }

  create() {
    // Background
    this.add
      .tileSprite(0, 0, WORLD_BOUNDS_WIDTH, HEIGHT, "sky")
      .setOrigin(0, 0);

    // Player
    this.player = new Player(this, 100, 400);

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
    this.enemies = this.physics.add.group({
      classType: Enemy,
    });

    // Spells
    this.spells = this.physics.add.group({
      classType: Spell,
    });

    // Physics
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.spells, this.platforms, (spell) => {
      spell.destroy(); // Destroy the spell on collision with platforms
    });
    this.physics.add.collider(this.player, this.enemies);
    this.physics.add.overlap(
      this.spells,
      this.enemies,
      this.handleSpellCollision,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.spells,
      this.player,
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
        frames: this.anims.generateFrameNumbers("spell", { start: 3, end: 5 }),
        frameRate: 15,
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
    const direction = this.player.flipX ? -1 : 1;
    const spell = new Spell(
      this,
      this.player.x + direction * 25,
      this.player.y,
      "player"
    );
    spell.setVelocityX(direction * 1000);

    this.spells.add(spell);

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
    const enemy = new Enemy(this, spawnX, spawnY);
    this.enemies.add(enemy);
  }

  handleSpellCollision(spell: Spell, target: Phaser.Physics.Arcade.Sprite) {
    if (spell.owner === "player" && target instanceof Enemy) {
      const damage = this.calculateDamage(target);
      target.takeDamage(damage); // Reduce enemy HP
      this.showDamageNumber(target.x, target.y, damage); // Show damage number
      spell.destroy();
    } else if (spell.owner === "enemy" && target === this.player) {
      if (!this.player.isInvincible) {
        const damage = this.calculateDamage(this.player);
        this.player.takeDamage(damage); // Reduce player HP
        this.showDamageNumber(this.player.x, this.player.y, damage, "#ff0000"); // Show damage number
        this.updateHealthBar();
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
      return Phaser.Math.Between(13, 50);
    }
    return 0; // Default damage if character type is unknown
  }

  showDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: string = "yellow"
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
    this.healthBar.fillRect(16, 16, this.player.hp * 2, 20); // Width proportional to HP
    this.healthBar.lineStyle(1, 0x000); // White border
    this.healthBar.strokeRect(16, 16, 200, 20); // Fixed border width
  }

  update() {
    this.handleMovement();

    // Handle player attack while pointer is pressed
    if (this.input.activePointer.isDown) {
      this.castPlayerSpell();
    }

    // Ensure enemies keep moving
    this.enemies.getChildren().forEach((enemy: Enemy) => {
      if (enemy.active) {
        const distanceToPlayer = Math.abs(this.player.x - enemy.x);
        if (distanceToPlayer < 160) {
          // Move away from the player if too close
          const directionX = this.player.x > enemy.x ? -1 : 1; // Move away from the player's X position
          enemy.setVelocityX(directionX * ENEMY_MOVEMENT_SPEED);
        } else if (distanceToPlayer > 300) {
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
