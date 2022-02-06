Game_Map.KNS_RE_MAP_NAME = /^(\d+)$/
Game_Map.prototype.displayName = function(name) {
	const base = name === undefined ? $dataMap.displayName : name;
	if (Game_Map.KNS_RE_MAP_NAME.test(base)){
		return KNS_MAPNAMES[Math.floor(base)];
	}else{
		return base;
	}
};
//=========================================================
// new Sprite_ObtainedWeapon < Sprite_KnsWeapon
//=========================================================
class Sprite_ObtainedWeapon extends Sprite_KnsWeapon{
	constructor(itemId){
		super(null, -2);
		this.x = 40;
		this.y = 34;
		this.setWeaponRect(itemId);
		this.rotation = Math.PI * 2;
	}
	update(){
		super.update();
		this.knsUpdateRolling();
	}
	knsUpdateRolling(){
		let tx = 0.805;
		if (this.rotation >= tx){
			let angle = tx - 0.05 - this.rotation;
			this.rotation = this.rotation + angle * 0.06;
		}
	}
}

//=========================================================
// new Sprite_InfoPop
//=========================================================
class Sprite_InfoPop extends Sprite{
	constructor(iconIndex){
		super(ImageManager.reserveSystem('IconSet'));
		this.x = 4;
		this.opacity = 0;
		this._knsIndex = 0;
		this.setIcon(iconIndex);
	}
	setIcon(iconIndex){
		let size = 32;
		let sx = size * (iconIndex & 15);
		let sy = size * (iconIndex >> 4);
		this.setFrame(sx, sy, size, size);
	}
	update(){
		super.update();
		this.knsUpdateRolling();
	}
	knsMaxCount(){ return 50; }
	knsUpdateRolling(){
		const max = this.knsMaxCount();
		if (this._knsIndex < max){
			const rate = (++this._knsIndex) / max;
			this.y = - Math.sin(Math.PI * rate) * 9 + 2;
			this.opacity += 10;
		}else if (this._knsIndex == max){
			this.y -= 1;
			this._knsIndex++;
		}
	}
}

