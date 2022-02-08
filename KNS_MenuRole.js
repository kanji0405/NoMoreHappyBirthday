(function(){
//=========================================================
// alias Game_Party
//=========================================================
Game_Party.prototype.knsIsRoleCommandEnable = function(){
	return $gameSwitches.value(7);
}

//=========================================================
// alias Game_Enemy
//=========================================================
Game_Enemy.getKnsRolePoint = function(id){
	return $dataEnemies[id].meta.rolePoint || 0;
}
Game_Enemy.prototype.getKnsRolePoint = function(){
	return Game_Enemy.getKnsRolePoint(this.enemyId());
}
//=========================================================
// alias Game_Actor
//=========================================================
Game_Actor.KNS_EQUIP_SLOTS = Uint8Array.from([1,2,3,4,5,5,6,6]);
Game_Actor.prototype.equipSlots = function() {
    return Game_Actor.KNS_EQUIP_SLOTS;
};

Game_Actor.prototype.knsGetCurrentExp = function(){
	if (this.isMaxLevel()){
		return null;
	}else{
		let cur = this.expForLevel(this.level) || 0;
		exp1 = Math.max((this.currentExp() || 0) - cur, 0);
		exp2 = exp1 + this.nextRequiredExp(this.nextLevelExp() || 1);
		return [exp1, exp2];
	}
}

// role
Game_Actor.KnsRoleList = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]);
Game_Actor.KnsRoleLevel = Uint16Array.from(
	[50, 150, 300, 500, 1000, 2500, 5000, 5000, 7500, 8000]
);

Game_Actor.prototype.knsGetRoleId = function(){
	return this._knsRoleId || 0;
}

Game_Actor.prototype.knsSetRoleId = function(id){
	if (this._knsRoleId != id){
		this._knsRoleId = id;
		$gamePlayer.refresh();
		$gameMap.requestRefresh($gameMap.mapId());
	}
}

Game_Actor.knsGetRoleClass = function(roleId){
	return roleId ? $dataClasses[roleId] : null;
}

Game_Actor.knsGetRoleTraits = function(roleId, code){
	const roleClass = this.knsGetRoleClass(roleId);
	if (roleClass){
		return roleClass.traits.filter(function(ft){
			return ft.code == code;
		});
	}else{
		return [];
	}
}


Game_Actor.knsRoleAffect = Float32Array.from([1, 0.625, 0.875, 1, 1.125, 1.375]);
Game_Actor.knsGetRoleParam = function(roleId, paramId){
	const roleClass = Game_Actor.knsGetRoleClass(roleId);
	if (roleClass){
		const meta = roleClass.meta;
		if (typeof meta.param == 'string'){
			meta.param = eval(meta.param);
		}
		return meta.param[paramId] || 0;
	}else{
		return 0;
	}
}

const _Game_Actor_paramBase = Game_Actor.prototype.paramBase;
Game_Actor.prototype.paramBase = function(paramId) {
    return _Game_Actor_paramBase.call(this, paramId) * Game_Actor.knsRoleAffect[
		Game_Actor.knsGetRoleParam(this.knsGetRoleId(), paramId)
	];
};

Game_Actor.prototype.knsGetRoleName = function(roleId){
	const roleClass = Game_Actor.knsGetRoleClass(roleId);
	if (roleClass){
		return roleClass.name;
	}else{
		return this.name();
	}
}

// exp
Game_Actor.prototype.knsGetTotalRoleExp = function(id){
	if (this._knsRoleExp === undefined){
		this._knsRoleExp = new Array(Game_Actor.KnsRoleList.length).fill(0);
	}
	if (id === undefined){ id = this.knsGetRoleId(); }
	return this._knsRoleExp[id] || 0;
}

Game_Actor.prototype.knsGetRoleLevel = function(id){
	let exp = this.knsGetTotalRoleExp(id);
	let level = 0, sum = 0;
	const levelList = Game_Actor.KnsRoleLevel;
	for (; level < levelList.length; level++){
		sum += levelList[level];
		if (exp < sum) break;
	}
	return level;
}

Game_Actor.prototype.knsGetRoleCurrentExp = function(id){
	let currentLevel = this.knsGetRoleLevel(id);
	let sum = 0;
	const levelList = Game_Actor.KnsRoleLevel;
	for (let i = 0; i < currentLevel; i++){ sum += levelList[i]; }
	return this.knsGetTotalRoleExp(id) - sum;
}

