var settings = {

	// General Graphics

	fps: 30, 					           				// frames per second
	spf: 1/30, 					           				// seconds per frame
	fpms: 30/1000, 				           				// frames per millisecond
	mspf: 1000/30, 				           				// milliseconds per frame 
	canvasWidth: 600,                      				// in px
	canvasHeight: 600,                     				// in px

	// Game board

	boardSqrBorderSize: 5,                 				// in px
	boardSqrBorderColor: 0x000000,
	boardSqrWhiteColor: 0xFFFFFF,
	boardSqrBlackColor: 0x666666,
	boardSqrHighlightColor: 0xa0f2ff,
	boardSqrHighlightColorForSelectedPiece: 0xfff760,

	// Game settings

	humanPlayer: "W",
	aiPlayer: "B"

};

module.exports = settings;