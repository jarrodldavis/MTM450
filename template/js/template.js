var main = (function () {
	var game = {
		stage: null,
		queue: null,
		width: 500,
		height: 500,
		fps: 30,
		manifest: [
			{ src: "img/sun.png", id: "sun" },
			{ src: "json/frames.json", id: "frames" }
		],
		sprites: {}
	};

	var initPreload = (function () {
		function initSprites() {
			var sunSprite = new createjs.SpriteSheet({
				images: [game.queue.getResult("sun")],
				frames: game.queue.getResult("frames").sun
			});

			var sun = game.sprites.sun = new createjs.Sprite(sunSprite);
			var sunBounds = sun.getBounds();

			sun.regX = (sunBounds.width / 2);
			sun.regY = (sunBounds.height / 2);

			sun.x = (game.width / 2);
			sun.y = (game.height / 2);

			sun.play();
			game.stage.addChild(sun);
		}

		function initSounds() {
			console.info("No sounds initialized in initSounds().");
		}

		function loop() {
			game.sprites.sun.rotation += 0.5;
			game.stage.update();
		}

		return function () {
			var queue = game.queue = new createjs.LoadQueue(true, "assets/");
			queue.on("complete", function () {
				initSprites();
				initSounds();
				createjs.Ticker.addEventListener("tick", loop);
				createjs.Ticker.setFPS(game.fps);
			});
			queue.loadManifest(game.manifest);
		};
	})();

	function initCanvas() {
		var canvas = document.createElement("canvas");
		canvas.width = game.width;
		canvas.height = game.height;
		document.getElementById("game").appendChild(canvas);
		game.stage = new createjs.Stage(canvas);
	}

	return function () {
		initCanvas();
		initPreload();
	};
})();

document.addEventListener("DOMContentLoaded", main);
