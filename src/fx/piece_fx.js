var PieceFX = function(renderer, stage){
	this.renderer = renderer;
	this.stage = stage;
};

PieceFX.prototype.drawPieces = function(boardState){
	var thisObj = this;
	PIXI.loader
  		.add("assets/img/pieces_tileset.png")
  		.load(function(){ onTilesetLoaded.call(thisObj); });
};

module.exports = PieceFX;

function onTilesetLoaded(){
	var texture = PIXI.utils.TextureCache["assets/img/pieces_tileset.png"];
	var rectangle = new PIXI.Rectangle(0, 0, 106.7, 106.5);
	texture.frame = rectangle;
	var king = new PIXI.Sprite(texture);
	king.x = 42;
	king.y = 42;
	this.stage.addChild(king);
	this.renderer.render(this.stage);
}