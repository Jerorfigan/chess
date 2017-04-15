var GameManager = require("./managers/game_manager.js");

window.onload = function(){

	// Setup request animation pollfill if needed
	function requestAnimPolyfill(func) {
        var currTime = (new Date()).getTime();
        var timeToWait = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { func(currTime + timeToWait); }, timeToWait);
        lastTime = currTime + timeToWait;
        return id;
    }

    (function() {
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimPolyfill;
        window.requestAnimationFrame = requestAnimationFrame;
    })();

    window.chess = {};
    window.chess.gameMgr = new GameManager();
};