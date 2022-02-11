(function(){
"use strict";
Game_Enemy.prototype.knsIsFieldLeft = function(){
	return BattleManager.knsFieldPosition == 1;
}

const _Game_Enemy_screenX = Game_Enemy.prototype.screenX;
Game_Enemy.prototype.screenX = function(){
	const x = _Game_Enemy_screenX.call(this);
	if (this.knsIsFieldLeft()){
		return Graphics.width - x;
	}
	return x;
}
//===========================================
// alias Sprite_Enemy
//===========================================
const _Sprite_Enemy_updatePosition = Sprite_Enemy.prototype.updatePosition;
Sprite_Enemy.prototype.updatePosition = function() {
	_Sprite_Enemy_updatePosition.call(this);
	if (this._enemy){
		if (this._enemy.knsIsFieldLeft()){
			this.scale.x = -1;
		}else{
			this.scale.x = 1;
		}
		if (this._enemy.isConfused()){
			this.scale.x *= -1;
		}
	}
};


KNS_Battlers.setCursor(Sprite_Enemy, '_enemy');
Sprite_Enemy.prototype.updatePartsTone = function(tone){
	if (this._knsToneArray.equals(tone)){
		return;
	}else{
		this._knsToneArray = tone;
	}
	const target = this._effectTarget;
	if (target) target.setBlendColor(tone);
}

})();