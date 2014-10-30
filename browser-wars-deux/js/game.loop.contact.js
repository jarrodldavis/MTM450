window.game.loop.contact = (function() {

	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2BodyDef = Box2D.Dynamics.b2BodyDef;
	var b2Body = Box2D.Dynamics.b2Body;
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	var b2Fixture = Box2D.Dynamics.b2Fixture;
	var b2World = Box2D.Dynamics.b2World;
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
	var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

	function getUserData(contact) {
		var bodyA = contact.GetFixtureA().GetBody();
		var bodyB = contact.GetFixtureB().GetBody();
		return {
			a: bodyA.GetUserData(),
			b: bodyB.GetUserData(),
			aBodyType: bodyA.GetType(),
			bBodyType: bodyB.GetType()
		};
	}

	var beginContact = function(contact) {
		var $game = window.game.data;
		// Inside world.Step()
		var data = getUserData(contact),
		a = data.a,
		b = data.b;

		if (a.role === "destroyer" && b.destroyable === true) {
			b.entity.status = "destroyed";
		} else if (b.role === "destroyer" && a.destroyable === true) {
			a.entity.status = "destroyed";
		}

		if (a.role === "player" || b.role === "player") {
			if (data.aBodyType === b2Body.b2_dynamicBody && data.bBodyType === b2Body.b2_staticBody) {
				a.entity.jumping = false;
			} else if (data.aBodyType === b2Body.b2_staticBody && data.bBodyType === b2Body.b2_dynamicBody) {
				b.entity.jumping = false;
			}
		}

		var isBulletToEnemy = (a.role === "enemy" && b.role === "bullet") ||
			(a.role === "bullet" && b.role === "enemy");

		if (isBulletToEnemy) {
			a.entity.status = "destroyed";
			b.entity.status = "destroyed";
			$game.metrics.score++;
		}

		var isEnemyToPlayer = (a.role === "player" && b.role === "enemy") || (a.role === "enemy" && b.role === "player");
		if (isEnemyToPlayer) {
			if(a.role === "player") {
				b.entity.status = "destroyed";
			} else {
				a.entity.status = "destroyed";
			}
			if (!$game.player.selected.invincible && $game.metrics.health > 0) {
				$game.metrics.health -= 20;
				$game.healthBar.graphics.clear();
				$game.healthBar.graphics.beginFill("#2dbbe9").drawRect(10, 130, $game.metrics.health, 25);
			}
		}

		if (a.role === "player" && b.role === "powerup") {
			b.entity.status = "obtained";
			a.entity.invincible = true;
			$game.metrics.powerupStart = $game.metrics.time;
		} else if (b.role === "player" && a.role === "powerup") {
			a.entity.status = "obtained";
			b.entity.invincible = true;
			$game.metrics.powerupStart = $game.metrics.time;
		}
	};

	function disableSelfBulletCollision(contact) {
		// Inside world.Step()
		var data = getUserData(contact), a = data.a, b = data.b;

		var isSelfBullet = (a.role === "player" && b.role === "bullet") ||
			(a.role === "bullet" && b.role === "player");

		if (isSelfBullet) {
			contact.SetEnabled(false);
		} else {
			contact.SetEnabled(true);
		}
	}

	var preSolve = function(contact) {
		disableSelfBulletCollision(contact);
	};

	return {
		beginContact: beginContact,
		preSolve: preSolve
	}
})();
