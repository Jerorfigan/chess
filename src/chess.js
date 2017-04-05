var GameManager = require("./managers/game_manager.js");

window.onload = function(){
    window.chess = {};
    window.chess.gameMgr = new GameManager();
};