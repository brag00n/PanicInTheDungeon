import Player from "./player.js";
import TILES from "./tile-mapping.js";
import TilemapVisibility from "./tilemap-visibility.js";
//import Dungeon from "@mikewesthad/dungeon";
//  import rooms from "@mikewesthad/dungeon";

/**
 * Scene that generates a new dungeon
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super();
    this.level = 0;
  }

  preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('star', 'assets/star_gold.png');

    this.load.image("tiles", "../assets/tilesets/buch-tileset-48px-extruded.png");
    this.load.spritesheet(
      "characters",
      "../assets/spritesheets/buch-characters-64px-extruded.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        margin: 1,
        spacing: 2
      }
    );

    self.dungeon= null;
    self.player=null;
  }

  initPlayer(){
    console.log('START this.initPlayer');
    var self = this;
    this.socket = io();
    this.players = this.add.group();
  
    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
  
    this.socket.on('newDungeon', (dungeon,rooms,tiles,doors) => {

      console.log('==> New Dungeon recieved');

            // Generate a random world with a few extra options:
      //  - Rooms should only have odd number dimensions so that they have a center tile.
      //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
      //    either side of the door location
      self.dungeon = new Dungeon({
        width: 50,
        height: 50,
        doorPadding: 2,
        rooms: {
          width: { min: 7, max: 15, onlyOdd: true },
          height: { min: 7, max: 15, onlyOdd: true }
        }
      });

      // log recieved new dungeon

      //As Object prototype is not transmited into "socket.on" communication, we have to backup it.
      this.prototypeOfRoom=Object.getPrototypeOf(self.dungeon.rooms[0]);
      
      //Copy the values of all of the enumerable own properties from one or more source objects to a target object.
      //Prototype of children objects (functions) are lost.
      this.dungeon=Object.assign(this.dungeon,dungeon);

      //this.dungeon.drawToConsole();
  
      self.createDungeon();
    });

    this.socket.on('currentPlayers', function (players) {
      console.log('==> New Players recieved');
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          displayPlayers(self, players[id], 'curentPlayer');
        } else {
          displayPlayers(self, players[id], 'otherPlayer');
        }
      });
    });
  
    this.socket.on('newPlayer', function (playerInfo) {
      console.log('==> New Player recieved: '+playerInfo.playerId);
      displayPlayers(self, playerInfo, 'otherPlayer');
    });
  
    this.socket.on('disconnect', function (playerId) {
      console.log('==> Disconnect recieved ');
      self.players.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
        }
      });
    });
  
    this.socket.on('playerUpdates', function (players) {
      //console.log('==> Player Updates recieved ');
      Object.keys(players).forEach(function (id) {
        self.players.getChildren().forEach(function (player) {
          if (players[id].playerId === player.playerId) {
            player.setPosition();
          }
        });
      });
    });
  
    this.socket.on('updateScore', function (scores) {
      console.log('==> Update Score recieved ');
      self.blueScoreText.setText('Blue: ' + scores.blue);
      self.redScoreText.setText('Red: ' + scores.red);
    });
  
    this.socket.on('starLocation', function (starLocation) {
      console.log('==> Update star Location recieved ');
      if (!self.star) {
        self.star = self.add.image(starLocation.x, starLocation.y, 'star');
      } else {
        self.star.setPosition(starLocation.x, starLocation.y);
      }
    });
  
    //this.cursors = this.input.keyboard.createCursorKeys();
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
    this.upKeyPressed = false;
    console.log('END   this.initPlayer');
  }

  createDungeon(){
    console.log('START this.createDungeon');
    var self = this;
    //self.level++;
    self.hasPlayerReachedStairs = false;

  // Creating a blank tilemap with dimensions matching the dungeon
  const map =  self.make.tilemap({
    tileWidth: 48,
    tileHeight: 48,
    width:  self.dungeon.width,
    height:  self.dungeon.height
  });
  const tileset = map.addTilesetImage("tiles", null, 48, 48, 1, 2); // 1px margin, 2px spacing
    self.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
    self.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
  const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);

    self.tilemapVisibility = new TilemapVisibility(shadowLayer);

  // Use the array of rooms generated to place tiles in the map
  // Note: using an arrow function here so that " self" still refers to our scene
  self.dungeon.rooms.forEach(room => {
    const { x, y, width, height, left, right, top, bottom } = room;
    Object.setPrototypeOf(room, this.prototypeOfRoom);

    // Fill the floor with mostly clean tiles, but occasionally place a dirty tile
    // See "Weighted Randomize" example for more information on how to use weightedRandomize.
      self.groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR);

    // Place the room corners tiles
      self.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      self.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      self.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      self.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

    // Fill the walls with mostly clean tiles, but occasionally place a dirty tile
      self.groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP);
      self.groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
      self.groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT);
      self.groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT);

    // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
    // room's location. Each direction has a different door to tile mapping.
    var doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
    for (var i = 0; i < doors.length; i++) {
      if (doors[i].y === 0) {
          self.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
      } else if (doors[i].y === room.height - 1) {
          self.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
      } else if (doors[i].x === 0) {
          self.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
      } else if (doors[i].x === room.width - 1) {
          self.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
      }
    }
  });

  // Separate out the rooms into:
  //  - The starting room (index = 0)
  //  - A random room to be designated as the end room (with stairs and nothing else)
  //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
  const rooms =  self.dungeon.rooms.slice();
  const startRoom = rooms.shift();
  const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
  const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);

  // Place the stairs
    self.stuffLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY);

  // Place stuff in the 90% "otherRooms"
  otherRooms.forEach(room => {
    var rand = Math.random();
    if (rand <= 0.25) {
      // 25% chance of chest
        self.stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
    } else if (rand <= 0.5) {
      // 50% chance of a pot anywhere in the room... except don't block a door!
      const x = Phaser.Math.Between(room.left + 2, room.right - 2);
      const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
        self.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.POT);
    } else {
      // 25% of either 2 or 4 towers, depending on the room size
      if (room.height >= 9) {
          self.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY + 1);
          self.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY + 1);
          self.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 2);
          self.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 2);
      } else {
          self.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 1);
          self.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 1);
      }
    }
  });

  // Not exactly correct for the tileset since there are more possible floor tiles, but  self will
  // do for the example.
    self.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
    self.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

    self.stuffLayer.setTileIndexCallback(TILES.STAIRS, () => {
      console.log('--> Player Reached Stairs');
      self.stuffLayer.setTileIndexCallback(TILES.STAIRS, null);
      self.hasPlayerReachedStairs = true;
      self.player.freeze();
      const cam =  self.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
          //self.player.destroy();
          self.scene.restart();
      });
  });

  // Place the player in the first room
  const playerRoom = startRoom;
  const x = map.tileToWorldX(playerRoom.centerX);
  const y = map.tileToWorldY(playerRoom.centerY);
  if ( self.player == null){ 
    self.player = new Player( self, x, y,'curentPlayer',this.socket.id);
  }else{
    console.log('Reusing player ['+self.player.playerId+']');
    self.player.scene=this;
    self.player.x=x;
    self.player.y=y;
    self.player.sprite.setPosition(x,y);
    self.player.reuse(self, x, y,'curentPlayer');
    //self.player.sprite.anims.play("player-walk-back",true);
  }
  //self.player = new Player( self, x, y,'curentPlayer',this.socket.id);

  // Watch the player and tilemap layers for collisions, for the duration of the scene:
    self.physics.add.collider( self.player.sprite,  self.groundLayer);
    self.physics.add.collider( self.player.sprite,  self.stuffLayer);

  // Phaser supports multiple cameras, but you can access the default camera like  self:
  const camera =  self.cameras.main;

  // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  camera.startFollow( self.player.sprite);

  // Help text that has a "fixed" position on the screen
    self.add
    .text(16, 16, `Find the stairs. Go deeper.\nlevel:${self.level}. Player:${self.player.palyerId}`, {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0);
    console.log('END   this.createDungeon');
  }

  create() {
    console.log('START this.create');
    this.initPlayer();
    console.log('END   this.create');
  }

  update(time, delta) {
    //console.log('START this.update');
    if (this.dungeon==null) return;
    if (this.hasPlayerReachedStairs) {
      console.log('##> emit playerReachedStairs');
      this.socket.emit('playerReachedStairs');
      this.hasPlayerReachedStairs=false;
      return;
    }

    if (this.player==null) return
    this.player.update();

    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
    const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

    this.tilemapVisibility.setActiveRoom(playerRoom);
    //console.log('##> emit playerInput');
    this.socket.emit('playerInput', { x: this.player.x , y: this.player.y });
    //console.log('END   this.update');
  }
}

function displayPlayers(self, playerInfo, sprite) {

  //const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (sprite!='curentPlayer'){
    var player=self.player;
    if ( player == null){ 
      player = new Player(self, playerInfo.x, playerInfo.y,sprite,this.socket.id);
      player.playerId = playerInfo.playerId;
     }else{
      player.x=playerInfo.x;
      player.y=playerInfo.y;
     }
    player.update();
  }else{
    self.player.update();
  }
  //self.players.add(player);
}
