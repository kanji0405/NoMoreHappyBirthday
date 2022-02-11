"use strict";

//===========================================
// new Spriteset_KnsResult
//===========================================
class Spriteset_KnsResult extends Sprite{
	constructor(){
		super();
		this._reward = {};
	}
	knsStart(reward){
		this._reward = reward;
		this.createElements();
	}
	createElements(){
		this._rewards.exp;
		this._rewards.gold;
		this._rewards.items.forEach(function(item) {
			$gameMessage.add(TextManager.obtainItem.format(item.name));
		});
	}
	isBusy(){
		return false;
	}
}

;(function(){
//===========================================
// alias BattleManager
//===========================================
const _BattleManager_isBusy = BattleManager.isBusy;
BattleManager.isBusy = function(){
	return this._knsResultSpriteset.isBusy() || _BattleManager_isBusy.call(this);
};

BattleManager.knsSetResultWindow = function(window){
	this._knsResultSpriteset = window;
};

const _BattleManager_processVictory = BattleManager.processVictory;
BattleManager.processVictory = function(){
	_BattleManager_processVictory.call(this);
	this._knsResultSpriteset.knsStart(this._rewards);
};

// reward
const _BattleManager_makeRewards = BattleManager.makeRewards;
BattleManager.makeRewards = function() {
	_BattleManager_makeRewards.call(this);
	this._rewards
};

BattleManager.displayRewards = function(){};

//===========================================
// alias Scene_Battle
//===========================================
const _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
Scene_Battle.prototype.createDisplayObjects = function(){
	_Scene_Battle_createDisplayObjects.call(this);
	this.knsCreateResultWindow();
};

Scene_Battle.prototype.knsCreateResultWindow = function(){
	this._knsResultSpriteset = new Spriteset_KnsResult();
	this.addChild(this._knsResultSpriteset);
	BattleManager.knsSetResultWindow(this._knsResultSpriteset);
}
})();