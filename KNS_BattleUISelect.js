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
// alias Window_BattleStatus
//===========================================
Window_BattleStatus.prototype.initialize = function() {
	var width = this.windowWidth();
	var height = this.windowHeight();
	var x = Graphics.boxWidth - width - 4;
	var y = Graphics.boxHeight - height;
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this.refresh();
	this.openness = 0;
	this.setBackgroundType(1);
};

Window_BattleStatus.prototype.standardPadding = function(){ return 12; };
Window_BattleStatus.prototype.numVisibleRows = function(){ return 4; };

Window_BattleStatus.prototype.itemRect = function(index){
	const rect = Window_Selectable.prototype.itemRect.call(this, index);
	rect.y += 24;
	return rect;
};

Window_BattleStatus.prototype.windowWidth = function() {
	return Graphics.boxWidth - 320;
};

Window_BattleStatus.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows() + 1);
};

Window_BattleStatus.prototype.drawItem = function(index) {
	var actor = $gameParty.battleMembers()[index];
	this.drawBasicArea(this.basicAreaRect(index), actor);
	this.drawGaugeArea(this.gaugeAreaRect(index), actor);
};

Window_BattleStatus.prototype.gaugeAreaWidth = function(){ return 330; };
Window_BattleStatus.prototype.basicAreaRect = function(index) {
	var rect = this.itemRectForText(index);
	rect.width -= this.gaugeAreaWidth() + 15;
	return rect;
};

Window_BattleStatus.prototype.gaugeAreaRect = function(index) {
	var rect = this.itemRectForText(index);
	rect.x += rect.width - this.gaugeAreaWidth();
	rect.width = this.gaugeAreaWidth();
	return rect;
};


Window_BattleStatus.prototype.drawBasicArea = function(rect, actor) {
	this.drawActorName(actor, rect.x + 0, rect.y, 150);
	this.drawActorIcons(actor, rect.x + 156, rect.y, rect.width - 156);
};

Window_BattleStatus.prototype.drawGaugeArea = function(rect, actor) {
	this.drawActorHp(actor, rect.x + 0, rect.y, 201);
	this.drawActorMp(actor, rect.x + 216,  rect.y, 114);
};

