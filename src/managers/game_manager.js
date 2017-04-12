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
	gameEvent.subscribe("Checkmate", onGameOver, this);
	gameEvent.subscribe("Stalemate", onGameOver, this);
};

module.exports = GameManager;

function onGraphicsLoaded(){
	// Init managers
	this.boardManager = new BoardManager();
	this.playerManager = new PlayerManager(this.boardManager);
	this.aiManager = new AIManager(this.boardManager);

	gameEvent.fire("GameStarted");
}

function onGameOver(){
	var query = "New game? Y/N",
		choice = "",
		validAns = ["Y","N"];

	while(validAns.indexOf(choice) == -1){
		choice = prompt(query);
		console.log("Invalid choice");
	}

	if(choice == "Y"){
		this.boardManager.resetBoard();
		gameEvent.fire("GameStarted");
	}
}