(function(){
//===========================================
// alias Window_PartyCommand
//===========================================
Window_PartyCommand.prototype.makeCommandList = function() {
	this.addCommand(KNS_TERMS.BATTLE_PARTY[0], 'fight');
	this.addCommand(KNS_TERMS.BATTLE_PARTY[1], 'escape', BattleManager.canEscape());
};

//===========================================
// alias Window_ActorCommand
//===========================================
Window_ActorCommand.prototype.numVisibleRows = function() {
	return 5;
};

Window_ActorCommand.prototype.makeCommandList = function() {
	if (this._actor){
		this.addCommand($dataSkills[this._actor.attackSkillId()].name, 'attack');
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[0], 'skill', true, 0);
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[1], 'guard');
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[2], 'item');
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[3], 'cancel');
	}
};

Window_ActorCommand.prototype.processOk = function() {
	if (this._actor) {
		this._actor.setLastCommandSymbol(this.currentSymbol());
	}
	Window_Command.prototype.processOk.call(this);
};


//===========================================
// new KNS_BattleUI
//===========================================
class KNS_BattleUI{
	static setItemWindow(klass){
		const _initialize = klass.prototype.initialize;
		klass.prototype.initialize = function(x, y, width, height){
			_initialize.call(this, x, y, 440, height);
			this.setBackgroundType(1);
		};

		klass.prototype.maxCols = function(){ return 2; };

		const _klass_update = klass.prototype.update;
		klass.prototype.update = function(){
			_klass_update.call(this);
			if (this.visible){
				this.x = (-12 - this.x >> 1) + this.x;
			}else{
				this.x = -480;
			}
		}

		klass.prototype.refreshDimmerBitmap = function() {
			if (this._dimmerSprite) {
				var bitmap = this._dimmerSprite.bitmap;
				var w = this.width;
				var h = this.height;
				var m = this.padding;
				var c1 = this.dimColor1();
				var c2 = this.dimColor2();
				bitmap.resize(w, h);
				bitmap.gradientFillRect(0, 0, m, h, c2, c1);
				bitmap.fillRect(m, 0, w - m * 2, h, c1);
				bitmap.gradientFillRect(w - m, 0, m, h, c1, c2);
				this._dimmerSprite.setFrame(0, 0, w, h);
			}
		};
	}
	static setSelectWindow(klass){}
}

//===========================================
// item skill
//===========================================
KNS_BattleUI.setItemWindow(Window_BattleSkill);
KNS_BattleUI.setItemWindow(Window_BattleItem);

//===========================================
// alias Scene_Battle
//===========================================
Scene_Battle.prototype.createHelpWindow = function() {
    this._helpWindow = new Window_Help();
	this._helpWindow.setBackgroundType(2);
    this._helpWindow.visible = false;
    this.addWindow(this._helpWindow);

	const bmp = new Bitmap(this._helpWindow.width - 20, this._helpWindow.height);
	let pad = 96;
	let wid = bmp.width - pad;
	const color1 = this._helpWindow.dimColor1();
	const color2 = this._helpWindow.dimColor2();
	bmp.fillRect(0, 0, wid, bmp.height, color1);
	bmp.gradientFillRect(wid, 0, pad, bmp.height, color1, color2);
	this._helpWindow.addChildAt(new Sprite(bmp), 0);
};

//===========================================
// alias Window_BattleStatus
//===========================================
Window_BattleStatus.prototype.initialize = function() {
	var width = this.windowWidth();
	var height = this.windowHeight();
	var x = Graphics.boxWidth - width;
	var y = Graphics.boxHeight - height;
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this.refresh();
	this.openness = 0;
};

Window_BattleStatus.prototype.windowWidth = function() {
	return Graphics.boxWidth - 192;
};

Window_BattleStatus.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows());
};

Window_BattleStatus.prototype.numVisibleRows = function() {
	return 4;
};

Window_BattleStatus.prototype.maxItems = function() {
	return $gameParty.battleMembers().length;
};

Window_BattleStatus.prototype.refresh = function() {
	this.contents.clear();
	this.drawAllItems();
};

