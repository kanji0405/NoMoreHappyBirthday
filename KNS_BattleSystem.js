(function(){
//============================================
// alias Game_Enemy
//============================================
// search player
Game_Event.prototype.knsCheckPlayer = function(distance) {
	let sx = Math.abs(this.deltaXFrom($gamePlayer.x));
	let sy = Math.abs(this.deltaYFrom($gamePlayer.y));
	if (sx + sy < distance){
		AudioManager.playSe({name: '017-Jump03', volume: 100, pitch: 100, pan: 0});
		this.requestBalloon(1);
		this.knsSetSelfSwitch('B', true);
	}else{
		this.moveRandom();
	}
};

//============================================
// alias Game_Interpreter
//============================================
// encounter
const _Game_Interpreter_command301 = Game_Interpreter.prototype.command301;
Game_Interpreter.prototype.command301 = function(){
	_Game_Interpreter_command301.call(this);
	if (this._params[0] == 2){
		BattleManager.onEncounter();
	}
	return true;
};

//============================================
// alias BattleManager
//============================================
// escape rate
BattleManager.processEscape = function() {
    $gameParty.performEscape();
    const success = this._preemptive ? true : (Math.random() < this._escapeRatio);
    if (success) {
		SoundManager.playEscape();
		this.displayEscapeSuccessMessage();
        this._escaped = true;
        this.processAbort();
    } else {
		AudioManager.playSe({name: '015-Jump01', volume: 100, pitch: 100, pan: 0});
        this.displayEscapeFailureMessage();
        this._escapeRatio += 0.25; // edited
        $gameParty.clearActions();
        this.startTurn();
    }
    return success;
};

BattleManager.onEncounter = function(){
	const eventId = $gameMap._interpreter.eventId();
	const ev = eventId ? $gameMap.event(eventId) : null;
	const evDir = ev ? ev.direction() : 0;
	const playerDir = $gamePlayer.direction();
	let dirType = 0;
	if (evDir == $gamePlayer.reverseDir(playerDir)){
		dirType = 3;
	}else if (playerDir == evDir){
		let x = $gameMap.roundXWithDirection(ev.x, evDir);
		let y = $gameMap.roundYWithDirection(ev.y, evDir);
		dirType = x == $gamePlayer.x && y == $gamePlayer.y ? 1 : 2;
	}
	let preRate = 0;
	let surRate = 0;
	if ($gameSelfSwitches.value([$gameMap.mapId(), eventId, 'B'])){
		switch(dirType){ // 追走状態
			case 1: surRate = 0.75; break; // ふいうち
			case 2: preRate = 0.50; break; // プレイヤー先制
			case 3: preRate = 0.05; break; // 向かい合っている
			default:// なんでもない
				preRate = 0.10;
				surRate = 0.15;
				break;
		}
	}else{
		switch(dirType){ // 通常
			case 1: surRate = 0.25; break; // ふいうち
			case 2: preRate = 0.80; break; // プレイヤー先制
			case 3: preRate = 0.30; break; // 向かい合っている
			default:// なんでもない
				preRate = 0.45;
				surRate = 0.08;
				break;
		}
	}
	if ($gameParty.hasRaisePreemptive()){	preRate *= 2;	}
	if ($gameParty.hasCancelSurprise()){	surRate = 0;	}
    this._preemptive	= Math.random() < preRate;
    this._surprise		= !this._preemptive && Math.random() < surRate;
};
})();