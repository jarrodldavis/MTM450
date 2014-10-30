/**
 * Defines the game loop.
 * This file should be included after game data has been initialized.
 **/
"use strict";
/* global createjs: false */

var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

window.game.loop = (function () {
	var $game = window.game.data;
	var $gameReset = window.game.dataReset;
	var $stage = window.game.stage;
	var $world = window.game.physics;
	var $STATES = window.game.constants.states;
	var $KEYS = window.game.constants.keys;
	var $TIME = window.game.constants.time;
	var $MISC = window.game.constants.misc;
	var $LEVEL = window.game.constants.levels;

	var $loop; // Initialized later
	var $backgrounds = $game.assets.backgrounds;
	var $buttons = $game.assets.buttons.sprites;
	var $text = $game.assets.text;

	var $metrics = $game.metrics;

	var scoreToAdvance = 10;
	var platforms = [];
	var platformColor = "#000000";

	function titleLoop() {
		if ($game.isSwitchingState) {
			createjs.Sound.stop();
			createjs.Sound.play("game-start");
			$stage.addChild($backgrounds.title);
			$stage.addChild($buttons.play);
			$stage.addChild($buttons.instructions);
			$game.isSwitchingState = false;
		}
	}

	function instructionsLoop() {
		if ($game.isSwitchingState) {
			$stage.addChild($backgrounds.instructions);
			$stage.addChild($buttons.play);
			$stage.addChild($buttons.mainMenu);
			$game.isSwitchingState = false;
		}
	}

	function characterSelection() {
		var choices = $game.player.choices;
		if($game.isSwitchingState) {
			$stage.addChild($backgrounds.character);

			choices.forEach(function(choice) {
				choice.shape.x = choice.coordinates.x;
				choice.shape.y = choice.coordinates.y;
				$stage.addChild(choice.shape);
			});
			$game.isSwitchingState = false;
		}
	}

	function winScreen() {
		if($game.isSwitchingState) {
			$loop.character.reset();
			$loop.enemy.reset();

			$gameReset();
			$game = window.game.data;
			createjs.Sound.stop();
			createjs.Sound.play("game-win");

			$stage.addChild($backgrounds.winner);
			$stage.addChild($buttons.credits)
			$stage.addChild($buttons.play);
			$stage.addChild($buttons.mainMenu);
			$text.score.x = ($metrics.fullWidth / 2); // - ($text.score.getBounds().width/2);
			$text.score.y = 325; //175;
			$stage.addChild($text.score);
			$game.isSwitchingState = false;
		}
	}

	function showCredits() {
		if($game.isSwitchingState) {
			$stage.addChild($backgrounds.credits);
			$stage.addChild($buttons.play);
			$stage.addChild($buttons.mainMenu);
		}
	}
	function createBox(width, height, x, y, color, role) {
		var box = {};

		box.easel = new createjs.Shape();
		box.easel.regX = width / 2;
		box.easel.regY = height / 2;
		box.easel.graphics.beginFill(color).drawRect(0, 0, width, height); // test
		box.easel.x = x; // test
		box.easel.y = y; // test
		$stage.addChild(box.easel);

		var body = new b2BodyDef;
		body.type = b2Body.b2_staticBody;
		body.position.x = x / $MISC.BOX2D_SCALE; // test
		body.position.y = y / $MISC.BOX2D_SCALE; // test
		body.userData = { role: role, destroyable: false, entity: box }; // test

		var fixture = new b2FixtureDef;
		fixture.density = 1.0;
		fixture.friction = 0.5;
		fixture.restitution = 0.2;
		fixture.shape = new b2PolygonShape;
		fixture.shape.SetAsBox((width / $MISC.BOX2D_SCALE) / 2, (height / $MISC.BOX2D_SCALE) / 2);

		box.box2d = $world.CreateBody(body);
		box.box2d.CreateFixture(fixture);

		return box;
	}

	function createGround() {
		var width = $game.metrics.width;
		var height = 1;
		var x = $game.metrics.width / 2;
		var y = ($game.metrics.height + (height / 2));
		createBox(width, height, x, y, "transparent", "destroyer");
	}

	function createCeiling() {
		var width = $game.metrics.width;
		var height = 1;
		var x = $game.metrics.width / 2;
		var y = 0;
		createBox(width, height, x, y, "transparent", "destroyer");
	}

	function createRightEdge() {
		var height = $game.metrics.height;
		var width = 1;
		var y = $game.metrics.height / 2;
		var x = ($game.metrics.width + (width / 2));
		createBox(width, height, x, y, "transparent", "destroyer");
	}

	function createLeftEdge() {
		var height = $game.metrics.height;
		var width = 1;
		var y = $game.metrics.height / 2;
		var x = 0;
		createBox(width, height, x, y, "transparent", "destroyer");
	}

	function createRandomPlatform() {
		if (numPlatforms < 20) {
			var height = 10;
			var width = (Math.random() * 50) + 100;
			var x = Math.random() * ($game.metrics.width - width);
			var y = Math.random() * ($game.metrics.height - height);
			y += 200;
			platforms.push(createBox(width, height, x, y, platformColor, "platform"));
			numPlatforms++;
		}
	}
	function loadLevel(level, color) {
		clearLevels();
		$game.level.text = level + 1;
		var levelPlatforms = $game.levelData.allLevels[level].platforms;
		levelPlatforms.forEach(function(platform) {
			platforms.push(createBox(platform[0], platform[1], platform[2], platform[3], color, "platform"));
		});

	}
	function clearLevels() {
		platforms = platforms.filter(function(platform) {
				$world.DestroyBody(platform.box2d);
				$stage.removeChild(platform.easel);
				delete platform.box2d;
				delete platform.easel;
				return false;
			});
	}
	function updateLevel() {
		$game.state = $STATES.RUNNING;
		switch ($game.metrics.level) {
			case $LEVEL.INTRO:
				platformColor = "#f05d51";
				scoreToAdvance = 10;
				loadLevel($LEVEL.INTRO, platformColor);
				break;
			case $LEVEL.CHROME:
				platformColor = "#57d680";
				scoreToAdvance = 25;
				loadLevel($LEVEL.CHROME, platformColor);
				break;
			case $LEVEL.FIREFOX:
				platformColor = "#d75e30";
				scoreToAdvance = 45;
				loadLevel($LEVEL.FIREFOX, platformColor);
				break;
			case $LEVEL.SAFARI:
				scoreToAdvance = 65;
				platformColor = "#3faeec";
				loadLevel($LEVEL.SAFARI, platformColor);
				break;
			case $LEVEL.IE:
				scoreToAdvance = 100;
				platformColor = "#9f9bf8";
				loadLevel($LEVEL.IE, platformColor);
				break;
			case $LEVEL.WIN:
				$game.state = $STATES.WINNER;
				$game.isSwitchingState = true;
				break;
		}
		$game.metrics.level++;
		$loop.character.powerupSpawn();
	}

	function runningLoop() {
		if ($game.isSwitchingState) {
			createjs.Sound.stop('game-over');
			createjs.Sound.play('gamesound');

			$stage.addChild($game.sidebar);
			$stage.addChild($backgrounds.gameRunning);

			$game.assets.text.score.x = $metrics.width / 2;
			$game.assets.text.score.y = 5;

			$stage.addChild($text.time);
			$stage.addChild($text.mouse);
			$stage.addChild($text.score);
			$text.score.y = 5;

			$loop.character.init();
			$loop.enemy.init();

			createGround();
			createCeiling();
			createRightEdge();
			createLeftEdge();

			updateLevel();

			$game.healthBar.graphics.clear();
			$game.healthBar.graphics.beginFill("#2dbbe9").drawRect(10, 130, $game.metrics.health, 25);
			
			$game.isSwitchingState = false;
		}
		if($game.metrics.score >= scoreToAdvance) {
			$game.state = $STATES.NEW_LEVEL;
		}
		$text.score.text = "Score: " + $game.metrics.score;
		// $text.time.text = "Time: " + ($game.metrics.time / $TIME.MILLISECONDS_PER_SECOND).toFixed(1);
		// $text.mouse.text = "Mouse { X: " + $game.input.mouse.x + ", Y: "+ $game.input.mouse.y +" }";
		if($game.metrics.health <= 0) {
				$game.state = $STATES.GAME_OVER;
				$game.isSwitchingState = true;
			}
		$loop.character.loop();
		$loop.enemy.loop();
	}

	function gameOverLoop() {
		if ($game.isSwitchingState) {
			createjs.Sound.stop('gamesound');
			createjs.Sound.play('game-over');
			$stage.addChild($backgrounds.gameOver);
			$stage.addChild($buttons.play);
			$stage.addChild($buttons.mainMenu);
			$stage.addChild($text.score);
			$text.score.x = ($metrics.fullWidth / 2); // - ($text.score.getBounds().width/2);
			$text.score.y = 325; //175;

			$loop.character.reset();
			$loop.enemy.reset();

			$gameReset();
			$game = window.game.data;
			$backgrounds = $game.assets.backgrounds;
			$buttons = $game.assets.buttons.sprites;
			$text = $game.assets.text;
			$game.isSwitchingState = false;
			clearLevels();
		}
	}

	var lastStepTime = 0;

	function cleanupLoop() {
		$loop.character.cleanup();
		$loop.enemy.cleanup();
	}

	$loop = function() {
		$game = window.game.data;
		var metrics = $game.metrics;

		if ($game.isSwitchingState) {
			$stage.removeAllChildren();
			metrics.startTime = createjs.Ticker.getTime();
			$game.frames = 0;
		}
		$game.frames++;

		metrics.time = createjs.Ticker.getTime() - metrics.startTime;

		switch ($game.state) {
			case $STATES.TITLE:
				titleLoop();
				break;
			case $STATES.INSTRUCTIONS:
				instructionsLoop();
				break;
			case $STATES.RUNNING:
				runningLoop();
				break;
			case $STATES.GAME_OVER:
				gameOverLoop();
				break;
			case $STATES.CHARACTER_SELECTION:
				characterSelection();
				break;
			case $STATES.NEW_LEVEL:
				updateLevel();
				break;
			case $STATES.WINNER:
				winScreen();
				break;
			case $STATES.CREDITS:
				showCredits();
		}

		$stage.update();

		var now = createjs.Ticker.getTime();
		var delta = (now - lastStepTime);
		$world.Step(delta / 1000, 1, 1); // test
		lastStepTime = now;

		cleanupLoop();
	};

	return $loop;
})();

console.info("Game loop logic defined.");