Window_BattleStatus.prototype.drawItem = function(index) {
	var actor = $gameParty.battleMembers()[index];
	this.drawBasicArea(this.basicAreaRect(index), actor);
	this.drawGaugeArea(this.gaugeAreaRect(index), actor);
};

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

Window_BattleStatus.prototype.gaugeAreaWidth = function() {
	return 330;
};

Window_BattleStatus.prototype.drawBasicArea = function(rect, actor) {
	this.drawActorName(actor, rect.x + 0, rect.y, 150);
	this.drawActorIcons(actor, rect.x + 156, rect.y, rect.width - 156);
};

Window_BattleStatus.prototype.drawGaugeArea = function(rect, actor) {
	if ($dataSystem.optDisplayTp) {
		this.drawGaugeAreaWithTp(rect, actor);
	} else {
		this.drawGaugeAreaWithoutTp(rect, actor);
	}
};

Window_BattleStatus.prototype.drawGaugeAreaWithTp = function(rect, actor) {
	this.drawActorHp(actor, rect.x + 0, rect.y, 108);
	this.drawActorMp(actor, rect.x + 123, rect.y, 96);
	this.drawActorTp(actor, rect.x + 234, rect.y, 96);
};

Window_BattleStatus.prototype.drawGaugeAreaWithoutTp = function(rect, actor) {
	this.drawActorHp(actor, rect.x + 0, rect.y, 201);
	this.drawActorMp(actor, rect.x + 216,  rect.y, 114);
};


//===========================================
// alias Window_BattleActor
//===========================================
Window_BattleActor.prototype.initialize = function(x, y) {
	Window_BattleStatus.prototype.initialize.call(this);
	this.x = x;
	this.y = y;
	this.openness = 255;
	this.hide();
};

Window_BattleActor.prototype.show = function() {
	this.select(0);
	Window_BattleStatus.prototype.show.call(this);
};

Window_BattleActor.prototype.hide = function() {
	Window_BattleStatus.prototype.hide.call(this);
	$gameParty.select(null);
};

Window_BattleActor.prototype.select = function(index) {
	Window_BattleStatus.prototype.select.call(this, index);
	$gameParty.select(this.actor());
};

Window_BattleActor.prototype.actor = function() {
	return $gameParty.members()[this.index()];
};


//===========================================
// alias Window_BattleEnemy
//===========================================
Window_BattleEnemy.prototype.initialize = function(x, y) {
	this._enemies = [];
	var width = this.windowWidth();
	var height = this.windowHeight();
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this.refresh();
	this.hide();
};

Window_BattleEnemy.prototype.windowWidth = function() {
	return Graphics.boxWidth - 192;
};

Window_BattleEnemy.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows());
};

Window_BattleEnemy.prototype.numVisibleRows = function() {
	return 4;
};

Window_BattleEnemy.prototype.maxCols = function() {
	return 2;
};

Window_BattleEnemy.prototype.maxItems = function() {
	return this._enemies.length;
};

Window_BattleEnemy.prototype.enemy = function() {
	return this._enemies[this.index()];
};

Window_BattleEnemy.prototype.enemyIndex = function() {
	var enemy = this.enemy();
	return enemy ? enemy.index() : -1;
};

Window_BattleEnemy.prototype.drawItem = function(index) {
	this.resetTextColor();
	var name = this._enemies[index].name();
	var rect = this.itemRectForText(index);
	this.drawText(name, rect.x, rect.y, rect.width);
};

Window_BattleEnemy.prototype.show = function() {
	this.refresh();
	this.select(0);
	Window_Selectable.prototype.show.call(this);
};

Window_BattleEnemy.prototype.hide = function() {
	Window_Selectable.prototype.hide.call(this);
	$gameTroop.select(null);
};

Window_BattleEnemy.prototype.refresh = function() {
	this._enemies = $gameTroop.aliveMembers();
	Window_Selectable.prototype.refresh.call(this);
};

Window_BattleEnemy.prototype.select = function(index) {
	Window_Selectable.prototype.select.call(this, index);
	$gameTroop.select(this.enemy());
};
})();