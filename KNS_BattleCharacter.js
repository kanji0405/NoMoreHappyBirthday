$gameBattleActors = null;
//===========================================
// new Game_BattleActors(wrapper)
//===========================================
class Game_BattleActors{
	constructor(){
		this._data = {};
	}
	actor(id){
		if (!this._data[id]) this._data[id] = new Game_BattleActor(id);
		return this._data[id];
	}
	position(index){
		return Game_BattleActors.SidePosition[index];
	}
	update(){
		this.forEach(function(actor){ actor.update(); })
	}
	forEach(method, parent){
		Object.keys(this._data).forEach(function(key, i){
			method(this._data[key], i);
		}, parent || this);
	}
};

Game_BattleActors.SidePosition = [
	[546, 300, 4], [600, 375, 4], [666, 280, 4], [720, 350, 4]
];
//===========================================
// new Game_BattleActor
//===========================================
class Game_BattleActor extends Game_Character{
	//===========================================
	// properties
	//===========================================
	actorId()	{ return this._actorId; }
	actor()		{ return $gameActors.actor(this.actorId()); }

	screenX()	{ return Math.round(this._realX); }
	screenY()	{ return Math.round(this._realY - this.jumpHeight()); }
	screenZ()	{ return 5; }
	isMoving()	{ return super.isMoving() || !!this._knsMoveInfo; }

	getKnsDirection(){
		const actor = this.actor();
		if (actor){
			const index = actor.index();
			if (index != -1){
				return $gameBattleActors.position(index);
			}
		}
		return [-4, -4];
	}
	//===========================================
	// initialize
	//===========================================
	constructor(id){
		super();
		this._actorId = id;
		this._knsMoveCnt = 0;
		this._knsMoveInfo = null;
		const actor = this.actor();
		this.knsSetActor(actor, actor);
	}
	setBattlePosition(i){
		const chara = i == 0 ? $gamePlayer : $gamePlayer._followers._data[i - 1];
		this.locate(chara.screenX(), chara.screenY());
		const pos = $gameBattleActors.position(i);
		this.knsJump(pos[0], pos[1], 40);
		this.setDirection(pos[2]);
		this.updateKnsWalk();
	}
	//===========================================
	// actions
	//===========================================
	knsWalk(x, y, time){
		this._knsMoveCnt = 0;
		const oldX = this.screenX(), oldY = this.screenY();
		this._knsMoveInfo = {
			oldX: oldX,
			oldY: oldY,
			padX: x - oldX,
			padY: y - oldY,
			time: time,
			type: 'walk'
		}
	}
	knsJump(x, y, time){
		this.knsWalk(x, y, time);
		this._knsMoveInfo.type = 'jump';
	}
	//===========================================
	// update
	//===========================================
	update(){
		super.update()
		this.knsUpdateWeapon();
		this.knsUpdateMotion();
	}
	knsUpdateWeapon(){
		this._knsWeaponId = this.getActorWeaponId(this.actorId());
	}
	updateKnsWalk(){
		if (!this._knsMoveInfo){ return; }
		let moveEnd, max = this._knsMoveInfo.time;
		if (this._knsMoveInfo.type == 'jump'){
			moveEnd = Math.floor(max * 3 / 4);
			switch(++this._knsMoveCnt){
				case 1:
					this.setKnsMode('jump', true);
					break;
				case moveEnd:
					this.setKnsMode('sit', true);
					break;
				case max:
					this._knsMoveInfo = null;
					this.setKnsMode('');
					break;
			}
		}else{
			moveEnd = max - 1
			++this._knsMoveCnt;
			if (this._knsMoveCnt == max){
				this._knsMoveInfo = null;
				this.setKnsMode('');
			}else{
				switch(this._knsMoveCnt % 20){
					case 1:		this.setKnsMode('walk1'); break;
					case 11:	this.setKnsMode('walk2'); break;
				}
			}
		}
		if (this._knsMoveCnt <= moveEnd){
			const rate = this._knsMoveCnt / moveEnd;
			this.locate(
				rate * this._knsMoveInfo.padX + this._knsMoveInfo.oldX,
				rate * this._knsMoveInfo.padY + this._knsMoveInfo.oldY
			);
		}
	}
	//===========================================
	// motions
	//===========================================
	knsUpdateMotion(){
		const actor = this.actor();
		if (actor.isMotionRequested()) {
			const motion = actor.motionType();
			this.startMotion(motion);
			actor.clearMotion();
		}
	}
	knsDefaultMotion(){
		const actor = this.actor();
		if (actor){
			if (actor.isDead()){
				return 'dead';
			}else if (actor.isGuard()){
				return 'guard';
			} else if (actor == BattleManager.actor()) {
				return 'sit';
			}else if (actor.isDying()){
				return 'pinch';
			}else{
				const stateMotion = actor.stateMotionIndex();
				if (stateMotion === 3) {
					return 'pinch';
				} else if (stateMotion === 2) {
					return 'sleep';
				} else if (actor.isChanting()) {
					return 'chant';
				} else if (stateMotion === 1) {
					return 'badState';
				}
			}
		}
		return 'normal';
	}
	startMotion(type){
		if (type == 'escape'){
			if (BattleManager._escaped){
				let tx = 640;
				const pos = this.getKnsDirection();
				if (!pos[2] || pos[2] == 4){
					tx += pos[0];
					this.setDirection(6);
				}else{
					tx = pos[0] + tx * -1;
					this.setDirection(4);
				}
				this.knsWalk(
					tx, this.screenY(), 50
				);
			}else{
				this.setKnsMode('damage', false);
			}
		}else{
			this.setKnsMode(type);
		}
	}
};



