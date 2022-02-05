(function(){
//================================================
// alias Window_Options
//================================================
Window_Options.prototype.volumeOffset = function(){ return 10; };
Window_Options.prototype.statusWidth = function(){ return 200; };
Window_Options.prototype.windowWidth = function(){ return 500; };
Window_Options.prototype.isDoneSymbol = function(index){
	return this.commandSymbol(index) == 'cancel';
}

Window_Options.prototype.booleanStatusText = function(value) {
	return KNS_TERMS[value ? 'SET_ON' : 'SET_OFF'];
};

Window_Options.prototype.addGeneralOptions = function() {
	this.addCommand(KNS_TERMS.SET_ALWAYS_DASH, 'alwaysDash');
};

Window_Options.prototype.addVolumeOptions = function(){
	this.addCommand(KNS_TERMS.SET_BGM_VOLUME, 'bgmVolume');
	this.addCommand(KNS_TERMS.SET_BGS_VOLUME, 'bgsVolume');
	this.addCommand(KNS_TERMS.SET_ME_VOLUME, 'meVolume');
	this.addCommand(KNS_TERMS.SET_SE_VOLUME, 'seVolume');
	this.addCommand(KNS_TERMS.SET_DONE, 'cancel');
};

Window_Options.prototype.drawItem = function(index){
	this.resetTextColor();
	this.changePaintOpacity(this.isCommandEnabled(index));
	// 実描画開始
	const rect = this.itemRectForText(index);
	if (this.isDoneSymbol(index)){
		this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'center');
	}else{
		const statusWidth = this.statusWidth();
		const titleWidth = rect.width - statusWidth;
		this.drawText(this.commandName(index), rect.x, rect.y, titleWidth, 'left');
		const symbol = this.commandSymbol(index);
		if (this.isVolumeSymbol(symbol)) {
			const value = this.getConfigValue(symbol);
			this.drawGauge(
				titleWidth, rect.y - 2, statusWidth, value / 100,
				this.textColor(30), this.textColor(31)
			);
		}
		this.drawText(this.statusText(index), titleWidth, rect.y, statusWidth, 'right');
	}
};

// input
const _Window_Options_processOk = Window_Options.prototype.processOk;
Window_Options.prototype.processOk = function() {
	if (this.isDoneSymbol(this.index())){
		Window_Command.prototype.processOk.call(this);
	}else{
		_Window_Options_processOk.call(this);
	}
};

const _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
Window_Options.prototype.cursorRight = function(wrap) {
	if (!this.isDoneSymbol(this.index())){
		_Window_Options_cursorRight.call(this, wrap);
	}
};

const _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
Window_Options.prototype.cursorLeft = function(wrap) {
	if (!this.isDoneSymbol(this.index())){
		_Window_Options_cursorLeft.call(this, wrap);
	}
};

//================================================
// alias Scene_Options
//================================================
const _Scene_Options_create = Scene_Options.prototype.create;
Scene_Options.prototype.create = function() {
	_Scene_Options_create.call(this);
	this._optionsWindow.setBackgroundType(1);
	this._optionsWindow._dimmerSprite.scale.x = 2.5;
	this._optionsWindow._dimmerSprite.x = -this._optionsWindow.x - 2;
	this._backgroundSprite.opacity = 128;
};


//================================================
// alias Window_GameEnd
//================================================
KNS_Menu.linkHelp(Window_GameEnd);
Window_GameEnd.prototype.makeCommandList = function() {
    this.addCommand('OPTION_VOLUME', 'options');
    this.addCommand('OPTION_TITLE', 'toTitle');
    this.addCommand('OPTION_QUIT',  'cancel');
};

Window_GameEnd.prototype.itemTextAlign = function(){
	return 'center';
}
//================================================
// alias Scene_GameEnd
//================================================
const _Scene_GameEnd_create = Scene_GameEnd.prototype.create;
Scene_GameEnd.prototype.create = function() {
    _Scene_GameEnd_create.call(this);
    this.createHelpWindow();
	this._commandWindow.y += 48;
	this._commandWindow.setHelpWindow(this._helpWindow);
    this._commandWindow.setHandler('options',  this.commandOptions.bind(this));
	this._commandWindow.setBackgroundType(2);
	this._helpWindow.setBackgroundType(1);
	this._helpWindow.y = this._commandWindow.y - this._helpWindow.height;
	this._helpWindow.openness = 0;
	this._helpWindow.open();

	this.pushKnsSlide(this._helpWindow, 2);
	this.pushKnsSlide(this._commandWindow, 8);
};

Scene_GameEnd.prototype.commandOptions = function() {
    SceneManager.goto(Scene_Options);
}

Scene_GameEnd.prototype.commandToTitle = function() {
	const text = KNS_TERMS.OPTION_TITLE_ALERT;
	if (this._helpWindow._text == text){
		this.fadeOutAll();
		SceneManager.goto(Scene_Title);
	}else{
		this._commandWindow.activate();
		this._helpWindow.setText(text);
	}
}

})();