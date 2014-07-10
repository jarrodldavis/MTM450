// Jarrod Davis

var CANVAS_WIDTH = 480;
var CANVAS_HEIGHT = 320;
var STATE_TITLE = 0;
var STATE_RUNNING = 1;
var STATE_END = 2;
var COLOR_TEXT_FULLSCREEN = "#FFF";
var COLOR_TEXT_SCORE = "#000";
var COLOR_TITLE = "#11F";
var COLOR_END = "#F11";
var FPS = 30;

var canvas;
var state;
var frames = 0;
var lastActivityFrame = 0;
var enemies = [];
var enemySprite = Sprite("ie");

function init() {
	player.active = true;
  player.x = 220;
  player.y = 270;
  player.score = 0;
  player.bullets = [];
  enemies = [];
  frames = 0;
}

var player = {
	active: true,
  color: "#00A",
  score: 0,
  x: 220,
  y: 270,
  width: 32,
  height: 32,
	sprite: Sprite("chrome"),
	bullets: [],
	update: function() {
		if (this.active) {
			if ((frames % 5 === 0) && keydown.space) {
				this.shoot();
			}
			if (keydown.left) {
				this.x -= 5;
			}
			if (keydown.right) {
				this.x += 5;
			}

			this.x = this.x.clamp(0, CANVAS_WIDTH - this.width);
		}
	},
	updateBullets: function() {
		this.bullets.forEach(function(bullet) {
			bullet.update();
		});
	},
  draw: function() {
    // canvas.fillStyle = this.color;
    // canvas.fillRect(this.x, this.y, this.width, this.height);
		this.sprite.draw(canvas, this.x, this.y);
  },
	shoot: function() {
		var bulletPosition = this.midpoint();
		this.bullets.push(Bullet({
			speed: 5,
			x: bulletPosition.x,
			y: bulletPosition.y
		}));
    createjs.Sound.play("shoot");
	},
	midpoint: function() {
		return {
			x: this.x + this.width/2,
			y: this.y + this.height/2
		};
	},
	explode: function() {
		if (this.active) {
			this.active = false;
			state = STATE_END;
			createjs.Sound.play("player-explode");
		}
	}
};

function Bullet(I) {
  I.active = true;

  I.xVelocity = 0;
  I.yVelocity = -I.speed;
  I.width = 3;
  I.height = 3;
  I.color = "#000";

  I.inBounds = function() {
    return this.x >= 0 && this.x <= CANVAS_WIDTH &&
      this.y >= 0 && this.y <= CANVAS_HEIGHT;
  };

  I.draw = function() {
    canvas.fillStyle = this.color;
    canvas.fillRect(this.x, this.y, this.width, this.height);
		// this.sprite.draw(canvas, this.x, this.y);
  };

  I.update = function() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;

    this.active = this.active && this.inBounds();
  };

  return I;
}

function Enemy(I) {
  I = I || {};

  I.active = true;
  I.age = Math.floor(Math.random() * 128);

  I.color = "#A2B";

  //I.x = (CANVAS_WIDTH / 4) + (Math.random() * (CANVAS_WIDTH / 2));
	// Prevent spawning near edge (10px buffer each side)
	I.x = (Math.random() * (CANVAS_WIDTH - 20)) + 10;
  I.y = -40;
  I.xVelocity = 0;
  I.yVelocity = 2;

  I.width = 32;
  I.height = 32;

  I.inBounds = function() {
    return this.x >= -32 && this.x <= (CANVAS_WIDTH +32) &&
      this.y >= -64 && this.y <= (CANVAS_HEIGHT + 32);
  };

  I.draw = function() {
    // canvas.fillStyle = this.color;
    // canvas.fillRect(this.x, this.y, this.width, this.height);
		enemySprite.draw(canvas, this.x, this.y);
  };

  I.update = function() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;

    this.xVelocity = 3 * Math.sin(this.age * Math.PI / 64);

    this.age++;

    this.active = this.active && this.inBounds();
		if (!this.inBounds()) {
			player.score -= 5;
			lastActivityFrame = frames;
		}
  };

	I.explode = function() {
    this.active = false;
		player.score += 10;
		lastActivityFrame = frames;
		createjs.Sound.play("enemy-explode");
  };

  return I;
}

