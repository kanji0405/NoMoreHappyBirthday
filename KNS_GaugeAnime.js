"use strict";

const KNS_GaugeAnime = {};
(function(){
//===========================================
// new KNS_GaugeAnime
//===========================================
KNS_GaugeAnime.changeValue = function(cur, old){
	const curParam = this[cur];
	const oldParam = this[old];
	const offset = Math.max(Math.abs(curParam - oldParam >> 1), 5);
	if (oldParam < curParam){
		this[old] = Math.min(oldParam + offset, curParam);
	}else if(oldParam > curParam){
		this[old] = Math.max(oldParam - offset, curParam);
	}else{
		return false;
	}
	return true;
}
//===========================================
// alias Game_Actor
//===========================================
Object.defineProperties(Game_Actor.prototype, {
	oldHp:{
		get: function(){ return this._oldHp || 0; },
		set: function(n){ this._oldHp = n || 0; },
		configuable: true,
	},
	oldMp:{
		get: function(){ return this._oldMp || 0; },
		set: function(n){ this._oldMp = n || 0; },
		configuable: true,
	},
})

Game_Actor.prototype.knsUpdateOldStatus = function(){
	let hpChanged = KNS_GaugeAnime.changeValue.call(this, '_hp', 'oldHp');
	return KNS_GaugeAnime.changeValue.call(this, '_mp', 'oldMp') || hpChanged;
}

const _Game_Actor_onBattleStart = Game_Actor.prototype.onBattleStart;
Game_Actor.prototype.onBattleStart = function(){
	$gameParty.knsSetOldStatusInit();
	_Game_Actor_onBattleStart.call(this);
}

const _Game_Actor_onBattleEnd = Game_Actor.prototype.onBattleEnd;
Game_Actor.prototype.onBattleEnd = function(){
	$gameParty.knsSetOldStatusInit();
	_Game_Actor_onBattleEnd.call(this);
}

//===========================================
// alias Game_Party
//===========================================
Game_Party.prototype.knsSetOldStatusInit = function(){
	this.members().forEach(function(actor){
		actor.oldHp = 0;
		actor.oldMp = 0;
	});
}

Game_Party.prototype.knsSetOldStatusMax = function(){
	this.members().forEach(function(actor){
		actor.oldHp = actor.hp;
		actor.oldMp = actor.mp;
	});
}

Game_Party.prototype.knsUpdateOldStatus = function(){
	let changed = false;
	this.members().forEach(function(actor){
		if (actor.knsUpdateOldStatus() == true){ changed = true; }
	});
	return changed;
}

//===========================================
// alias Window_Base
//===========================================
// gauge
Window_Base.prototype.drawActorHp = function(actor, x, y, width, needOld) {
	width = width || 186;
	const color1 = this.hpGaugeColor1();
	const color2 = this.hpGaugeColor2();
	let cur = needOld ? actor.oldHp : actor.hp;
	let max = actor.mhp;
	this.drawGauge(x, y, width, cur / (max || 1), color1, color2);
	this.changeTextColor(color2);
	this.contents.fontSize -= 4;
	this.drawText(KNS_TERMS.STATUS_PARAM_SHORT[0], x, y, 44);
	this.contents.fontSize += 4;
	this.drawCurrentAndMax(cur, max, x, y, width, this.hpColor(actor), this.normalColor());
};

Window_Base.prototype.drawActorMp = function(actor, x, y, width, needOld) {
	width = width || 186;
	const color1 = this.mpGaugeColor1();
	const color2 = this.mpGaugeColor2();
	let cur = needOld ? actor.oldMp : actor.mp;
	let max = actor.mmp;
	this.drawGauge(x, y, width, cur / (max || 1), color1, color2);
	this.changeTextColor(color2);
	this.contents.fontSize -= 4;
	this.drawText(KNS_TERMS.STATUS_PARAM_SHORT[1], x, y, 44);
	this.contents.fontSize += 4;
	this.drawCurrentAndMax(cur, max, x, y, width, this.mpColor(actor), this.normalColor());
};

Window_Base.prototype.knsUpdateRefresh = function(){
	if (this._knsUpdateTiming < this.knsUpdateMax()){
		this._knsUpdateTiming++;
		return;
	}
	this._knsUpdateTiming = 0;
	if ($gameParty.knsUpdateOldStatus()){
		this.refresh();
	}
};

Window_Base.prototype.knsUpdateMax = function(){ return 1; }

// - KNS_GaugeAnime.setAnimeWindow
KNS_GaugeAnime.setAnimeWindow = function(proto){
	const _initialize = proto.initialize;
	proto.initialize = function(){
		this._knsUpdateTiming = 0;
		_initialize.apply(this, arguments);
	}

	const _update = proto.update;
	proto.update = function(){
		_update.call(this);
		this.knsUpdateRefresh();
	}
}
//===========================================
// - apply
//===========================================
KNS_GaugeAnime.setAnimeWindow(Window_MenuStatus.prototype);
KNS_GaugeAnime.setAnimeWindow(Window_BattleStatus.prototype);
Window_MenuStatus.prototype.knsUpdateMax = function(){ return 2; }
Window_BattleStatus.prototype.knsUpdateMax = function(){ return 3; }
Window_MenuActor.prototype.knsUpdateMax = function(){ return 1; }

})();