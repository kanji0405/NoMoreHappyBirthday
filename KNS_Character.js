"use strict";
//=========================================================
// new Sprite_KnsBodyBase
//=========================================================
class Sprite_KnsBodyBase extends Sprite{
	constructor(bitmap, partType){
		super(bitmap);
		this._partType = partType;
		this._knsRoleId = 0;
		this.isSpriteKnsCharacter = true;
		this.setFrame(...this.partRect());
		this.setKnsPosition();
	}
	setKnsPosition(){}
	partRect(){ return [0,0,0,0]; }
	roleX(){ return this._knsRoleId * 192; }

	setKnsActor(chara, angle){
		if (chara){
			if (this._knsRoleId != chara._knsRoleId){
				this._knsRoleId = chara._knsRoleId;
				this.setFrame(...this.partRect());
			}
		}
		let rotate = angle * KNS_Pose.toRadian;
		if (this.parent && this.parent.isSpriteKnsCharacter){
			rotate -= this.parent.rotation;
		}
		this.rotation = rotate;
	}
}

//=========================================================
// new Sprite_KnsBody < Sprite_KnsBodyBase
//=========================================================
class Sprite_KnsBody extends Sprite_KnsBodyBase{
	setKnsPosition(){
		this.y = -24;
		this.anchor.x = 0.5;
		this.anchor.y = 1;
		this._knsBlinkState = -1;
		this.initKnsBlink();
	}
	update(){
		super.update();
		this.updateKnsBlink();
	}
	initKnsBlink(){
		this._knsBlinkCnt = 30 + Math.randomInt(8) * 10;
		this._knsBlinkPage = -1;
	}
	updateKnsBlink(){
		if (this._knsBlinkState != 0) return;
		// ブリンク中ではない
		if (this._knsBlinkPage == -1){
			if (this._knsBlinkCnt > 0){
				this._knsBlinkCnt--;
			}else{
				this._knsBlinkPage = 0;
			}
		}else{
			if (this._knsBlinkPage >= 21 || this.bitmap.width <= 96){
				this.initKnsBlink();
			}else{
				switch (this._knsBlinkPage++){
					case 0: case 16: this._setBlink(1); break;
					case 8: this._setBlink(2); break;
					case 20: this._setBlink(0); break;
				}
			}
		}
	}
	partRect(){ return [48+this.roleX(),0,48,96]; }
	setFace(type){
		if (this._knsBlinkState != type){
			this._knsBlinkState = type;
			this._setBlink(type);
		}
	}
	_setBlink(type){
		const rect = this.partRect();
		rect[0] += type * rect[2];
		this.setFrame(...rect);
	}
}
//=========================================================
// new Sprite_KnsWeapon < Sprite_KnsBodyBase
//=========================================================
class Sprite_KnsWeapon extends Sprite_KnsBodyBase{
	partRect(){ return [0,0,64,36]; }
	setKnsPosition(){
		this.bitmap = ImageManager.reserveCharacter('Weapon');
		this.y = 18;
		this.anchor.x = 0.75;
		this.anchor.y = 0.5;
		this._lastChara  = null;
		this._lastItemId = null;
	}
	setKnsActor(chara, angle){
		let oldRole = this._knsRoleId;
		super.setKnsActor(chara, angle);
		let refresh = oldRole != this._knsRoleId;

		if (chara && this._knsRoleId != chara._knsRoleId){
			this._knsRoleId = chara._knsRoleId;
			refresh = true;
		}
		let itemId = chara && chara._knsWeaponId;
		if (this._lastItemId != itemId){
			this._lastItemId = itemId;
			refresh = true;
		}
		this.visible = !!itemId;
		if (refresh == true){
			this.setWeaponRect(itemId);
		}
	}
	setWeaponRect(itemId){
		const rect = this.partRect();
		let idx = itemId - 1;
		rect[0] = rect[2] * (idx >> 3);
		rect[1] = rect[3] * (idx % 8);
		this.setFrame(...rect);
	}
}
//=========================================================
// new Sprite_KnsBodyPart < Sprite_KnsBodyBase
//=========================================================
class Sprite_KnsBodyPart extends Sprite_KnsBodyBase{
	setKnsPosition(){
		this.anchor.x = 0.5;
		let isLeft = this._partType < 4;
		// ["Thigh", "Leg", "Shoulder", "Arm"]
		switch(this._partType % 4){
			case 0:
				this.y = -26;
				this.anchor.y = 0.1;
				if (isLeft){
					this.x -= 4;
					this.y -= 2;
				}else{
					this.x += 4;
				}
				break;
			case 1:
				this.y = 16;
				this.anchor.y = 0.4;
				break;
			case 2:
				this.y = -55;
				this.anchor.y = 0.2;
				if (isLeft){
					this.x -= 3;
				}else{
					this.x += 3;
				}
				break;
			case 3:
				this.y = 12;
				this.anchor.y = 0.5;
				break;
		}
	}
	partRect(){
		let sw = 24, sh = 48;
		const rect = [this.roleX(), 0, sw, sh];
		// ["Thigh", "Leg", "Shoulder", "Arm"]
		switch(this._partType % 4){
			case 0:
				rect[0] += sw;
				break;
			case 1:
				rect[0] += sw;
				rect[1] = sh;
				break;
			case 3:
				rect[1] = sh;
				break;
		}
		return rect;
	}
}