function collides(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function handleCollisions() {
  player.bullets.forEach(function(bullet) {
    enemies.forEach(function(enemy) {
      if (collides(bullet, enemy)) {
        enemy.explode();
        bullet.active = false;
      }
    });
  });

  enemies.forEach(function(enemy) {
    if (collides(enemy, player)) {
      //enemy.explode();
      player.explode();
    }
  });
}

function updateGame() {
  frames++;

	if (player.score <= -15 || (frames - lastActivityFrame >= (10 * FPS))) {
		player.explode()
	} else {

		player.update();

		player.updateBullets();

		player.bullets = player.bullets.filter(function (bullet) {
			return bullet.active;
		});

		enemies.forEach(function (enemy) {
			enemy.update();
		});

		enemies = enemies.filter(function (enemy) {
			return enemy.active;
		});

		var score = player.score + 1;
		var rand = Math.max(0.1, 0.1 * (score / 200));
		if (Math.random() < rand) {
			for (var i = Math.ceil(score / 2000); i > 0; i--) {
				enemies.push(Enemy());
			}
		}

		handleCollisions();
	}
}

function update() {
  switch (state) {
    case STATE_TITLE:
		case STATE_END:
      if (keydown.return) {
				init();
        state = STATE_RUNNING;
      }
      break;
    case STATE_RUNNING:
      updateGame();
      break;
  }
}

function drawTitle() {
  canvas.fillStyle = COLOR_TITLE;
  canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.fillStyle = COLOR_TEXT_FULLSCREEN;
  canvas.textAlign = 'center';
  canvas.font = "normal 16pt Arial";
  canvas.fillText("Browser Wars: Start", CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) - 20);
  canvas.font = "normal 13pt Arial";
  canvas.fillText("Left and Right Arrow Keys to Move. Space to Shoot.", CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) + 20);
	canvas.fillText("Enemy hit: +10 points. Enemy missed: -5 points.", CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) + 50);
  canvas.fillText("Hit Enter to Play.", CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) + 80);
}

function drawEnd() {
  canvas.fillStyle = COLOR_END;
  canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.fillStyle = COLOR_TEXT_FULLSCREEN;
  canvas.textAlign = 'center';
  canvas.font = "normal 16pt Arial";
  canvas.fillText("Game Over", CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) - 20);
  canvas.font = "normal 13pt Arial";
  canvas.fillText("Score: " + player.score, CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) + 20);
	canvas.fillText("Hit Enter to Restart.", CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2) + 50);
}

function draw() {
  canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	switch (state) {
		case STATE_TITLE:
      drawTitle();
			break;
		case STATE_RUNNING:
      canvas.fillStyle = COLOR_TEXT_SCORE;
      canvas.textAlign = 'left';
      canvas.font = "normal 12pt Arial";
      canvas.fillText("Score: " + player.score, 10, 20);
			player.bullets.forEach(function(bullet) {
				bullet.draw();
			});
			player.draw();
			enemies.forEach(function(enemy) {
				enemy.draw();
			});
			break;
		case STATE_END:
      drawEnd();
			break;
	}
}

function loadSounds() {
  createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
  createjs.Sound.alternateExtensions = ["wav"];

  createjs.Sound.registerSound({src:"sounds/shoot.mp3", id:"shoot"});
	createjs.Sound.registerSound({src:"sounds/enemy-explode.mp3", id:"enemy-explode"});
	createjs.Sound.registerSound({src:"sounds/player-explode.mp3", id:"player-explode"});
}

function setSprites() {

}

$(document).ready(function() {
	Number.prototype.clamp = function(min, max) {
		return Math.min(Math.max(this, min), max);
	};
	loadSounds();

	CANVAS_WIDTH = Math.max(CANVAS_WIDTH, $('html').width() / 2);

	var canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
	canvasElement.appendTo('main');
	canvas = canvasElement.get(0).getContext("2d");

	state = STATE_TITLE;

	setInterval(function() {
	  update();
	  draw();
	}, 1000/FPS);
});
