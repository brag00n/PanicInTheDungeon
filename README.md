# Node PanicInTheDungeon App

A Node app built with Phaser. For demonstration purposes and a tutorial.

Node provides the RESTful API. Phaser provides the frontend and accesses the API.

## Requirements

- [Node and npm](http://nodejs.org)
- Phaser: Make sure you have your own local.

## Installation
The game requires Node and Yarn (npm) package manager. Make sure that you already have both installed on your system before trying to launch it.

Steps:
1. Clone the repository: `git clone git@github.com:brag00n/PanicInTheDungeon`
2. Run `yarn install` inside a newly created directory.
3. Start the server: `node --inspect index.js`
4. View in browser at `http://localhost:8082/`

The game can be also deployed into docker environemnt (Docker should be installed).
Steps:
1. Run `docker build --tag panicinthedungeon:1.0 .` inside the newly created directory.
2. Create and run the container 
    * `docker run -d -it --name PanicInTheDungeon.server --restart=always  -p 8082:8082 panicinthedungeon:1.0`
3. Check out the game at [http://localhost:8082](http://localhost:3000)
4. Enjoy!

Used for developement docker container could be configured to use external folders.
Steps:
1. Clone the repository into your local path E.g: `c:\opt\` for windows or `/opt` for unix
2. Run `docker build --tag panicinthedungeon:1.0.dev .` inside the newly created directory.
3. Create and run the container 
    * For Windows: `docker run -d -it --name PanicInTheDungeon.server.dev --restart=always -p 8083:8082 -v C:/opt/PanicInTheDungeon:/mnt/PanicInTheDungeon -w /mnt/PanicInTheDungeon panicinthedungeon:1.0.dev`
    * For Linux: `docker run -d -it --name PanicInTheDungeon_dev.server.dev --restart=always -p 8083:8082 -v /opt/PanicInTheDungeon:/mnt/PanicInTheDungeon -w /mnt/PanicInTheDungeon panicinthedungeon:1.0.dev`
4. Check out the game at [http://localhost:8083](http://localhost:3001)
5. Enjoy!

## Tutorial Series

This repo corresponds to the Node PanicInTheDungeon Tutorial using the links:
 * https://gamedevacademy.org/phaser-3-tutorial/
 * https://itnext.io/modular-game-worlds-in-phaser-3-tilemaps-3-procedural-dungeon-3bc19b841cd
 * https://www.npmjs.com/package/@mikewesthad/dungeon
 * https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/
 * https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-2/
 * https://opengameart.org/content/16x16-indoor-rpg-tileset-the-baseline


Happy PanicInTheDungeon-ing!
