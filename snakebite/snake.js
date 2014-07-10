var game = (function() {

	function generateHexColor() {
		return '#' + Math.floor(Math.random() * 16777215).toString(16);
	}

	var getQueryParam = (function() {
		var params = {};
		var query = location.search.substr(1);
		var _query = query.split("&");
		for(var i = 0; i < _query.length; i++) {
			var item = _query[i].split("=");
			params[item[0]] = item[1];
		}

		return function(param, defaultValue) {
			return params[param] || defaultValue;
		};
	})();

	var GRID = {
		cols: parseInt(getQueryParam('cols', 26)),
		rows: parseInt(getQueryParam('rows', 26)),
		scalar: parseInt(getQueryParam('scalar', 26))
	};
	var FPS = 60;
	var SQUARE = { empty: 0, snake: 1, fruit: 2 };
	var COLOR = {
		0: generateHexColor(),
		1: generateHexColor(),
		2: generateHexColor(),
		text: generateHexColor(),
		background: generateHexColor()
	};
	var DIRECTION = { left: 0, up: 1, right: 2, down: 3 };
	var KEYCODE = { left: 65, up: 87, right: 68, down: 83, enter: 13, space: 32 };
	var STATE = { starting: 0, atStart: 1, running: 2, ending: 3, atEnd: 4, pausing: 5, paused: 6 };

	var canvas = null,
			context = null,

			score = null,
			highscore = null,
			frames = null,

			keystate = null,
			state = STATE.starting;

			grid = null,
			snake = null,

	grid = (function() {
		var _grid;

		function getEmptySquares() {
			var _empty = [];
			for (var x = 0; x < GRID.cols; x++) {
				for (var y = 0; y < GRID.rows; y++) {
					if (_grid[x][y] === SQUARE.empty) {
						_empty.push({ x: x, y: y });
					}
				}
			}
			return _empty;
		}

		return {
			init: function() {
				_grid = [];
				for (var x = 0; x < GRID.cols; x++) {
					_grid.push([]);
					for (var y = 0; y < GRID.rows; y++) {
						_grid[x].push(SQUARE.empty);
					}
				}
			},
			set: function(val, x, y) {
				_grid[x][y] = val;
			},
			get: function(x, y) {
				return _grid[x][y];
			},
			setFood: function() {
				var _empty = getEmptySquares();
				if (_empty.length > 0) {
					var randindex = Math.floor(Math.random() * _empty.length);
					var randpos = _empty[randindex];
					this.set(SQUARE.fruit, randpos.x, randpos.y);
				} else {
					throw new Error("No empty space available to place fruit.");
				}
			}
		};
	})();

	snake = (function() {
		var _snakeBody;
		return {
			init: function(dir, x, y) {
				this.direction = dir;
				_snakeBody = [];
				this.insert(x, y);
			},
			insert: function(x, y) {
				_snakeBody.unshift({ x: x, y: y });
			},
			remove: function() {
				return _snakeBody.pop();
			},
			getHead: function() {
				return { x: _snakeBody[0].x, y: _snakeBody[0].y };
			},
			direction: null
		};
	})();

	var update = (function() {
		function updateSnakeDirection() {
			var currentDir = snake.direction,
					newDir = currentDir;

			if (keystate[KEYCODE.left] && currentDir !== DIRECTION.right) {
				newDir = DIRECTION.left;
			} else if (keystate[KEYCODE.up] && currentDir !== DIRECTION.down) {
				newDir = DIRECTION.up;
			} else if (keystate[KEYCODE.right] && currentDir !== DIRECTION.left) {
				newDir = DIRECTION.right;
			} else if (keystate[KEYCODE.down] && currentDir !== DIRECTION.up) {
				newDir = DIRECTION.down;
			}

			snake.direction = newDir;
		}

		function calcNewSnakePosition() {
			var newHead = snake.getHead();
			switch(snake.direction) {
				case DIRECTION.left:
					newHead.x--;
					break;
				case DIRECTION.up:
					newHead.y--;
					break;
				case DIRECTION.right:
					newHead.x++;
					break;
				case DIRECTION.down:
					newHead.y++;
					break;
			}
			return newHead;
		}

		function isCollision(newX, newY) {
			var isCollisionX = (newX < 0 || newX > GRID.cols - 1);
			var isCollisionY = (newY < 0 || newY > GRID.rows - 1);
			return isCollisionX || isCollisionY || (grid.get(newX, newY) === SQUARE.snake);
		}

		function updatePositions(newX, newY) {
			var newPos = grid.get(newX, newY);
			var tail;

			if (newPos === SQUARE.fruit) {
				score++;
				grid.setFood();
			} else {
				tail = snake.remove();
				grid.set(SQUARE.empty, tail.x, tail.y);
			}

			grid.set(SQUARE.snake, newX, newY);
			snake.insert(newX, newY);
		}

		function updateGame() {
			updateSnakeDirection();
			var pos = calcNewSnakePosition();
			if (isCollision(pos.x, pos.y)) {
				state = STATE.ending;
				if (score > highscore) {
					localStorage.highscore = score;
					highscore = score;
				}
			} else {
				updatePositions(pos.x, pos.y);
			}
		}

		return function() {
			frames++;
			if (frames % 5 === 0) {
				switch (state) {
					case STATE.running:
						if (keystate[KEYCODE.space]) {
							state = STATE.pausing;
							keystate[KEYCODE.space] = false;
						} else {
							updateGame();
						}
						break;
					case STATE.atStart:
					case STATE.atEnd:
						if (keystate[KEYCODE.enter]) {
							state = STATE.running;
						}
						init();
						break;
					case STATE.paused:
						if (keystate[KEYCODE.space]) {
							state = STATE.running;
							keystate[KEYCODE.space] = false;
						}
						break;
				}
			}
		};
	})();

	var draw = (function() {

		var centerX, centerY;

		function fullScreen(clearScreen) {
			if (clearScreen) {
				context.clearRect(0, 0, canvas.width, canvas.height);
			}

			context.fillStyle = COLOR.background;
			context.fillRect(0, 0, canvas.width, canvas.height);

			context.fillStyle = COLOR.text;
			context.textAlign = 'center';
			context.font = "normal 16pt Arial";
		}

		function drawStart() {
			fullScreen(true);

			context.fillText("START", centerX, centerY - 40);
			context.fillText("Use WASD to move. Use Space to pause.", centerX, centerY);
			context.fillText("Hit Enter to start.", centerX, centerY + 40);
		}

		function drawPause() {
			context.globalAlpha = 0.2;
			fullScreen(false);
			context.globalAlpha = 1;

			context.fillText("PAUSE", centerX, centerY - 20);
			context.fillText("Hit Space to unpause.", centerX, centerY + 20);
		}

		function drawEnd() {
			fullScreen(true);

			context.fillText("GAME OVER", centerX, centerY - 40);
			context.fillText("Score: " + score, centerX, centerY);
			context.fillText("Hit Enter to restart.", centerX, centerY + 40);
		}

		function drawScore() {
			context.fillStyle = COLOR.text;
			context.font = "normal 14pt Arial";

			context.textAlign = 'left';
			context.fillText("Score: " + score, 10, 20);

			context.textAlign = 'right';
			context.fillText("High Score: " + highscore, canvas.width - 10, 20);
		}

		function drawSquares() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			var squareWidth = canvas.width / GRID.cols;
			var squareHeight = canvas.height / GRID.rows;

			for (var x = 0; x < GRID.cols; x++) {
				for (var y = 0; y < GRID.rows; y++) {
					context.fillStyle = COLOR[grid.get(x, y)];
					context.fillRect(x * squareWidth, y * squareHeight, squareWidth, squareHeight);
				}
			}
		}

		return function() {
			centerX = canvas.width / 2;
			centerY = canvas.height / 2;

			switch (state) {
				case STATE.starting:
					drawStart();
					state = STATE.atStart;
					break;
				case STATE.running:
					drawSquares();
					drawScore();
					break;
				case STATE.ending:
					drawEnd();
					state = STATE.atEnd;
					break;
				case STATE.pausing:
					drawPause();
					state = STATE.paused;
					break;
			}
		};
	})();

	function init() {
		frames = 0;
		score = 0;

		var snakePos = {
			x: Math.floor(GRID.cols / 2),
			y: GRID.rows - 1
		};
		snake.init(DIRECTION.up, snakePos.x, snakePos.y);

		grid.init();
		grid.set(SQUARE.snake, snakePos.x, snakePos.y);
		grid.setFood();
	}

	return (function() {
		keystate = {};

		function createCanvas() {
			canvas = document.createElement("canvas");
			canvas.width = GRID.cols * GRID.scalar;
			canvas.height = GRID.rows * GRID.scalar;
			context = canvas.getContext("2d");
			document.body.appendChild(canvas);
		}

		function resetKeystate() {
			for (var code in KEYCODE) {
				if (KEYCODE.hasOwnProperty(code)) {
					keystate[KEYCODE[code]] = false;
				}
			}
		}

		return function() {
			createCanvas();
			document.addEventListener("keydown", function(event) {
				resetKeystate();
				keystate[event.keyCode] = true;
			});
			document.addEventListener("keyup", function(event) {
				resetKeystate();
			});

			highscore = localStorage.highscore || 0;
			setInterval(function() { update(); draw(); }, 1000 / FPS);
		};
	})();
})();

if (!!(window.addEventListener)) {
	window.addEventListener("DOMContentLoaded", game);
} else {
	window.attachEvent("onload", game);
}