;(function(){
//=========================================================
// - check clicked
//=========================================================
const KNS_Character = {};
KNS_Character.setCheckClicked = function(x, y, width, height){
	const spX = this.screenX() + x;
	if (spX < TouchInput.x + width && TouchInput.x < spX + width){
		const spY = this.screenY() + y;
		return spY < TouchInput.y + height && TouchInput.y < spY;
	}
	return false;
}

Game_Enemy.prototype.knsIsClicked = function(scale, x, y){
	const bmp = ImageManager.loadEnemy(this.battlerName());
	scale = Math.abs(scale || 1);
	return KNS_Character.setCheckClicked.call(this, x || 0, y || 0,
		(bmp.width >> 1) * scale, bmp.height * scale);
}

Game_Character.prototype.knsIsClicked = function(scale, x, y){
	if (!this.isKnsCharacter()) return false;
	x = x || 0;
	y = y || 0;
	scale = Math.abs(scale || 1);
	let width = 40;
	let height = 128;
	if (this._knsMode == 'dead'){
		x -= 10;
		width = 128;
		height = 45;
	}
	return KNS_Character.setCheckClicked.call(this, x, y, width * scale, height * scale);
}


//=========================================================
// alias Game_Character
//=========================================================
const _Game_Character_initMembers = Game_Character.prototype.initMembers;
Game_Character.prototype.initMembers = function(){
	this._knsMode = '';
	this._knsWeaponId = 0;
	this._knsRoleId = 0;
	this._knsModeLoop = false;
	this._knsLastDirection = this.direction();
	if (this._knsLastDirection != 4 && this._knsLastDirection != 6){
		this._knsLastDirection = 6;
	}
	this._knsCurrentPose	= {}; // 現在のポーズ
	this._knsLastPose		= {}; // 切り替え時に保存するポーズの原点
	_Game_Character_initMembers.call(this);
	// 開始時点ポーズ乱数
	this.setKnsMode(Math.randomInt(2) == 0 ? 'normal' : 'normal2', false);
	this._knsLastPose._TIME = Math.randomInt(5) * 8 + 5;
	this._knsWalkType = Math.randomInt(2);
}

Game_Character.prototype.isKnsCharacter = function(){
	return	this._characterName &&
			KNS_Pose.reKnsCharacter.test(this._characterName);
}

Game_Character.prototype.getActorWeaponId = function(id){
	const actor = $gameActors.actor(id);
	if (actor){
		const weapon = actor.equips()[0];
		if (weapon) return weapon.id;
	}
	return 0;
}

Game_Character.prototype.getCurrentPose = function(){
	return this._knsCurrentPose;
}

Game_Character.prototype.getTargetPose = function(){
	return KNS_Pose[this._knsMode];
}

const _Game_Character_setDirection = Game_Character.prototype.setDirection;
Game_Character.prototype.setDirection = function(d){
	if (d != 0 && !this.isDirectionFixed()){
		switch (d % 3){
			case 0: this._knsLastDirection = d = 6; break;
			case 1: this._knsLastDirection = d = 4; break;
			case 2: break;
		};
	}
	_Game_Character_setDirection.call(this, d);
};

Game_Character.prototype.turnTowardCharacter = function(character) {
    let sx = this.deltaXFrom(character.x);
	this.setDirection(sx > 0 ? 4 : 6);
};

Game_Character.prototype.turnAwayFromCharacter = function(character) {
    let sx = this.deltaXFrom(character.x);
	this.setDirection(sx > 0 ? 4 : 6);
};

Game_Character.prototype.knsDefaultMotion = function(){
	return 'normal';
}

Game_Character.prototype.setKnsMode = function(mode, loop){
	this._knsLoopMode = loop;
	if (mode == ''){ mode = this.knsDefaultMotion(); };
	if (!KNS_Pose[mode]){
		console.log("無効なポーズ: " + mode)
		return;
	}
	if (this._knsMode == mode){
		this._knsMode = mode;
		return;
	}
	this._knsMode = mode;
	this._knsLastPose = {};
	if (this._knsCurrentPose){
		Object.keys(this._knsCurrentPose).forEach(function(key){
			this._knsLastPose[key] = this._knsCurrentPose[key];
		}, this);
	}
	// 前のポジションに経過時間を記録する
	this._knsLastPose._TIME = KNS_Pose[this._knsMode]._TIME;
}

const _Game_Character_update = Game_Character.prototype.update;
Game_Character.prototype.update = function(){
	_Game_Character_update.call(this);
	this.updateKnsWalk();
	this.updateKnsMode();
}

Game_Character.prototype.updateKnsWalk = function(){
	// 通常モーションで動いた場合
	if (this._knsMode.contains(this.knsDefaultMotion())){
		if (this.isMoving() && this.hasWalkAnime()){
			const type = this.realMoveSpeed() > 4 ? 'dash' : 'walk';
			if (this._knsWalkType == 1){
				this._knsWalkType = 0;
				this.setKnsMode(type+1, false);
			}else{
				this._knsWalkType = 1;
				this.setKnsMode(type+2, false);
			}
		}
	};
}

Game_Character.prototype.updateKnsMode = function(){
	const targetPose = KNS_Pose[this._knsMode];
	if (this._knsLastPose._TIME <= 0){
		// ループしなければ通常ポーズに戻す
		if (!this._knsLoopMode){
			this.setKnsMode(targetPose._NEXT || '', false);
		}
	}else{
		const rate = 1.0 - --this._knsLastPose._TIME / targetPose._TIME;
		KNS_Pose.partsList.forEach(function(parts){
			let old = this._knsLastPose[parts] || 0;
			this._knsCurrentPose[parts] = rate * (
				(targetPose[parts] || 0) - old
			) + old;
		}, this);
	}
}

//=========================================================
// knsSetActor
//=========================================================
Game_Character.prototype.knsSetActor = function(actor, visible){
	if (actor){
		this._knsWeaponId = this.getActorWeaponId(actor.actorId());
		this._knsRoleId = actor.knsGetRoleId();
	}
	let characterName, characterIndex;
	if (visible){
		characterName  = actor.characterName();
		characterIndex = actor.characterIndex();
	}else{
		characterName  = '';
		characterIndex = 0;
	}
	this.setImage(characterName, characterIndex);
}

Game_Player.prototype.refresh = function() {
    const actor = $gameParty.leader();
	this.knsSetActor(actor, actor);
	this._followers.refresh();
};
Game_Follower.prototype.refresh = function() {
	this.knsSetActor(this.actor(), this.isVisible());
};

//=========================================================
// alias Game_Event
//=========================================================
const _Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
	_Game_Event_initialize.apply(this, arguments);
	const ev = this.event();
	if (ev){
		const note = ev.note;
		// init position
		if (KNS_Pose.reEventPos.test(note)){
			this._x = this._realX = Number(RegExp.$1);
			this._y = this._realY = Number(RegExp.$2);
		}
		// init mode
		if (KNS_Pose.reEventMode.test(note)){
			this.setKnsMode(RegExp.$1, RegExp.$2 == 'true');
			this._knsLastPose._TIME = 1;
		}
		// actor
		if (KNS_Pose.reEventActor.test(note)){
			this._knsActorId = Math.floor(RegExp.$1);
		}else{
			this._knsActorId = 0;
		}
		this.refreshKnsActor();
		// weapons
		if (KNS_Pose.reEventWeapon.test(note)){
			this._knsWeaponId = Math.floor(RegExp.$1);
		}
	}
};

const _Game_Event_refresh = Game_Event.prototype.refresh;
Game_Event.prototype.refresh = function() {
	_Game_Event_refresh.call(this)
	this.refreshKnsActor();
};

Game_Event.prototype.refreshKnsActor = function(){
	if (this._knsActorId){
		this._knsWeaponId = this.getActorWeaponId(this._knsActorId);
		const actor = $gameActors.actor(this._knsActorId);
		this._knsRoleId = actor.knsGetRoleId();
	}
}


//=========================================================
// alias Sprite_Character
//=========================================================
Sprite_Character.prototype.isKnsCharacter = function() {
	return this._character && this._character.isKnsCharacter();
}

Sprite_Character.prototype.clearKnsCharacter = function() {
	function remove(parent){
		const children = parent.children;
		for (let i = 0; i < children.length; i++){
			const child = children[i];
			if (child.isSpriteKnsCharacter){
				parent.removeChild(child);
				remove(child);
				i--;
			}
		}
	}
	remove(this);
}

const _Sprite_Character_setTileBitmap = Sprite_Character.prototype.setTileBitmap;
Sprite_Character.prototype.setTileBitmap = function() {
	this.clearKnsCharacter();
	this._knsAllCharacter = false;
	this.scale.x = 1;
	_Sprite_Character_setTileBitmap.call(this);
}

const _Sprite_Character_setCharacterBitmap = Sprite_Character.prototype.setCharacterBitmap;
Sprite_Character.prototype.setCharacterBitmap = function() {
	this.clearKnsCharacter();
	_Sprite_Character_setCharacterBitmap.call(this);
	this._knsAllCharacter = false;
	if (this.isKnsCharacter()){
		let last;
		KNS_Pose.partsList.forEach(function(parts, i){
			if (KNS_Pose.reSystem.test(parts)) return;
			const key = "_kns" + parts;
			switch (parts){
			case "BD":
				this[key] = new Sprite_KnsBody(this.bitmap, -1);
				break;
			case "WP":
				this[key] = new Sprite_KnsWeapon(null, -2);
				break;
			default:
				this[key] = new Sprite_KnsBodyPart(this.bitmap, i);
				if (i % 2 == 1 && KNS_Pose.reParts.test(parts)){
					this[last].addChild(this[key]);
				}else{
					last = key;
				}
				break;
			}
		}, this);
		this.addChild(this._knsLS);
		this.addChild(this._knsLT);
		this.addChild(this._knsRT);
		this.addChild(this._knsBD);
		this.addChild(this._knsRS);
		this._knsLA.addChild(this._knsWP);
		this.bitmap = Sprite_Character.EmptyBitmap;
	}else if (this._characterName && /^@/.test(this._characterName)){
		this._knsAllCharacter = true;
	}
}
Sprite_Character.EmptyBitmap = new Bitmap(1, 1);

const _Sprite_Character_update = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function() {
    _Sprite_Character_update.call(this);
	this.updateKnsCharacter();
}

Sprite_Character.prototype.updateKnsCharacter = function(){
	if (this.isKnsCharacter()){
		this.y -= 16;
		const currentPose = this._character.getCurrentPose();
		KNS_Pose.partsList.forEach(function(parts){
			if (KNS_Pose.reSystem.test(parts)){
				this.y += currentPose[parts] || 0;
				return;
			}
			this["_kns" + parts].setKnsActor(
				this._character, currentPose[parts] || 0
			);
		}, this);
		const target = this._character.getTargetPose();
		this._knsBD.setFace(target ? target._FACE || 0 : 0);

		// direction
		let scale = Math.abs(this.scale.x);
		switch (this._character._knsLastDirection || 4){
			case 8: case 4:
				this.rotation = -this._knsBD.rotation;
				this.scale.x = scale;
				break;
			default:
				this.rotation = this._knsBD.rotation;
				this.scale.x = -scale;
				break;
		}
		this._knsBD.rotation = 0;
	}
}

const _Sprite_Character_characterBlockX = Sprite_Character.prototype.characterBlockX;
Sprite_Character.prototype.characterBlockX = function() {
	if (!this._character || this._knsAllCharacter){
		return 0;
	}else{
		return _Sprite_Character_characterBlockX.call(this);
	}
};

const _Sprite_Character_characterBlockY = Sprite_Character.prototype.characterBlockY;
Sprite_Character.prototype.characterBlockY = function() {
	if (!this._character || this._knsAllCharacter){
		return 0;
	}else{
		return _Sprite_Character_characterBlockY.call(this);
	}
};

Sprite_Character.prototype.characterPatternX = function() {
    return !this._character || this._knsAllCharacter ? 0 : this._character.pattern();
};

Sprite_Character.prototype.characterPatternY = function() {
    return !this._character || this._knsAllCharacter ? 0 : (this._character.direction() - 2) / 2;
};

const _Sprite_Character_patternWidth = Sprite_Character.prototype.patternWidth;
Sprite_Character.prototype.patternWidth = function() {
	if (this.bitmap && this._knsAllCharacter){
        return this.bitmap.width;
	}else{
		return _Sprite_Character_patternWidth.call(this);
	}
};
const _Sprite_Character_patternHeight = Sprite_Character.prototype.patternHeight;
Sprite_Character.prototype.patternHeight = function() {
	if (this.bitmap && this._knsAllCharacter){
        return this.bitmap.height;
	}else{
		return _Sprite_Character_patternHeight.call(this);
	}
};

const _Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
Sprite_Character.prototype.updateCharacterFrame = function() {
	if (this.isKnsCharacter()) return;
	_Sprite_Character_updateCharacterFrame.call(this);
}

const _Sprite_Character_updateBalloon = Sprite_Character.prototype.updateBalloon;
Sprite_Character.prototype.updateBalloon = function() {
	_Sprite_Character_updateBalloon.call(this);
	if (this._balloonSprite && this.isKnsCharacter()){
		this._balloonSprite.y -= 128;
	}
};

const _Sprite_Character_hide = Sprite_Character.prototype.hide;
Sprite_Character.prototype.hide = function(){
	_Sprite_Character_hide.call(this);
	if (this._balloonSprite){
		this._balloonSprite.hide();
	}
}
})();