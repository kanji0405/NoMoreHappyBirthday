(function(){
//===========================================
// alias Window_BattleStatus
//===========================================
Window_BattleStatus.prototype.initialize = function() {
	var width = this.windowWidth();
	var height = this.windowHeight();
	var x = Graphics.boxWidth - width - 4;
	var y = Graphics.boxHeight - height;
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this.refresh();
	this.openness = 0;
	this.setBackgroundType(1);
};

Window_BattleStatus.prototype.standardPadding = function(){ return 12; };
Window_BattleStatus.prototype.numVisibleRows = function(){ return 4; };

Window_BattleStatus.prototype.windowWidth = function() {
	return Graphics.boxWidth - 280;
};

Window_BattleStatus.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows() + 1);
};

Window_BattleStatus.prototype.drawItem = function(index) {
	var actor = $gameParty.battleMembers()[index];
	this.drawBasicArea(this.basicAreaRect(index), actor);
	this.drawGaugeArea(this.gaugeAreaRect(index), actor);
};

Window_BattleStatus.prototype.itemRect = function(index){
	const rect = Window_Selectable.prototype.itemRect.call(this, index);
	rect.x += index * 8;
	rect.y += 24;
	rect.width -= 40;
	return rect;
};

Window_BattleStatus.prototype.gaugeAreaWidth = function(){ return 300; };

Window_BattleStatus.prototype.basicAreaRect = function(index) {
	var rect = this.itemRectForText(index);
	rect.width -= this.gaugeAreaWidth() + 15;
	return rect;
};

Window_BattleStatus.prototype.gaugeAreaRect = function(index) {
	var rect = this.itemRectForText(index);
	rect.x += rect.width - this.gaugeAreaWidth();
	rect.width = this.gaugeAreaWidth();
	return rect;
};


Window_BattleStatus.prototype.drawBasicArea = function(rect, actor) {
	this.drawActorName(actor, rect.x + 0, rect.y, 150);
	this.drawActorIcons(actor, rect.x + 156, rect.y, rect.width - 156);
};

Window_BattleStatus.prototype.drawGaugeArea = function(rect, actor){
	const gaugeX = rect.width - 8 >> 1;
	const gaugeWidth = gaugeX - 10;
	this.drawActorHp(actor, rect.x, rect.y, gaugeWidth);
	this.drawActorMp(actor, rect.x + gaugeX,  rect.y, gaugeWidth);
};

Window_BattleStatus.prototype.refreshDimmerBitmap = function() {
	if (this._dimmerSprite) {
		const bmp = this._dimmerSprite.bitmap;
		const w = Graphics.width;
		const h = this.height;
		const m = 96;
		bmp.resize(w, h);
		const padX = w-m;
		const ah = 28;
		const accent1 = '#0000ffaa';
		const accent2 = '#0000ff00';
		bmp.fillRect(0,1,padX,ah-1,accent1);
		bmp.gradientFillRect(padX,1,m,ah-1,accent1,accent2);

		const color1 = this.dimColor1();
		const color2 = this.dimColor2();
		bmp.fillRect(0,ah,padX,h,color1);
		bmp.gradientFillRect(padX,ah,m,h,color1,color2);
		this._dimmerSprite.setFrame(0, 0, w, h);
	}
};


//===========================================
// alias Scene_Battle
//===========================================
// status keep
Scene_Battle.prototype.startPartyCommandSelection = function() {
	this.refreshStatus();
	// this._statusWindow.deselect();
	this._statusWindow.open();
	this._actorCommandWindow.close();
	this._partyCommandWindow.setup();
};

Scene_Battle.prototype.stop = function() {
	Scene_Base.prototype.stop.call(this);
	if (this.needsSlowFadeOut()) {
		this.startFadeOut(this.slowFadeSpeed(), false);
	} else {
		this.startFadeOut(this.fadeSpeed(), false);
	}
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
};

Scene_Battle.prototype.updateStatusWindow = function(){
	if ($gameMessage.isBusy()) {
		this._partyCommandWindow.close();
		this._actorCommandWindow.close();
	}
};

Scene_Battle.prototype.updateWindowPositions = function(){
	this._statusWindow.x = 0;
};

})();