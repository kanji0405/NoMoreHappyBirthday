(function(){
//===========================================
// new KNS_BattleUICommand
//===========================================
KNS_BattleUICommand = {};

KNS_BattleUICommand.setItemWindow = function(klass){
	const _initialize = klass.prototype.initialize;
	klass.prototype.initialize = function(x, y, width, height){
		_initialize.call(this, x, y, 440, height);
		this.setBackgroundType(1);
	};

	klass.prototype.maxCols = function(){ return 2; };

	const _klass_update = klass.prototype.update;
	klass.prototype.update = function(){
		_klass_update.call(this);
		if (this.visible){
			this.x = (-12 - this.x >> 1) + this.x;
		}else{
			this.x = -480;
		}
	}
	klass.prototype.refreshDimmerBitmap = function() {
		if (this._dimmerSprite) {
			var bitmap = this._dimmerSprite.bitmap;
			var w = this.width;
			var h = this.height;
			var m = this.padding;
			var c1 = this.dimColor1();
			var c2 = this.dimColor2();
			bitmap.resize(w, h);
			bitmap.gradientFillRect(0, 0, m, h, c2, c1);
			bitmap.fillRect(m, 0, w - m * 2, h, c1);
			bitmap.gradientFillRect(w - m, 0, m, h, c1, c2);
			this._dimmerSprite.setFrame(0, 0, w, h);
		}
	};
}
//===========================================
// - apply for item/skill windows
//===========================================
KNS_BattleUICommand.setItemWindow(Window_BattleSkill);
KNS_BattleUICommand.setItemWindow(Window_BattleItem);

//===========================================
// alias Scene_Battle
//===========================================
const _Scene_Battle_create = Scene_Battle.prototype.create;
Scene_Battle.prototype.create = function(){
	_Scene_Battle_create.call(this);
	this.knsCreateCancelButton([
		this._itemWindow, this._skillWindow, this._actorWindow, this._enemyWindow,
		this._actorCommandWindow, this._knsEquipItemWindow, this._knsEquipSlotWindow
	], true);
}

// help window
Scene_Battle.prototype.createHelpWindow = function() {
    this._helpWindow = new Window_Help();
	this._helpWindow.setBackgroundType(2);
    this._helpWindow.visible = false;
    this.addWindow(this._helpWindow);

	const bmp = new Bitmap(this._helpWindow.width - 20, this._helpWindow.height);
	let pad = 96;
	let wid = bmp.width - pad;
	const color1 = this._helpWindow.dimColor1();
	const color2 = this._helpWindow.dimColor2();
	bmp.fillRect(0, 0, wid, bmp.height, color1);
	bmp.gradientFillRect(wid, 0, pad, bmp.height, color1, color2);
	this._helpWindow.addChildAt(new Sprite(bmp), 0);
};

})();