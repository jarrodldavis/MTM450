window.game.loop.enemy = (function() {
	var $game = window.game.data;
	var $stage = window.game.stage;
	var $world = window.game.physics;
	var $STATES = window.game.constants.states;
	var $KEYS = window.game.constants.keys;
	var $MISC = window.game.constants.misc;

	var $enemies;
	var $queue = window.game.data.assets.queue;
	var widthHeight = $MISC.ENEMY_WIDTH_HEIGHT;

	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2BodyDef = Box2D.Dynamics.b2BodyDef;
	var b2Body = Box2D.Dynamics.b2Body;
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	var b2Fixture = Box2D.Dynamics.b2Fixture;
	var b2World = Box2D.Dynamics.b2World;
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
	var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

	var doIt = true;

	function createEnemy() {
		var x = Math.random() * ($game.metrics.width - widthHeight);
		var y = Math.random() * ($game.metrics.height - widthHeight);
		var enemy = {};

		var image = $queue.getResult("enemy");
		enemy.easel = new createjs.Bitmap(image);
		enemy.easel.regX = widthHeight / 2;
		enemy.easel.regY = widthHeight / 2;
		enemy.easel.x = x; // test
		enemy.easel.y = y; // test
		$stage.addChild(enemy.easel);

		enemy.velocity = { x: 10, y: 10 }; // TODO: magicnum
		enemy.status = "alive";

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

		body.userData = { role: "enemy", destroyable: true, entity: enemy }; // test

		enemy.box2d = $world.CreateBody(body);
		enemy.box2d.CreateFixture(fixture);

		enemy.update = function() {
			this.easel.rotation = this.box2d.GetAngle() * (180 / Math.PI);
			this.easel.x = this.box2d.GetWorldCenter().x * $MISC.BOX2D_SCALE;
			this.easel.y = this.box2d.GetWorldCenter().y * $MISC.BOX2D_SCALE;
		};

		return enemy;
	}

	function loopLoop() {
		$enemies = $game.enemies;

		var chance = Math.random();
		if (chance <= 0.02) {
			$enemies.push(createEnemy());
		}

		$enemies.forEach(function(enemy) {
			enemy.update();
		});
	}

	function initLoop() {
		$game = window.game.data;
	}

	function cleanupLoop() {
		$game.enemies = $game.enemies.filter(function(enemy) {
			if (enemy.status === "destroyed") {
				$world.DestroyBody(enemy.box2d);
				$stage.removeChild(enemy.easel);
				delete enemy.box2d;
				delete enemy.easel;
				return false;
			} else {
				return true;
			}
		});
	}

	function reset() {
		$game.enemies = $game.enemies.filter(function(enemy) {
			$world.DestroyBody(enemy.box2d);
			$stage.removeChild(enemy.easel);
			delete enemy.box2d;
			delete enemy.easel;
			return false;
		});
	}

	return {
		init: initLoop,
		loop: loopLoop,
		cleanup: cleanupLoop,
		reset: reset
	};
})();
