(function(){
//=============================================
// alias Game_System
//=============================================
Game_System.prototype.knsGetPopInfo = function(){
	return this._popInfo;
}
Game_System.prototype.knsSetPopInfo = function(type, id){
	this._popInfo = [type.toUpperCase(), id];
}
//=============================================
// alias Game_Interpreter
//=============================================
Game_Interpreter.prototype.knsGetFaceName = function(faceName){
	let name = KNS_NAMES[faceName];
	if (name){
		if ($gameSwitches && $gameSwitches.value(6) == true){
			name = KNS_NAMES.hatena;
		}else{
			if (typeof name == "number"){
				name = $gameActors.actor(name).name();
			}
		}
		return "\\c[3]\\>"+name+"\\c[0]\\<";
	}
	return "";
}

Game_Interpreter.RE_KNS_POPTYPE = /\\([AaEe])\[(-?\d+)\]/;
Game_Interpreter.prototype.command101 = function(){
	if (!$gameMessage.isBusy()) {
		$gameMessage.setFaceImage(this._params[0], this._params[1]);
		$gameMessage.setBackground(this._params[2]);
		$gameMessage.setPositionType(this._params[3]);
		// start add
		const name = this.knsGetFaceName($gameMessage.faceName());
		if (name.length > 0){
			$gameMessage.add(name);
		}
		while (this.nextEventCode() === 401) {  // Text data
			this._index++;
			let text = this.currentCommand().parameters[0];
			$gameMessage.add(text.replace(
				Game_Interpreter.RE_KNS_POPTYPE, function(){
					$gameSystem.knsSetPopInfo(RegExp.$1, Math.floor(RegExp.$2));
					return "";
				}
			));
		}
		// end add
		switch (this.nextEventCode()) {
		case 102:  // Show Choices
			this._index++;
			this.setupChoices(this.currentCommand().parameters);
			break;
		case 103:  // Input Number
			this._index++;
			this.setupNumInput(this.currentCommand().parameters);
			break;
		case 104:  // Select Item
			this._index++;
			this.setupItemChoice(this.currentCommand().parameters);
			break;
		}
		this._index++;
		this.setWaitMode('message');
	}
	return false;
};

//=============================================
// alias Scene_Boot
//=============================================
const _Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages = function() {
	_Scene_Boot_loadSystemImages.call(this);
	ImageManager.reserveSystem('popWindow');
};

//=============================================
// alias Window_Message
//=============================================
// for child
Window_Message.prototype.processEscapeCharacter = function(code, textState) {
	switch (code) {
	case '$': this._goldWindow.open(); break;
	case '.': this.startWait(15); break;
	case '|': this.startWait(40); break;
	case '!': this.startPause(); break;
	case '>': this._lineShowFast = true; break;
	case '<': this._lineShowFast = false; break;
	case '^': this._pauseSkip = true; break;
	default:
		Window_Base.prototype.processEscapeCharacter.call(this, code, textState);
		break;
	}
};

Window_Message.prototype.knsSubSprites = function() {
	return [];
};

// skip
Window_Message.prototype.knsIsSkipPressed = function(){
	return Input.isRepeated('pageup') || Input.isRepeated('pagedown');
};

const _Window_Message_isTriggered = Window_Message.prototype.isTriggered;
Window_Message.prototype.isTriggered = function() {
	return _Window_Message_isTriggered.call(this) || this.knsIsSkipPressed();
};

const _Window_Message_updateWait = Window_Message.prototype.updateWait;
Window_Message.prototype.updateWait = function() {
	if (this.knsIsSkipPressed()) {
		this._waitCount = 0;
		return false;
	}else{
		return _Window_Message_updateWait.call(this);
	};
};

//=============================================
// new Window_PopMessage < Window_Message
//=============================================
class Window_PopMessage extends Window_Message{
	standardPadding(){ return 13; }
	standardFontSize(){ return 24; }
	lineHeight(){ return 28; }
	areSettingsChanged(){ return true; }
	faceSize(){ return 128; }
	newLineX(){ return $gameMessage.faceName() === '' ? 10 : this.faceSize() + 8; };

	updateOpen() {
		if (this._opening) {
			this.openness = 255;
			this._opening = false;
		}
	};
	updateClose() {
		if (this._closing) {
			this.knsSubSprites().forEach(function(sp){ sp.visible = false });
			this.openness = 0;
			this._closing = false;
		}
	};
	updateBackground() { this.setBackgroundType(0); };
	updateTone() { this._windowBackSprite.alpha = 255; }
	loadWindowskin() {
		this.windowskin = ImageManager.reserveSystem('popWindow');
	}
	knsSubSprites() {
		return [this._downArrowSprite, this._upArrowSprite];
	}
	textColor(n) {
		let px = (n % 8) * 12 + 6;
		let py = 48 + Math.floor(n >> 3) * 12 + 6;
		return this.windowskin.getPixel(px, py);
	}

	createSubWindows() {
		this._goldWindow = new Window_Gold(0, 0);
		this._goldWindow.x = Graphics.boxWidth - this._goldWindow.width;
		this._goldWindow.openness = 0;
		this._numberWindow = new Window_NumberInput(this);
		this._itemWindow = new Window_EventItem(this);
		this._choiceWindow = new Window_ChoiceList2(this);
		// no mask
		this._knsDisableDrawBack = false;
		this._goldWindow._knsDisableDrawBack = false;
		this._numberWindow._knsDisableDrawBack = false;
		this._itemWindow._knsDisableDrawBack = false;
		this._choiceWindow._knsDisableDrawBack = false;
	};

	newPage(state) {
		this.knsResetPopSize();
		super.newPage(state);
	}

	knsGetPopWidth(){
		let str, maxWidth = 1;
		const re_color_tag = /\\\w\[\d+\]/g;
		// メッセージ: テキストの幅を取得
		for (let i = 0; str = $gameMessage._texts[i]; i++){
			let size = this.textWidth(str.replace(re_color_tag, ""));
			if (maxWidth < size){ maxWidth = size; }
		}
		// 選択肢: テキストの幅を取得
		for (let i = 0; str = $gameMessage.choices()[i]; i++){
			let size = this.textWidth(str.replace(re_color_tag, "")) + 32;
			if (maxWidth < size){ maxWidth = size; };
		}
		return maxWidth;
	}
	knsResetPopSize(){
		let pad = this.standardPadding() << 1;
		let textWidth = this.knsGetPopWidth();

		let width = 32, height;
		if ($gameMessage.faceName() === ''){
			height = pad + $gameMessage._texts.length * (
				this.lineHeight() + 5);
		}else{
			width += this.faceSize();
			height = 160;
		}
		this.width  = Math.min(pad + textWidth + width, Graphics.width);
		this.height = height + 36 * $gameMessage.choices().length;
		this.createContents();
	}

	drawMessageFace(){
		let size = this.faceSize();
		this.contents.blt(
			this._faceBitmap, 0, 0, this._faceBitmap.width, 
			this._faceBitmap.height, 0, 0, size, size
		);
		ImageManager.releaseReservation(this._imageReservationId);
	}

	// update
	update(){
		super.update();
		this.knsUpdatePopPosition();
	}
	knsGetCharacterByInfo(){
		const info = $gameSystem.knsGetPopInfo();
		if (info){
			let id = info[1];
			if (info[0] == 'A'){
				if (id == 0){
					return $gamePlayer;
				}else if (id < 0){
					return $gamePlayer.follower(-id - 1);
				}else{
					id = $gameParty.battleMembers().findIndex(function(actor){
						return actor.actorId() == id;
					});
					switch(id){
						case -1: break;
						case  0: return $gamePlayer;
						default: return $gamePlayer.follower(id - 1);
					}
				}
			}else if (info[0] == 'E'){
				if ($gameParty.inBattle()){
					//ここに敵のキャラを入れる
				}else{
					return $gameMap.event(id == 0 ? $gameMap._interpreter.eventId() : id);
				}
			}
		}
		return null;
	}
	knsUpdatePopPosition(){
		if (this.openness == 0) return;
		let chara = this.knsGetCharacterByInfo();
		let charaX = chara ? chara.screenX() : 0;
		this.x = Math.max(
			Math.min(charaX - (this.width >> 1), Graphics.width - this.width), 0
		);
		let height = 0;
		let name = chara && chara.characterName();
		if (this._positionType == 0 && name){
			if (name.contains("$=")){
				height = 128;
			}else{
				height = ImageManager.loadCharacter(name).height;
				if (!name.contains("@")){
					height >>= name.contains("$") ? 2 : 3;
				}
				height += 20;
			}
			height += this.height;
		}
		this.y = Math.max(Math.min((chara ? chara.screenY() : 0) - height,
			Graphics.height - this.height), 0);
	
		// arrow
		let sp;
		if (this._positionType == 0){
			sp = this._downArrowSprite;
			sp.y = this.y + this.height - 9;
		}else{
			sp = this._upArrowSprite;
			sp.y = this.y - 19;
		}
		sp.visible = true;
		sp.x = Math.min(Math.max(charaX, 24), Graphics.width - 24);
		// this.contentsOpacity += 20;
	}

	// low layer
	_createAllParts() {
		super._createAllParts();
		this.removeChild(this._downArrowSprite);
		this.removeChild(this._upArrowSprite);
		this._downArrowSprite.visible = false;
		this._upArrowSprite.visible = false;
	};
	_refreshContents() {
		this._windowContentsSprite.move(this.padding, this.padding);
	};
	_refreshFrame(){}
	_refreshBack() {
		var m = this._margin;
		var w = this._width - m * 2;
		var h = this._height - m * 2;
		this._windowBackSprite.bitmap = new Bitmap(w, h);
		this._windowBackSprite.setFrame(0, 0, w, h);
		this._windowBackSprite.move(m, m);
		if (w > 0 && h > 0 && this._windowskin) {
			var p = 13;
			var q = 14;
	
			var x1 = 40 - p;
			var x2 = w-p;
			var y2 = h-p;
			var cH = y2 - p;
			const ctx = this._windowBackSprite.bitmap._context;
			const skin = this._windowskin._canvas;
			// right: top center bottom
			ctx.drawImage(skin, 0, 0,p,p, 0,0,p,p);
			ctx.drawImage(skin, 0, p,p,q, 0,p,p,cH);
			ctx.drawImage(skin, 0,x1,p,p, 0,y2,p,p);
	
			// center: top center bottom
			ctx.drawImage(skin, p, 0,p,p, p,0,x2-p,p);
			ctx.drawImage(skin, p, p,p,q, p,p,x2-p,cH);
			ctx.drawImage(skin, p,x1,p,p, p,y2,x2-p,p);
	
			// left: top center bottom
			ctx.drawImage(skin, x1, 0,p,p, x2,0,p,p);
			ctx.drawImage(skin, x1, p,p,q, x2,p,p,cH);
			ctx.drawImage(skin, x1,x1,p,p, x2,y2,p,p);
		}
		// this.contentsOpacity = 0;
	};
	_refreshArrows() {
		let iX = 40;
		let p = 16;
		let q = 24;
	
		this._downArrowSprite.bitmap = this._windowskin;
		this._downArrowSprite.anchor.x = 0.5;
		this._downArrowSprite.setFrame(iX, 0, p, q);
	
		this._upArrowSprite.bitmap = this._windowskin;
		this._upArrowSprite.anchor.x = 0.5;
		this._upArrowSprite.setFrame(iX+p, 0, p, q);
	};
	_refreshPauseSign() {
		let p = 24;
		this._windowPauseSignSprite.bitmap = this._windowskin;
		this._windowPauseSignSprite.anchor.x = 0.5;
		this._windowPauseSignSprite.anchor.y = 0.5;
		this._windowPauseSignSprite.move(this._width - 22, this._height - 20);
		this._windowPauseSignSprite.setFrame(72, 0, p, p);
		this._windowPauseSignSprite.alpha = 0;
	};
	_updateArrows() {}
	_updatePauseSign() {
		var sprite = this._windowPauseSignSprite;
		if (sprite.visible = this.isOpen()){
			if (sprite.rotation >= 2.4){
				sprite.rotation = 0;
			}else{
				sprite.rotation += 0.012;
			}
		}
		if (!this.pause) {
			sprite.alpha = 0;
		} else if (sprite.alpha < 1) {
			sprite.alpha = Math.min(sprite.alpha + 0.1, 1);
		}
	}
}

//=============================================
// new Window_ChoiceList2 < Window_ChoiceList
//=============================================
class Window_ChoiceList2 extends Window_ChoiceList{
	standardFontSize() { return 24; }
	standardPadding() { return 13; }
	lineHeight() { return 32; }
	disableDrawBack() { return false; }
	updateBackground(){ this.setBackgroundType(2); }
	updatePlacement() {
		this.width = this._messageWindow.width;
		this.height = this.windowHeight();
		this.updatePopPosition();
	}

	windowWidth() {
		let width = this.maxChoiceWidth() + this.padding * 2;
		return Math.min(width, Graphics.boxWidth);
	};
	drawItem(index) {
		const rect = this.itemRectForText(index);
		this.drawTextEx("●"+this.commandName(index), rect.x, rect.y);
	};
	// update
	update() {
		super.update();
		this.updatePopPosition();
	};
	updatePopPosition(){
		this.x = this._messageWindow.x;
		this.y = this._messageWindow.y + this._messageWindow.height - this.height - 4;
	};
	// low layer
	_createAllParts() {
		this._windowSpriteContainer = new PIXI.Container();
		this._windowBackSprite = new Sprite();
		this._windowCursorSprite = new Sprite();
		this._windowContentsSprite = new Sprite();
		this._downArrowSprite = new Sprite();
		this._upArrowSprite = new Sprite();
		this._windowPauseSignSprite = new Sprite();
		this._windowBackSprite.bitmap = new Bitmap(1, 1);
		this._windowBackSprite.visible = false;
		this._windowContentsSprite.visible = false;
		this.addChild(this._windowCursorSprite);
		this.addChild(this._windowContentsSprite);
	};
	_refreshBack() {
		this._windowBackSprite.visible = false;
	};
	
	_refreshFrame() {
	};
}

//=============================================
// no mask
//=============================================
WindowLayer.prototype._maskWindow = function(window, shift) {
	this._windowMask._currentBounds = null;
	this._windowMask.boundsDirty = true;
	if (window._knsDisableDrawBack){
		var rect = this._windowRect;
		rect.x = this.x + shift.x + window.x;
		rect.y = this.x + shift.y + window.y + window.height / 2 * (1 - window._openness / 255);
		rect.width = window.width;
		rect.height = window.height * window._openness / 255;
	}
};
//=============================================
// apply for scene
//=============================================
Scene_Base.prototype.knsRecreateMessageWindow = function(){
	if (this.lastMessageType = $gameSwitches.value(5)){
		this._messageWindow = new Window_Message();
	}else{
		this._messageWindow = new Window_PopMessage();
	}
	this.addWindow(this._messageWindow);
	this._messageWindow.knsSubSprites().forEach(sp => this.addWindow(sp));
	this._messageWindow.subWindows().forEach(win => this.addWindow(win));
}

Scene_Base.prototype.knsUpdateMessageWindow = function(){
	if (this.lastMessageType != $gameSwitches.value(5)){
		this._windowLayer.removeChild(this._messageWindow);
		this._messageWindow.knsSubSprites().forEach(sp => this._windowLayer.removeChild(sp));
		this._messageWindow.subWindows().forEach(win => this._windowLayer.removeChild(win));
		this.knsRecreateMessageWindow();
	}
}

// Map
Scene_Map.prototype.createMessageWindow = function() {
	this.knsRecreateMessageWindow();
};

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
	this.knsUpdateMessageWindow();
	_Scene_Map_update.call(this);
};

// Battle
Scene_Battle.prototype.createMessageWindow = function() {
	this.knsRecreateMessageWindow();
};
	
const _Scene_Battle_update = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function() {
	this.knsUpdateMessageWindow();
	_Scene_Battle_update.call(this);
};
})();