(function(){
//===========================================
// alias Game_Party
//===========================================
Game_Party.prototype.setupBattleTestItems = function(){
	function gainItems(list){
		list.forEach(function(item){
			if (item && item.name.length > 0) {
				this.gainItem(item, this.maxItems(item));
			}
		}, $gameParty);
	}
	gainItems($dataItems);
	gainItems($dataWeapons);
	gainItems($dataArmors);
}


//============================================
// alias Game_Action
//============================================
// damage
Game_Action.KNS_CRITICAL_RATE = 1;
Game_Action.KNS_ELEMENT_RATE = 1;

Game_Action.prototype.makeDamageValue = function(target, critical) {
	var item = this.item();
	Game_Action.KNS_CRITICAL_RATE = critical ? 2.5 : 1;
	Game_Action.KNS_ELEMENT_RATE = this.calcElementRate(target);
	var value = this.evalDamageFormula(target);
	if (this.isPhysical()){ value *= target.pdr; }
	if (this.isMagical()) { value *= target.mdr; }
	if (value < 0) { value *= target.rec; }
	value = this.applyVariance(value, item.damage.variance);
	value = this.applyGuard(value, target);
	value = Math.round(value);
	if (target.isHealElement(item)){
		value *= -1;
	}
	return value;
};

//============================================
// alias Game_Battler
//============================================
Game_Battler.prototype.isHealElement = function(item){
	const itemElId = item.damage.elementId;
	if (itemElId < 0) return false;
	return this.traitObjects().some(function(obj){
		if (obj && obj.meta.heal){
			if (typeof obj.meta.heal == 'string'){
				obj.meta.heal = eval('[' + obj.meta.heal + ']');
			}
			return obj.meta.heal.includes(itemElId)
		}
		return false;
	});
};

Game_Battler.prototype.normalAttackDamage = function(enemy, atkPower, defPower, isMagic){
	// 飛び道具
	// atk x1.25 def x0.75
	if (isMagic){
		atk = this.mat * (atkPower || 1);
		def = enemy.mdf * (defPower || 0);
	}else{
		atk = this.atk * (atkPower || 1);
		def = enemy.def * (defPower || 0);
	}
	return this.calcKnsDamage(atk, def);
}
Game_Battler.prototype.physicalDamage = function(enemy, atkPower, defPower, add){
	const atk = this.atk * (atkPower || 1);
	const def = enemy.def * (defPower || 0);
	return this.calcKnsDamage(atk, def, add);
}
Game_Battler.prototype.magicalDamage = function(enemy, atkPower, defPower, add){
	const atk = this.mat * (atkPower || 1);
	const def = enemy.mdf * (defPower || 0);
	return this.calcKnsDamage(atk, def, add);
}
Game_Battler.prototype.calcKnsDamage = function(atk, def, add){
	const rate = Game_Action.KNS_CRITICAL_RATE * Game_Action.KNS_ELEMENT_RATE;
	return atk * rate - def + (add || 0);
}


//============================================
// alias Game_Actor
//============================================
// normal attack
Game_Actor.prototype.attackSkillId = function() {
	let magicAttack, entireAttack;
	this.equips().forEach(function(item){
		if (item){
			if (item.meta.magicAttack){ magicAttack = true; }
			if (item.meta.entireAttack){ entireAttack = true; }
		}
	}, this);
	if (magicAttack && entireAttack){
		return 13;
	}else if(entireAttack){
		return 12;
	}else if(magicAttack){
		return 11;
	}else{
		return 1;
	}
};

//============================================
// alias Scene_Battle
//============================================
const _Scene_Battle_commandAttack = Scene_Battle.prototype.commandAttack;
Scene_Battle.prototype.commandAttack = function(){
	BattleManager.inputtingAction().setAttack();
	const action = BattleManager.inputtingAction();
	if (action.needsSelection() && action.isForOpponent()){
		_Scene_Battle_commandAttack.call(this);
	}else{
		this.onSelectAction();
	}
};

Scene_Battle.prototype.update = function() {
	var active = this.isActive();
	$gameTimer.update(active);
	$gameScreen.update();
	this.updateStatusWindow();
	this.updateWindowPositions();
	if (active && !this.isBusy()) {
		this.updateBattleProcess();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Battle.prototype.updateBattleProcess = function() {
	if (!this.isAnyInputWindowActive() || BattleManager.isAborting() ||
			BattleManager.isBattleEnd()) {
		BattleManager.update();
		this.changeInputWindow();
	}
};

Scene_Battle.prototype.isAnyInputWindowActive = function() {
	return (this._partyCommandWindow.active ||
			this._actorCommandWindow.active ||
			this._skillWindow.active ||
			this._itemWindow.active ||
			this._actorWindow.active ||
			this._enemyWindow.active);
};

Scene_Battle.prototype.changeInputWindow = function() {
	if (BattleManager.isInputting()) {
		if (BattleManager.actor()) {
			this.startActorCommandSelection();
		} else {
			this.startPartyCommandSelection();
		}
	} else {
		this.endCommandSelection();
	}
};

Scene_Battle.prototype.stop = function() {
	Scene_Base.prototype.stop.call(this);
	if (this.needsSlowFadeOut()) {
		this.startFadeOut(this.slowFadeSpeed(), false);
	} else {
		this.startFadeOut(this.fadeSpeed(), false);
	}
	this._statusWindow.close();
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
};

Scene_Battle.prototype.terminate = function() {
	Scene_Base.prototype.terminate.call(this);
	$gameParty.onBattleEnd();
	$gameTroop.onBattleEnd();
	AudioManager.stopMe();

	ImageManager.clearRequest();
};

Scene_Battle.prototype.needsSlowFadeOut = function() {
	return (SceneManager.isNextScene(Scene_Title) ||
			SceneManager.isNextScene(Scene_Gameover));
};

Scene_Battle.prototype.updateStatusWindow = function() {
	if ($gameMessage.isBusy()) {
		this._statusWindow.close();
		this._partyCommandWindow.close();
		this._actorCommandWindow.close();
	} else if (this.isActive() && !this._messageWindow.isClosing()) {
		this._statusWindow.open();
	}
};

Scene_Battle.prototype.updateWindowPositions = function() {
	var statusX = 0;
	if (BattleManager.isInputting()) {
		statusX = this._partyCommandWindow.width;
	} else {
		statusX = this._partyCommandWindow.width / 2;
	}
	if (this._statusWindow.x < statusX) {
		this._statusWindow.x += 16;
		if (this._statusWindow.x > statusX) {
			this._statusWindow.x = statusX;
		}
	}
	if (this._statusWindow.x > statusX) {
		this._statusWindow.x -= 16;
		if (this._statusWindow.x < statusX) {
			this._statusWindow.x = statusX;
		}
	}
};

Scene_Battle.prototype.startPartyCommandSelection = function() {
	this.refreshStatus();
	this._statusWindow.deselect();
	this._statusWindow.open();
	this._actorCommandWindow.close();
	this._partyCommandWindow.setup();
};

Scene_Battle.prototype.startActorCommandSelection = function() {
	this._statusWindow.select(BattleManager.actor().index());
	this._partyCommandWindow.close();
	this._actorCommandWindow.setup(BattleManager.actor());
};

Scene_Battle.prototype.selectPreviousCommand = function() {
	BattleManager.selectPreviousCommand();
	this.changeInputWindow();
};

Scene_Battle.prototype.selectActorSelection = function() {
	this._actorWindow.refresh();
	this._actorWindow.show();
	this._actorWindow.activate();
};

Scene_Battle.prototype.onActorOk = function() {
	var action = BattleManager.inputtingAction();
	action.setTarget(this._actorWindow.index());
	this._actorWindow.hide();
	this._skillWindow.hide();
	this._itemWindow.hide();
	this.selectNextCommand();
};

Scene_Battle.prototype.onActorCancel = function() {
	this._actorWindow.hide();
	switch (this._actorCommandWindow.currentSymbol()) {
	case 'skill':
		this._skillWindow.show();
		this._skillWindow.activate();
		break;
	case 'item':
		this._itemWindow.show();
		this._itemWindow.activate();
		break;
	}
};

Scene_Battle.prototype.selectEnemySelection = function() {
	this._enemyWindow.refresh();
	this._enemyWindow.show();
	this._enemyWindow.select(0);
	this._enemyWindow.activate();
};

Scene_Battle.prototype.onEnemyOk = function() {
	var action = BattleManager.inputtingAction();
	action.setTarget(this._enemyWindow.enemyIndex());
	this._enemyWindow.hide();
	this._skillWindow.hide();
	this._itemWindow.hide();
	this.selectNextCommand();
};

Scene_Battle.prototype.onEnemyCancel = function() {
	this._enemyWindow.hide();
	switch (this._actorCommandWindow.currentSymbol()) {
	case 'attack':
		this._actorCommandWindow.activate();
		break;
	case 'skill':
		this._skillWindow.show();
		this._skillWindow.activate();
		break;
	case 'item':
		this._itemWindow.show();
		this._itemWindow.activate();
		break;
	}
};

Scene_Battle.prototype.onSkillOk = function() {
	var skill = this._skillWindow.item();
	var action = BattleManager.inputtingAction();
	action.setSkill(skill.id);
	BattleManager.actor().setLastBattleSkill(skill);
	this.onSelectAction();
};

Scene_Battle.prototype.onSkillCancel = function() {
	this._skillWindow.hide();
	this._actorCommandWindow.activate();
};

Scene_Battle.prototype.onItemOk = function() {
	var item = this._itemWindow.item();
	var action = BattleManager.inputtingAction();
	action.setItem(item.id);
	$gameParty.setLastItem(item);
	this.onSelectAction();
};

Scene_Battle.prototype.onItemCancel = function() {
	this._itemWindow.hide();
	this._actorCommandWindow.activate();
};

Scene_Battle.prototype.onSelectAction = function() {
	var action = BattleManager.inputtingAction();
	this._skillWindow.hide();
	this._itemWindow.hide();
	if (!action.needsSelection()) {
		this.selectNextCommand();
	} else if (action.isForOpponent()) {
		this.selectEnemySelection();
	} else {
		this.selectActorSelection();
	}
};

Scene_Battle.prototype.endCommandSelection = function() {
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
	this._statusWindow.deselect();
};

})();