var e=Object.defineProperty,t=(t,s,i)=>((t,s,i)=>s in t?e(t,s,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[s]=i)(t,"symbol"!=typeof s?s+"":s,i);import{p as s}from"./phaser-CwoquCe3.js";!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver((e=>{for(const s of e)if("childList"===s.type)for(const e of s.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&t(e)})).observe(document,{childList:!0,subtree:!0})}function t(e){if(e.ep)return;e.ep=!0;const t=function(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?t.credentials="include":"anonymous"===e.crossOrigin?t.credentials="omit":t.credentials="same-origin",t}(e);fetch(e.href,t)}}();class i extends s.Scene{constructor(){super("Boot")}preload(){this.load.image("background","assets/bg.png")}create(){this.scene.start("Preloader")}}class a extends Phaser.Physics.Arcade.Sprite{constructor(e,s,i,a,h=100){super(e,s,i,a),t(this,"hp"),this.hp=h,e.add.existing(this),e.physics.add.existing(this),this.setCollideWorldBounds(!0)}hit(e){this.hp-=e,this.showDamageNumber(this.x,this.y,e,"#ffff00"),this.hp<=0&&this.destroy()}showDamageNumber(e,t,s,i="#ff0000"){const a=this.scene.add.text(e,t,`${s}`,{font:"16px Arial",color:i,stroke:"#000000",strokeThickness:2});this.scene.tweens.add({targets:a,y:t-30,alpha:1,duration:350,ease:"Power1",onComplete:()=>{a.destroy()}})}}class h extends a{constructor(e,s,i,a){super(e,s,i,a,100),t(this,"level",1),t(this,"levelXp",0),t(this,"xpToNextLevel",2e3),t(this,"isInvincible",!1),t(this,"isLevelUpEffectActive",!1),t(this,"levelUpEffect",null),t(this,"isAttacking",!1),this.setGravityY(n)}hit(e){this.isInvincible||(this.hp-=e,this.scene.sound.play("tap",{volume:.5}),this.showDamageNumber(this.x,this.y,e),this.hp,this.isInvincible=!0,this.scene.tweens.add({targets:this,alpha:.5,duration:100,ease:"Linear",yoyo:!0,repeat:5,onComplete:()=>{this.setAlpha(1)}}),this.scene.time.delayedCall(1e3,(()=>{this.isInvincible=!1})))}gainExperience(e){this.levelXp+=e,this.levelXp>=this.xpToNextLevel&&(this.levelXp-=this.xpToNextLevel,this.level++,this.hp=100,this.xpToNextLevel+=5e3,this.triggerLevelUpEffect())}triggerLevelUpEffect(){if(this.isLevelUpEffectActive)return;this.levelUpEffect=this.scene.add.sprite(this.x,this.y,"levelUpEffect"),this.levelUpEffect.setScale(1),this.levelUpEffect.setDepth(10),this.levelUpEffect.play("levelUpAnim"),this.scene.sound.play("lightning-shield",{volume:.5,loop:!0});const e=this.scene.time.addEvent({delay:16,callback:()=>{this.levelUpEffect&&this.levelUpEffect.setPosition(this.x,this.y),this.isLevelUpEffectActive=!0,this.isInvincible=!0},callbackScope:this,loop:!0});this.scene.time.delayedCall(2e3,(()=>{this.scene.sound.stopByKey("lightning-shield"),e.remove(!1),this.levelUpEffect&&(this.levelUpEffect.destroy(),this.levelUpEffect=null),this.isLevelUpEffectActive=!1,this.isInvincible=!1}))}castPlayerSpell(){if(this.isAttacking)return;this.isAttacking=!0;const e=this.flipX?-1:1,t=25*e;[-30,-50,-60].forEach((s=>{const i=this.scene.spells.create(this.x+t,this.y+s+30,"projectile-spell");i.setScale(.6),i.setAlpha(.5),i.flipX=this.flipX,i.anims.play("spellAnim"),this.anims.play("char-attack"),i.setVelocityX(300*e),i.setGravityY(-1900),i.owner=h,this.scene.time.delayedCall(3e3,(()=>{i.active&&i.destroy()}))})),this.scene.time.delayedCall(800,(()=>{this.isAttacking=!1}))}}class r extends a{constructor(e,s,i,a){super(e,s,i,a,50),t(this,"isAttacking",!1),this.setTint(16711680)}castSpellTowardsPlayer(e){if(!this.active)return;const t=new Phaser.Math.Vector2(e.x-this.x,e.y-this.y).normalize(),s=this.scene.spells.create(this.x,this.y-60,"projectile-spell");s.setVelocity(1e3*t.x,1e3*t.y),s.setGravityY(-500),s.setTint(16711680),s.setScale(.5),s.owner=r,s.anims.play("spellAnim"),this.scene.time.delayedCall(1e3,(()=>{s.destroy()}))}chasePlayer(e){var t;if(this.active){new Phaser.Math.Vector2(e.x-this.x,e.y-this.y).normalize().x<0?this.setFlipX(!0):this.setFlipX(!1);const s=Math.abs(e.x-this.x);if(s<30&&!1===this.isAttacking){this.isAttacking=!0,this.anims.play("char-attack");const t=this.scene.add.rectangle(this.x+(this.flipX?-20:20),this.y,40,20);this.scene.physics.add.existing(t),t.body.setAllowGravity(!1),this.scene.physics.add.overlap(t,e,(()=>{if(!e.isInvincible){const t=Phaser.Math.Between(5,15);e.hit(t)}}),void 0,this),this.scene.time.delayedCall(1e3,(()=>{t.destroy(),this.isAttacking=!1}))}else if(s>100){const t=e.x>this.x?1:-1;this.anims.play("char-running",!0),this.setVelocityX(100*t)}(null==(t=this.body)?void 0:t.touching.down)&&0===Phaser.Math.Between(0,200)&&(this.anims.play("char-jump"),this.setVelocityY(Phaser.Math.Between(-200,-800)))}}}const l=2e3,n=2e3;class c extends s.Scene{constructor(){super("Game"),t(this,"player"),t(this,"platforms"),t(this,"enemies"),t(this,"spells"),t(this,"characters"),t(this,"cursorKeys"),t(this,"keyboardKeys"),t(this,"healthBar"),t(this,"experienceBar"),t(this,"levelText"),t(this,"attackKey")}preload(){this.load.spritesheet("char-idle","assets/char-idle.png",{frameWidth:120,frameHeight:80}),this.load.spritesheet("char-running","assets/char-running.png",{frameWidth:120,frameHeight:80}),this.load.spritesheet("char-jump","assets/char-jump.png",{frameWidth:120,frameHeight:80}),this.load.spritesheet("char-attack","assets/char-attack.png",{frameWidth:120,frameHeight:80}),this.load.spritesheet("projectile-spell","assets/lightning-bolt.png",{frameWidth:256,frameHeight:128}),this.load.spritesheet("levelUpEffect","assets/lightning-shield.png",{frameWidth:128,frameHeight:128})}create(){var e;this.add.tileSprite(0,0,l,u,"bg").setOrigin(0,0),this.sound.add("music",{loop:!0,volume:1}).play(),this.player=new h(this,1e3,u-60,"char-idle"),this.cameras.main.startFollow(this.player,!0,5,5),this.characters=this.physics.add.group(),this.characters.add(this.player),this.physics.world.setBounds(0,0,l,u),this.cameras.main.setBounds(0,0,l,u),this.platforms=this.physics.add.group({immovable:!0,allowGravity:!1}),this.createPlatforms(),this.enemies=this.physics.add.group({classType:r,runChildUpdate:!0}),this.spells=this.physics.add.group(),this.physics.add.collider(this.characters,this.platforms),this.physics.add.overlap(this.spells,this.platforms,(e=>{this.time.delayedCall(1e3,(()=>{e.active&&e.destroy()}))})),this.physics.add.overlap(this.spells,this.characters,this.handleSpellCollision,void 0,this),this.physics.add.overlap(this.enemies,this.player,((e,t)=>{const s=t;this.player.isLevelUpEffectActive&&this.hitTarget(s,9999)}),void 0,this),this.createAnimations(),this.input.keyboard&&(this.cursorKeys=this.input.keyboard.createCursorKeys(),this.keyboardKeys=null==(e=this.input.keyboard)?void 0:e.addKeys({W:Phaser.Input.Keyboard.KeyCodes.W,A:Phaser.Input.Keyboard.KeyCodes.A,S:Phaser.Input.Keyboard.KeyCodes.S,D:Phaser.Input.Keyboard.KeyCodes.D,F:Phaser.Input.Keyboard.KeyCodes.F})),this.healthBar=this.add.graphics(),this.healthBar.setScrollFactor(0),this.updateHealthBar(),this.experienceBar=this.add.graphics(),this.experienceBar.setScrollFactor(0),this.updateExperienceBar(),this.levelText=this.add.text(24,60,"",{font:"16px Arial",color:"#ffffff",stroke:"#000000",strokeThickness:1}),this.levelText.setScrollFactor(0),this.updateLevelText(),this.time.addEvent({delay:250,callback:this.spawnEnemies,callbackScope:this,loop:!0})}createPlatforms(){const e=Math.ceil(10)+1;for(let s=0;s<e;s++)this.platforms.create(200*s,315,"ground").setScale(1).refreshBody();const t=u;this.platforms.create(0,u/2,"ground").setScale(1,t/20).setOrigin(.5,.5).refreshBody(),this.platforms.create(l,u/2,"ground").setScale(1,t/20).setOrigin(.5,.5).refreshBody()}createAnimations(){this.anims.exists("char-idle")||this.anims.create({key:"char-idle",frames:this.anims.generateFrameNumbers("char-idle",{start:0,end:9}),frameRate:10,repeat:-1}),this.anims.exists("char-running")||this.anims.create({key:"char-running",frames:this.anims.generateFrameNumbers("char-running",{start:0,end:9}),frameRate:10,repeat:-1}),this.anims.exists("char-attack")||this.anims.create({key:"char-attack",frames:this.anims.generateFrameNumbers("char-attack",{start:0,end:5}),frameRate:12,repeat:0}),this.anims.exists("char-jump")||this.anims.create({key:"char-jump",frames:this.anims.generateFrameNumbers("char-jump",{start:0,end:2}),frameRate:5,repeat:0}),this.anims.exists("spellAnim")||this.anims.create({key:"spellAnim",frames:this.anims.generateFrameNumbers("projectile-spell",{start:0,end:3}),frameRate:12,repeat:-1}),this.anims.exists("levelUpAnim")||this.anims.create({key:"levelUpAnim",frames:this.anims.generateFrameNumbers("levelUpEffect",{start:0,end:3}),frameRate:40,repeat:-1})}handleMovement(){var e,t,s,i,a,h;try{this.input.activePointer.worldX<this.player.x?this.player.flipX=!0:this.player.flipX=!1,this.input.keyboard&&(this.cursorKeys.left.isDown||this.keyboardKeys.A.isDown?(this.player.flipX=!0,(null==(e=this.player.body)?void 0:e.touching.down)&&!this.player.isAttacking&&this.player.anims.play("char-running",!0),this.player.setVelocityX(-400)):this.cursorKeys.right.isDown||this.keyboardKeys.D.isDown?(this.player.flipX=!1,(null==(t=this.player.body)?void 0:t.touching.down)&&!this.player.isAttacking&&this.player.anims.play("char-running",!0),this.player.setVelocityX(400)):((null==(s=this.player.body)?void 0:s.touching.down)&&!this.player.isAttacking&&this.player.anims.play("char-idle",!0),this.player.setVelocityX(0)),((null==(i=this.cursorKeys.space)?void 0:i.isDown)||(null==(a=this.cursorKeys.up)?void 0:a.isDown)||this.keyboardKeys.W.isDown)&&(null==(h=this.player.body)?void 0:h.touching.down)&&(this.player.anims.play("char-jump"),this.sound.play("jump",{volume:.2}),this.player.setVelocityY(-800)))}catch(r){}}spawnEnemies(){if(this.enemies.countActive()>=10)return;const e=0===Phaser.Math.Between(0,1);let t;do{t=e?Phaser.Math.Between(100,1e3):Phaser.Math.Between(1e3,1900)}while(Math.abs(t-this.player.x)<100);const s=new r(this,t,-185,"char-idle");this.enemies.add(s),this.characters.add(s)}handlePlayerDamage(e){this.player.hit(e),this.updateHealthBar(),this.evaluateGameOver()}hitTarget(e,t=0){0===t&&(t=this.calculateDamage(e)),e.hit(t),e.hp<=0&&e instanceof r&&this.gainExperience(1e3)}handleSpellCollision(e,t){(e.owner===h&&t instanceof r||e.owner===r&&t instanceof h)&&(this.hitTarget(t),e.destroy())}calculateDamage(e){return e===this.player?Phaser.Math.Between(5,10):e instanceof r?Phaser.Math.Between(100,200):0}updateHealthBar(){this.healthBar.clear(),this.healthBar.fillStyle(16711680,1),this.healthBar.fillRect(8,8,.8*this.player.hp,5),this.healthBar.lineStyle(1,0),this.healthBar.strokeRect(8,8,80,5)}updateExperienceBar(){this.experienceBar.clear(),this.experienceBar.fillStyle(65280,1);const e=Math.min(this.player.levelXp/this.player.xpToNextLevel*80,80);this.experienceBar.fillRect(8,16,e,3),this.experienceBar.lineStyle(1,0),this.experienceBar.strokeRect(8,16,80,3)}updateLevelText(){this.levelText.setText(`Level: ${this.player.level}\nXP: ${this.player.levelXp} / ${this.player.xpToNextLevel}`),this.levelText.setFontSize(8),this.levelText.setPosition(8,24)}gainExperience(e){this.player.gainExperience(e),this.updateExperienceBar(),this.updateLevelText()}evaluateGameOver(){this.player.hp<=0&&(this.scene.stop(),this.player.hp=100,this.scene.start("GameOver",{level:this.player.level}),this.sound.stopAll())}chasePlayer(){this.enemies.getChildren().forEach((e=>{e.chasePlayer(this.player)}))}gameOverOnFallOutOfWorld(){this.player.y>u&&(this.player.hp=0,this.evaluateGameOver())}handleCastSpells(){this.input.activePointer.isDown&&this.player.castPlayerSpell()}update(){this.evaluateGameOver(),this.handleMovement(),this.handleCastSpells(),this.chasePlayer(),this.updateHealthBar(),this.gameOverOnFallOutOfWorld()}}class o extends s.Scene{constructor(){super("GameOver"),t(this,"camera"),t(this,"background"),t(this,"gameover_text"),t(this,"level",0)}init(e){this.level=e.level}create(){var e;this.camera=this.cameras.main,this.camera.setBackgroundColor(16711680);const t=this.scale.width/2,s=this.scale.height/2;this.background=this.add.image(t,s,"background"),this.background.setAlpha(.5),this.scene.stop("Game"),this.gameover_text=this.add.text(t,s,`\nLevel Reached: ${this.level||0}`,{fontFamily:"Arial Black",fontSize:30,color:"#fff",stroke:"#000",strokeThickness:8,align:"center"}),this.gameover_text.setOrigin(.5);const i=null==(e=this.input.keyboard)?void 0:e.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);null==i||i.once("down",(()=>{this.scene.start("MainMenu")})),this.input.once("pointerdown",(()=>{this.scene.start("MainMenu")}))}}class p extends s.Scene{constructor(){super("MainMenu"),t(this,"background"),t(this,"title"),t(this,"subtitle")}create(){var e;const t=this.scale.width/2,s=this.scale.height/2;this.background=this.add.image(t,s,"background"),this.background.setAlpha(.5),this.subtitle=this.add.text(t,s,"PRESS SPACE OR TAP TO START",{fontFamily:"Arial Black",fontSize:30,color:"#ffffff",stroke:"#000000",strokeThickness:2,align:"center"}).setOrigin(.5);const i=null==(e=this.input.keyboard)?void 0:e.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);null==i||i.once("down",(()=>{this.scene.start("Game")})),this.input.once("pointerdown",(()=>{this.scene.start("Game")}))}}class d extends s.Scene{constructor(){super("Preloader"),t(this,"background")}init(){const e=this.scale.width/2,t=this.scale.height/2;this.background=this.add.image(e,t,"background"),this.background.setAlpha(.5),this.add.rectangle(y/2,u/2,y-172,32).setStrokeStyle(1,16777215);const s=this.add.rectangle(y/2-(y-172)/2+2,u/2,4,28,16777215);this.load.on("progress",(e=>{s.width=4+(y-176)*e}))}preload(){this.load.image("bg","assets/bg.png"),this.load.image("ground","assets/platform.png"),this.load.audio("tap","assets/audio/tap.wav"),this.load.audio("music","assets/audio/music.mp3"),this.load.audio("lightning-shield","assets/audio/lightning-shield.wav"),this.load.audio("jump","assets/audio/jump.wav")}create(){this.scene.start("MainMenu")}}const y=640,u=320,m={type:Phaser.AUTO,width:y,height:u,pixelArt:!0,zoom:6,parent:"game-container",backgroundColor:"#000",scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{gravity:{x:0,y:2e3},debug:!1}},scene:[i,d,p,c,o]};new s.Game(m);
