/**
 * Defines the game loop for the playable character.
 *
 **/
"use strict";
// TODO: replace with actual sprite from initSprites/initPlayer
window.game.loop.character = (function() {

	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2BodyDef = Box2D.Dynamics.b2BodyDef;
	var b2Body = Box2D.Dynamics.b2Body;
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	var b2Fixture = Box2D.Dynamics.b2Fixture;
	var b2World = Box2D.Dynamics.b2World;
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
	var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

	var $game = window.game.data;
	var $world = window.game.physics;
	var $stage = window.game.stage;
	var $STATES = window.game.constants.states;
	var $KEYS = window.game.constants.keys;
	var $MISC = window.game.constants.misc;

	var $character; // Initialized by initLoop
	var $bullets; // Initialized by initLoop
	var velocity = { x: 0, y: $MISC.GRAVITY };
	var $keys = $game.input.keys;
	var $metrics = $game.metrics;


	var direction = 1;
	var lastBulletTime = 0;
	var isJamieMode = false;
	var isJamieKeyDown = false;

	var hitTopLeft = false;
	var hitTopRight = false;
	var hitBottomLeft = false;
	var hitBottomRight = false;

	var easterEggBuffer = 13;

	function signum(x) {
		return (x > 0) - (x < 0);
	}

	function shouldShoot() {
		var isTooSoon = ($metrics.time - lastBulletTime) < $MISC.BULLET_SHOOT_FREQUENCY;
		var keyPressed = ($keys[$KEYS.enter] || $keys[$KEYS.z]);
		var isTurning = (velocity.x !== 0 && signum(velocity.x) !== signum(direction));
		return !isTooSoon && keyPressed && !isTurning;
	}

	function createBullet(x, y) {
		var widthHeight = $MISC.BULLET_WIDTH_HEIGHT;

		var bullet = {};
		bullet.easel = new createjs.Shape();
		bullet.easel.graphics.beginFill("#000000").drawRect(0, 0, widthHeight, widthHeight);
		bullet.easel.regX = widthHeight / 2;
		bullet.easel.regY = widthHeight / 2;
		bullet.easel.x = x; // test
		bullet.easel.y = y; // test
		$stage.addChild(bullet.easel);

		bullet.velocity = { x: 10, y: 10 }; // TODO: magicnum
		bullet.status = "alive";

		var fixture = new b2FixtureDef;
		fixture.density = 1;
		fixture.restitution = 0.6; // TODO: magicnum
		fixture.shape = new b2PolygonShape;
		var box = (widthHeight / $MISC.BOX2D_SCALE) / 2;
		fixture.shape.SetAsBox(box, box);
		var body = new b2BodyDef;
		body.type = b2Body.b2_dynamicBody;
		body.position.x = x / $MISC.BOX2D_SCALE; // test
		body.position.y = y / $MISC.BOX2D_SCALE; // test

		body.userData = { role: "bullet", destroyable: true, entity: bullet }; // test

		bullet.box2d = $world.CreateBody(body);
		bullet.box2d.CreateFixture(fixture);
		bullet.box2d.ApplyImpulse(new b2Vec2($MISC.BULLET_VELOCITY_X * direction, 0), bullet.box2d.GetWorldCenter());

		bullet.update = function() {
			this.easel.rotation = this.box2d.GetAngle() * (180 / Math.PI);
			this.easel.x = this.box2d.GetWorldCenter().x * $MISC.BOX2D_SCALE;
			this.easel.y = this.box2d.GetWorldCenter().y * $MISC.BOX2D_SCALE;
		};

		return bullet;
	}

	function bulletLoop() {
		if (shouldShoot()) {
			$bullets.push(createBullet($character.easel.x, $character.easel.y));
			lastBulletTime = $metrics.time;
			createjs.Sound.play('shoot');
		}

		$bullets.forEach(function(bullet) {
			bullet.update();
		});
	}

	function createPowerup() {
		var widthHeight = 20;
		var x = Math.random() * ($game.metrics.width - widthHeight);
		var y = Math.random() * ($game.metrics.height - widthHeight);
		var powerup = {};
		powerup.easel = new createjs.Shape();
		powerup.easel.graphics.beginFill("#8dfbd8").drawRect(0, 0, widthHeight, widthHeight);
		powerup.easel.regX = widthHeight / 2;
		powerup.easel.regY = widthHeight / 2;
		powerup.easel.x = x; // test
		powerup.easel.y = y; // test
		$stage.addChild(powerup.easel);

		powerup.velocity = { x: 10, y: 10 }; // TODO: magicnum
		powerup.status = "unobtained";

		var fixture = new b2FixtureDef;
		fixture.density = 1;
		fixture.restitution = 0.6; // TODO: magicnum
		fixture.shape = new b2PolygonShape;
		var box = (widthHeight / $MISC.BOX2D_SCALE) / 2;
		fixture.shape.SetAsBox(box, box);
		var body = new b2BodyDef;
		body.type = b2Body.b2_dynamicBody;
		body.position.x = x / $MISC.BOX2D_SCALE; // test
		body.position.y = y / $MISC.BOX2D_SCALE; // test

		body.userData = { role: "powerup", destroyable: false, entity: powerup }; // test

		powerup.box2d = $world.CreateBody(body);
		powerup.box2d.CreateFixture(fixture);

		powerup.update = function() {
			this.easel.rotation = this.box2d.GetAngle() * (180 / Math.PI);
			this.easel.x = this.box2d.GetWorldCenter().x * $MISC.BOX2D_SCALE;
			this.easel.y = this.box2d.GetWorldCenter().y * $MISC.BOX2D_SCALE;
		};

		return powerup;
	}

	function powerupLoop() {
		var chance = Math.random();
		if (chance <= 0.0001 || (isJamieMode && chance <= 0.3)) {
			$game.powerups.push(createPowerup());
		}

		$game.powerups.forEach(function(powerup) {
			powerup.update();
		});

		var powerupLength = 10000;
		if (($metrics.time - $metrics.powerupStart) > powerupLength) {
			$character.invincible = false;
		}
	}

	function loopLoop() {
		$bullets = $game.player.bullets;
		var $body = $character.box2d;

		if ($keys[$KEYS.left]) {
			direction = -1;
			$body.ApplyImpulse(new b2Vec2(-10, 0), $body.GetWorldCenter());
		}

		if ($keys[$KEYS.right]) {
			direction = 1;
			$body.ApplyImpulse(new b2Vec2(10, 0), $body.GetWorldCenter());
		}

		if (($keys[$KEYS.up] || $keys[$KEYS.space]) && !$character.jumping) {
			$character.jumping = true;
			$body.ApplyImpulse(new b2Vec2(0, -75), $body.GetWorldCenter());
			createjs.Sound.play('jump');
		}

		if (!isJamieKeyDown) {
			if ($keys[$KEYS.j]) {
				isJamieMode = !isJamieMode;
				isJamieKeyDown = true;

				$game.powerups = $game.powerups.filter(function(powerup) {
					$world.DestroyBody(powerup.box2d);
					$stage.removeChild(powerup.easel);
					delete powerup.box2d;
					delete powerup.easel;
					return false;
				});
			}
		} else {
			if (!$keys[$KEYS.j]) {
				isJamieKeyDown = false;
			}
		}

		if (getXPosition() <= 10 && getYPosition() <= 10){
			// TOP LEFT
			hitTopLeft = true;
		} else if (getXPosition() >= easterEggXRight() && getYPosition() <= (0 + easterEggBuffer)){
			// TOP RIGHT
			hitTopRight = true;
		} else if (getXPosition() <= (0 + easterEggBuffer) && getYPosition() >= easterEggYBottom()){
			// BOTTOM LEFT
			hitBottomLeft = true;
		} else if (getXPosition() >= easterEggXRight()  && getYPosition() >= easterEggYBottom()){
			// BOTTOM RIGHT
			hitBottomRight = true;
		}

		// EASTER EGG
		if (hitTopLeft && hitTopRight && hitBottomLeft && hitBottomRight){
			$metrics.score += 1000;
		}

		$character.update();
		bulletLoop();
		powerupLoop();
	}

	function initLoop() {
		$game = window.game.data;
		$keys = $game.input.keys;
		$metrics = $game.metrics;

		$character = $game.player.selected;
		$stage.addChild($character.easel);

		direction = 1;
		lastBulletTime = 0;
		isJamieMode = false;
		isJamieKeyDown = false;
		hitTopLeft = false;
		hitTopRight = false;
		hitBottomLeft = false;
		hitBottomRight = false;
	}

	function cleanupLoop() {
		$game.player.bullets = $game.player.bullets.filter(function(bullet) {
			if (bullet.status === "destroyed") {
				$world.DestroyBody(bullet.box2d);
				$stage.removeChild(bullet.easel);
				delete bullet.box2d;
				delete bullet.easel;
				return false;
			} else {
				return true;
			}
		});

		$game.powerups = $game.powerups.filter(function(powerup) {
			if (powerup.status === "obtained") {
				$world.DestroyBody(powerup.box2d);
				$stage.removeChild(powerup.easel);
				delete powerup.box2d;
				delete powerup.easel;
				return false;
			} else {
				return true;
			}
		});
	}

	function reset() {
		$game.player.bullets = $game.player.bullets.filter(function(bullet) {
			$world.DestroyBody(bullet.box2d);
			$stage.removeChild(bullet.easel);
			delete bullet.box2d;
			delete bullet.easel;
			return false;
		});

		$game.powerups = $game.powerups.filter(function(powerup) {
			$world.DestroyBody(powerup.box2d);
			$stage.removeChild(powerup.easel);
			delete powerup.box2d;
			delete powerup.easel;
			return false;
		});

		$world.DestroyBody($character.box2d);
		$stage.removeChild($character.easel);
		delete $character.box2d;
		delete $character.easel;

		lastBulletTime = 0;
	}

	function powerupSpawn() {
		for (var i = 0; i < 2; i++) {
			$game.powerups.push(createPowerup());
		}
	}

	function getXPosition(){
		return $character.easel.x - $character.easel.regX;
	}

	function getYPosition(){
		return $character.easel.y - $character.easel.regY;
	}

	function getWidthHeight() {
		return 50;
	}

	function easterEggXRight() {
		return $metrics.width - getWidthHeight() - easterEggBuffer;
	}

	function easterEggYBottom() {
		return $metrics.height - getWidthHeight() - easterEggBuffer;
	}

	return {
		init: initLoop,
		loop: loopLoop,
		cleanup: cleanupLoop,
		reset: reset,
		powerupSpawn: powerupSpawn,
		getX: getXPosition,
		getY: getYPosition
	};
})();
