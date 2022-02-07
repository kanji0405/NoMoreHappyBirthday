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

Window_BattleStatus.prototype.itemRect = function(index){
	const rect = Window_Selectable.prototype.itemRect.call(this, index);
	rect.y += 24;
	return rect;
};

Window_BattleStatus.prototype.windowWidth = function() {
	return Graphics.boxWidth - 320;
};

Window_BattleStatus.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows() + 1);
};

Window_BattleStatus.prototype.drawItem = function(index) {
	var actor = $gameParty.battleMembers()[index];
	this.drawBasicArea(this.basicAreaRect(index), actor);
	this.drawGaugeArea(this.gaugeAreaRect(index), actor);
};

Window_BattleStatus.prototype.gaugeAreaWidth = function(){ return 330; };
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

Window_BattleStatus.prototype.drawGaugeArea = function(rect, actor) {
	this.drawActorHp(actor, rect.x + 0, rect.y, 201);
	this.drawActorMp(actor, rect.x + 216,  rect.y, 114);
};

Window_BattleStatus.prototype.refreshDimmerBitmap = function() {
	if (this._dimmerSprite) {
		const bmp = this._dimmerSprite.bitmap;
		const w = this.width;
		const h = this.height;
		bmp.resize(w, h);
		bmp.knsDownerGradient(0, 0, w, h, 24, this.dimColor1(), this.dimColor2());
		this._dimmerSprite.setFrame(0, 0, w, h);
		this._dimmerSprite.scale.x = 2;
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