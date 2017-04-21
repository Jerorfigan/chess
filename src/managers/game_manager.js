var BoardManager = require("./board_manager.js");
var FX = require("../fx/fx.js");
var settings = require("../settings.js");
var PlayerManager = require("./player_manager.js");
var AIManager = require("./ai_manager.js");
var gameEvent = require("../game_event.js");
var ui = require("../user_prompt.js");

var GameManager = function(){
	// Init graphics
	this.fx = new FX(onGraphicsLoaded, this);

	// Register for events
	gameEvent.subscribe("Checkmate", onGameOver, this);
	gameEvent.subscribe("Stalemate", onGameOver, this);
};

module.exports = GameManager;

function onGraphicsLoaded(){
	this.boardManager = new BoardManager();

	// Prompt user for preferred AI strength
	ui.showMenu(
		"Select AI skill level",
		[{label: "Novice", value: 1}, {label: "Intermediate", value: 2}, {label: "Expert", value: 3}],
		function(selectedSkillLevel){
			settings.aiSkillLevel = selectedSkillLevel;

			// Prompt user to select color
			ui.showMenu(
				"Select color",
				[{label: "White", value: "W"}, {label: "Black", value: "B"}],
				function(selectedColor){
					settings.humanPlayer = selectedColor;
					settings.aiPlayer = selectedColor == "W" ? "B" : "W";

					this.playerManager = new PlayerManager(this.boardManager);
					this.aiManager = new AIManager(this.boardManager);

					gameEvent.fire("GameStarted");
				},
				this
			);
		},
		this
	);
}

function onGameOver(){
	ui.showMenu(
		"New game?",
		[{label: "Yes", value: true}, {label: "No", value: false}],
		function(restartGame){
			if(restartGame){
				this.boardManager.resetBoard();
				ui.resetLog();
				gameEvent.fire("GameStarted");
			}
		},
		this
	);
}