//============================================
// alias Game_Actor
//============================================
// motion
Game_Actor.prototype.performAction = function(action) {
	Game_Battler.prototype.performAction.call(this, action);
	if (action.isAttack()) {
		this.performAttack();
	} else if (action.isGuard()) {
		this.requestMotion('guard');
	} else if (action.isMagicSkill()) {
		this.requestMotion('spell');
	} else if (action.isSkill()) {
		this.requestMotion('skill');
	} else if (action.isItem()) {
		this.requestMotion('item');
	}
};

Game_Actor.prototype.performAttack = function() {
	var weapons = this.weapons();
	var wtypeId = weapons[0] ? weapons[0].wtypeId : 0;
	var attackMotion = $dataSystem.attackMotions[wtypeId];
	if (attackMotion) {
		if (attackMotion.type === 0) {
			this.requestMotion('thrust');
		} else if (attackMotion.type === 1) {
			this.requestMotion('swing');
		} else if (attackMotion.type === 2) {
			this.requestMotion('missile');
		}
		this.startWeaponAnimation(attackMotion.weaponImageId);
	}
};

Game_Actor.prototype.performDamage = function() {
	Game_Battler.prototype.performDamage.call(this);
	this.requestMotion('damage');
	SoundManager.playActorDamage();
};

Game_Actor.prototype.performEvasion = function() {
	Game_Battler.prototype.performEvasion.call(this);
	this.requestMotion('evade');
};

Game_Actor.prototype.performMagicEvasion = function() {
	Game_Battler.prototype.performMagicEvasion.call(this);
	this.requestMotion('evade');
};

Game_Actor.prototype.performVictory = function() {
	if (this.canMove()) {
		this.requestMotion('victory');
	}else{
		this.requestMotion('sit');
	}
};

Game_Actor.prototype.performEscape = function() {
	this.requestMotion('escape');
};

