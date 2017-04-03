var settings = require("./settings.js");
var GameManager = require("./managers/game_manager.js");

window.onload = function(){
    // Setup polyfill for window.requestAnimationFrame
    (function() {
        var lastTime = 0;

        function requestAnimPolyfill(func) {
            var currTime = (new Date()).getTime();
            var timeToWait = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { func(currTime + timeToWait); }, timeToWait);
            lastTime = currTime + timeToWait;
            return id;
        }

        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimPolyfill;
    })();

    // Setup and kick off game driver, which drives the game loop
    (function () {
        var Driver = function () {
            this.lastUpdate = 0;
            this.gameManager = new GameManager();
        };

        Driver.prototype.loop = function (now) {
            if(now - this.lastUpdate > settings.mspf){
                this.gameManager.updateGameState();
                this.gameManager.drawGameState();
                this.lastUpdate = now;
            }

            var thisObj = this;
            window.requestAnimationFrame(function(){
                Driver.prototype.loop.apply(thisObj, arguments);
            });
        };

        (new Driver).loop(0);
    }());
};