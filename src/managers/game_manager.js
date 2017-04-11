var BoardManager = require("./board_manager.js");
var FX = require("../fx/fx.js");
var settings = require("../settings.js");
var PlayerManager = require("./player_manager.js");
var AIManager = require("./ai_manager.js");
var gameEvent = require("../game_event.js");

var GameManager = function(){
	// Init graphics
	this.fx = new FX(onGraphicsLoaded, this);

	// Register for events
	gameEvent.subscribe("Checkmate", resetGame, this);
	gameEvent.subscribe("Stalemate", resetGame, this);
};

module.exports = GameManager;

function onGraphicsLoaded(){
	// Init managers
	this.boardManager = new BoardManager();
	this.playerManager = new PlayerManager(this.boardManager);
	this.aiManager = new AIManager(this.boardManager);

	gameEvent.fire("GameStarted");
}

function resetGame(){
	this.boardManager = new BoardManager();

	gameEvent.fire("GameStarted");
}