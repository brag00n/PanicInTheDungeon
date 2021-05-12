//import Dungeon from "@mikewesthad/dungeon";
//import Player from "./player.js";
//import TILES from "./tile-mapping.js";
//import TilemapVisibility from "./tilemap-visibility.js";

const players = {};
const _dungeon_width=500;
const _dungeon_height=500;

const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('star', 'assets/star_gold.png');
}

function create() {

  console.log('Create Dungeon Scene')

  const self = this;
  this.players = this.physics.add.group();

  self.dungeon= new Dungeon({
    width: _dungeon_width,
    height: _dungeon_height,
    doorPadding: 2,
    rooms: {
      width: { min: 7, max: 15, onlyOdd: true },
      height: { min: 7, max: 15, onlyOdd: true }
    }
  });

  this.scores = {
    blue: 0,
    red: 0
  };

  this.star = this.physics.add.image(randomPosition(700), randomPosition(500), 'star');
  this.physics.add.collider(this.players);

  this.physics.add.overlap(this.players, this.star, function (star, player) {
    if (players[player.playerId].team === 'red') {
      self.scores.red += 10;
    } else {
      self.scores.blue += 10;
    }
    self.star.setPosition(randomPosition(700), randomPosition(500));
    console.log('##> updateScore playerUpdates to user ['+socket.id+']');
    io.emit('updateScore', self.scores);
    console.log('##> starLocation playerUpdates to user ['+socket.id+']');
    io.emit('starLocation', { x: self.star.x, y: self.star.y });
  });

  io.on('connection', function (socket) {
    console.log('');
    console.log('==>#connection# New Players ['+socket.id+'] recieved');
    // create a new player and add it to our players object
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
      input: {
        left: false,
        right: false,
        up: false
      }
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the dungeon object to the new player
    console.log('##> emit newDungeon to user ['+socket.id+']');
    io.emit('newDungeon',self.dungeon, self.dungeon.rooms,self.dungeon.tiles,self.dungeon.doors);
    //io.emit('newDungeonScene', self.dungeonScene);
    //console.log('Dungeon sent to user ['+socket.id+'] dungeon.width='+self.dungeon.width );
    // send the players object to the new player
    console.log('##> emit currentPlayers to user ['+socket.id+']');
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    console.log('##> emit newPlayer to user ['+socket.id+']');
    socket.broadcast.emit('newPlayer', players[socket.id]);
    // send the star object to the new player
    console.log('##> emit starLocation to user ['+socket.id+']');
    socket.emit('starLocation', { x: self.star.x, y: self.star.y });
    // send the current scores
    console.log('##> emit updateScore to user ['+socket.id+']');
    socket.emit('updateScore', self.scores);

    socket.on('disconnect', function () {
      console.log('==>#disconnect# Players ['+socket.id+'] diconnected recieved');
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      console.log('##> emit disconnect to user ['+socket.id+']');
      io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      //console.log('==>#playerInput# Players ['+socket.id+'] sent input');
      handlePlayerInput(self, socket.id, inputData);
    });

    // when a player ReachedStairs, create a dungeon
    socket.on('playerReachedStairs', function (inputData) {
      console.log('==>#playerReachedStairs# Players ['+socket.id+'] Reached Stairs');
      self.dungeon= new Dungeon({
        width: _dungeon_width,
        height: _dungeon_height,
        doorPadding: 2,
        rooms: {
          width: { min: 7, max: 15, onlyOdd: true },
          height: { min: 7, max: 15, onlyOdd: true }
        }  
      });

      console.log('##> emit newDungeon to user ['+socket.id+']');
      io.emit('newDungeon',self.dungeon, self.dungeon.rooms,self.dungeon.tiles,self.dungeon.doors);  
    });
  });
}

function update() {
  this.players.getChildren().forEach((player) => {
    const input = players[player.playerId].input;
    if (input.left) {
      player.setAngularVelocity(-300);
    } else if (input.right) {
      player.setAngularVelocity(300);
    } else {
      player.setAngularVelocity(0);
    }

    if (input.up) {
      this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
    } else {
      player.setAcceleration(0);
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;
  });
  this.physics.world.wrap(this.players, 5);
  //console.log('##> emit playerUpdates to user ['+socket.id+']');
  io.emit('playerUpdates', players);
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      //console.log('Update player');
      players[player.playerId].input = input;
    }
  });
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  player.setDrag(100);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();
