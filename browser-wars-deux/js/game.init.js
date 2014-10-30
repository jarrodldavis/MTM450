/**
 * Defines the game preloading and initialization logic.
 * This file should be included after game data and the game loop have been initialized.
 **/
"use strict";
/* global createjs: false*/
window.game.init = (function() {

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
    var $stage = window.game.stage;
    var $world = window.game.physics;
    var $loop = window.game.loop;
    var $STATES = window.game.constants.states;
    var $KEYS = window.game.constants.keys;
    var $MISC = window.game.constants.misc;
    var $TIME = window.game.constants.time;

    var $assets = $game.assets;
    var $queue = $assets.queue;
    var $metrics = $game.metrics;

    $world.SetContactListener(function() {
        var listener = new Box2D.Dynamics.b2ContactListener;
        listener.BeginContact = $loop.contact.beginContact;
        listener.PreSolve = $loop.contact.preSolve;
        return listener;
    }());

    var initCanvas = function() {
        document.getElementById("game").appendChild($stage.canvas);
    };

    var initPreload = (function() {
        function initSprites() {
            // TODO: replace with Sprite
            var chrome = $assets.sprites.character = new createjs.Bitmap($queue.getResult("sprites.chrome"));
            var chromeBounds = chrome.getBounds();

            chrome.regX = (chromeBounds.width / 2);
            chrome.regY = (chromeBounds.height / 2);

            chrome.x = ($metrics.width / 2);
            chrome.y = ($metrics.height / 2);
        }
        function loadLevelsFromJson() {
            $game.levelData = $queue.getResult("levels");
        }
        function initBackgrounds() {
            function get(id) {
                return $queue.getResult("backgrounds." + id);
            }

            ["title", "instructions", "gameRunning", "gameOver", "character", "winner", "credits"].forEach(function(id) {
                $assets.backgrounds[id] = new createjs.Bitmap(get(id));
            });
        }

        function muteSound() {
            createjs.Sound.setMute(!createjs.Sound.getMute());
        }

        function initSidebar() {
            var sidebar = $game.sidebar = new createjs.Container();

            var sidebarWidth = $metrics.fullWidth - $metrics.width;
            var healthBarWidth = sidebarWidth - 20;
            var sidebarBackground = new createjs.Shape();
            var sidebarTitle = new createjs.Text("Browser Wars", "24px Arial", "#a0a0a0");
            var levelText = new createjs.Text("Level", "20px Arial", "#a0a0a0");
            $game.level = new createjs.Text("1", "26px Arial", "#A0A0A0");
            var sidebarSubtitle = new createjs.Text("Deux", "24px Arial", "#a0a0a0");
            var health = new createjs.Text("Health", "20px Arial", "#a0a0a0");
            var healthBarContainer = new createjs.Shape();
            $game.healthBar = new createjs.Shape();
            var mute = $queue.getResult("mute");
            var bitMute = new createjs.Bitmap(mute);
            bitMute.addEventListener("click", muteSound);

            sidebarTitle.x = (sidebarWidth - sidebarTitle.getMeasuredWidth()) / 2;
            sidebarSubtitle.x = (sidebarWidth - sidebarSubtitle.getMeasuredWidth()) / 2;
            health.x = (sidebarWidth - health.getMeasuredWidth()) / 2;
            levelText.x = (sidebarWidth - levelText.getMeasuredWidth()) / 2;
            $game.level.x = (sidebarWidth - $game.level.getMeasuredWidth()) / 2;

            sidebarTitle.y = 10;
            sidebarSubtitle.y = 40;
            health.y = 100;
            levelText.y = 200;
            $game.level.y = 230;
            bitMute.x = (sidebarWidth - 20) / 2;
            bitMute.y = 400;

            sidebarBackground.graphics.beginFill("#262626").drawRect(0, 0, sidebarWidth, $metrics.height);
            healthBarContainer.graphics.beginStroke("#FFF").drawRect(10, 130, healthBarWidth, 25);
            $game.healthBar.graphics.beginFill("#2dbbe9").drawRect(10, 130, healthBarWidth, 25);

            sidebar.addChild(sidebarBackground, sidebarTitle, sidebarSubtitle, health, $game.healthBar, healthBarContainer, levelText, $game.level, bitMute);
            sidebar.x = $metrics.width;
            sidebar.y = 0;
        }

        function initButtons() {
            function get(id) {
                return $queue.getResult(id);
            }

            // Allows buttons to work
            $stage.enableMouseOver(10);

            // TODO: simplify variables
            var animations = {
                playNormal: [0, 0],
                playHover: [1, 1],
                instructionsNormal: [2, 2],
                instructionsHover: [3, 3],
                mainMenuNormal: [4, 4],
                mainMenuHover: [5, 5],
	              creditsNormal: [6, 6],
	              creditsHover: [7, 7]
            };

            var buttonSpriteSheet = new createjs.SpriteSheet({
                images: [get("buttons.all")],
                frames: get("frames").buttons,
                animations: animations
            });

            var buttonMaster = new createjs.Sprite(buttonSpriteSheet);
            var buttons = $assets.buttons;

            [
                ["play", $STATES.CHARACTER_SELECTION, {
                    x: 300,
                    y: 500
                }],
                ["instructions", $STATES.INSTRUCTIONS, {
                    x: 550,
                    y: 500
                }],
                ["mainMenu", $STATES.TITLE, {
                    x: 550,
                    y: 500
                }],
                ["credits", $STATES.CREDITS, {
                    x: 700,
                    y: 30
                }]
            ]
            // TODO: fix indent
            .forEach(function(helperInfo) {
                var buttonName = helperInfo[0];
                var buttonStateNormal = buttonName + "Normal";
                var buttonStateHover = buttonName + "Hover";
                var sprite = buttons.sprites[buttonName] = buttonMaster.clone();
                sprite.gotoAndStop(buttonStateNormal);
                sprite.x = helperInfo[2].x;
                sprite.y = helperInfo[2].y;

                buttons.helpers[buttonName] = new createjs.ButtonHelper(sprite, buttonStateNormal,
                    buttonStateHover, buttonStateHover, false);
                sprite.on("click", function() {
                    var $game = window.game.data;
                    $game.state = helperInfo[1];
                    $game.isSwitchingState = true;
                });
            });
        }

        function initPlayers() {
        var choices = $game.player.choices;
        var widthHeight = $MISC.CHARACTER_WIDTH_HEIGHT;
        var center = widthHeight / 2;

        function createSelectedListener(selected) {
            return function(event) {
                $game = window.game.data;
                $game.state = $STATES.RUNNING;
                $game.isSwitchingState = true;

                var $character = $game.player.selected = {};
                $character.jumping = false;
                $character.invincible = false;

                $character.easel = selected.shape;

                var fixture = new b2FixtureDef;
                fixture.density = 4;
                fixture.restitution = 0; // TODO: magicnum
                fixture.shape = new b2PolygonShape;
                fixture.friction = 30;
                var box = (widthHeight / $MISC.BOX2D_SCALE) / 2;
                fixture.shape.SetAsBox(box, box);
                var body = new b2BodyDef;
                body.type = b2Body.b2_dynamicBody;
                body.position.x = selected.shape.x / $MISC.BOX2D_SCALE; // test
                body.position.y = selected.shape.y / $MISC.BOX2D_SCALE; // test

                body.userData = {
                    role: "player",
                    destroyable: false,
                    entity: $character
                }; // test
                createjs.Sound.play("gamesound", {loop:-1});
                $character.box2d = $world.CreateBody(body);
                $character.box2d.CreateFixture(fixture);
                $character.box2d.SetBullet(true);
                $character.box2d.SetFixedRotation(true);

                $character.update = function() {
                    this.easel.rotation = this.box2d.GetAngle() * (180 / Math.PI);
                    this.easel.x = this.box2d.GetWorldCenter().x * $MISC.BOX2D_SCALE;
                    this.easel.y = this.box2d.GetWorldCenter().y * $MISC.BOX2D_SCALE;
                };
            }
        }

	      choices.forEach(function(choice) {
		      var image = $queue.getResult("character." + choice.name);
		      choice.shape = new createjs.Bitmap(image);
		      choice.shape.x = choice.coordinates.x;
		      choice.shape.y = choice.coordinates.y;
		      choice.shape.regX = center;
		      choice.shape.regY = center;
		      choice.shape.addEventListener("click", createSelectedListener(choice));
	      });
    }

        return function() {
            $queue.on("complete", function() {
                initSprites();
                initBackgrounds();
                loadLevelsFromJson();
                initButtons();
                initSidebar();
                initPlayers();
                createjs.Ticker.addEventListener("tick", $loop);
                createjs.Ticker.setFPS($metrics.fps);
            });
            $queue.installPlugin(createjs.Sound);
            $queue.loadManifest($assets.manifest);
        };
    })();

    var initText = function() {
        var text = $assets.text;

        // var time = text.time = new createjs.Text("Time: 0", "20px Arial", "#FFFFFF");
        // time.textAlign = "right";
        // time.x = $metrics.width - 5;
        // time.y = 5;

        // var mouse = text.mouse = new createjs.Text("Mouse { X: 0, Y: 0 }", "20px Arial", "#FFFFFF");
        // mouse.textAlign = "right";
        // mouse.x = $metrics.width - 5;
        // mouse.y = 30;

        var score = text.score = new createjs.Text("Score: 0", "20px Arial", "#909090");
        score.textAlign = "center";
        score.x = $metrics.width / 2;
        score.y = 5;
    };

    var initEvents = function() {

        $stage.on("stagemousemove", function(event) {
            var $input = window.game.data.input;
            $input.mouse.x = event.stageX;
            $input.mouse.y = event.stageY;
        });

        document.onkeydown = function(event) {
            var $input = window.game.data.input;
            $input.keys[event.keyCode] = true;
        };

        document.onkeyup = function(event) {
            var $input = window.game.data.input;
            $input.keys[event.keyCode] = false;
        };
    };

    return {
        canvas: initCanvas,
        preload: initPreload,
        text: initText,
        events: initEvents
    };
})();

console.info("Game initialization logic defined.");
