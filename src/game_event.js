var R = require("../lib/ramda.min.js");

var _events = {};

var gameEvent = {
	create: function(eventName){
		if(_events[eventName]) throw "Attempt to create event with duplicate key";
		_events[eventName] = {
			subscribers: []
		};
	},
	subscribe: function(eventName, callback, context){
		_events[eventName].subscribers.push({
			callback: callback,
			context: context
		});
	},
	fire: function(eventName, data){
		R.forEach(function(subscriber){
			subscriber.callback.call(subscriber.context, eventName, data);
		}, _events[eventName].subscribers);
	}
};

gameEvent.create("GameStarted");
gameEvent.create("BoardSetup");
gameEvent.create("BoardSquareSelected");
gameEvent.create("PieceSelected");
gameEvent.create("PiecesUpdated");
gameEvent.create("NextTurn");
gameEvent.create("PieceCaptured");
gameEvent.create("Checkmate");
gameEvent.create("Stalemate");
gameEvent.create("AnimatePiecesFinished");

module.exports = gameEvent;