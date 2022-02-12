(function(){
"use strict";
//===========================================
// alias Game_Actor
//===========================================
Game_Actor.prototype.shouldDisplayLevelUp = function(){ return false; };
//===========================================
// alias Game_Party
//===========================================
Game_Party.prototype.name = function(){
	const members = this.battleMembers();
	if (members.length == 0) {
		return '';
	} else if (members.length == 1) {
		return members[0].name();
	} else {
		return KNS_TERMS.BATTLE_PARTY_NAME.replace('%s', members[0].name());
	}
};
//===========================================
// alias Game_Troop
//===========================================
Game_Troop.prototype.name = function() {
	const members = this.members();
	if (members.length == 0) {
		return '';
	} else if (members.length == 1) {
		return members[0].name();
	} else {
		return KNS_TERMS.BATTLE_TROOP_NAME.replace('%s', members[0].originalName());
	}
};

//===========================================
// alias BattleManager
//===========================================
// display
BattleManager.knsPushBattleLog = function(text, until){
	this._logWindow.push('addText', 
	text.replace('%a', $gameParty.name()).replace('%e', $gameTroop.name())
	);
	if (until === true){
		this._logWindow.push('waitUntil');
	}else{
		this._logWindow.push('wait', until);
	}
	this._logWindow.push('clear');
}

BattleManager.displayStartMessages = function() {
	if (this._preemptive) {
		this.knsPushBattleLog(KNS_TERMS.BATTLE_PREEMPTIVE);
	} else if (this._surprise) {
		this.knsPushBattleLog(KNS_TERMS.BATTLE_SURPRISE);
	}else{
		this.knsPushBattleLog(KNS_TERMS.BATTLE_ENCOUNTER);
	}
};

BattleManager.displayVictoryMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_VICTORY, 45);
};

BattleManager.displayDefeatMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_DEFEAT, true);
};

BattleManager.displayEscapeSuccessMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_ESCAPE, true);
};

BattleManager.displayEscapeFailureMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_ESCAPE_FAILURE);
};

//===========================================
// alias Window_BattleLog
//===========================================
Window_BattleLog.prototype.setSpriteset = function(spriteset){ this._spriteset = spriteset; };
Window_BattleLog.prototype.windowWidth = function(){ return Graphics.boxWidth; };
Window_BattleLog.prototype.windowHeight = function(){ return this.fittingHeight(this.maxLines()); };
Window_BattleLog.prototype.maxLines = function(){ return 10; };
Window_BattleLog.prototype.lineHeight = function(){ return 58; };

Window_BattleLog.prototype.animationBaseDelay = function(){ return 0; };
Window_BattleLog.prototype.animationNextDelay = function(){ return 8; };

Window_BattleLog.prototype.numLines = function(){ return this._lines.length; };
Window_BattleLog.prototype.messageSpeed = function(){ return 16; };

Window_BattleLog.prototype.wait = function(n) {
	this._waitCount = n == undefined ? this.messageSpeed() : n;
};

Window_BattleLog.prototype.waitUntil = function(){
	this._knsWaitUntil = 15;
};

// knsSetResult
Window_BattleLog.prototype.knsSetResult = function(spriteset){
	this._knsResult = spriteset;
}

Window_BattleLog.prototype.knsStartResult = function(){
	this._knsResult.knsStart();
}

Window_BattleLog.prototype.knsRoleLevelUp = function(actor, level){
	const bactor = $gameBattleActors.actor(actor.actorId());
	bactor.setKnsMode('evade');
	actor.startAnimation(97);
	const roleId = actor.knsGetRoleId();
	this.addText(KNS_TERMS.RESULT_ROLE_LEVELUP.format(actor.name(), 
		actor.knsGetRoleName(roleId), actor.knsGetRoleLevel(roleId)
	));
	this.waitUntil(5);
}

const _Window_BattleLog_updateWaitCount = Window_BattleLog.prototype.updateWaitCount;
Window_BattleLog.prototype.updateWaitCount = function(){
	const oldWait = _Window_BattleLog_updateWaitCount.call(this);
	if (this._knsWaitUntil > 1){
		this._knsWaitUntil--;
		return true;
	}else if (this._knsWaitUntil == 1){
		if (Input.isTriggered('ok') || TouchInput.isTriggered()){
			this._knsWaitUntil = 0;
		}else{
			return true;
		}
	}
	return oldWait;
};

Window_BattleLog.prototype.backRect = function() {
	return {
		x: 0, y: this.padding,
		width: this.width, height: this.numLines() * this.lineHeight()
	};
};

