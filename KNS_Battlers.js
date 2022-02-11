"use strict";
//============================================
// new KNS_Battlers
//============================================
const KNS_Battlers = {};
KNS_Battlers.setCursor = function(klass, name){
	klass.KNS_SELECT_MAX = 80;
	klass.KNS_SELECT_MATH = Math.PI / klass.KNS_SELECT_MAX;
	klass.KNS_INIT_TONE = [0, 0, 0, 0];

	const _klass_initialize = klass.prototype.initialize;
	klass.prototype.initialize = function(){
		this._knsIsBattler = true;
		this.knsCreateArrow();
		_klass_initialize.apply(this, arguments);
	}
	klass.prototype.knsCreateArrow = function(){
		this._knsToneArray = klass.KNS_INIT_TONE;
		this._knsArrowSprite = new Sprite(ImageManager.loadSystem('BattleArrow'));
		this._knsArrowSprite.anchor.x = 0.5;
		this._knsArrowSprite.anchor.y = 1;
	}
	klass.prototype.updateSelectionEffect = function(){
		if (this._battler && this._battler.isSelected()) {
			this._knsArrowSprite.visible = true;
			this._selectionEffectCount = (this._selectionEffectCount + 1) % klass.KNS_SELECT_MAX;
			this._knsUpdateArrow();
		} else {
			this._selectionEffectCount = 0;
			this._knsArrowSprite.visible = false;
			this.updatePartsTone(klass.KNS_INIT_TONE);
		}
	};
	klass.prototype._knsUpdateArrow = function(){
		const rate = this._selectionEffectCount * klass.KNS_SELECT_MATH;
		// select
		const tone = (32 + 80 * Math.sin(rate * 2) >> 3) << 3;
		this.updatePartsTone([255, 255, 255, tone]);
		this._knsArrowSprite.y = -(96 + 2 * Math.sin(rate));
		// arrow
		this._knsArrowSprite.x = 0;
		this._knsArrowSprite.rotation = -this.rotation;
		if (this.children.length != 1 + this.children.indexOf(this._knsArrowSprite)){
			this.addChild(this._knsArrowSprite);
		}
	}
}

;(function(){
//============================================
// alias BattleManager
//============================================
BattleManager.RE_BATTLE_FIELD_POS = /^<field\s*:\s*(\d+)>/i;
const _BattleManager_setup = BattleManager.setup;
BattleManager.setup = function(){
	_BattleManager_setup.apply(this, arguments);
	const troop = $gameTroop.troop();
	if (troop){
		if (BattleManager.RE_BATTLE_FIELD_POS.test(troop.name)){
			BattleManager.knsFieldPosition = Math.floor(RegExp.$1);
		}else{
			BattleManager.knsFieldPosition = 
				$gamePlayer.screenX() < (Graphics.width >> 1) ? 1 : 0;
		}
	}else{
		BattleManager.knsFieldPosition = 0;
	}
}

//============================================
// alias Sprite_Damage
//============================================
Sprite_Damage.prototype.createDigits = function(baseRow, value) {
	var string = Math.abs(value).toString();
	var row = baseRow + (value < 0 ? 1 : 0);
	var w = this.digitWidth();
	var h = this.digitHeight();
	for (var i = 0; i < string.length; i++) {
		var sprite = this.createChildSprite();
		var n = Number(string[i]);
		sprite.setFrame(n * w, row * h, w, h);
		sprite.x = (i - (string.length - 1) / 2) * w;
		sprite.dy = i * -3 - i;
	}
};

//===========================================
// alias Scene_Battle
//===========================================
const _Scene_Battle_start = Scene_Battle.prototype.start;
Scene_Battle.prototype.start = function() {
	const old = this.startFadeIn;
	this.startFadeIn = function(){}
	_Scene_Battle_start.call(this);
	this.startFadeIn = old;
};

//===========================================
// alias Spriteset_Battle
//===========================================
const _Spriteset_Battle_createBattleField = Spriteset_Battle.prototype.createBattleField;
Spriteset_Battle.prototype.createBattleField = function() {
	_Spriteset_Battle_createBattleField.call(this);
	this._knsFadeInCnt = 0;
};

Spriteset_Battle.prototype.getKnsFadeInMax = function(){
	return 60;
}

// update
const _Spriteset_Battle_update = Spriteset_Battle.prototype.update;
Spriteset_Battle.prototype.update = function() {
    _Spriteset_Battle_update.call(this);
	$gameBattleActors.update();
    this.updateKnsFadeIn();
	this.updateKnsZIndex();
};

Spriteset_Battle.prototype.updateKnsFadeIn = function(){
	if (this._knsFadeInCnt < this.getKnsFadeInMax()){
		this._knsFadeInCnt++;
		this.updateKnsBackGroundFadeIn();
	}
}

Spriteset_Battle.prototype.updateKnsBackGroundFadeIn = function(){
	const rate = this._knsFadeInCnt / this.getKnsFadeInMax();
	this._back1Sprite.opacity = 
	this._back2Sprite.opacity = rate * 255;
}

Spriteset_Battle.prototype.updateKnsZIndex = function(){
	let index = this._battleField.children.findIndex(function(sp){
		return sp._knsIsBattler;
	});
	if (index != -1){
		const concat = this._actorSprites.concat(this._enemySprites);
		this._battleField.removeChild(...concat);
		concat.sort(function(a, b){ return b.y - a.y; }).forEach(
			function(sp){ this._battleField.addChildAt(sp, index); }, this);
	}
};

})();