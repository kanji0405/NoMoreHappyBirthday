"use strict";
(function(){
SceneManager.snapForBackground = function(needBlur){
	this._backgroundBitmap = this.snap();
	if (this._backgroundBitmap && needBlur) this._backgroundBitmap.blur();
}

Game_Interpreter.prototype.command354 = function() {
	SceneManager._backgroundBitmap = null;
	SceneManager.goto(Scene_Title);
	return true;
};

Scene_GameEnd.prototype.commandToTitle = function() {
	SceneManager._backgroundBitmap = null;
	this.fadeOutAll();
	SceneManager.goto(Scene_Title);
};

Scene_Gameover.prototype.gotoTitle = function() {
	SceneManager._backgroundBitmap = null;
	SceneManager.goto(Scene_Title);
};

//===========================================
// alias Window_TitleCommand
//===========================================
Window_TitleCommand.prototype.itemTextAlign = function() {
	return 'center'
};

Window_TitleCommand.prototype.lineHeight = function() {
	return 48
};

Window_TitleCommand.prototype.createContents = function() {
	Window_Command.prototype.createContents.call(this);
	this.contents.outlineWidth = 3;
};

Window_TitleCommand.prototype.makeCommandList = function() {
    this.addCommand(KNS_TERMS.TITLE_NEW_GAME,   'newGame');
    this.addCommand(KNS_TERMS.TITLE_CONTINUE, 'continue', this.isContinueEnabled());
    this.addCommand(KNS_TERMS.TITLE_OPTIONS,   'options');
};

//===========================================
// alias Scene_Title
//===========================================
Scene_Title.prototype.start = function() {
	Scene_Base.prototype.start.call(this);
	SceneManager.clearStack();
	this.playTitleMusic();
	const bmp = SceneManager.backgroundBitmap();
	if (!bmp){
		this.startFadeIn(this.fadeSpeed(), false);
	}
};

const _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
Scene_Title.prototype.createCommandWindow = function() {
	_Scene_Title_createCommandWindow.call(this);
	this._commandWindow.y += 30;
	this._commandWindow.opacity = 0;
};

Scene_Title.prototype.createForeground = function() {
	// new gameTitleSprite
    this._gameTitleSprite = new Sprite(ImageManager.loadTitle1('cake_fire'));
	this.setFireFrame(0);
	this._gameTitleSprite.x = Graphics.width  - this._gameTitleSprite.width >> 1;
	this._gameTitleSprite.y = Graphics.height - this._gameTitleSprite.height - 124;
	this._gameTitleSprite._fireCount = 1;
    this.addChild(this._gameTitleSprite);

	// setting backSprite2
	this._backSprite2.opacity = 0;
	this._backSprite2.x = Graphics.width >> 1;
	this._backSprite2.y = (Graphics.height >> 1) - 10;
	this._backSprite2.anchor.x = 0.5;
	this._backSprite2.anchor.y = 0.5;
    this.addChild(this._backSprite2);

	// new credit Sprite
	const bmp = new Bitmap(444, 32);
	bmp.outlineWidth = 3;
	bmp.fontSize = 20;
	bmp.drawText(KNS_TERMS.CREDIT, 0, 0, bmp.width, bmp.height, 'right');
	this._creditSprite = new Sprite(bmp);
	this._creditSprite.x = Graphics.width - bmp.width - 10;
	this._creditSprite.y = Graphics.height - bmp.height;
	this.addChild(this._creditSprite);
};

Scene_Title.prototype.setFireFrame = function(i){
	let height = 144;
	this._gameTitleSprite.setFrame(0, height * i, 420, height);
};

const _Scene_Title_update = Scene_Title.prototype.update;
Scene_Title.prototype.update = function(){
	_Scene_Title_update.call(this);
	this._creditSprite.opacity = this._backSprite2.opacity = 
		this._commandWindow.openness;
	const max = 12;
	let page = this._gameTitleSprite._fireCount / max;
	if (page == Math.floor(page)){
		if (page == 4){
			this._gameTitleSprite._fireCount = 0;
			page = 0;
		}
		this.setFireFrame(page);
	}
	this._gameTitleSprite._fireCount++;
}

Scene_Title.prototype.terminate = function() {
    Scene_Base.prototype.terminate.call(this);
    SceneManager.snapForBackground(true);
};

})();
