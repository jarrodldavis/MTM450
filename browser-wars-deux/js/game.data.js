/**
 * Sets up the game name space and initializes constants and game data.
 * This file should be included before any other game files, but after CreateJS and any helpers.
 **/
"use strict";

window.game = {};

window.game.constants = (function() {
	var STATES = {
		TITLE: 0,
		INSTRUCTIONS: 1,
		RUNNING: 2,
		GAME_OVER: 3,
		CHARACTER_SELECTION: 4,
		NEW_LEVEL: 5,
		WINNER: 6
	};

	var TIME = {
		MILLISECONDS_PER_SECOND: 1000,
		MAX_GAME_TIME_SECONDS: 10
	};

	var KEYS = {
		enter: 13,
		space: 32,
		up: 38,
		down: 40,
		left: 37,
		right: 39,
		z: 90,
		j: 74
	};

	var MISC = {
		CHARACTER_ACCELERATION_X: 1,
		CHARACTER_MAX_VELOCITY_X: 10,
		CHARACTER_JUMP_VELOCITY: -15,
		CHARACTER_WIDTH_HEIGHT: 50,
		BULLET_SHOOT_FREQUENCY: 150,
		BULLET_VELOCITY_X: 10,
		BULLET_WIDTH_HEIGHT: 10,
		ENEMY_WIDTH_HEIGHT: 25,
		BOX2D_SCALE: 30,
		GRAVITY: 12
	};

	var LEVELS = {
		INTRO: 0,
		CHROME: 1,
		FIREFOX: 2,
		SAFARI: 3,
		IE: 4,
		WIN: 5
	};

	return {
		states: STATES,
		time: TIME,
		keys: KEYS,
		misc: MISC,
		levels: LEVELS
	};
})();

window.game.data = {
	sidebar: {},
	levelData: {},
	healthBar: {},
	level: {},
	state: window.game.constants.states.TITLE,
	player: {
		choices: [ // Might go into preload later
			{
				"name": "firefox",
				"coordinates": { "x": 600, "y": 360 },
				"shape": null
			},
			{
				"name": "ie",
				"coordinates": { "x": 450, "y": 360 },
				"shape": null
			},
			{
				"name": "chrome",
				"coordinates": { "x": 150, "y": 360 },
				"shape": null
			},
			{
				"name": "safari",
				"coordinates": { "x": 300, "y": 360 },
				"shape": null
			}
		]
	},
	assets: {
		manifest: [
			{ src: "img/chrome.png", id: "sprites.chrome" },
			{ src: "img/title.jpg", id: "backgrounds.title" },
			{ src: "img/instructions.jpg", id: "backgrounds.instructions" },
			{ src: "img/game-running.jpg", id: "backgrounds.gameRunning" },
			{ src: "img/game-over.jpg", id: "backgrounds.gameOver" },
			{ src: "img/character.png", id: "backgrounds.character"},
			{ src: "img/winner.jpg", id: "backgrounds.winner" },
			{ src: "img/credits.jpg", id: "backgrounds.credits" },
			{ src: "img/buttons.png", id: "buttons.all" },
			{ src: "img/mute.png", id: "mute" },
			{ src: "img/enemy.png", id: "enemy"},
			{ src: "img/ie.png", id: "character.ie"},
			{ src: "img/chrome.png", id: "character.chrome"},
			{ src: "img/safari.png", id: "character.safari"},
			{ src: "img/firefox.png", id: "character.firefox"},
			{ src: "json/frames.json", id: "frames" },
			{ src: "json/levels.json", id: "levels" },
			{ src: "audio/saltandpepper.mp3", id: "gamesound" },
			{ src: "audio/jump.wav", id: "jump" },
			{ src: "audio/shoot.mp3", id: "shoot" },
			{ src: "audio/game-over.wav", id: "game-over"},
			{ src: "audio/game-win.wav", id: "game-win" },
			{ src: "audio/start.wav", id: "game-start"}
		],
		queue: new createjs.LoadQueue(true, "assets/"),
		sprites: {},
		backgrounds: {},
		text: {},
		buttons: {
			sprites: {},
			helpers: {}
		}
	}
};

window.game.dataReset = function() {
	window.game.data = {
		sidebar: window.game.data.sidebar,
		healthBar: window.game.data.healthBar,
		level: window.game.data.level,
		state: window.game.data.state,
		levelData: window.game.data.levelData,
		isSwitchingState: true,
		metrics: {
			fullWidth: 1000,
			width: 800,
			height: 600,
			score: 0,
			health: 180,
			fps: 60,
			time: 0,
			startTime: 0,
			powerupStart: 0,
			level: window.game.constants.levels.INTRO
		},
		input: {
			mouse: {
				x: 0,
				y: 0
			},
			keys: {}
		},
		player: {
			choices: window.game.data.player.choices,
			selected: {},
			bullets: []
		},
		enemies: [],
		powerups: [],
		assets: window.game.data.assets
	};
};

window.game.dataReset();

// Initialize stage early to allow immediate use
// Canvas is not added to page until DOMContentLoaded (see game.js and initCanvas() in game.init.js)
window.game.stage = (function(metrics) {
	var canvas = document.createElement("canvas");
	canvas.width = metrics.fullWidth;
	canvas.height = metrics.height;
	return new createjs.Stage(canvas);
})(window.game.data.metrics);

window.game.physics = (function() {
	var gravity = new Box2D.Common.Math.b2Vec2(0, 9.8);
	var world = new Box2D.Dynamics.b2World(gravity, true); // test
	return world;
})();

console.info("Game constants and data initialized.");
