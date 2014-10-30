/**
 * Defines the game entry point.
 * This file should be included last.
 **/
"use strict";
window.game.main = (function ($init) {
	return function () {
		console.info("Starting game.");
		$init.canvas();
		$init.text();
		$init.preload();
		$init.events();
	};
})(window.game.init);

document.addEventListener("DOMContentLoaded", window.game.main);

console.info("Game entry point defined.");
