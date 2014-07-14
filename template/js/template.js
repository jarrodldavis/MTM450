var main = (function() {
	var game = {
		stage: null,
		queue: null,
		width: 0,
		height: 0,
		fps: 30,
		manifest: [
			{ src: "sprites.png", id: "sprites" }
		]
	};

	var initPreload = (function() {
		function initSprites() {

		}

		function initSounds() {

		}

		function startLoop() {
			createjs.Ticker.addEventListener("tick", function() { game.stage.update(); });
			createjs.Ticker.setFPS(game.fps);
		}

		return function() {
			var queue = new createjs.LoadQueue(true, "assets/");
			queue.on("complete", function() { initSprites(); initSounds(); startLoop(); });
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

	return function() {
		initCanvas();
		initPreload();
	};
})();

document.addEventListener("DOMContentLoaded", main);
