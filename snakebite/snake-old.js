var GRID_COLS = 26, GRID_ROWS = 26, SCALAR = 20,
	FPS = 60,
	EMPTY = 0, SNAKE = 1, FRUIT = 2,
	LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3,
	//KEY_LEFT = 37, KEY_UP = 38, KEY_RIGHT = 39, KEY_DOWN = 40;
	KEY_LEFT = 65, KEY_UP = 87, KEY_RIGHT = 68, KEY_DOWN = 83;

var canvas, context, score, frames, keystate;

var grid = {
	width: null,
	height: null,
	_grid: null,
	init: function() {
		this.width = GRID_COLS;
		this.height = GRID_ROWS;
		this._grid = [];
		for (var x = 0; x < this.width; x++) {
			this._grid.push([]);
			for (var y = 0; y < this.height; y++) {
				this._grid[x].push(EMPTY);
			}
		}
	},
	set: function(val, x, y) {
		this._grid[x][y] = val;
	},
	get: function(x, y) {
		return this._grid[x][y];
	}
};

var snake = {
	direction: null,
	head: null,
	_snakeBody: [],
	init: function(dir, x, y) {
		this.direction = dir;
		this._snakeBody = [];
		this.insert(x, y);
	},
	insert: function(x, y) {
		this._snakeBody.unshift({x: x, y:y});
		this.head = this._snakeBody[0];
	},
	remove: function(x, y) {
		return this._snakeBody.pop();
	}
};

function setFood() {
	var _empty = [];
	for (var x = 0; x < grid.width; x++) {
		for (var y = 0; y < grid.height; y++) {
			if (grid.get(x, y) === EMPTY) {
				_empty.push({ x: x, y: y });
			}
		}
	}

	if (_empty.length > 0) {
		var randindex = Math.floor(Math.random() * _empty.length);
		var randpos = _empty[randindex];
		grid.set(FRUIT, randpos.x, randpos.y);
	} else {
		throw new Error("No empty space available to place fruit.");
	}
}

function update() {
	frames++;

	if (keystate[KEY_LEFT] && snake.direction !== RIGHT) {
		snake.direction = LEFT;
	}

	if (keystate[KEY_UP] && snake.direction !== DOWN) {
		snake.direction = UP;
	}

	if (keystate[KEY_RIGHT] && snake.direction !== LEFT) {
		snake.direction = RIGHT;
	}

	if (keystate[KEY_DOWN] && snake.direction !== UP) {
		snake.direction = DOWN;
	}

	if (frames % 5 === 0) {
		var newX = snake.head.x;
		var newY = snake.head.y;
		switch(snake.direction) {
			case LEFT:
				newX--;
				break;
			case UP:
				newY--;
				break;
			case RIGHT:
				newX++;
				break;
			case DOWN:
				newY++;
				break;
		}

		if (newX < 0 || newX > grid.width - 1 ||
				newY < 0 || newY > grid.height - 1 ||
				grid.get(newX, newY) == SNAKE) {
					return init();
				}

		var newPos = grid.get(newX, newY);
		var tail;

		if (newPos === FRUIT) {
			score++;
			setFood();
		} else {
			tail = snake.remove();
			grid.set(EMPTY, tail.x, tail.y);
		}

		grid.set(SNAKE, newX, newY);
		snake.insert(newX, newY);
	}
}

function draw() {
	var theWidth = canvas.width / grid.width;
	var theHeight = canvas.height / grid.height;

	for (var x = 0; x < grid.width; x++) {
		for (var y = 0; y < grid.height; y++) {
			switch(grid.get(x, y)) {
				case EMPTY:
					context.fillStyle = "#222";
					break;
				case SNAKE:
					context.fillStyle = "#5A5";
					break;
				case FRUIT:
					context.fillStyle = "#F00";
					break;
			}
			context.fillRect(x * theWidth, y * theHeight, theWidth, theHeight);
		}
	}
	context.fillStyle = "#FFF";
	context.fillText("Score: " + score, 10, 10);
}

function loop() {
	update();
	draw();
}

function init() {
	grid.init();
	frames = 0;
	score = 0;
	var snakePos = {
		x: Math.floor(GRID_COLS / 2),
		y: GRID_ROWS - 1
	};
	snake.init(UP, snakePos.x, snakePos.y);
	grid.set(SNAKE, snakePos.x, snakePos.y);
	setFood();
}

function main() {
	canvas = document.createElement("canvas");
	canvas.width = GRID_COLS * SCALAR;
	canvas.height = GRID_ROWS * SCALAR;
	context = canvas.getContext("2d");
	document.body.appendChild(canvas);

	keystate = {};

	function resetKeystate() {
		keystate[KEY_LEFT] = false;
		keystate[KEY_UP] = false;
		keystate[KEY_RIGHT] = false;
		keystate[KEY_DOWN] = false;
	}

	document.addEventListener("keydown", function(event) {
		resetKeystate();
		keystate[event.keyCode] = true;
	});

	document.addEventListener("keyup", function(event) {
		resetKeystate();
	});

	init();
	setInterval(function() { loop(); }, 1000 / FPS);
}

if (!!(window.addEventListener)) {
	window.addEventListener("DOMContentLoaded", main);
} else {
	window.attachEvent("onload", main);
}