;(function(){
//============================================
// new Sprite_KnsMapName
//============================================
class Sprite_KnsMapName extends Sprite{
	open(){
		const name = $gameMap.displayName();
		if (!name || Sprite_KnsMapName.LAST_NAME === name){
			return;
		}else{
			Sprite_KnsMapName.LAST_NAME = name;
		}
		this.refresh();
		this._showCount = this.knsMaxFrame();
	};
	close(){ this._showCount = 0; };
	hide(){ this.visible = false; }
	knsMaxFrame(){ return 180; }

	constructor(){
		super();
		this.knsCreateBitmap();
		this.opacity = 0;
		this.x = -Graphics.width;
		this.y = Graphics.height - 40;
		this._showCount = 0;
		this.refresh();
	}
	knsCreateBitmap(){
		this.bitmap = new Bitmap(320, 4);
		let pad = 48, width = this.bitmap.width - pad;
		// back
		let height = 4, color1 = KNS_COLORS.WINDOW_BACK1, color2 = KNS_COLORS.WINDOW_BACK2;
		this.bitmap.fillRect(0, 0, width, height, color1);
		this.bitmap.gradientFillRect(width, 0, pad, height, color1, color2);
		// front
		height = 2, color1 = '#fff', color2 = '#fff0';
		this.bitmap.fillRect(0, 1, width, height, color1);
		this.bitmap.gradientFillRect(width, 1, pad, height, color1, color2);
	}
	update(){
		super.update();
		if (this._showCount > 0 && $gameMap.isNameDisplayEnabled()) {
			this.updateFadeIn();
			this._showCount--;
		} else {
			this.updateFadeOut();
		}
		this.updateChrChildren();
	};
	updateFadeIn(){
		this.opacity += 16;
		const max = this.knsMaxFrame();
		const rate = (max - this._showCount) / max;
		this.x = this.x - this.x * rate;
	}
	updateFadeOut(){
		this.opacity -= 16;
		if (this.opacity > 0){
			this.x -= 4;
		}
	}
	updateChrChildren(){
		const waveMax = 30;
		this.children.forEach(function(sp){
			if (sp._knsCnt < 0){
				sp._knsCnt++;
			}else if (sp._knsCnt < waveMax){
				sp._knsCnt++;
				const rate = sp._knsCnt / waveMax;
				sp.y = Math.sin(Math.PI * rate) * 9 - 55;
				sp.opacity += 10;
			}
		});
	}
	refresh(){
		this.removeChildren();
		const name = $gameMap.displayName();
		if (!name) return;
		let x = 12;
		for (let i = 0; i < name.length; i++){
			const bmp = new Bitmap(60, 60);
			bmp.fontSize = i == 0 ? 48 : 36;
			bmp.outlineColor = KNS_COLORS.WINDOW_BACK1;
			bmp.outlineWidth = 3;
			bmp.drawText(name[i], 0, 0, bmp.width, bmp.height);
			const sp = new Sprite(bmp);
			sp.x = x;
			sp.opacity = 0;
			sp._knsCnt = -i * 4 - 10;
			x += bmp.measureTextWidth(name[i]);
			this.addChild(sp);
		}
	};
}

//============================================
// alias Scene_Map
//============================================
Scene_Map.prototype.createMapNameWindow = function() {
	this._mapNameWindow = new Sprite_KnsMapName();
	this.addChild(this._mapNameWindow);
};

//============================================
// new Spriteset_LogInfo
//============================================
class Spriteset_LogInfo extends Sprite{
	pushInfo(info){
		this.addChild(new Sprite_LogInfo(info));
	}
	update(){
		super.update();
		this.updatePosition();
	}
	updatePosition(){
		let y = 0;
		for (let i = 0; i < this.children.length; i++){
			const sp = this.children[i];
			if (sp.isEnd()){
				this.removeChild(sp);
				sp.destroy();
				i--;
			}else{
				if (!sp.isPreEnd()){
					sp.knsSetTargetY(y);
					y += sp.height + 4;
				}
			}
		}
	}
}

//============================================
// new Sprite_LogInfo
//============================================
class Sprite_LogInfo extends Sprite{
	isPreEnd(){ return this._knsIndex > this._knsFadePage1; }
	isEnd(){ return this._knsIndex > this._knsFadePageEnd; }
	moveMax(){ return 20; }
	constructor(info){
		super();
		let type = this.getInfoType(info);
		this.setFadeCnt(type);
		this.bitmap = this._knsCreateBitmap(type, info);

		this._knsIndex = 0;
		// fade
		// pos
		this.x = -Graphics.width;
		this.y = 240;
		this._knsOldY = this.y;
		this._knsTargetY = Infinity;
		this._knsMoveIndex = this.moveMax();
	}
	getInfoType(info){
		if (typeof info == 'object'){
			const first = info[0];
			if (DataManager.isItem(first)){
				return 1;
			}else if (DataManager.isWeapon(first)){
				return 2;
			}else if (DataManager.isArmor(first)){
				return 3;
			}else{
				return 4;
			}
		}else{
			return 0;
		}
	}
	setFadeCnt(type){
		this._knsFadePageEnd = 220;
		this._knsFadePage0 = 30;
		this._knsFadePage1 = this._knsFadePageEnd - this._knsFadePage0;
	}
	_knsObtainedText(info){
		return KNS_TERMS.OBTAINED.replace("%s", info[0].name);
	}
	_knsObtainedNumber(info){
		return KNS_TERMS.OBTAINED_NUMBER.replace("%d", info[1]);
	}
	_knsCreateBitmap(type, info){
		let bmp;
		switch(type){
			case 0:
				bmp = this.refreshAsText(type, KNS_ADVICE[info], 400, 80);
				break;
			case 1: case 2: case 3:
				bmp = this.refreshAsItem(type, info);
				break;
			default:
				bmp = this.refreshAsText(type, info, 400, 80);
				break;
		}
		return bmp;
	}
	refreshAsText(type, text, width, height){
		const bmp = this._knsCreateBack(width, height);
		bmp.fontSize = 24;
		let newX = 12;
		let x = newX;
		let y = 4;
		const color2 = KNS_COLORS.SYSTEM_ACCENT;
		for (let i = 0; i < text.length; i++){
			let char = text[i];
			switch (char){
				case '\n':
					x = newX;
					y += 32;
					break;
				case '@':
					bmp.textColor = bmp.textColor == color2 ? 'white' : color2;
					break;
				default:
					bmp.drawText(char, x, y, 32, 32);
					x += bmp.measureTextWidth(char);
					break;
			}
		}
		return bmp;
	}
	refreshAsItem(type, info){
		let startX = 64;
		let padY = 16;
		let icon = 0;
		if (type == 2){
			this.addChild(new Sprite_ObtainedWeapon(info[0].id));
		}else{
			padY = 0;
			icon = info[0].iconIndex;
			if (icon){
				startX = 40;
				this.addChild(new Sprite_InfoPop(icon));
			}else{
				startX = 8;
			}
		}
		const bmp = this._knsCreateBack(330, 36, padY);
		const numberWidth = 64;
		const wid = bmp.width - startX - numberWidth - (bmp.height >> 1);
		bmp.drawText(this._knsObtainedText(info),
			startX, padY, wid - 4, bmp.height - padY
		);
		bmp.drawText(this._knsObtainedNumber(info),
			startX + wid, padY, numberWidth, bmp.height - padY, 'right'
		);
		return bmp;
	}
	_knsCreateBack(width, height, padY){
		if (!padY){
			padY = 0;
		}
		const bmp = new Bitmap(width, height + padY);
		bmp.fontSize = 22;
		bmp.outlineWidth = 3;
		bmp.outlineColor = KNS_COLORS.SYSTEM_OUTLINE;

		const ctx = bmp._context;
		const grad = ctx.createLinearGradient(0, padY, 0, height + padY);
		grad.addColorStop(0, KNS_COLORS.UI_BACK + '99');
		grad.addColorStop(0.8, KNS_COLORS.UI_BACK_DARK + 'aa');
		const accentColor = KNS_COLORS.SYSTEM_ACCENT + 'cc';
		let x = height >> 1;
		height += padY;

		let bottomLine = height - 6;
		let bottomCnt = 1;
		for (; padY < height; padY+=2){
			if (padY >= bottomLine && bottomCnt > 0){
				ctx.fillStyle = accentColor;
				bottomCnt--;
			}else{
				ctx.fillStyle = grad;
			}
			ctx.fillRect(0, padY, width - x, 2);
			x -= 1;
		}
		return bmp;
	}

	update(){
		super.update();
		this.updateFade();
		this.updateMove();
	}
	updateFade(){
		if (!this.isEnd()){
			if (this._knsIndex < this._knsFadePage0){
				this.x = Math.min(
					this.x - this.x * this._knsIndex / this._knsFadePage0, 0
				);
			}else if (this.isPreEnd()){
				this.x -= 3;
				this.opacity -= 12;
			}
			this._knsIndex++;
		}
	}
	updateMove(){
		const max = this.moveMax();
		if (this._knsMoveIndex != max){
			const rate = ++this._knsMoveIndex / max;
			this.y = this._knsOldY + Math.floor(
				rate * (this._knsTargetY - this._knsOldY)
			);
		}
	}
	knsSetTargetY(y){
		if (this._knsTargetY == Infinity){
			this.y = y;
			this._knsTargetY = y;
			this._knsOldY = y;
		}else if (this._knsTargetY != y){
			this._knsTargetY = y;
			this._knsOldY = this.y;
			this._knsMoveIndex = 0;
		}
	}
	destroy(){
		for (let i = 0; i < this.children.length; i++){
			this.children[i--].destroy();
		}
		super.destroy();
	}
}


//============================================
// alias Game_System
//============================================
Game_System.prototype.knsGetLogInfo = function(){
	return this._knsLogInfo;
}

Game_System.prototype.knsSetLogInfo = function(info){
	this._knsLogInfo = info;
}

//============================================
// alias Game_Interpreter
//============================================
const _command126 = Game_Interpreter.prototype.command126;
const _command127 = Game_Interpreter.prototype.command127;
const _command128 = Game_Interpreter.prototype.command128;
Game_Interpreter.prototype.command126 = function() {
	return this.knsSetItemInfo($dataItems, _command126);
};
Game_Interpreter.prototype.command127 = function() {
	return this.knsSetItemInfo($dataWeapons, _command127);
};
Game_Interpreter.prototype.command128 = function() {
	return this.knsSetItemInfo($dataArmors, _command128);
};
Game_Interpreter.prototype.knsSetItemInfo = function(container, method){
	const item = container[this._params[0]];
	const value = this.operateValue(this._params[1], this._params[2], this._params[3])
	if (item && value > 0){
		$gameSystem.knsSetLogInfo([item, value]);
	}
	return method.call(this);
}

// handler
Game_Interpreter.prototype.knsShowInfo = function(info){
	if (info === undefined){
		info = $gameSystem.knsGetLogInfo();
	}
	SceneManager._scene.knsShowInfo(info);
}

//============================================
// alias Scene_Base
//============================================
Scene_Base.prototype._knsCreateSpritesetLogInfo = function(){
	this._logSpriteset = new Spriteset_LogInfo();
	this.addChild(this._logSpriteset);
}

Scene_Base.prototype.knsShowInfo = function(info){
	if (this._logSpriteset){ this._logSpriteset.pushInfo(info); }
}

//============================================
// alias apply
//============================================
const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function(){
	_Scene_Map_createDisplayObjects.call(this);
	this._knsCreateSpritesetLogInfo();
	this._logSpriteset.y = 320;
}

const _Scene_Battle_create = Scene_Battle.prototype.create;
Scene_Battle.prototype.create = function(){
	_Scene_Battle_create.call(this);
	this._knsCreateSpritesetLogInfo();
	this._logSpriteset.y = 200;
}

//============================================
// new Sprite_KnsFade
//============================================
class Sprite_KnsFade extends Sprite{
	constructor(){
		super();
		this.knsCreateBaseBitmaps();
		this.fadeOutCnt = -1;
	}
	knsCreateBaseBitmaps(){
		const bmp = new Bitmap(108, 140);
		const ctx = bmp._context;
		ctx.fillStyle = '#2c7076';
		let hw = (bmp.width  >> 1) - 2;
		let hh = (bmp.height >> 1) - 2;
		ctx.beginPath();
		ctx.moveTo(hw, 0);
		ctx.lineTo(0, hh);
		ctx.lineTo(hw, bmp.height - 1);
		ctx.lineTo(bmp.width - 1, hh);
		ctx.closePath();
		ctx.fill();
		bmp._setDirty();
		// baseBitmap2
		const bmp2 = new Bitmap(bmp.width, bmp.height);
		const ctx2 = bmp2._context;
		ctx2.drawImage(ctx.canvas, 0, 0);
		ctx2.globalCompositeOperation = 'source-in';
		ctx2.fillStyle = '#972eb1';
		ctx2.fillRect(0, 0, bmp.width, bmp.height);
		bmp2._setDirty();
		this._baseBitmaps = [bmp, bmp2];
	}
	kncCreateSprites(){
		this.removeChildren();
		const wid = 12;
		const hei = 10;
		const children1 = [];
		const children2 = [];
		const padX = (Graphics.width + 54) / (wid-1);
		const padY = (Graphics.height + 70) / (hei-1);
		for (let y = 0; y < hei; y++){
			let i = y & 1;
			for (let x = 0; x < wid; x++){
				const sp = new Sprite();
				sp.x = padX * x;
				sp.y = padY * y;
				if (i){
					sp.bitmap = this._baseBitmaps[0];
					sp.x -= padX >> 1;
					sp.y += 8;
					children1.push(sp);
				}else{
					sp.bitmap = this._baseBitmaps[1];
					children2.push(sp);
				}
				sp._knsCnt = (y + x) * -3;
				sp.scale.x = sp.scale.y = 0;
				sp.anchor.x = sp.anchor.y = 0.5;
			}
		}
		this.addChild(...children2, ...children1);
	}
	knsFadeOut(){
		this._knsFadeOut = true;
		this._knsFadeIn = false;
		this.kncCreateSprites();
	}
	knsFadeIn(){
		this._knsFadeOut = false;
		this._knsFadeIn = true;
	}
	update(){
		super.update();
		if (this._knsFadeOut){
			this.knsUpdateFadeOut();
		}else if (this._knsFadeIn){
			this.knsUpdateFadeIn();
		}
	}
	knsMaxFadeCnt(){ return 20; }
	knsUpdateFadeOut(){
		const max = this.knsMaxFadeCnt();
		for (let sp of this.children){
			if (sp._knsCnt < 0){
				sp._knsCnt++;
			}else if (sp._knsCnt < max){
				sp._knsCnt++;
				sp.scale.x = sp.scale.y = sp._knsCnt / max;
			}
		}
	}
	knsUpdateFadeIn(){
		const max = this.knsMaxFadeCnt();
		for (let sp of this.children){
			if (sp._knsCnt > 0){
				sp._knsCnt--;
				sp.scale.x = sp.scale.y = sp._knsCnt / max;
			}else{
				this.removeChild(sp);
			}
		}
		if (this.children.length == 0){
			this._knsFadeIn = false;
		}
	}
}



//============================================
// new Sprite_KnsMenuButton
//============================================
class Sprite_KnsMenuButton extends Sprite{
	knsGetTouchArea(){
		const size = this.knsSize();
		return [this.x - size, this.x, this.y, this.y + size];
	}
	knsSize(){ return 128; }
	constructor(){
		super(ImageManager.loadSystem('menu'));
		this.x = Graphics.width;
		this.anchor.x = 1;
		this.opacity = 0;
		this._knsMovingCnt = 1;
		if ($gameSystem._knsPositionType === undefined){
			$gameSystem._knsPositionType = 0;
		}
		this.update();
	}
	update(){
		super.update();
		if (this._knsMovingCnt > 0){
			this.knsUpdateMoving();
		}else{
			this.knsUpdatePosition();
		}
	}
	knsMovingMax(){ return 15; }
	knsUpdateMoving(){
		let ty = $gameSystem._knsPositionType == 0 ? 0 : Graphics.height - this.knsSize();
		let max = this.knsMovingMax();
		this.y = (ty - this.y) * (max - --this._knsMovingCnt) / max + this.y;
		this.opacity = 64;
	}
	knsUpdatePosition(){
		const area = this.knsGetTouchArea();
		const playerX = $gamePlayer.screenX();
		let range = 64;
		// プレイヤーが近くにいる場合は移動する
		if (area[0] < playerX + range && playerX <= area[1] + range){
			const playerY = $gamePlayer.screenY();
			if (area[2] < playerY + range && playerY <= area[3] + range){
				$gameSystem._knsPositionType = this.y == 0 ? 1 : 0;
				this._knsMovingCnt = this.knsMovingMax();
			}
		}
	}
	knsIsTriggered(){
		const area = this.knsGetTouchArea();
		if (
			this._knsMovingCnt <= 0 && TouchInput.isTriggered() &&
			area[0] < TouchInput.x && TouchInput.x < area[1] &&
			area[2] < TouchInput.y && TouchInput.y < area[3]
		){
			this.opacity = 192;
			return true;
		}
		return false;
	}
	knsSetTranslucent(){
		const max = 128;
		if (this.opacity < max){
			this.opacity = Math.min(max, this.opacity + 8);
		}else{
			this.opacity = Math.max(max, this.opacity - 8);
		}
	}
	knsSetHide(){
		this.opacity = Math.max(0, this.opacity - 8);
	}
}

//============================================
// alias Scene_Map
//============================================
const _Scene_Map_createDisplayObjects2 = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function(){
	_Scene_Map_createDisplayObjects2.call(this);
	this.knsCreateKnsFadeSprite();
	this.knsCreateMenuButtonSprite();
}

Scene_Map.prototype.knsCreateMenuButtonSprite = function(){
	this._knsMenuButtonSprite = new Sprite_KnsMenuButton();
	this.addChild(this._knsMenuButtonSprite);
}

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function(){
	if (
		this.isSceneChangeOk() && !SceneManager.isSceneChanging() &&
		this.isMenuEnabled()
	){
		if (this._knsMenuButtonSprite.knsIsTriggered()){
			TouchInput.clear();
			this.menuCalling = true;
		}else{
			this._knsMenuButtonSprite.knsSetTranslucent();
		}
	}else{
		this._knsMenuButtonSprite.knsSetHide();
	}
	_Scene_Map_update.call(this);
}

Scene_Map.prototype.knsCreateKnsFadeSprite = function(){
	this._knsFadeSprite = new Sprite_KnsFade();
	this.addChild(this._knsFadeSprite);
}

Scene_Map.prototype.knsStartFadeOut = function(){
	this._knsFadeSprite.knsFadeOut();
}

Scene_Map.prototype.knsStartFadeIn = function(){
	this._knsFadeSprite.knsFadeIn();
}

// for next scenes
Scene_Map.prototype.terminate = function() {
	Scene_Base.prototype.terminate.call(this);
	if (!SceneManager.isNextScene(Scene_Battle)) {
		this._logSpriteset.visible = false;
		this._knsMenuButtonSprite.opacity = 0;
		this._spriteset.update();
		this._mapNameWindow.hide();
		SceneManager.snapForBackground(true);
	} else {
		ImageManager.clearRequest();
	}

	if (SceneManager.isNextScene(Scene_Map)) {
		ImageManager.clearRequest();
	}

	$gameScreen.clearZoom();
	this.removeChild(this._knsMenuButtonSprite);
	this.removeChild(this._fadeSprite);
	this.removeChild(this._logSpriteset);
	this.removeChild(this._mapNameWindow);
	this.removeChild(this._windowLayer);
	this.removeChild(this._spriteset);
};

// in battle
Scene_Map.prototype.encounterEffectSpeed = function() {
	return 2;
};

Scene_Map.prototype.startEncounterEffect = function() {
	this.removeChild(this._knsMenuButtonSprite);
	this._encounterEffectDuration = this.encounterEffectSpeed();
};

Scene_Map.prototype.updateEncounterEffect = function() {
	if (this._encounterEffectDuration > 0) {
		this._encounterEffectDuration--;
		if (this._encounterEffectDuration == 0){
			this._spriteset.hideCharacters();
			if (this._fadeSprite){
				this._fadeSprite.opacity = 0;
			}
			this.snapForBattleBackground();
			this._spriteset.knsShowPlayer();
			BattleManager.playBattleBgm();
		}
	}
};

//===========================================
// alias Spriteset_Map
//===========================================
Spriteset_Map.prototype.hideCharacters = function() {
	for (let sp of this._characterSprites){
		if (!sp.isTile() && sp.isKnsCharacter()){
			sp.hide();
		}
	}
};

Spriteset_Map.prototype.knsShowPlayer = function() {
	for (let i = 0; i < this._characterSprites.length; i++) {
		const sp = this._characterSprites[i];
		const character = sp._character;
		if (
			character && (character == $gamePlayer ||
			character.constructor.name == "Game_Follower")
		){
			sp.show();
		}
	}
};

})();