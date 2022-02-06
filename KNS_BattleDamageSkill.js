(function(){
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
})();