Game_Actor.prototype.knsGetRoleNextExp = function(id){
	return Game_Actor.KnsRoleLevel[this.knsGetRoleLevel(id)] || 0;
}

Game_Actor.prototype.isLevelMax = function(id){
	return this.knsGetRoleNextExp(id) == 0;
}

Game_Actor.prototype.knsEquippable = function(typeId, code){
	const roleId = this.knsGetRoleId();
	return !roleId || Game_Actor.knsGetRoleTraits(roleId, code).map(
		function(ft){ return ft.dataId; }).contains(typeId);
}

Game_Actor.prototype.isEquipWtypeOk = function(wtypeId){
	return this.knsEquippable(wtypeId, Game_BattlerBase.TRAIT_EQUIP_WTYPE);
};

Game_Actor.prototype.isEquipAtypeOk = function(atypeId) {
	return atypeId == 1 || this.knsEquippable(atypeId, Game_BattlerBase.TRAIT_EQUIP_ATYPE);
};

})();

//================================================
// new Window_RoleSelect
//================================================
class Window_RoleSelect extends Window_Selectable{
	constructor(y, height){
		super(0, y, Graphics.width, height);
		this._actor = null;
		this.activate();
	}
	maxItems(){ return Game_Actor.KnsRoleList.length; }
	maxCols(){ return this.maxItems(); }
	itemHeight(){ return this.contents ? this.contents.height >> 1 : 1; }
	setActor(actor){
		if (this._actor != actor){
			this._actor = actor;
			if (this._actor){
				this.select(this._actor.knsGetRoleId());
			}
			this.refresh();
		}
	}
	cursorLeft(){
		let max = this.maxItems();
		this.select((this.index() + max - 1) % max);
	}
	cursorRight(){
		this.select((this.index() + 1) % this.maxItems());
	}
	setHelpWindow(help, info){
		this._infoWindow = info;
		super.setHelpWindow(help);
	}
	updateHelp(){
		super.updateHelp();
		this._helpWindow.setText(KNS_TERMS.ROLE_NEW);
		if (this._infoWindow){
			this._infoWindow.refresh(this._actor, this.index());
		}
	}
}

