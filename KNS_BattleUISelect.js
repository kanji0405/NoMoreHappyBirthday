(function(){
//===========================================
// alias Game_Action
//===========================================
// switch target
Game_Action.prototype.knsChangeSwitch = function() {
	this._knsSwitchParty = !this._knsSwitchParty;
};

Game_Action.prototype.knsClearSwitch = function() {
	this._knsSwitchParty = false;
};

Game_Action.prototype.knsSwitchTarget = function(func, args){
	if (this._knsSwitchParty == true){
		const _opponents = this.opponentsUnit;
		const _friends = this.friendsUnit;
		this.opponentsUnit = _friends;
		this.friendsUnit = _opponents;
		// old method
		const result = func.apply(this, args);
		// over
		this.opponentsUnit = _opponents;
		this.friendsUnit = _friends;
		return result;
	}else{
		return func.apply(this, args);
	}
}

const _Game_Action_decideRandomTarget = Game_Action.prototype.decideRandomTarget;
Game_Action.prototype.decideRandomTarget = function(){
	return this.knsSwitchTarget(_Game_Action_decideRandomTarget, arguments);
};

const _Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
Game_Action.prototype.targetsForOpponents = function(){
	return this.knsSwitchTarget(_Game_Action_targetsForOpponents, arguments);
};

const _Game_Action_targetsForFriends = Game_Action.prototype.targetsForFriends;
Game_Action.prototype.targetsForFriends = function(){
	return this.knsSwitchTarget(_Game_Action_targetsForFriends, arguments);
};

//===========================================
// alias Game_Unit
//===========================================
Game_Unit.prototype.knsSelectAll = function(){
	this.members().forEach(function(member){ member.select(); });
};

//===========================================
// new Window_KnsBattleSelect
//===========================================
class Window_KnsBattleSelect extends Window_Selectable{
	// disable
	updateCursor(){};
	_refreshArrows(){};
	// base settings
	numVisibleRows(){ return 1; };
	maxCols(){ return 1; };
	windowWidth(){ return Graphics.width - 70; }
	windowHeight(){ return this.fittingHeight(this.numVisibleRows()); };
	refreshDimmerBitmap() {
		if (this._dimmerSprite) {
			const bmp = this._dimmerSprite.bitmap;
			const w = this.width;
			const h = this.height;
			const m = 24;
			bmp.resize(w, h);
			const color1 = this.dimColor1();
			const color2 = this.dimColor2();
			bmp.knsUpperGradient(0, 0, w, h, m, color1, color2);
			this._dimmerSprite.setFrame(0, 0, w, h);
			this._dimmerSprite.scale.x = 1.5;
		}
	};
	// property
	maxItems(){ return this._candidates ? this._candidates.length : 0; };
	actor(){ return this._candidates ? this._candidates[this.index()] : null; }

	// original
	knsAction(){ return this._action; }
	knsIsSwitchable(){
		const action = this.knsAction();
		return action && !action.isForUser();
	}
	knsIsRangeSingle(){
		const action = this.knsAction();
		return action && action.isForOne() && !action.isForRandom() ? action : null;
	}
	// abstract
	knsUnit(){ return null; }
	knsMembers(){ return null; }
	knsChangeTerm(){ return ''; }

	// init
	initialize(){
		this._candidates = [];
		this._action = null;
		super.initialize(0, 0, this.windowWidth(), this.windowHeight());
		this.setBackgroundType(1);
		this.hide();
		this.refresh();
	}
	// display
	refresh(){
		this._candidates = this.knsMembers();
		const action = this.knsIsRangeSingle();
		if (action){
			if (action.isForUser()){
				this._candidates = [action.subject()];
			}
		}else{
			this._candidates = [this._candidates[0]];
		}
		super.refresh();
	};
	drawItem(index){
		this.resetFontSettings();
		const rect = this.itemRectForText(index);
		const actor = this._candidates[index];
		const action = this.knsAction();
		if (actor && action){
			this.contents.fontSize = 25;
			const isEnemy = actor.friendsUnit() == $gameTroop;
			if (action.isForAll()){
				let text = KNS_TERMS['TARGET_ALL_' + (isEnemy ? 'ENEMY' : 'ACTOR')];
				this.drawText(text, rect.x, rect.y, rect.width, 'center');
			}else if(action.isForRandom()){
				let text = KNS_TERMS['TARGET_RANDOM_' + (isEnemy ? 'ENEMY' : 'ACTOR')];
				this.drawText(text, rect.x, rect.y, rect.width, 'center');
			}else{
				let nameWidth = 230;
				this.drawText(actor.name(), rect.x, rect.y, nameWidth - 4);
				this.contents.fontSize = 22;
				let gaugeY = rect.y - 6;
				let gaugeX = rect.x + nameWidth;
				this.drawActorIcons(actor, gaugeX, rect.y, Window_Base._iconWidth);
				gaugeX += Window_Base._iconWidth;
				this.drawActorHp(actor, gaugeX + 4, gaugeY, 144);
				this.drawActorMp(actor, gaugeX + 154, gaugeY, 144);
			}
		}
		if (this.knsIsSwitchable()){
			let w = 128;
			this.contents.fontSize = 20;
			this.drawText(this.knsChangeTerm(), rect.x + rect.width - w, rect.y, w);
		}
	};
	// control
	select(index) {
		super.select(index);
		if (this.knsIsRangeSingle()){
			this.knsUnit().select(this.actor());
		}else{
			this.knsUnit().knsSelectAll();
		}
	};
	hide() {
		super.hide();
		this.deactivate();
		this.knsUnit().select(null);
	};
	cursorLeft(){
		const max = this.maxItems();
		this.select((this.index() + max - 1) % max);
	}
	cursorRight(){ this.select((this.index() + 1) % this.maxItems()); }
	cursorUp(){ this.cursorLeft(); }
	cursorDown(){ this.cursorRight(); }
	onTouch(){
		this.processPageup();
	}
	// for battle
	knsSetStart(action){
		this._action = action;
		this.refresh();
		this.select(0);
		this.show();
		this.activate();
	}
	selectSprite(index, processOk){
		index = Math.min(this.maxItems()-1, index);
		if (processOk && index == this.index()){
			this.isOkEnabled() && this.processOk();
		}else{
			SoundManager.playCursor();
			this.select(index);
		}
	}
}
//===========================================
// new Window_KnsBattleActor
//===========================================
class Window_KnsBattleActor extends Window_KnsBattleSelect{
	knsUnit(){ return $gameParty; }
	knsMembers(){ return $gameParty.battleMembers(); }
	knsChangeTerm(){ return KNS_TERMS.CHANGE_TARGET_ENEMY; }
	selectSprite(sp, processOk){
		const actor = sp._character;
		if (actor){
			super.selectSprite(actor.actor().index(), processOk);
		}
	}

	cursorLeft(){
		const max = this.maxItems();
		if (max <= 2){
			super.cursorLeft();
		}else{
			this.select((this.index() + max - 2) % max);
		}
	}
	cursorRight(){
		const max = this.maxItems();
		if (max <= 2){
			super.cursorRight();
		}else{
			this.select((this.index() + 2) % max);
		}
	}
	cursorUp(){ super.cursorLeft(); }
	cursorDown(){ super.cursorRight(); }
}

//===========================================
// new Window_KnsBattleEnemy
//===========================================
class Window_KnsBattleEnemy extends Window_KnsBattleSelect{
	knsUnit(){ return $gameTroop; }
	knsMembers(){
		const action = this.knsAction();
		if (action && action.isForDeadFriend()){
			return $gameTroop.members();
		}else{
			return $gameTroop.aliveMembers();
		}
	}
	knsChangeTerm(){ return KNS_TERMS.CHANGE_TARGET_ACTOR; }

	enemyIndex(){
		const enemy = this.actor();
		return enemy ? enemy.index() : -1;
	};
	selectSprite(sp, processOk){
		const actor = sp._enemy;
		if (actor){
			super.selectSprite(this.knsMembers().indexOf(actor), processOk);
		}
	}
}

//===========================================
// alias Spriteset_Battle
//===========================================
Spriteset_Battle.prototype.knsClickedCharacter = function(){
	const clicked = (function(sp, name){
		return	sp.visible == true && sp.opacity > 0 && 
				sp[name].knsIsClicked(sp.scale.x, this.x, this.y);
	}).bind(this);
	const actors = this._actorSprites.filter(
		function(sp){ return clicked(sp, '_character'); }, this);
	const enemies = this._enemySprites.filter(
		function(sp){ return clicked(sp, '_enemy'); }, this);
	return enemies.concat(actors).sort(function(a, b){ return a.y - b.y; })[0];
}

//===========================================
// alias Scene_Battle
//===========================================
const _Scene_Battle_update = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function(){
	_Scene_Battle_update.call(this);
	this.knsUpdateTargetSelect();
}

Scene_Battle.prototype.knsUpdateTargetSelect = function(){
	if (!TouchInput.isTriggered()) return;
	let mainWindow, subWindow;
	if (this._actorWindow.active){
		mainWindow = this._actorWindow;
		subWindow  = this._enemyWindow;
	}else if(this._enemyWindow.active){
		mainWindow = this._enemyWindow;
		subWindow  = this._actorWindow;
	}
	if (mainWindow){
		const enemy = this._spriteset.knsClickedCharacter();
		if (enemy){
			const isActor = enemy._character && 
			enemy._character.constructor.name == 'Game_BattleActor';
			if (mainWindow == (isActor ? this._actorWindow : this._enemyWindow)){
				// selected friend
				if (mainWindow.knsIsSwitchable()){
					mainWindow.selectSprite(enemy, true);
				}
			}else{
				// selected opponent
				const old = SoundManager.playCursor;
				SoundManager.playCursor = function(){};
				mainWindow.processPageup();
				SoundManager.playCursor = old;
				if (subWindow.active){
					subWindow.selectSprite(enemy, false);
				}
			}
		}
	}
}

// actor/party
Scene_Battle.prototype.createActorWindow = function() {
	this._actorWindow = new Window_KnsBattleActor();
	this._actorWindow.setHandler('ok',     this.onActorOk.bind(this));
	this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
	const handle = this.knsSwitchParty.bind(this, 'actor');
	this._actorWindow.setHandler('pageup',   handle);
	this._actorWindow.setHandler('pagedown', handle);
	this.addWindow(this._actorWindow);
};

Scene_Battle.prototype.createEnemyWindow = function() {
	this._enemyWindow = new Window_KnsBattleEnemy();
	this._enemyWindow.setHandler('ok',     this.onEnemyOk.bind(this));
	this._enemyWindow.setHandler('cancel', this.onEnemyCancel.bind(this));
	const handle = this.knsSwitchParty.bind(this, 'enemy');
	this._enemyWindow.setHandler('pageup',   handle);
	this._enemyWindow.setHandler('pagedown', handle);
	this.addWindow(this._enemyWindow);
};

// original
Scene_Battle.prototype.knsSwitchParty = function(type){
	let mainWindow, subWindow;
	if (type == 'actor'){
		mainWindow = this._actorWindow;
		subWindow = this._enemyWindow;
	}else{
		mainWindow = this._enemyWindow;
		subWindow = this._actorWindow;
	}
	if (mainWindow.knsIsSwitchable()){
		const action = BattleManager.inputtingAction();
		if (action){ action.knsChangeSwitch(); }
		mainWindow.hide();
		subWindow.knsSetStart(action);
	}else{
		mainWindow.activate();
	}
}

// reset switched party
Scene_Battle.prototype.knsClearSwitchParty = function(){
    const action = BattleManager.inputtingAction();
    if (action) action.knsClearSwitch();
}

// start
Scene_Battle.prototype.onSelectAction = function(){
	this._skillWindow.hide();
	this._itemWindow.hide();
	this.knsClearSwitchParty();
	const action = BattleManager.inputtingAction();
	if (action.isForOpponent()) {
		this.selectEnemySelection();
	} else {
		this.selectActorSelection();
	}
}

// normal attack
Scene_Battle.prototype.commandAttack = function(){
	BattleManager.inputtingAction().setAttack();
	this._helpWindow.hide();
	this.onSelectAction();
};

// start on actor/enemy window
Scene_Battle.prototype.selectEnemySelection = function() {
	this._enemyWindow.knsSetStart(BattleManager.inputtingAction());
};

Scene_Battle.prototype.selectActorSelection = function() {
	this._actorWindow.knsSetStart(BattleManager.inputtingAction());
};

// cancel on actor/enemy window
const _Scene_Battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
Scene_Battle.prototype.onActorCancel = function() {
	this.knsClearSwitchParty();
	_Scene_Battle_onActorCancel.call(this)
};

const _Scene_Battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
Scene_Battle.prototype.onEnemyCancel = function() {
	this.knsClearSwitchParty();
	_Scene_Battle_onEnemyCancel.call(this)
};
})();