(function(){
//===========================================
// alias Scene_Battle
//===========================================
Scene_Battle.prototype.start = function() {
	Scene_Base.prototype.start.call(this);
	BattleManager.playBattleBgm();
	BattleManager.startBattle();
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


//===========================================
// actors
//===========================================
Spriteset_Battle.prototype.createActors = function(){
	$gameBattleActors = new Game_BattleActors();
	this._actorSprites = [];
	const party = $gameParty.battleMembers(), max = $gameParty.maxBattleMembers();
	for (let i = 0; i < max; i++){
		let battleActor = null;
		const actor = party[i];
		if (actor){
			battleActor = $gameBattleActors.actor(actor.actorId());
			battleActor.setBattlePosition(i);
		}
		this._actorSprites[i] = new Sprite_KnsActor(battleActor);
		this._battleField.addChild(this._actorSprites[i]);
	}
};

//===========================================
// new Sprite_KnsActor
//===========================================
class Sprite_KnsActor extends Sprite_Character{
	//===========================================
	// - properties
	//===========================================
	isEffecting()	{ return false; };
	damageOffsetX()	{ return -32; };
	damageOffsetY()	{ return 0; };
	isMoving(){
		return this._character && this._character.isMoving();
	}
	//===========================================
	// - creating
	//===========================================
	constructor(character){
		super(character);
		this.createStateSprite();
		if (this._character){
			this._stateSprite.setup(this._character.actor());
		}
	}
	createStateSprite() {
		this._stateSprite = new Sprite_StateOverlay();
		this.addChild(this._stateSprite);
	};
	initMembers(){
		super.initMembers();
		this._damages = [];
		this._selectionEffectCount = 0;
	};
	//===========================================
	// - starting
	//===========================================
	setBattler(actor){
		let character = null;
		if (actor){
			character = $gameBattleActors.actor(actor.actorId());
		}
		if (character != this._character){
			this._character = character;
			this._stateSprite.setup(actor);
			this.addChild(this._stateSprite);
		}
	}
	//===========================================
	// - update
	//===========================================
	update() {
		super.update();
		if (this._character){
			this.updateDamagePopup();
			this.updateSelectionEffect();
		}
	};
	//===========================================
	// - damage
	//===========================================
	updateDamagePopup(){
		this.setupDamagePopup();
		if (this._damages.length > 0) {
			for (var i = 0; i < this._damages.length; i++) {
				this._damages[i].update();
			}
			if (!this._damages[0].isPlaying()) {
				this.parent.removeChild(this._damages[0]);
				this._damages.shift();
			}
		}
	};
	setupDamagePopup() {
		const actor = this._character.actor();
		if (actor.isDamagePopupRequested()) {
			let sprite = new Sprite_Damage();
			sprite.x = this.x + this.damageOffsetX();
			sprite.y = this.y + this.damageOffsetY();
			sprite.setup(actor);
			this._damages.push(sprite);
			this.parent.addChild(sprite);
			actor.clearDamagePopup();
			actor.clearResult();
		}
	};
	//===========================================
	// - effect
	//===========================================
	updateSelectionEffect() {
		const actor = this._character.actor();
		if (actor.isSelected()) {
			this._selectionEffectCount++;
			if (this._selectionEffectCount % 30 < 15) {
				this.updatePartsTone([255, 255, 255, 128]);
			} else {
				this.updatePartsTone([0, 0, 0, 0]);
			}
		} else if (this._selectionEffectCount > 0) {
			this._selectionEffectCount = 0;
			this.updatePartsTone([0, 0, 0, 0]);
		}
	};
	updatePartsTone(tone){
		function remove(parent){
			const children = parent.children;
			for (let i = 0; i < children.length; i++){
				const child = children[i];
				if (child.isSpriteKnsCharacter){
					remove(child);
					child.setBlendColor(tone);
				}
			}
		}
		remove(this);
	}

	setupAnimation() {
		if (!this._character) return;
		const actor = this._character.actor();
		while (actor.isAnimationRequested()) {
			var data = actor.shiftAnimation();
			var animation = $dataAnimations[data.animationId];
			var mirror = data.mirror;
			var delay = animation.position === 3 ? 0 : data.delay;
			this.startAnimation(animation, mirror, delay);
		}
	};

}
})();