//================================================
// new Window_RoleInfo
//================================================
class Window_RoleInfo extends Window_Base{
	standardPadding(){ return 4; }
	constructor(height){
		super(0, Graphics.height - height, Graphics.width, height);
	}
	refresh(actor, index){
		this.contents.clear();
		if (!actor) return;
		const roleId = Game_Actor.KnsRoleList[index];
		let roleWidth = 240;
		let padX = -48;
		if (roleId == 0){
			const roleName = actor.knsGetRoleName(roleId);
			let y = this.contents.height - 32 >> 1
			this.drawText(roleName, 0, y, roleWidth+padX*2, 'center');
		}else{
			this.knsDrawJobGauge(actor, padX-5, 64, roleWidth, roleId);
			this.resetFontSettings();
		}
		padX = 150;
		this.knsDrawStatus(
			actor, roleId, padX-40, 10, this.contents.width - padX - 20
		);

		let width = (this.contents.width - padX - 20 >> 1) - 10;
		let y = 110;
		this.knsDrawEquipmentInfo('WEAPON', padX, y, width, roleId);
		this.knsDrawEquipmentInfo('ARMOR', padX + width + 20, y, width, roleId);
		this.resetFontSettings();
	}
	knsDrawEquipmentInfo(type, x, y, width, roleId){
		let y2 = y + 28;
		this.contents.fontSize = 22;
		this.changeTextColor(this.systemColor());
		this.drawText(KNS_TERMS[type + '_EQUIPABLE'], x, y, width);
		this.changeTextColor(this.normalColor());
		let text;
		if (roleId == 0){
			text = [KNS_TERMS[type + '_ALL']];
		}else{
			let code = Game_BattlerBase['TRAIT_EQUIP_' + type[0] + 'TYPE'];
			const terms = $dataSystem[type.toLowerCase() + 'Types'];
			text = Game_Actor.knsGetRoleTraits(roleId, code).map(function(ft){
				return terms[ft.dataId]; });
		}
		let pad = 4;
		let padW = width / text.length - pad;
		for (let i = 0; i < text.length; i++){
			x += pad;
			this.contents.fillRect(x, y2 + 32, padW, 1, this.contents.textColor);
			this.drawText(text[i], x, y2, padW, 'center');
			x += padW + pad;
		}
	}
	knsDrawStatus(base, roleId, sx, sy, width){
		let col = 2;
		let colWidth = width / 4;
		let space = 48;
		let spaceWid = colWidth - space;

		let oldRoleId = base.knsGetRoleId();
		const actor = JsonEx.makeDeepCopy(base);
		actor.knsSetRoleId(roleId);
		let bmp;
		if (!this._knsParamSprite){
			this._knsParamSprite = [];
			bmp = ImageManager.loadSystem('ParamRank');
		}
		for (let i = 0; i < 7; i++){
			let x = sx + Math.floor(i / col) * colWidth + space;
			let y = sy + (i % col) * 52;
			this.contents.fontSize = 18;
			this.changeTextColor(this.systemColor());
			this.drawText(TextManager.param(i), x, y - 4, spaceWid);
			// params
			let baseParam = base.param(i);
			let tempParam = actor.param(i);
			// add
			this.contents.fontSize = 18;
			let typeStr;
			let color;
			if (baseParam == tempParam){
				color = 8;
				typeStr = "";
			}else if (baseParam < tempParam){
				color = 24;
				typeStr = "+";
			}else{
				color = 25;
				typeStr = "-";
			}
			if (oldRoleId != roleId){
				let y2 = y + 20;
				this.changeTextColor(this.textColor(color));
				this.changePaintOpacity(false);
				this.drawText(typeStr, x, y2, spaceWid, 'center');
				this.drawText(Math.abs(tempParam - baseParam), x-2, y2, spaceWid, 'right');
				this.changePaintOpacity(true);
			}else{
				this.changeTextColor(this.normalColor());
			}
			this.contents.fontSize = 28;
			this.drawText(tempParam, x, y, spaceWid, 'right');
			if (bmp){
				this._knsParamSprite[i] = new Sprite(bmp);
				this.addChild(this._knsParamSprite[i]);
			}
			const sp = this._knsParamSprite[i];
			sp.x = x + colWidth - 20;
			sp.y = y + 26;
			sp.anchor.x = sp.anchor.y = 0.5;
			sp.scale.x = sp.scale.y = 0;
			sp.rotation = Math.PI;
			sp._knsIndex = i * -2;
			let spIdx = Game_Actor.knsGetRoleParam(actor.knsGetRoleId(), i);
			sp.setFrame(32 * (spIdx == 0 ? 2 : spIdx - 1), 0, 32, 40);
		}
		this.resetFontSettings();
	}
	update(){
		super.update();
		this.updateKnsParamSprites();
	}
	updateKnsParamSprites(){
		if (!this._knsParamSprite) return;
		const max = 15;
		this._knsParamSprite.forEach(function(sp){
			if (sp._knsIndex < 0){
				sp._knsIndex++;
			}else if (sp._knsIndex < max){
				const rate = ++sp._knsIndex / max;
				sp.rotation = sp.rotation - sp.rotation * rate;
				sp.scale.x = sp.scale.y = Math.min(rate * 2, 1);
			}
		})
	}
}


