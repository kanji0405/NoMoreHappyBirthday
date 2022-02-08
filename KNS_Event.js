(function() {
//========================================================
// reserve event
//========================================================
if (!DataManager.isBattleTest()){
	DataManager._databaseFiles.push({
		name: '$knsReserveMap', src: 'Map009.json'
	});
}

// alias Game_Event
const _Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
    _Game_Event_initialize.apply(this, arguments);
	this.knsSetupReserveEvent();
};

Game_Event.prototype.knsSetSelfSwitch = function(key, value){
	$gameSelfSwitches.setValue([this._mapId, this._eventId, key], value);
}

Game_Event.RE_KNS_RESERVE_EVENT = /<call[:：]\s*(\d+)\s*>/;
Game_Event.prototype.knsSetupReserveEvent = function(){
	const original = _Game_Event_event.call(this);
	if (Game_Event.RE_KNS_RESERVE_EVENT.test(original.name)){
		this._knsReserveId = Math.floor(RegExp.$1);
		this._pageIndex = -1;
		['A', 'B', 'C', 'D'].forEach(function(key){
			this.knsSetSelfSwitch(key, false);
		}, this);
		this.event().pages.forEach(function(page){
			ImageManager.loadCharacter(page.image.characterName);
		})
		this.refresh();
	}
}

const _Game_Event_event = Game_Event.prototype.event;
Game_Event.prototype.event = function() {
	if (typeof this._knsReserveId == 'number'){
		return $knsReserveMap.events[this._knsReserveId];
	}else{
		return _Game_Event_event.call(this);
	}
};

//========================================================
// step sound
//========================================================
// alias Game_Player
const _Game_Player_increaseSteps = Game_Player.prototype.increaseSteps;
Game_Player.prototype.increaseSteps = function() {
	this.knsPlayStepSound();
	_Game_Player_increaseSteps.call(this);
};
Game_Player.KNS_STEP_SOUNDS = [
	"OFloor",
	"Oncarpet",
	"OnGrass",
	"OFullFrontal",
	"OIrons",
	"OnSlimy",
];
Game_Player.prototype.knsPlayStepSound = function(){
	let name;
	switch (this.terrainTag()){
		case 0: name = Game_Player.KNS_STEP_SOUNDS[0]; break;
		case 1: name = Game_Player.KNS_STEP_SOUNDS[1]; break;
	}
	if (name){
		let volume = 30, pitch = 80;
		if (this._animationCount % 2 == 0){
			pitch += 6;
		}
		if (this.isDashing()){
			pitch += 12;
		}
		AudioManager.playSe({name: name, volume: volume, pitch: pitch, pan: 0});
	}
}

Game_Player.prototype.follower = function(n){
	return this.followers().follower(n);
}

// alias Scene_Boot
// - preload
const _Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages = function() {
	_Scene_Boot_loadSystemImages.call(this);
	Game_Player.KNS_STEP_SOUNDS.forEach(function(name){
		AudioManager.playSe({name: name, volume: 0, pitch: 100, pan: 0});
	});
	ImageManager.reserveCharacter("weapon");
};

//========================================================
// check event symbol
//========================================================
Game_Player.prototype.triggerButtonAction = function() {
	if (Input.isTriggered('ok')) {
		this.checkEventTriggerHere([0]);
		if ($gameMap.setupStartingEvent()) {
			return true;
		}
		let lastDirection = this.direction();
		const checkDir = [this._knsLastDirection || 4, 2, 8]
		for (let i = 0; i < checkDir.length; i++){
			this.setDirection(checkDir[i]);
			this.checkEventTriggerThere([0,1,2]);
			if ($gameMap.setupStartingEvent()){
				this.setDirection(lastDirection);
				return true;
			}
		}
	}
	return false;
};

//========================================================
// 8-direction move
//========================================================
// alias Game_Character
Game_Character.prototype.knsMove8D = function(d){
	switch (d){
		case 0: case 5: break;
		case 1: this.moveDiagonally(4, 2); break;
		case 3: this.moveDiagonally(6, 2); break;
		case 7: this.moveDiagonally(4, 8); break;
		case 9: this.moveDiagonally(6, 8); break;
		default: this.moveStraight(d); break;
	}
}

const _Game_Character_moveRandom = Game_Character.prototype.moveRandom;
Game_Character.prototype.moveRandom = function() {
	if (Math.randomInt(2) == 0){
		let horz = Math.randomInt(2) == 0 ? 4 : 6;
		let vert = Math.randomInt(2) == 0 ? 2 : 8;
		const sx = $gameMap.roundY(this.x);
		const sy = $gameMap.roundY(this.y);
		if (this.canPassDiagonally(sx, sy, vert, horz)){
			this.moveDiagonally(horz, vert);
		}
	}else{
		_Game_Character_moveRandom.call(this);
	}
};

/*
Game_Character.prototype.moveTowardCharacter = function(character) {
    var sx = this.deltaXFrom(character.x);
    var sy = this.deltaYFrom(character.y);
    if (Math.abs(sx) > Math.abs(sy)) {
        this.moveStraight(sx > 0 ? 4 : 6);
        if (!this.isMovementSucceeded() && sy !== 0) {
            this.moveStraight(sy > 0 ? 8 : 2);
        }
    } else if (sy !== 0) {
        this.moveStraight(sy > 0 ? 8 : 2);
        if (!this.isMovementSucceeded() && sx !== 0) {
            this.moveStraight(sx > 0 ? 4 : 6);
        }
    }
};
*/


// alias player
Game_Player.prototype.getInputDirection = function(){ return Input.dir8; };
Game_Player.prototype.executeMove = function(dir){ this.knsMove8D(dir); };

// alias Game_Followers
Game_Followers.prototype.updateMove = function() {
	this._data.forEach(ev=>ev.chaseCharacter());
};

Game_Follower.prototype.chaseCharacter = function() {
	let formation = [0, 0];
	let direction = $gamePlayer.direction();
	if ($gamePlayer._followers._gathering){
		this._through = true;
	}else{
		switch (this._memberIndex){
			case 1:  formation = [1, -1]; break;
			case 2:  formation = [2,  0]; break;
			case 3:  formation = [1,  1]; break;
			default: formation = [1,  0]; break;
		}
		if (direction == 6){
			formation[0] *= -1;
		}
		this._through = false;
	}
	let sx = $gameMap.roundX($gamePlayer.x + formation[0]);
	let sy = $gameMap.roundY($gamePlayer.y + formation[1]);
	this.knsMove8D(this.findDirectionTo(sx, sy));
	this._through = true;
	this.setMoveSpeed($gamePlayer.realMoveSpeed());
};


//=========================================================
// lighten move process
//=========================================================
// Game_CharacterBase
Game_CharacterBase.prototype.canPass = function(x, y, d) {
    const x2 = $gameMap.roundXWithDirection(x, d);
    const y2 = $gameMap.roundYWithDirection(y, d);
    if (!$gameMap.isValid(x2, y2)) return false;
    return	(this.isThrough() || this.isDebugThrough()) || 
			this.isMapPassable(x, y, d) && !this.isCollidedWithCharacters(x2, y2);
};

Game_CharacterBase.prototype.canPassDiagonally = function(x, y, horz, vert) {
    return (
		this.canPass(x, y, vert) && 
		this.canPass(x, $gameMap.roundYWithDirection(y, vert), horz)
	) || (
		this.canPass(x, y, horz) && 
		this.canPass($gameMap.roundXWithDirection(x, horz), y, vert)
	);
};

Game_CharacterBase.prototype.moveDiagonally = function(horz, vert) {
    this.setMovementSuccess(this.canPassDiagonally(this._x, this._y, horz, vert));
    if (this.isMovementSucceeded()) {
        this._x = $gameMap.roundXWithDirection(this._x, horz);
        this._y = $gameMap.roundYWithDirection(this._y, vert);
        this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(horz));
        this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(vert));
        this.increaseSteps();
    }
	this.setDirection(horz);
};