Window_BattleStatus.prototype.refreshDimmerBitmap = function() {
	if (this._dimmerSprite) {
		const bmp = this._dimmerSprite.bitmap;
		const w = this.width;
		const h = this.height;
		bmp.resize(w, h);
		bmp.knsDownerGradient(0, 0, w, h, 24, this.dimColor1(), this.dimColor2());
		this._dimmerSprite.setFrame(0, 0, w, h);
		this._dimmerSprite.scale.x = 2;
	}
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
	maxItems(){ return this._candidates ? this._candidates.length : 0; };
	actor(){ return this._candidates ? this._candidates[this.index()] : null; }

	// original
	knsAction(){ return this._action; }
	knsIsSwitchable(){
		const action = this.knsAction();
		if (!action || action.isForUser()){
			return false;
		}
		return true;
	}
	// abstract
	knsUnit(){ return null; }
	knsMembers(){ return null; }
	knsChangeTerm(){ return ''; }

	// init
	initialize(){
		super.initialize(0, 0, this.windowWidth(), this.windowHeight());
		this._candidates = [];
		this._action = null;
		this.hide();
		this.refresh();
		this.setBackgroundType(1);
	}
	// display
	refresh() {
		this._candidates = this.knsMembers();
		const action = this.knsAction();
		if (action){
			if (action.isForUser()){
				this._candidates = [action.subject()];
			}else if (!action.isForOne()){
				this._candidates = [this._candidates[0]];
			}
		}
		super.refresh();
	};
	drawItem(index){
		this.resetTextColor();
		const rect = this.itemRectForText(index);
		const actor = this._candidates[index];
		const action = this.knsAction();
		if (actor && action){
			this.contents.fontSize = 25;
			const isEnemy = $gameTroop == actor.friendsUnit();
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
				this.drawActorIcons(actor, gaugeX, rect.y);
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
	show(){
		this.refresh();
		this.select(0);
		super.show();
	};
	select(index) {
		super.select(index);
		const action = this.knsAction();
		if (action && action.isForOne()){
			this.knsUnit().select(this.actor());
		}else{
			this.knsUnit().knsSelectAll();
		}
	};
	hide() {
		super.hide();
		this.knsUnit().select(null);
	};
	cursorLeft(){
		const max = this.maxItems();
		this.select((this.index() + max - 1) % max);
	}
	cursorRight(){ this.select((this.index() + 1) % this.maxItems()); }
	cursorUp(){ this.cursorLeft(); }
	cursorDown(){ this.cursorRight(); }
	cursorPageup(){
		Input.clear();
		TouchInput.clear();
		if (!this.knsIsSwitchable()){
			this.activate();
			return;
		}
		this.select(this.maxItems());
		this.deactivate();
		this.callOkHandler();
	}
	cursorPagedown(){ this.cursorPageup(); }
	onTouch(){}
	refreshDimmerBitmap() {
		if (this._dimmerSprite) {
			const bmp = this._dimmerSprite.bitmap;
			const w = this.width;
			const h = this.height;
			bmp.resize(w, h);
			bmp.knsUpperGradient(0, 0, w, h, 24, this.dimColor1(), this.dimColor2());
			this._dimmerSprite.setFrame(0, 0, w, h);
			this._dimmerSprite.scale.x = 1.5;
		}
	};
	
	// for battle
	knsSwitchIn(action){
		this._action = action;
		this.show();
		this.activate();
	}
	knsSwitchOut(){
		this.hide();
	}
	knsIsSwitchParty(i){
		if (i === undefined) i = this.index();
		return !this._candidates[i];
	}
}
//===========================================
// new Window_KnsBattleActor
//===========================================
class Window_KnsBattleActor extends Window_KnsBattleSelect{
	knsUnit(){ return $gameParty; }
	knsMembers(){ return $gameParty.battleMembers(); }
	knsChangeTerm(){ return KNS_TERMS.CHANGE_TARGET_ENEMY; }
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
}

//===========================================
// alias Spriteset_Battle
//===========================================
Spriteset_Battle.prototype.knsClickedCharacters = function(name){
	this._actorSprites
	this._enemySprites
	const firstArray = this['_' + name + 'Sprite'];
	const secondArray = this['_' + name + 'Sprite'];
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
	if (this._actorWindow.active){
		this.knsClickedCharacters('actor');
	}else if(this._enemyWindow.active){
		this.knsClickedCharacters('enemy');
	}
}


Scene_Battle.prototype.createActorWindow = function() {
	this._actorWindow = new Window_KnsBattleActor();
	this._actorWindow.setHandler('ok',     this.onActorOk.bind(this));
	this._actorWindow.setHandler('cancel', this.onActorCancel.bind(this));
	this.addWindow(this._actorWindow);
};

Scene_Battle.prototype.createEnemyWindow = function() {
	this._enemyWindow = new Window_KnsBattleEnemy();
	this._enemyWindow.setHandler('ok',     this.onEnemyOk.bind(this));
	this._enemyWindow.setHandler('cancel', this.onEnemyCancel.bind(this));
	this.addWindow(this._enemyWindow);
};

// original
Scene_Battle.prototype.knsSwitchParty = function(type){
	const action = BattleManager.inputtingAction();
	if (action){ action.knsChangeSwitch(); }
	if (type == 'actor'){
		this._actorWindow.knsSwitchOut();
		this._enemyWindow.knsSwitchIn(action);
	}else{
		this._enemyWindow.knsSwitchOut();
		this._actorWindow.knsSwitchIn(action);
	}
}

Scene_Battle.prototype.knsClearSwitchParty = function(){
    const action = BattleManager.inputtingAction();
    if (action) action.knsClearSwitch();
}

// start
Scene_Battle.prototype.onSelectAction = function(){
	this.knsClearSwitchParty();
	const action = BattleManager.inputtingAction();
	this._skillWindow.hide();
	this._itemWindow.hide();
	if (action.isForOpponent()) {
		this.selectEnemySelection();
	} else {
		this.selectActorSelection();
	}
}
Scene_Battle.prototype.selectActorSelection = function() {
	this._actorWindow.knsSwitchIn(BattleManager.inputtingAction());
};

Scene_Battle.prototype.selectEnemySelection = function() {
	this._enemyWindow.knsSwitchIn(BattleManager.inputtingAction());
};

// apply
const _Scene_Battle_onActorOk = Scene_Battle.prototype.onActorOk;
Scene_Battle.prototype.onActorOk = function() {
	if (this._actorWindow.knsIsSwitchParty()){
		this.knsSwitchParty('actor');
	}else{
		_Scene_Battle_onActorOk.call(this);
	}
};

const _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
Scene_Battle.prototype.onEnemyOk = function() {
	if (this._enemyWindow.knsIsSwitchParty()){
		this.knsSwitchParty('enemy');
	}else{
		_Scene_Battle_onEnemyOk.call(this);
	}
};

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

// status keep
Scene_Battle.prototype.stop = function() {
	Scene_Base.prototype.stop.call(this);
	if (this.needsSlowFadeOut()) {
		this.startFadeOut(this.slowFadeSpeed(), false);
	} else {
		this.startFadeOut(this.fadeSpeed(), false);
	}
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
};

Scene_Battle.prototype.updateStatusWindow = function(){
	if ($gameMessage.isBusy()) {
		this._partyCommandWindow.close();
		this._actorCommandWindow.close();
	}
};

Scene_Battle.prototype.updateWindowPositions = function(){
	this._statusWindow.x = 0;
};
})();