//================================================
// new Scene_Role < Scene_MenuBase
//================================================
class Scene_Role extends Scene_MenuBase{
	create(){
		super.create();
		this.createHelpWindow();
		this.knsCreateInfoWindow();
		this.knsCreateRoleSelect();
		// start
		this._gotoCnt = 0;
		this.knsCreateBackBlacks(
			this._helpWindow.y + this._helpWindow.height,
			this._infoWindow.height
		);
		this.pushKnsSlide(this._helpWindow, 2);
		this.pushKnsSlide(this._infoWindow, 8);
		this.knsCreateCancelButton([this._roleSelectWindow]);
		this.setBackgroundOpacity(128);
		this.updateActor();
	}
	createHelpWindow() {
		this._helpWindow = new Window_Help(1);
		this._helpWindow.opacity = 0;
		this.addWindow(this._helpWindow);
	};
	knsCreateInfoWindow(){
		this._infoWindow = new Window_RoleInfo(200);
		this._infoWindow.opacity = 0;
		this.addWindow(this._infoWindow);
	}
	knsCreateRoleSelect(){
		let y = this._helpWindow.y + this._helpWindow.height;
		let height = Graphics.height - y - this._infoWindow.height;
		this._roleSelectWindow = new Window_RoleSelect(y, height);
		this._roleSelectWindow.setHandler('ok', this.onSelectOk.bind(this));
		this._roleSelectWindow.setHandler('cancel', this.popScene.bind(this));
		this._roleSelectWindow.setHandler('pageup', this.previousActor.bind(this));
		this._roleSelectWindow.setHandler('pagedown', this.nextActor.bind(this));
		this._roleSelectWindow.y = Graphics.height;
		this._roleSelectWindow.setHelpWindow(this._helpWindow, this._infoWindow);
		this.addWindow(this._roleSelectWindow);
	}
	onSelectOk(){
		let roleId = this._characterSpriteLayer.setOk(this._roleSelectWindow.index());
		if (roleId === undefined){
			this._roleSelectWindow.activate();
			this._helpWindow.setText(KNS_TERMS.ROLE_ALREADY);
		}else{
			this._helpWindow.setText(KNS_TERMS.ROLE_CHANGE);
			this._actor.knsSetRoleId(roleId);
			this._actor.refresh();
			this._roleSelectWindow.deactivate();
			// scene
			this._gotoCnt = 45;
			SceneManager.push(Scene_Equip);
			SceneManager._stack.pop();
		}
	}
	isBusy(){
		if (!super.isBusy()){
			if (this._gotoCnt > 0){
				this._gotoCnt--;
			}else{
				return false;
			}
		}
		return true;
	};	
	createBackground(){
		super.createBackground();
		this._characterSpriteLayer = new Spriteset_RoleCharacters();
		this.addChild(this._characterSpriteLayer);

		const bmp = ImageManager.loadSystem('roleArrows');
		this._arrowSprite1 = new Sprite(bmp);
		this._arrowSprite1.x = 10;
		this._arrowSprite1.y = 120;

		this._arrowSprite2 = new Sprite(bmp);
		this._arrowSprite2.x = Graphics.width - this._arrowSprite1.x;
		this._arrowSprite2.y = this._arrowSprite1.y;
		this._arrowSprite2.scale.x = -1;
		this.addChild(this._arrowSprite1, this._arrowSprite2);
	}
	updateActor(){
		super.updateActor();
		if (this._characterSpriteLayer){
			this._characterSpriteLayer.setActor(this._actor);
		}
		if (this._roleSelectWindow){
			this._roleSelectWindow.setActor(this._actor);
			this._roleSelectWindow.activate();
		}
	}
	update(){
		super.update();
		if (this._characterSpriteLayer && this._roleSelectWindow){
			this._characterSpriteLayer.updateIndex(this._roleSelectWindow);
		}
	}
};

