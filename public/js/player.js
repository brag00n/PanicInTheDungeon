export default class Player {
  constructor(scene, x, y,playerType,playerId) {
    this.scene = scene;
    this.playerType=playerType;
    this.x;
    this.y;
    this.playerId=playerId;

    const anims = scene.anims;
    anims.create({
      key: "player-walk",
      frames: anims.generateFrameNumbers("characters", { start: 46, end: 49 }),
      frameRate: 8,
      repeat: -1
    });
    anims.create({
      key: "player-walk-back",
      frames: anims.generateFrameNumbers("characters", { start: 65, end: 68 }),
      frameRate: 8,
      repeat: -1
    });

    this.sprite = scene.physics.add
      .sprite(x, y, "characters", 0)
      .setSize(22, 33)
      .setOffset(23, 27);

    this.sprite.anims.play("player-walk-back");

    if (this.playerType == 'curentPlayer')
       this.keys = scene.input.keyboard.createCursorKeys();
    console.log('new Player ['+this.playerId+'] ('+this.playerType+') created');
  }

  reuse(scene, x, y,playerType){
    this.scene = scene;
    this.playerType=playerType;
    this.x;
    this.y;

    const anims = scene.anims;

    this.sprite = scene.physics.add
      .sprite(x, y, "characters", 0)
      .setSize(22, 33)
      .setOffset(23, 27);

    this.sprite.anims.play("player-walk-back");

    console.log('Player ['+this.playerId+'] ('+this.playerType+') reused');
  }

  freeze() {
    this.sprite.body.moves = false;
  }

  update() {
    if (this.playerType == 'curentPlayer') {
      const keys = this.keys;
      const sprite = this.sprite;
      const speed = 600;
      const prevVelocity = sprite.body.velocity.clone();

      // Stop any previous movement from the last frame
      sprite.body.setVelocity(0);

      // Horizontal movement
      if (keys.left.isDown) {
        sprite.body.setVelocityX(-speed);
        sprite.setFlipX(true);
      } else if (keys.right.isDown) {
        sprite.body.setVelocityX(speed);
        sprite.setFlipX(false);
      }

      // Vertical movement
      if (keys.up.isDown) {
        sprite.body.setVelocityY(-speed);
      } else if (keys.down.isDown) {
        sprite.body.setVelocityY(speed);
      }

      // Normalize and scale the velocity so that sprite can't move faster along a diagonal
      sprite.body.velocity.normalize().scale(speed);

      // Update the animation last and give left/right animations precedence over up/down animations
      if (keys.left.isDown || keys.right.isDown || keys.down.isDown) {
        sprite.anims.play("player-walk", true);
      } else if (keys.up.isDown) {
        sprite.anims.play("player-walk-back", true);
      } else {
        sprite.anims.stop();

        // If we were moving, pick and idle frame to use
        if (prevVelocity.y < 0) sprite.setTexture("characters", 65);
        else sprite.setTexture("characters", 46);
      }
    }else{
      this.sprite.x=this.x;
      this.sprite.y=this.y;
      this.sprite.anims.play("player-walk", true);  
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
