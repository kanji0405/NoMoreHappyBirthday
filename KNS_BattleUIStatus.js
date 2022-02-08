(function(){
//===========================================
// alias Window_BattleStatus
//===========================================
Window_BattleStatus.prototype.standardPadding = function(){ return 0; };
Window_BattleStatus.prototype.standardFontSize = function(){ return 23; };
Window_BattleStatus.prototype.numVisibleRows = function(){ return 2; };
Window_BattleStatus.prototype.spacing = function(){ return 1; };
Window_BattleStatus.prototype.maxCols = function(){ return 2; };
Window_BattleStatus.prototype.itemHeight = function(){ return 104; };
Window_BattleStatus.prototype.windowWidth = function(){
	return Graphics.boxWidth - 296;
};

Window_BattleStatus.prototype.fittingHeight = function(numLines) {
    return numLines * this.itemHeight() + this.standardPadding() * 2 + 1;
};

Window_BattleStatus.prototype.initialize = function() {
	var width = this.windowWidth();
	var height = this.windowHeight();
	var y = Graphics.boxHeight - height - 2;
	Window_Selectable.prototype.initialize.call(this, 0, y, width, height);
	this.refresh();
	this.setBackgroundType(1);
};

Window_BattleStatus.prototype.itemRect = function(index){
	switch(index){
		case 1: index = 2; break;
		case 2: index = 1; break;
	}
	const rect = Window_Selectable.prototype.itemRect.call(this, index);
	rect.y += Math.floor(index / this.maxCols());
	return rect;
};

Window_BattleStatus.prototype.drawItem = function(index) {
	const rect = this.itemRect(index);
	const actor = $gameParty.battleMembers()[index];
	let gaugeWidth = 160;
	const gaugeX = rect.x + rect.width - gaugeWidth;
	const nameWidth = gaugeWidth - Window_Base._iconWidth;

	const faceSize = 96;
	this.drawCircleFace(actor.faceName(), actor.faceIndex(),
		rect.x + 4, rect.y+2, faceSize, faceSize);
	// this.drawKnsCharacter(actor, rect.x + 16, rect.y, rect.width, rect.height);
	rect.x += rect.x + rect.width - gaugeX;
	this.drawActorName(actor, gaugeX, rect.y, nameWidth - 4);
	this.drawActorIcons(actor, gaugeX + nameWidth - 2, rect.y, Window_Base._iconWidth);
	rect.y += 32;
	gaugeWidth -= 4;
	this.drawActorHp(actor, gaugeX, rect.y, gaugeWidth, true);
	this.drawActorMp(actor, gaugeX, rect.y + 32, gaugeWidth, true);
};

Window_BattleStatus.prototype.drawKnsCharacter = function(actor, x, y, w, h){
	if (!actor) return;
	const bmp = ImageManager.loadCharacter(actor.characterName());
	const roleId = actor.knsGetRoleId();
	const partWidth = 48, roleWidth = 192;
	const rate = 2;
	h = Math.min(bmp.height, h);
	h += 8;
	this.contents.blt(
		bmp, partWidth + roleWidth * roleId, 0, partWidth, h / rate, 
		x, y, partWidth * rate, h);
}

Window_BattleStatus.prototype.refreshDimmerBitmap = function() {
	if (this._dimmerSprite) {
		const bmp = this._dimmerSprite.bitmap;
		const w = this.width;
		const h = this.height;
		bmp.resize(w, h);

		const ctx = bmp._context;
		ctx.clearRect(0,0,w,h);
		const max = this.maxItems();
		this._refreshCursor();
		for (let i = 0; i < max; i++){
			const rect = this.itemRect(i);
			ctx.drawImage(this._windowCursorSprite.bitmap._canvas, 
				0, 0, rect.width, rect.height, 
				rect.x, rect.y, rect.width, rect.height
			);
		}
		bmp._setDirty();
		this._dimmerSprite.setFrame(0, 0, w, h);
	}
};

Window_BattleStatus.prototype._refreshCursor = function() {
	const pad = this._padding;
	const x = this._cursorRect.x + pad - this.origin.x;
	const y = this._cursorRect.y + pad - this.origin.y;
	this._windowCursorSprite.move(Math.max(x, pad), Math.max(y, pad));
	// reset
	const width = this.itemWidth();
	if (width <= 0) return;
	const height = this.itemHeight();
	if (height <= 0) return;
	if (this._windowCursorSprite.bitmap){
		if (
			width == this._windowCursorSprite.bitmap.width &&
			height == this._windowCursorSprite.bitmap.height
		){
			return;
		}
	}

	const r = 24;
	const bmp = new Bitmap(width, height);
	const ctx = bmp._context;
	ctx.fillStyle = this.dimColor1();
	ctx.beginPath();
	ctx.moveTo(r, 0);
	ctx.lineTo(width, 0);
	ctx.lineTo(width, height);
	ctx.arc(width - r, height - r, r, 0, Math.PI / 2, false);
	ctx.lineTo(0, height);
	ctx.lineTo(0, 0);
	ctx.arc(r, r, r, Math.PI, Math.PI * (3 / 2), false);
	ctx.fill();
	bmp._setDirty();
	this._windowCursorSprite.bitmap = bmp;
	this._windowCursorSprite.setBlendColor([255,0,0,255]);
};

Window_BattleStatus.prototype._updateCursor = function() {
	this._animationCount++;
	const max = 80;
    var blinkCount = this._animationCount % max;
    var cursorOpacity = this.contentsOpacity;
	if (blinkCount < 40) {
		cursorOpacity -= blinkCount * 4;
	} else {
		cursorOpacity -= (max - blinkCount) * 4;
	}
    this._windowCursorSprite.alpha = cursorOpacity / 255;
    this._windowCursorSprite.visible = this.isOpen() && this.index() != -1;
};


//===========================================
// alias Scene_Battle
//===========================================
// status keep
const _Scene_Battle_start = Scene_Battle.prototype.start;
Scene_Battle.prototype.start = function(){
	_Scene_Battle_start.call(this);
	this._statusWindow.x = 2;
	this._statusWindow.y += 1;
	this._statusWindow.refresh();
}
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
};

})();