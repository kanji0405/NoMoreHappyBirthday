"use strict";
(function(){
//============================================
// alias Game_Battler
//============================================
Object.defineProperties(Game_Battler.prototype, {
	ctbGauge: {
		get: function(){ return this._ctbGauge || 0; },
		set: function(n){ this._ctbGauge = Math.floor(n); },
		configurable: true
	},
});

const _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
Game_Battler.prototype.onBattleStart = function() {
	_Game_Battler_onBattleStart.call(this);
	this.ctbGauge = Math.randomInt(10) * 10;
};

const _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
Game_Battler.prototype.onBattleEnd = function() {
	_Game_Battler_onBattleEnd.call(this);
	this.ctbGauge = 0;
};

const _Game_Battler_die = Game_Battler.prototype.die;
Game_Battler.prototype.die = function() {
	_Game_Battler_die.call(this);
	this.ctbGauge = 0;
};

//============================================
// alias Game_Unit
//============================================
Game_Unit.prototype.knsMaxCtbGauge = function(){
	return ($gameParty.agility() + $gameTroop.agility() << 5) || 0;
}

Game_Unit.prototype.knsSetCtbMax = function(){
	const max = $gameParty.knsMaxCtbGauge();
	this.members().forEach(function(member){ member.ctbGauge = max; }, this);
}

Game_Unit.prototype.knsProcessCtb = function(){
	const maxMembers = [];
	const max = $gameParty.knsMaxCtbGauge();
	this.members().forEach(function(member){
		if (member.ctbGauge >= max){
			maxMembers.push(member);
		}else if(member.isAlive()){
			member.ctbGauge += member.agi + (Math.randomInt(5) - 5 << 1);
		}
	}, this);
	return maxMembers;
}

//============================================
// alias Game_Troop
//============================================
const _Game_Troop_onBattleStart = Game_Troop.prototype.onBattleStart;
Game_Troop.prototype.onBattleStart = function(){
	_Game_Troop_onBattleStart.call(this);
	if (BattleManager._surprise){
		this.knsSetCtbMax();
	}
}

//============================================
// alias Game_Party
//============================================
const _Game_Party_onBattleStart = Game_Party.prototype.onBattleStart;
Game_Party.prototype.onBattleStart = function(){
	_Game_Party_onBattleStart.call(this);
	if (BattleManager._preemptive){
		this.knsSetCtbMax();
	}
}

//============================================
// alias BattleManager
//============================================
BattleManager.update = function() {
	if (!this.isBusy() && !this.updateEvent()) {
		switch (this._phase) {
		// - ctb processing
		case 'knsCtb':
			this.knsUpdateCtb();
			break;
		// original
		case 'start':
			this.startInput();
			break;
		case 'turn':
			this.updateTurn();
			break;
		case 'action':
			this.updateAction();
			break;
		case 'turnEnd':
			this.updateTurnEnd();
			break;
		case 'battleEnd':
			this.updateBattleEnd();
			break;
		}
	}
};

BattleManager.startInput = function(){
	this._phase = 'knsCtb';
}

BattleManager.knsUpdateCtb = function(){
	const maxMembers = $gameTroop.knsProcessCtb().concat($gameParty.knsProcessCtb());
	if (maxMembers.length > 0){
		this.knsStartInput(maxMembers[Math.randomInt(maxMembers.length)]);
	}
}

BattleManager.knsStartInput = function(battler){
	battler.ctbGauge = -1;
	battler.onTurnEnd();
	this._logWindow.displayAutoAffectedStatus(battler);
	this._logWindow.displayRegeneration(battler);

	this.refreshStatus();
	battler.makeActions();
	if (battler.isActor() && battler.canInput()){
		SoundManager.playOk();
		// AudioManager.playSe({name: '002-System02', volume: 100, pitch: 100, pan: 0});
		this._phase = 'input';
		this._actorIndex = battler.index();
		this._knsActorIndex = this._actorIndex; // パーティコマンドからの復帰
		battler.setActionState('inputting');
	}else{
		this.startTurn();
	}
}

BattleManager.selectPreviousCommand = function() {
	this.changeActor(-1, 'undecided');
};

BattleManager.selectNextCommand = function(){
	if (this._actorIndex == -1){
		this._actorIndex = this._knsActorIndex;
	}else{
		this.startTurn();
		this._logWindow.wait(12);
	}
};

BattleManager.makeActionOrders = function() {
	const battlers = $gameParty.members().concat($gameTroop.members());
	battlers.forEach(function(battler){ battler.makeSpeed(); });
	battlers.sort(function(a, b){ return b.speed() - a.speed(); });
	this._actionBattlers = battlers;
};

BattleManager.endTurn = function() {
	this._phase = 'turnEnd';
	this._preemptive = false;
	this._surprise = false;
	this.refreshStatus();
	if (this.isForcedTurn()){ this._turnForced = false; }
};

//============================================
// new Spriteset_KnsCtb
//============================================
class Spriteset_KnsCtb extends Sprite{
	constructor(){
		super();
		this._party = [];
		this._partyId = [];
		this._troop = [];
		this._troopId = [];
		this._iconSprites = [];
		this.bitmap = ImageManager.loadSystem('ctbGauge');//this.knsCreateBaseBitmap();
		this.x = 32;
		this.update();
		this.opacity = 0;
	}
	knsCreateBaseBitmap(){
		let wid = Graphics.width;
		let hei = 16;
		const bmp = new Bitmap(wid, hei);
		const ctx = bmp._context;
		ctx.lineWidth = 2;
		ctx.beginPath();
		hei -= 1;
		ctx.moveTo(0, 0);
		ctx.lineTo(wid, 0);
		ctx.lineTo(wid, hei);
		ctx.lineTo(0, 4);
		ctx.closePath();
		ctx.strokeStyle = 'white';
		ctx.stroke();
		const grad = ctx.createLinearGradient(0,0,wid,0);
		grad.addColorStop(0.0, 'red');
		grad.addColorStop(0.4, 'purple');
		grad.addColorStop(0.8, 'blue');
		ctx.fillStyle = grad;
		ctx.fill();
		bmp._setDirty();
		return bmp;
	}
	update(){
		super.update();
		this.knsUpdateOpacity();
		this.knsUpdateChange();
		this.knsUpdateChildren();
	}
	knsUpdateOpacity(){
		const scene = SceneManager._scene;
		const partyWindow = scene._partyCommandWindow;
		let to = 128;
		if (partyWindow && partyWindow.active){
			to = 255;
		}else if (
			$gameTroop._interpreter && $gameTroop._interpreter.isRunning()
		){
			to = $gameVariables.value(7);
		}else if (
			BattleManager._phase == 'start' ||
			BattleManager._phase == 'battleEnd'
		){
			to = 0;
		}else if (BattleManager._phase == 'knsCtb'){
			to = 255;
		}
		this.opacity = this.opacity > to ?
			Math.max(this.opacity - 8, to) : Math.min(this.opacity + 8, to);
	}
	knsIsPartyChanged(a, b){
		if (a.length != b.length){ return true; }
		for (let i = 0; i < a.length; i++){
			if (a[i] != b[i]){
				return true;
			}
		}
		return false;
	}
	knsRefresh(){
		this._iconSprites.length = 0;
		const parse = (function(battler){
			return new Sprite_KnsCtbIcon(this, battler);
		}).bind(this);
		this._iconSprites.push(...this._party.map(parse), ...this._troop.map(parse));
	}
	knsUpdateChange(){
		let party, needsRefresh = false;
		party = $gameParty.members();
		if (this.knsIsPartyChanged(party, this._party)){
			this._party = party;
			needsRefresh = true;
		}
		party = $gameTroop.members();
		if (this.knsIsPartyChanged(party, this._troop)){
			this._troop = party;
			needsRefresh = true;
		}
		if (needsRefresh){ this.knsRefresh(); };
	}
	knsForceRefresh(){
		this._party = $gameParty.members();
		this._troop = $gameTroop.members();
		this.knsRefresh();
	}
	knsUpdateChildren(){
		this.removeChildren();
		const max = $gameParty.knsMaxCtbGauge();
		this._iconSprites.forEach(function(sp){ sp.knsUpdatePosition(max); });
		this.addChild(...this._iconSprites.sort(function(a, b){ return a.x - b.x; }));
	}
}

//============================================
// new Sprite_KnsCtbIcon
//============================================
class Sprite_KnsCtbIcon extends Sprite{
	constructor(parent, battler){
		super();
		this.knsParent = parent;
		this._battler = battler;
		this._frameBitmap = ImageManager.loadSystem('ctbFrame');
		this.knsRefresh();
		this.opacity = this.knsIsHidden() ? 0 : 255;
		this.anchor.x = 0.5;
		this.y = 8;
	}
	knsRefresh(){
		this.bitmap = new Bitmap(64, 64);
		let width = 48;
		let bmp, symbol, color, x, y;
		if (this._battler.isActor()){
			this.scale.x = BattleManager.knsFieldPosition == 1 ? -1 : 1;
			bmp = ImageManager.loadCharacter(this._battler.characterName());
			x = this._battler.knsGetRoleId() * 192 + 48;
			y = 10;
			color = '#00f7';
		}else{
			bmp = ImageManager.loadEnemy(this._battler.battlerName());
			symbol = this._battler._letter;
			x = Math.max(0, bmp.width - width - 4);
			y = 10;
			color = '#f007';
		}
		const frameBmp = this._frameBitmap;
		if (bmp.width <= 1 || frameBmp.width <= 1) return;
		const ctx = this.bitmap._context;
		ctx.save();
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, frameBmp.width, frameBmp.height);
		ctx.drawImage(bmp._canvas, x, y, width, width, 13, 10, width, width);
		const fWid = frameBmp.width >> 1;
		ctx.drawImage(
			frameBmp._canvas, 0, 0, fWid, frameBmp.height,
			0, 0, fWid, frameBmp.height
		);
		ctx.globalCompositeOperation = 'destination-in';
		ctx.drawImage(
			frameBmp._canvas, fWid, 0, fWid, frameBmp.height,
			0, 0, fWid, frameBmp.height
		);

		ctx.restore();
		this.bitmap._setDirty();
		if (symbol){
			const width = 48;
			const height = 32;
			this.bitmap.fontSize = 24;
			this.bitmap.drawText(
				symbol, bmp.width-width - 2, bmp.height-height,
				width, height, 'center'
			);
		}
	}
	knsUpdatePosition(max){
		const padX = this.knsParent.x;
		let ctbGauge = this._battler.ctbGauge;
		let rate = 1;
		if (ctbGauge == -1 || ctbGauge >= max){
			ctbGauge = max;
		}else{
			rate = ctbGauge / max;
		}
		let tx = rate * (Graphics.width - padX * 2);
		this.x = (tx - this.x >> 1) + this.x;
		// this.y = rate * this.knsParent.height;
		if (this.knsIsHidden()){
			this.opacity -= 16;
		}else{
			this.opacity += 16;
		}
	}
	knsIsHidden(){
		return this._battler.isHidden() || this._battler.isDead();
	}
}

//============================================
// alias Spriteset_Battle
//============================================
const _Spriteset_Battle_createUpperLayer = Spriteset_Battle.prototype.createUpperLayer;
Spriteset_Battle.prototype.createUpperLayer = function(){
	this.knsCreateCtbGaugeSprite();
	_Spriteset_Battle_createUpperLayer.call(this);
}

Spriteset_Battle.prototype.knsCreateCtbGaugeSprite = function(){
	this._spritesetKnsCtb = new Spriteset_KnsCtb();
	this.addChild(this._spritesetKnsCtb);
}

Spriteset_Battle.prototype.knsRefreshCtbGaugeSprite = function(){
	this._spritesetKnsCtb.knsForceRefresh();
}

//============================================
// alias Scene_Battle
//============================================
const _Scene_Battle_start = Scene_Battle.prototype.start;
Scene_Battle.prototype.start = function() {
	_Scene_Battle_start.call(this);
	this._spriteset.knsRefreshCtbGaugeSprite();
};
})();