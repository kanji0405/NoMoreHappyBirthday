//================================================
// - link command with help window
//================================================
class KNS_Menu{
	static linkHelp(klass){
		const oldCommandName = klass.prototype.commandName;
		klass.prototype.commandName = function(index){
			return KNS_TERMS[oldCommandName.call(this, index)];
		}
		klass.prototype.updateHelp = function(){
			let base = oldCommandName.call(this, this.index());
			if (base){
				this._helpWindow.setText(KNS_TERMS[base + '_TEXT']);
			}else{
				this._helpWindow.setText('');
			}
		};
	}
}

;(function(){
//================================================
// alias Window_MenuCommand
//================================================
Window_MenuCommand.prototype.windowWidth = function(){ return Graphics.width; };
Window_MenuCommand.prototype.maxCols = function(){ return 4; };
Window_MenuCommand.prototype.itemTextAlign = function(){ return 'center'; };
Window_MenuCommand.prototype.numVisibleRows = function(){
	return Window_Command.prototype.numVisibleRows.call(this);
};

Window_MenuCommand.prototype.cursorUp = function(){
	this.select((this.index() + this.maxCols()) % this.maxItems());
};
Window_MenuCommand.prototype.cursorDown = function(){
	const max = this.maxItems();
	this.select((this.index() + max - this.maxCols()) % max);
};

KNS_Menu.linkHelp(Window_MenuCommand);
Window_MenuCommand.prototype.makeCommandList = function() {
	this.addCommand('MENU_ITEM',		'item');
	this.addCommand('MENU_EQUIP',		'equip');
	this.addCommand('MENU_SKILL',		'skill');
	this.addCommand('MENU_FORMATION',	'formation');
	this.addCommand('MENU_ROLE',		'role', $gameParty.knsIsRoleCommandEnable());
	this.addCommand('MENU_SAVE',		'save', this.isSaveEnabled());
	this.addCommand('MENU_OPTIONS',		'options');
	this.addCommand('MENU_TITLE',		'gameEnd', this.isGameEndEnabled());
};

//================================================
// alias Window_MenuStatus
//================================================
Window_MenuStatus.prototype.windowWidth = function(){ return Graphics.boxWidth; };
Window_MenuStatus.prototype.windowHeight = function(){ return Graphics.boxHeight - 240; };
Window_MenuStatus.prototype.loadImages = function(){};
Window_MenuStatus.prototype.maxCols = function(){ return 4; };
Window_MenuStatus.prototype.spacing = function(){ return 2; };
Window_MenuStatus.prototype.standardPadding = function(){ return 4; };
Window_MenuStatus.prototype.itemHeight = function(){ return this.contents.height; };

Window_MenuStatus.prototype.drawItem = function(index){
	this.drawItemBackground(index);
	const actor = $gameParty.members()[index];
	if (actor){
		this.changePaintOpacity(actor.isBattleMember());
		const rect = this.itemRect(index);
		rect.width -= 4;
		this.drawActorFaceWithExp(actor, rect.x, rect.y, rect.width);
		// hp
		this.contents.fontSize = 24;
		let gaugeWidth = rect.width - 20;
		let gaugeX = rect.x + (rect.width - gaugeWidth >> 1);
		this.drawActorHp(actor, gaugeX, rect.y + 150, gaugeWidth);
		this.drawActorMp(actor, gaugeX, rect.y + 187, gaugeWidth);
		// job
		this.knsDrawJobGauge(actor, rect.x, rect.y + 276, rect.width);
		this.changePaintOpacity(true);
	}
};

//================================================
// alias Scene_Base
//================================================
Scene_Base.prototype.knsCreateCancelButton = function(parents, flag){
	this.addChild(new Sprite_KnsBackButton(parents, flag));
}

//================================================
// alias Scene_MenuBase
//================================================
const _Scene_MenuBase_update = Scene_MenuBase.prototype.update;
Scene_MenuBase.prototype.update = function(){
	_Scene_MenuBase_update.call(this);
	this.knsUpdateBackgroundOpacity();
	this.knsUpdateSlide();
}

Scene_MenuBase.prototype.knsSetBackgroundOpacity = function(n){
	this._knsBackgroundOpacity = n;
}

Scene_MenuBase.prototype.knsUpdateBackgroundOpacity = function(){
	if (!this._backgroundSprite || this._knsBackgroundOpacity === undefined) return;
	const to = this._knsBackgroundOpacity;
	const offset = 5;

	const bgo = this._backgroundSprite.opacity;
	if (bgo == to){
		this._knsBackgroundOpacity = undefined;
	}else if (bgo > to){
		this._backgroundSprite.opacity = Math.max(bgo - offset, to);
	}else if (bgo.opacity < to){
		this._backgroundSprite.opacity = Math.min(bgo + offset, to);
	}
}

Scene_MenuBase.prototype.pushKnsSlide = function(obj, dir){
	if (typeof this._knsSlideObjects != 'object'){
		this._knsSlideObjects = [];
	}
	let target;
	switch (dir){
		case 2:
			target = obj.y;
			obj.y -= Graphics.height;
			break;
		case 4:
			target = obj.x;
			obj.x -= Graphics.width;
			break;
		case 6:
			target = obj.x;
			obj.x += Graphics.width;
			break;
		case 8:
			target = obj.y;
			obj.y += Graphics.height;
			break;
	};
	this._knsSlideObjects.push([obj, dir, 0, target]);
}

Scene_MenuBase.prototype.knsUpdateSlide = function(){
	if (!this._knsSlideObjects) return;
	const max = 20;
	this._knsSlideObjects.forEach(function(info){
		if (info[2] < max){
			info[2] += 1;
			const rate = info[2] / max;
			const obj = info[0];
			if (info[1] == 4 || info[1] == 6){
				obj.x = obj.x + rate * (info[3] - obj.x);
			}else{
				obj.y = obj.y + rate * (info[3] - obj.y);
			}
		}
	})
}

Scene_MenuBase.prototype.knsCreateBackBlacks = function(uy, ey){
	let padY = 28;
	const upper = new Sprite();
	let index = this.children.indexOf(this._backgroundSprite) + 1;
	if (uy != 0){
		upper.bitmap = new Bitmap(1, uy);
		upper.scale.x = Graphics.width;
		upper.bitmap.knsUpperGradient(
			0, 0, upper.bitmap.width, upper.bitmap.height,
			padY, KNS_COLORS.WINDOW_BACK1, KNS_COLORS.WINDOW_BACK2
		);
		this.addChildAt(upper, index);
		this.pushKnsSlide(upper, 2);
	}

	const downer = new Sprite();
	if (ey != 0){
		downer.bitmap = new Bitmap(1, ey);
		downer.y = Graphics.height - downer.height;
		downer.scale.x = Graphics.width;
		downer.bitmap.knsDownerGradient(
			0, 0, downer.bitmap.width, downer.bitmap.height,
			padY, KNS_COLORS.WINDOW_BACK1, KNS_COLORS.WINDOW_BACK2
		);
		this.addChildAt(downer, index);
		this.pushKnsSlide(downer, 8);
	}
	return [upper, downer];
}

//=============================================
// alias Scene_Boot
//=============================================
const _Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages = function() {
	_Scene_Boot_loadSystemImages.call(this);
	const oldVolume = Scene_Map.CALL_MENU_SE.volume;
	Scene_Map.CALL_MENU_SE.volume = 0;
	AudioManager.playSe(Scene_Map.CALL_MENU_SE);
	Scene_Map.CALL_MENU_SE.volume = oldVolume;
};

//================================================
// alias Scene_Map
//================================================
Scene_Map.CALL_MENU_SE = { name: '108-Heal04', volume: 80, pitch: 100, pan: 0 };

const _Scene_Map_callMenu = Scene_Map.prototype.callMenu;
Scene_Map.prototype.callMenu = function() {
	Scene_Menu.KNS_CALLED_FROM_MAP = true;
	const oldSound = SoundManager.playOk;
	SoundManager.playOk = AudioManager.playSe.bind(AudioManager, Scene_Map.CALL_MENU_SE);
	_Scene_Map_callMenu.call(this);
	SoundManager.playOk = oldSound;
};

//================================================
// alias Scene_Menu
//================================================
Scene_Menu.KNS_CALLED_FROM_MAP = false;
Scene_Menu.prototype.createHelpWindow = function() {
	this._helpWindow = new Window_Help(1);
	this._helpWindow.opacity = 0;
	this.addWindow(this._helpWindow);
};

const _Scene_Menu_create = Scene_Menu.prototype.create;
Scene_Menu.prototype.create = function() {
	_Scene_Menu_create.call(this);
	this.createHelpWindow();
	this._commandWindow.y = this._helpWindow.height - 24;
	this._commandWindow.setHandler('role', this.commandPersonal.bind(this));
	this._commandWindow.opacity = 0;
	this._commandWindow.setHelpWindow(this._helpWindow);

	this._statusWindow.x = 0;
	this._statusWindow.y = this._commandWindow.y + this._commandWindow.height - 10;
	this._statusWindow.opacity = 0;

	this._goldWindow.x = Graphics.width - this._goldWindow.width;
	this._goldWindow.opacity = 0;

	this._knsPlaytimeWindow = new Window_Playtime(
		this._goldWindow.width, this._goldWindow.height
	);
	this._knsPlaytimeWindow.opacity = 0;
	this.addChild(this._knsPlaytimeWindow);

	let mapWidth = 400;
	this._knsMapNameWindow = new Window_Base(
		Graphics.width - mapWidth >> 1, this._goldWindow.y,
		mapWidth, this._goldWindow.height
	);
	this._knsMapNameWindow.drawText($gameMap.displayName(),
		0, 0, this._knsMapNameWindow.contents.width, 'center'
	);
	this._knsMapNameWindow.opacity = 0;
	this.addChild(this._knsMapNameWindow);

	const upper = this.knsCreateBackBlacks(
		this._commandWindow.y + this._commandWindow.height,
		Graphics.height - this._goldWindow.y
	)[0];
	upper.bitmap.fillRect(0, 55, 1, 1, 'white');
	this.pushKnsSlide(this._helpWindow, 2);
	this.pushKnsSlide(this._commandWindow, 2);
	this.pushKnsSlide(this._statusWindow, 6);
	this.pushKnsSlide(this._goldWindow, 8);
	this.pushKnsSlide(this._knsMapNameWindow, 8);
	this.pushKnsSlide(this._knsPlaytimeWindow, 8);
	this.knsCreateCancelButton([this._commandWindow, this._statusWindow], Scene_Menu.KNS_CALLED_FROM_MAP);

	this._knsCreateSpritesetLogInfo();
	this._logSpriteset.y = 410;

	if (Scene_Menu.KNS_CALLED_FROM_MAP){
		this.knsShowInfo($gameVariables.value(6));
		Scene_Menu.KNS_CALLED_FROM_MAP = false;
		this.knsSetBackgroundOpacity(128);
	}else{
		this.setBackgroundOpacity(128);
	}
};

const _Scene_Menu_commandFormation = Scene_Menu.prototype.commandFormation;
Scene_Menu.prototype.commandFormation = function() {
	_Scene_Menu_commandFormation.call(this);
	this._logSpriteset.visible = false;
	this._helpWindow.setText(KNS_TERMS.MENU_SELECT);
};
const _Scene_Menu_commandPersonal = Scene_Menu.prototype.commandPersonal;
Scene_Menu.prototype.commandPersonal = function() {
	_Scene_Menu_commandPersonal.call(this);
	this._logSpriteset.visible = false;
	this._helpWindow.setText(KNS_TERMS.MENU_SELECT);
};

// command
const _Scene_Menu_onPersonalOk = Scene_Menu.prototype.onPersonalOk;
Scene_Menu.prototype.onPersonalOk = function() {
	if (this._commandWindow.currentSymbol() == 'role'){
		SceneManager.push(Scene_Role);
	}else{
		_Scene_Menu_onPersonalOk.call(this);
	}
};
const _Scene_Menu_onFormationOk = Scene_Menu.prototype.onFormationOk;
Scene_Menu.prototype.onFormationOk = function() {
	const pendingIndex = this._statusWindow.pendingIndex();
	if (pendingIndex >= 0){
		this._helpWindow.setText(KNS_TERMS.MENU_SELECT);
	}else{
		this._helpWindow.setText(KNS_TERMS.MENU_FORMATION_PENDING);
	}
	_Scene_Menu_onFormationOk.call(this);
};

Scene_Menu.prototype.commandOptions = function() {
	SceneManager.push(Scene_KnsGallery);
};
})();