Game_CharacterBase.prototype.isCollidedWithCharacters = function(x, y) {
    return this.isCollidedWithEvents(x, y);
};

Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
    return $gameMap.events().some(function(event) {
        return event.isNormalPriority() && event.posNt(x, y);
    });
};

//========================================================
// 8-direction search
//========================================================
Game_Player.prototype.searchLimit = function(){ return 9; };
Game_Follower.prototype.searchLimit = function(){ return 10; };
Game_Event.prototype.searchLimit = function(){ return 6; };
// main
Game_Character.prototype.findDirectionTo = function(goalX, goalY) {
    if (this.x === goalX && this.y === goalY) return 0;
	const searchLimit = this.searchLimit();
    var mapWidth = $gameMap.width();
    var nodeList = [];
    var openList = [];
    var closedList = [];
    var start = {
		parent: null,
		x: this.x,
		y: this.y,
		g: 0,
	};
    start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
    var best = start;
    nodeList.push(start);
    openList.push(start.y * mapWidth + start.x);

	const dirArray = new Uint8Array(2);
    while (nodeList.length > 0) {
        var bestIndex = 0;
        for (var i = 0; i < nodeList.length; i++) {
            if (nodeList[i].f < nodeList[bestIndex].f) {
                bestIndex = i;
            }
        }
        var current = nodeList[bestIndex];
        var x1 = current.x;
        var y1 = current.y;
        var pos1 = y1 * mapWidth + x1;
        var g1 = current.g;

        nodeList.splice(bestIndex, 1);
        openList.splice(openList.indexOf(pos1), 1);
        closedList.push(pos1);
        if (current.x === goalX && current.y === goalY) {
            best = current;
            break;
        }
        if (g1 >= searchLimit) continue;

		for (let direction = 1; direction < 10; direction++) {
			if (direction == 5){
				continue;
			}else{
				switch (direction){
					case 1: dirArray[0] = 4; dirArray[1] = 2; break;
					case 3: dirArray[0] = 6; dirArray[1] = 2; break;
					case 7: dirArray[0] = 4; dirArray[1] = 8; break;
					case 9: dirArray[0] = 6; dirArray[1] = 8; break;
					default:dirArray[0] = dirArray[1] = direction; break;
				}
			}
			let x2 = $gameMap.roundXWithDirection(x1, dirArray[0]);
			let y2 = $gameMap.roundYWithDirection(y1, dirArray[1]);
			const pos2 = y2 * mapWidth + x2;
            if (closedList.contains(pos2)){
				continue;
			}else if (dirArray[0] == dirArray[1]){
				if (!this.canPass(x1, y1, dirArray[0])){
					continue;
				}
			}else if (!this.canPassDiagonally(x1, y1, dirArray[0], dirArray[1])){
				continue;
			}
            var g2 = g1 + 1;
            var index2 = openList.indexOf(pos2);
            if (index2 < 0 || g2 < nodeList[index2].g) {
                var neighbor;
                if (index2 >= 0) {
                    neighbor = nodeList[index2];
                } else {
                    neighbor = {};
                    nodeList.push(neighbor);
                    openList.push(pos2);
                }
                neighbor.parent = current;
                neighbor.x = x2;
                neighbor.y = y2;
                neighbor.g = g2;
                neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);
                if (!best || neighbor.f - neighbor.g < best.f - best.g) {
                    best = neighbor;
                }
            }
        }
    }
    var node = best;
    while (node.parent && node.parent !== start) node = node.parent;

    var deltaX1 = $gameMap.deltaX(node.x, start.x);
    var deltaY1 = $gameMap.deltaY(node.y, start.y);
	if (deltaY1 > 0){// 2
		if       (deltaX1 < 0){// 4
			return 1;
		}else if (deltaX1 > 0){// 6
			return 3;
		}else{
			return 2;
		}
	}
	if (deltaY1 < 0){// 8
		if       (deltaX1 < 0){// 4
			return 7;
		}else if (deltaX1 > 0){// 6
			return 9;
		}else{
			return 8;
		}
	}
    if (deltaX1 < 0) {
        return 4;
    } else if (deltaX1 > 0) {
        return 6;
    }

    var deltaX2 = this.deltaXFrom(goalX);
    var deltaY2 = this.deltaYFrom(goalY);
	let horz = 0, vert = 0;
    if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
        horz = deltaX2 > 0 ? 4 : 6;
    }
	if (deltaY2 !== 0) {
        vert = deltaY2 > 0 ? 8 : 2;
    }
	if (horz == 0) return vert;
	if (vert == 0) return horz;
	if (horz == 4){
		return vert == 8 ? 7 : 1;
	}else{
		return vert == 8 ? 9 : 3;
	}
};
})();