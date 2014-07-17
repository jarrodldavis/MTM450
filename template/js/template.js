var main = (function () {
	var STATES = {
		TITLE: 0,
		INSTRUCTIONS: 1,
		RUNNING: 2,
		GAME_OVER: 3
	};

	var TIME = {
		MILLISECONDS_PER_SECOND: 1000,
		MAX_GAME_TIME_SECONDS: 10
	};

	var KEYS = {
		13: "Enter",
		32: "Space",
		38: "Up",
		40: "Down",
		37: "Left",
		39: "Right"
	};

	var MISC = {
		DEGREE_ROTATION_PER_FRAME: 0.5
	};

	var game = {
		stage: null,
		queue: null,
		width: 500,
		height: 500,
		state: STATES.RUNNING,
		isSwitchingState: true,
		fps: 30,
		time: 0,
		startTime: 0,
		mouse: {
			x: 0,
			y: 0
		},
		keys: {},
		manifest: [
			{ src: "img/sun.png", id: "sprites.sun" },
			{ src: "img/title.png", id: "backgrounds.title" },
			{ src: "img/instructions.png", id: "backgrounds.instructions" },
			{ src: "img/game-running.png", id: "backgrounds.gameRunning" },
			{ src: "img/game-over.png", id: "backgrounds.gameOver" },
			{ src: "json/frames.json", id: "frames" }
		],
		sprites: {},
		backgrounds: {},
		text: {}
	};

	var loop = (function () {
		function titleLoop() {
			if (game.isSwitchingState) {
				game.stage.addChild(game.backgrounds.title);
				game.isSwitchingState = false;
			}
		}

		function instructionsLoop() {
			if (game.isSwitchingState) {
				game.stage.addChild(game.backgrounds.instructions);
				game.isSwitchingState = false;
			}
		}

		function runningLoop() {
			var stage = game.stage;
			var sprites = game.sprites;
			var text = game.text;

			var sun = sprites.sun;

			if (game.isSwitchingState) {
				stage.addChild(game.backgrounds.gameRunning);
				stage.addChild(sun);
				stage.addChild(text.time);
				stage.addChild(text.mouse);
				stage.addChild(text.keys);
				sun.play();
				game.isSwitchingState = false;
			}

			game.text.time.text = "Time: " + (game.time / TIME.MILLISECONDS_PER_SECOND).toFixed(1);
			game.text.mouse.text = "Mouse { X: " + game.mouse.x + ", Y: "+ game.mouse.y +" }";

			var keys = Object.keys(game.keys).filter(function(keyCode) {
				return game.keys[keyCode];
			});
			for (var i = 0; i < keys.length; i++) {
				if (KEYS[keys[i]]) {
					keys[i] = KEYS[keys[i]];
				} else {
					keys[i] = String.fromCharCode(keys[i]);
				}
			}
			game.text.keys.text = "Keys [" + keys + "]";

			if ((game.time / TIME.MILLISECONDS_PER_SECOND) >= TIME.MAX_GAME_TIME_SECONDS) {
				game.state = STATES.GAME_OVER;
			}

			sun.rotation += MISC.DEGREE_ROTATION_PER_FRAME;
		}

		function gameOverLoop() {
			if (game.isSwitchingState) {
				game.stage.addChild(game.backgrounds.gameOver);
				game.isSwitchingState = false;
			}
		}

		return function() {
			if (game.isSwitchingState) {
				game.stage.removeAllChildren();
				game.startTime = createjs.Ticker.getTime();
			}

			game.time = createjs.Ticker.getTime() - game.startTime;

			var oldState = game.state;
			switch (game.state) {
				case STATES.TITLE:
					titleLoop();
					break;
				case STATES.INSTRUCTIONS:
					instructionsLoop();
					break;
				case STATES.RUNNING:
					runningLoop();
					break;
				case STATES.GAME_OVER:
					gameOverLoop();
					break;
			}
			game.isSwitchingState = (oldState !== game.state);
			game.stage.update();
		};
	})();

	var init = (function () {
		function initCanvas() {
			var canvas = document.createElement("canvas");
			canvas.width = game.width;
			canvas.height = game.height;
			document.getElementById("game").appendChild(canvas);
			game.stage = new createjs.Stage(canvas);
		}

		var initPreload = (function () {
			function initSprites() {
				var sunSprite = new createjs.SpriteSheet({
					images: [game.queue.getResult("sprites.sun")],
					frames: game.queue.getResult("frames").sun
				});

				var sun = game.sprites.sun = new createjs.Sprite(sunSprite);
				var sunBounds = sun.getBounds();

				sun.regX = (sunBounds.width / 2);
				sun.regY = (sunBounds.height / 2);

				sun.x = (game.width / 2);
				sun.y = (game.height / 2);
			}

			function initBackgrounds() {
				function get(id) {
					return game.queue.getResult(id);
				}

				["title", "instructions", "gameRunning", "gameOver"].forEach(function(id) {
					game.backgrounds[id] = new createjs.Bitmap(get("backgrounds." + id));
				});
			}

			function initSounds() {
				console.info("No sounds initialized in initSounds().");
			}

			return function () {
				var queue = game.queue = new createjs.LoadQueue(true, "assets/");
				queue.on("complete", function () {
					initSprites();
					initSounds();
					initBackgrounds();
					createjs.Ticker.addEventListener("tick", loop);
					createjs.Ticker.setFPS(game.fps);
				});
				queue.loadManifest(game.manifest);
			};
		})();

		var initText = function() {
			var time = game.text.time = new createjs.Text("Time: 0", "20px Arial", "#FFFFFF");
			time.textAlign = "right";
			time.x = game.width - 5;
			time.y = 5;

			var mouse = game.text.mouse = new createjs.Text("Mouse { X: 0, Y: 0 }", "20px Arial", "#FFFFFF");
			mouse.textAlign = "right";
			mouse.x = game.width - 5;
			mouse.y = 30;

			var keys = game.text.keys = new createjs.Text("Keys []", "20px Arial", "#FFFFFF");
			var keyBounds = keys.getBounds();
			keys.textAlign = "right";
			keys.regY = keyBounds.height;
			keys.x = game.width - 5;
			keys.y = game.height - 5;
		};

		var initEvents = function() {
			var stage = game.stage;
			stage.on("stagemousemove", function(event) {
				game.mouse.x = event.stageX;
				game.mouse.y = event.stageY;
			});

			document.onkeydown = function(event) {
				console.info("Key '" + event.keyCode + "' down.");
				game.keys[event.keyCode] = true;
			};

			document.onkeyup = function(event) {
				console.info("Key '" + event.keyCode + "' up.");
				game.keys[event.keyCode] = false;
			};
		};

		return {
			canvas: initCanvas,
			preload: initPreload,
			text: initText,
			events: initEvents
		};
	})();

	return function () {
		init.canvas();
		init.text();
		init.preload();
		init.events();
	};
})();

document.addEventListener("DOMContentLoaded", main);