Window_BattleLog.prototype.drawBackground = function() {
	const rect = this.backRect();
	const color1 = this.dimColor1();
	this._backBitmap.clear();
	this._backBitmap.fillRect(rect.x, rect.y, rect.width, rect.height, color1);
};

Window_BattleLog.prototype.refresh = function() {
	this.drawBackground();
	this.contents.clear();
	for (var i = 0; i < this._lines.length; i++) {
		this.drawLineText(i);
	}
};

Window_BattleLog.prototype.initialize = function() {
	var width = this.windowWidth();
	var height = this.windowHeight();
	Window_Selectable.prototype.initialize.call(this, 0, 0, width, height);
	this.opacity = 0;
	this._lines = [];
	this._methods = [];
	this._waitCount = 0;
	this._knsWaitUntil = 0;
	this._waitMode = '';
	this._baseLineStack = [];
	this._spriteset = null;
	this.createBackBitmap();
	this.createBackSprite();
	this.y = -this.standardPadding();
	this.refresh();
};

Window_BattleLog.prototype.createBackSprite = function() {
	this._backSprite = new Sprite();
	this._backSprite.bitmap = this._backBitmap;
	this._backSprite.y = this.y;
	this.addChildToBack(this._backSprite);
};

Window_BattleLog.prototype.addText = function(text, wait){
	if (!text) return;
	this._lines.push(text);
	this.refresh();
	this.wait(wait);
};

Window_BattleLog.prototype.addKnsItem = function(item, wait){
	if (!item) return;
	this._lines.push(item);
	this.refresh();
	this.wait(wait);
};

Window_BattleLog.prototype.drawLineText = function(index) {
	const text = this._lines[index];
	const rect = this.itemRectForText(index);
	this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
	if (typeof text == 'object'){
		let x = rect.x;
		if (text.iconIndex){
			const textWidth = this.textWidth(text.name);
			const iconWidth = Window_Base._iconWidth >> 1;
			this.drawIcon(
				text.iconIndex, x + (rect.width - textWidth >> 1) - iconWidth, 
				rect.y + (rect.height - Window_Base._iconHeight >> 1)
			);
			x += iconWidth;
		}
		this.drawText(text.name, x, rect.y, rect.width, 'center');
	}else{
		this.drawText(text, rect.x, rect.y, rect.width, 'center');
	}
};


Window_BattleLog.prototype.pushBaseLine = function() {
	this._baseLineStack.push(this._lines.length);
};

Window_BattleLog.prototype.popBaseLine = function() {
	var baseLine = this._baseLineStack.pop();
	while (this._lines.length > baseLine) {
		this._lines.pop();
	}
};

Window_BattleLog.prototype.showActorAttackAnimation = function(subject, targets) {
	this.showNormalAnimation(targets, subject.attackAnimationId1(), false);
};

Window_BattleLog.prototype.showEnemyAttackAnimation = function(subject, targets) {
	this.showNormalAnimation(targets, 1, false);
};

Window_BattleLog.prototype.showNormalAnimation = function(targets, animationId, mirror) {
	var animation = $dataAnimations[animationId];
	if (animation) {
		var delay = this.animationBaseDelay();
		var nextDelay = this.animationNextDelay();
		targets.forEach(function(target) {
			target.startAnimation(animationId, mirror, delay);
			delay += nextDelay;
		});
	}
};

Window_BattleLog.prototype.startTurn = function(){};

Window_BattleLog.prototype.startAction = function(subject, action, targets) {
	var item = action.item();
	this.push('performActionStart', subject, action);
	this.push('waitForMovement');
	this.push('performAction', subject, action);
	this.push('showAnimation', subject, targets.clone(), item.animationId);
	this.displayAction(subject, item);
};

Window_BattleLog.prototype.endAction = function(subject) {
	this.push('waitForNewLine');
	this.push('clear');
	this.push('performActionEnd', subject);
};

Window_BattleLog.prototype.displayCurrentState = function(subject) {
	var stateText = subject.mostImportantStateText();
	if (stateText) {
		this.push('addText', subject.name() + stateText);
		this.push('wait');
		this.push('clear');
	}
};

Window_BattleLog.prototype.displayAction = function(subject, item) {
	if (DataManager.isSkill(item)) {
		this.push('addKnsItem', item);
		if (item.message2) {
			this.push('addText', item.message2.format(item.name));
		}
	} else {
		this.push('addKnsItem', item);
	}
	this.push('wait', 4);
};

