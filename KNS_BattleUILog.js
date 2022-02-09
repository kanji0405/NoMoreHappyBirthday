(function(){
//===========================================
// alias BattleManager
//===========================================
// display
BattleManager.knsPushBattleLog = function(text){
	$gameMessage.add(text.replace('%s', $gameParty.name()));
}

BattleManager.displayStartMessages = function() {
	if (this._preemptive) {
		this.knsPushBattleLog(KNS_TERMS.BATTLE_PREEMPTIVE);
	} else if (this._surprise) {
		this.knsPushBattleLog(KNS_TERMS.BATTLE_SURPRISE);
	}else{
		return;
		$gameTroop.enemyNames().forEach(function(name) {
			this.knsPushBattleLog.add(TextManager.emerge.format(name));
		}, this);
	}
};

BattleManager.displayVictoryMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_VICTORY);
};

BattleManager.displayDefeatMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_DEFEAT);
};

BattleManager.displayEscapeSuccessMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_ESCAPE);
};

BattleManager.displayEscapeFailureMessage = function(){
	this.knsPushBattleLog(KNS_TERMS.BATTLE_ESCAPE_FAILURE);
};

// reward
BattleManager.makeRewards = function() {
    this._rewards = {};
    this._rewards.gold = $gameTroop.goldTotal();
    this._rewards.exp = $gameTroop.expTotal();
    this._rewards.items = $gameTroop.makeDropItems();
};

BattleManager.displayRewards = function() {
//    this.displayExp();
//    this.displayGold();
//    this.displayDropItems();
};

BattleManager.displayExp = function() {
    var exp = this._rewards.exp;
    if (exp > 0) {
        var text = TextManager.obtainExp.format(exp, TextManager.exp);
        $gameMessage.add('\\.' + text);
    }
};

BattleManager.displayGold = function() {
    var gold = this._rewards.gold;
    if (gold > 0) {
        $gameMessage.add('\\.' + TextManager.obtainGold.format(gold));
    }
};

BattleManager.displayDropItems = function() {
    var items = this._rewards.items;
    if (items.length > 0) {
        $gameMessage.newPage();
        items.forEach(function(item) {
            $gameMessage.add(TextManager.obtainItem.format(item.name));
        });
    }
};

//===========================================
// alias Window_BattleLog
//===========================================
const _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
Window_BattleLog.prototype.addText = function(text) {
//	if($gameSystem.isSideView()){
		this.refresh();
		this.wait();
		return;  // not display battle log
//	}
	_Window_BattleLog_addText.call(this, text);
};

// for sideview battle only
Window_BattleLog.prototype.addItemNameText = function(itemName) {
	this._lines.push(itemName);
	this.refresh();
	this.wait();
};

const _Window_BattleLog_displayAction = Window_BattleLog.prototype.displayAction;
Window_BattleLog.prototype.displayAction = function(subject, item) {
	if (item && item.name){
		this.push('addItemNameText', item.name);  // display item/skill name
	}else{
		_Window_BattleLog_displayAction.call(this);
	}
};

// to put skill/item name at center
const _Window_BattleLog_drawLineText = Window_BattleLog.prototype.drawLineText;
Window_BattleLog.prototype.drawLineText = function(index) {
	var rect = this.itemRectForText(index);
	this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
	this.drawText(this._lines[index], rect.x, rect.y,
		rect.width, 'center');
	return;
	_Window_BattleLog_drawLineText.call(this, index);
};
})();