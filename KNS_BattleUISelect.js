(function(){
const KNS_BattleUISelect = {};
KNS_BattleUISelect.setSelectWindow = function(klass){}
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