Window_BattleLog.prototype.displayCounter = function(target) {
	this.push('performCounter', target);
	this.push('addText', KNS_TERMS.BATTLE_COUNTER.format(target.name()));
};

Window_BattleLog.prototype.displayReflection = function(target) {
	this.push('performReflection', target);
	this.push('addText', KNS_TERMS.BATTLE_REFLECT.format(target.name()));
};

Window_BattleLog.prototype.displaySubstitute = function(substitute, target) {
	var substName = substitute.name();
	this.push('performSubstitute', substitute, target);
	this.push('addText', KNS_TERMS.BATTLE_SUBSTITUTE.substitute.format(substName, target.name()));
};

Window_BattleLog.prototype.displayActionResults = function(subject, target) {
	if (target.result().used) {
		this.push('pushBaseLine');
		this.displayCritical(target);
		this.push('popupDamage', target);
		this.push('popupDamage', subject);
		this.displayDamage(target);
		this.displayAffectedStatus(target);
		this.displayFailure(target);
		this.push('waitForNewLine');
		this.push('popBaseLine');
	}
};

Window_BattleLog.prototype.displayFailure = function(target) {
	if (target.result().isHit() && !target.result().success) {
		this.push('addText', KNS_TERMS.BATTLE_ACTION_FAILURE.format(target.name()));
	}
};
Window_BattleLog.prototype.displayCritical = function(target) {};

Window_BattleLog.prototype.displayAffectedStatus = function(target) {
	if (target.result().isStatusAffected()) {
		this.push('pushBaseLine');
		this._lines.pop();
		this.displayChangedStates(target);
		this.displayChangedBuffs(target);
//        this.push('waitForNewLine');
		this.push('popBaseLine');
	}
};

Window_BattleLog.prototype.displayAutoAffectedStatus = function(target) {
	if (target.result().isStatusAffected()) {
		this.displayAffectedStatus(target, null);
		this.push('clear');
	}
};

Window_BattleLog.prototype.displayAddedStates = function(target){
	target.result().addedStateObjects().forEach(function(state){
		var stateMsg = target.isActor() ? state.message1 : state.message2;
		if (state.id === target.deathStateId()) {
			this.push('performCollapse', target);
			this.push('wait');
		}
		if (stateMsg) {
			this.push('addText', target.name() + stateMsg, 4);
		}
	}, this);
};

Window_BattleLog.prototype.displayRemovedStates = function(target) {
	target.result().removedStateObjects().forEach(function(state) {
		if (state.message4) {
			this.push('addText', target.name() + state.message4);
		}
	}, this);
};

Window_BattleLog.prototype.displayChangedBuffs = function(target) {
	var result = target.result();
	this.displayBuffs(target, result.addedBuffs, KNS_TERMS.BATTLE_ADD_BUFF);
	this.displayBuffs(target, result.addedDebuffs, KNS_TERMS.BATTLE_ADD_DEBUFF);
	this.displayBuffs(target, result.removedBuffs, KNS_TERMS.BATTLE_REMOVE_BUFF);
};

Window_BattleLog.prototype.displayBuffs = function(target, buffs, fmt) {
	buffs.forEach(function(paramId) {
		this.push('addText', fmt.format(target.name(), TextManager.param(paramId)));
	}, this);
};

Window_BattleLog.prototype.displayMiss = function(target) {
	if (target.result().physical) {
		this.push('performMiss', target);
	}
};

Window_BattleLog.prototype.displayEvasion = function(target) {
	if (target.result().physical) {
		this.push('performEvasion', target);
	} else {
		this.push('performMagicEvasion', target);
	}
};

Window_BattleLog.prototype.displayHpDamage = function(target){
	const old = this._lines.length;
	if (target.result().hpAffected) {
		if (target.result().hpDamage > 0 && !target.result().drain) {
			this.push('performDamage', target);
		}
		if (target.result().hpDamage < 0) {
			this.push('performRecovery', target);
		}
	}
	if (old != this._lines.length) this.push('wait', 8);
};

Window_BattleLog.prototype.displayMpDamage = function(target) {
	const old = this._lines.length;
	if (target.isAlive() && target.result().mpDamage !== 0) {
		if (target.result().mpDamage < 0) {
			this.push('performRecovery', target);
		}
	}
	if (old != this._lines.length) this.push('wait', 8);
};

//===========================================
// alias Scene_Battle
//===========================================
Scene_Battle.prototype.createLogWindow = function() {
	this._logWindow = new Window_BattleLog();
	this.addWindow(this._logWindow);
};
})();