class Spriteset_RoleCharacters extends Sprite{
	knsMaxFrame(){ return 20; }
	knsOriginX(){ return Graphics.width >> 1; }
	knsOriginY(){ return (Graphics.height >> 1) + 10; }
	constructor(){
		super();
		this._actor = null;
		this._knsLastIndex = -1;
		this._knsCnt = this.knsMaxFrame();
		this._characterSprites = [];
		this.createLightSprite();
	}
	createLightSprite(){
		let width = 110;
		let height = 242;
		let radius = 60;
		this._lightSprite = new Sprite(new Bitmap(width << 1, height + radius));
		this._lightSprite.smooth = true;

		const ctx = this._lightSprite.bitmap._context;
		if (ctx){
			const grad = ctx.createLinearGradient(0, 0, 0, 128);
			grad.addColorStop(0.0, '#ffff0000');
			grad.addColorStop(1.0, '#ffff00ff');
			ctx.fillStyle = grad;
			ctx.beginPath();
			let pad = 0.1;
			ctx.ellipse(width, height, width, radius, 0, -pad, Math.PI+pad);
			ctx.lineTo(width, 0);
			ctx.fill();
			ctx.closePath();
		}
		this._lightSprite.bitmap._setDirty();
		this._lightSprite.x = this.knsOriginX();
		this._lightSprite.y = this.knsOriginY() - height + 50;
		this._lightSprite.anchor.x = 0.5;
		this._lightSprite.opacity = 128;
		this._lightSprite.blendMode = 3;
	}
	setActor(actor){
		if (this._actor == actor){ return; }
		this._actor = actor;
		this._characterSprites = [];
		this.removeChildren();
		if (!actor){ return; }
		const ox = this.knsOriginX(), oy = -10;//this.knsOriginY();
		Game_Actor.KnsRoleList.forEach(function(roleId){
			const chara = new Game_MenuCharacter(actor.actorId(), roleId);
			chara._x = chara._realX = ox;
			chara._y = chara._realY = oy;
			const sp = new Sprite_Character(chara);
			sp.scale.x = sp.scale.y = 1.25;
			this._characterSprites.push(sp);
		}, this);
		this.calcPosition();
	}
	setOk(index){
		if (this._actor){
			let roleId = Game_Actor.KnsRoleList[index];
			const sp = this._characterSprites[index];
			if (sp){
				if (roleId == this._actor.knsGetRoleId()){
					sp._character.setKnsMode('damage');
				}else{
					sp._character.setKnsMode('thrust');
					return roleId;
				}
			}
		}
		return undefined;
	}
	updateIndex(window){
		this.updateTouchIndex(window);
		const index = window.index();
		if (this._knsLastIndex != index){
			this._knsLastIndex = index;
			this.calcPosition();
		}
	}
	updateTouchIndex(window){
		if (!(window.active && TouchInput.isTriggered())){
			return;
		}
		let found = -1;
		let foundY = -1;
		for (let i = 0; i < this._characterSprites.length; i++){
			const sp = this._characterSprites[i];
			if (sp._character && sp._character.knsIsClicked(sp.scale.x, this.x, this.y)){
				const spY = sp._character.screenY();
				if (foundY < spY){
					foundY = spY;
					found = i;
				}
			}
		}
		if (found != -1){
			if (window.index() == found){
				window.processOk();
			}else{
				SoundManager.playCursor();
				window.select(found);
			}
			return;
		}
		let pad = 80;
		if (TouchInput.x < pad){
			window.processPageup();
		}else if ( + pad > Graphics.width){
			window.processPagedown();
		}
	}
	calcPosition(){
		this._knsCnt = 0;
		const math = Math.PI * 2 / Game_Actor.KnsRoleList.length;
		const ox = this.knsOriginX(), oy = this.knsOriginY();
		this._characterSprites.forEach(function(sp, n){
			const rate = (this._knsLastIndex - n) * math;
			sp._knsTx = ox + Math.sin(rate) * -240;
			sp._knsTy = oy + Math.cos(rate) * 64;
			if (sp._character){
				sp._character.setKnsMode(
					n == this._knsLastIndex ? 'evade' : 'jump'
				);
			}
		}, this);
	}
	update(){
		super.update();
		this.updateCharacters();
		this.updatePosition();
	}
	updateCharacters(){
		this._characterSprites.forEach(function(sp){
			if (sp._character){
				sp._character.update();
			}
		}, this);
	}
	updatePosition(){
		const max = this.knsMaxFrame();
		if (this._knsCnt >= max){
			return;
		}
		const rate = ++this._knsCnt / max;
		this._characterSprites.forEach(function(sp){
			const chara = sp._character;
			chara._x = chara._realX = (sp._knsTx - chara._x) * rate + chara._x;
			chara._y = chara._realY = (sp._knsTy - chara._y) * rate + chara._y;
			sp._knsZ = Math.floor(chara._y);
		}, this);
		this.removeChildren();
		this.addChild(
			...Array.from(this._characterSprites).sort(
				function(a, b){ return a._knsZ - b._knsZ; }
			), this._lightSprite
		);
		if (
			typeof this._knsLastIndex == 'number' && 
			this._characterSprites[this._knsLastIndex]
		){
			this.addChild(this._characterSprites[this._knsLastIndex]);
		}
	}
}

//===========================================
// new Game_MenuActor
//===========================================
class Game_MenuCharacter extends Game_Character{
	//===========================================
	// properties
	//===========================================
	actorId()	{ return this._actorId; }
	actor()		{ return $gameActors.actor(this.actorId()); }

	screenX()	{ return Math.round(this._realX); }
	screenY()	{ return Math.round(this._realY - this.jumpHeight()); }
	screenZ()	{ return 5; }
	isMoving()	{ return false; }
	updateKnsWalk(){}
	//===========================================
	// initialize
	//===========================================
	constructor(id, roleId){
		super();
		this._actorId = id;
		const actor = this.actor();
		this.knsSetActor(actor, true);
		this._knsRoleId = roleId;
		this.setDirection(4);
		this.setInitWeapon(roleId);
		this.requestBalloon(1);
	}
	setInitWeapon(roleId){
		const currentRole = this.actor().knsGetRoleId();
		if (currentRole != roleId){
			switch(roleId){
				case 1: this._knsWeaponId = 10; break;
				case 2: this._knsWeaponId = 33; break;
				case 3: this._knsWeaponId = 26; break;
				case 4: this._knsWeaponId = 41; break;
				case 5: this._knsWeaponId = 50; break;
				case 6: this._knsWeaponId = 57; break;
				case 7: this._knsWeaponId = 65; break;
				default: this._knsWeaponId = 2; break;
			}
		}
	}
};