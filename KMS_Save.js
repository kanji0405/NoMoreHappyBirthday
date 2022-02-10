//=============================================================================
// KMS_Save.js
//   Last update: 2020/6/21
//=============================================================================
/*:
 * @plugindesc [v0.1.0] セーブ/ロード画面にスクリーンショットを追加します。
 * @author TOMY (Kamesoft)
 */
// from KMS_SaveWithSnap.js
(function() {
//======================================================
// alias DataManager
//======================================================
DataManager.maxSavefiles = function(){ return 25; };

const _makeSavefileInfo = DataManager.makeSavefileInfo;
DataManager.makeSavefileInfo = function() {
	const info	= _makeSavefileInfo.apply(this, arguments);
	const bitmap = this.makeSavefileBitmap();
	if (bitmap){
		info.snapUrl = bitmap.toDataURL();
	}
	info.advice	= $gameVariables.value(6);
	info.gold	= $gameParty.gold();
	info.place	= $dataMap.displayName;
	return info;
};

DataManager.makeSavefileBitmap = function(){
	const bmp = $gameTemp.getSavefileBitmap();
	if (!bmp) return null;
	bmp.smooth = false;
	let width  = Math.floor(0.5*Sprite_ScreenShot.SS_WIDTH);
	let height = Math.floor(0.5*Sprite_ScreenShot.SS_HEIGHT);
	const newBmp = new Bitmap(width, height);
	newBmp.smooth = false;
	newBmp._context.drawImage(bmp._canvas, 
		0, 0, bmp.width, bmp.height,
		0, 0, newBmp.width, newBmp.height
	);
	return newBmp;
};


//-----------------------------------------------------------------------------
// Game_Temp
const _Game_Temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function(){
	_Game_Temp_initialize.call(this);
	this._savefileBitmap = null;
};
Game_Temp.prototype.setSavefileBitmap = function(bitmap){
	this._savefileBitmap = bitmap;
};
Game_Temp.prototype.getSavefileBitmap = function(){
	if (this._savefileBitmap){
		return this._savefileBitmap;
	}else{
		return SceneManager._backgroundBitmap;
	}
};

//======================================================
// alias Game_Party
//======================================================
Game_Party.prototype.charactersForSavefile = function() {
    return [];
};

Game_Party.prototype.facesForSavefile = function() {
    return this.battleMembers().map(function(actor) {
        return [actor.faceName(), actor.faceIndex(), actor.level];
    })
};

// KMS_Save over

//-----------------------------------------------------------------------------
// Bitmap
Bitmap.prototype.toDataURL = function(){
	let type, value;
	if (KNS_Atsumaru.isAtsumaru()){
		type = 'image/jpeg';
		value = 0.15;
	}else{
		type = 'image/jpeg';
		value = 0.75;
	}
	return this._canvas.toDataURL(type, value);
};

//======================================================
// new Sprite_ScreenShot
//======================================================
class Sprite_ScreenShot extends Sprite{
	loadSS() {
		if (!this._loadedImg){
			this._loadedImg = this._noData;
			if (this._infoData && this._infoData.snapUrl){
				try{
					this._loadedImg = ImageManager.loadNormalBitmap(
						this._infoData.snapUrl);
				}catch (e){
					console.log(e);
				}
			}
		}
		return this._loadedImg;
	}
	_knsZIndex(){ return this._knsMoveInfo.ty; }

	constructor(id, calced, noData) {
		super(new Bitmap(Sprite_ScreenShot.SS_WIDTH, Sprite_ScreenShot.SS_HEIGHT));
		this._moveList = calced;
		this.moveCount = this._maxMoveFrame = calced.length;

		this._id = id;
		this._infoData = DataManager.loadSavefileInfo(this._id);

		this._noData = noData;
		this.anchor.x = this.anchor.y = 0.5;
		this.scale.x = this.scale.y = 0;

		this.bitmap.fillAll('black');
		this.loadSS();
	}
	_knsMoveTo(rate){
		this.moveCount = 0;
		const thF = Math.cos(rate);
		this._knsMoveInfo = {
			ox: this.x,
			oy: this.y,
			tx: Sprite_ScreenShot.RADIUS_WIDTH * Math.sin(rate),
			ty: Sprite_ScreenShot.RADIUS_HEIGHT * thF,
			oldScale: this.scale.x,
			newScale: Math.max(Math.min(thF * 1.25, 1), 0.625)
		}
		this._knsMoveInfo.padX = this._knsMoveInfo.tx - this._knsMoveInfo.ox;
		this._knsMoveInfo.padY = this._knsMoveInfo.ty - this._knsMoveInfo.oy;
		this._knsMoveInfo.padScale = this._knsMoveInfo.newScale - this._knsMoveInfo.oldScale;
		this.opacity = Math.max(255 * thF, -20) + 90;
	}
	update() {
		super.update();
		if (this.moveCount < this._maxMoveFrame) {
			const rate = this._moveList[this.moveCount++];
			this.x = this._knsMoveInfo.padX * rate + this._knsMoveInfo.ox;
			this.y = this._knsMoveInfo.padY * rate + this._knsMoveInfo.oy;
			this.scale.x = this.scale.y = 
			this._knsMoveInfo.padScale * rate + this._knsMoveInfo.oldScale;
		}
	}
	refresh() {
		const bmp = this.loadSS();
		this.bitmap._context.drawImage(
			bmp._canvas, 0, 0, bmp.width, bmp.height,
			1, 1, this.bitmap.width, this.bitmap.height
		);
		this.drawNumber();
	}
	drawNumber(){
		let h = 28;
		this.bitmap.drawText(
			KNS_TERMS.FILE_NUMBER + this._id, 4, 2, this.bitmap.width, h
		);
		const info = this._infoData;
		if (!info) return;
		// ファイルを読み込めなければ半透明で文字列を描画
		var valid = DataManager.isThisGameFile(this._id);
		this.bitmap.paintOpacity = valid ? 255 : 128;
		// プレイ時間の描画
		if (info.playtime) {
			this.bitmap.drawText(
				info.playtime, 0, this.bitmap.height - h,
				this.bitmap.width, h, "right"
			);
		}
	}
}
Sprite_ScreenShot.NO_DATA_TEXT = "NO DATA"
Sprite_ScreenShot.RADIUS_WIDTH  = 500;
Sprite_ScreenShot.RADIUS_HEIGHT = 80;
Sprite_ScreenShot.SS_WIDTH = 280;
Sprite_ScreenShot.SS_HEIGHT = 220;

//======================================================
// new Spriteset_File
//======================================================
class Spriteset_File extends Sprite{
	// create
	constructor(listWindow, infoWindow, helpWindow){
		super();
		this._infoWindow = infoWindow;
		this._helpWindow = helpWindow;
		this._listWindow = listWindow;
		this._lastIndex = this._listWindow.index();
		this.x = 408;
		this.y = 224;
		this.createFiles();
	}
	createFiles(){
		const noData = this.createNoData();
		const maxFrame = 8;
		const calced = new Array(maxFrame);
		for (let i = 0; i < maxFrame; i++) calced[i] = (i + 1) / maxFrame;
		const max = this._listWindow.maxItems();
		for (let i = 1; i <= max; i++) {
			this.addChild(new Sprite_ScreenShot(i, calced, noData));
		};
		this.sortedChildren = Array.from(this.children);
	}
	createNoData(){
		const width  = Sprite_ScreenShot.SS_WIDTH-2;
		const height = Sprite_ScreenShot.SS_HEIGHT-2;
		const bmp = new Bitmap(width, height);
		bmp.gradientFillRect(0, 0, width, height, "#444", "#111", true);
		bmp.drawText(Sprite_ScreenShot.NO_DATA_TEXT, 0, 0, width, height, "center")
		return bmp;
	}
	// update
	refreshInfoWindow() {
		const idx = this._listWindow.index();
		this._infoWindow.refresh(idx, this.sortedChildren[idx]._infoData);
	}
	update(){
		super.update();
		this.updateTouchInput();
		const index = this._listWindow.index();
		if (this._lastIndex != index){
			this._lastIndex = index;
			SoundManager.playCursor();
			this.updatePosition();
			this.refreshInfoWindow();
		}
	}
	updateTouchInput(){
		if (
			this._listWindow.active && TouchInput.isRepeated() &&
			TouchInput.y > this._helpWindow.height && 
			TouchInput.y < this._infoWindow.y
		){
			const tx = TouchInput.x - this.x;
			const sp = this.sortedChildren[this._listWindow.index()];
			const w  = Sprite_ScreenShot.SS_WIDTH >> 1;
			if       (sp.x > tx + w) {
				this._listWindow.cursorUp();
			}else if (sp.x + w < tx) {
				this._listWindow.cursorDown();
			}else{
				const ty = TouchInput.y - this.y;
				const h = sp.height >> 1;
				if (ty < sp.y + h && ty + h > sp.y) {
					this._listWindow.processOk();
				}
			}
		}
	}
	updatePosition() {
		// set z-axis
		const math = Math.PI / this.sortedChildren.length * 2;
		let index = -this._listWindow.index();
		this.sortedChildren.forEach(function(sp, i){
			sp._knsMoveTo(math * (index + i));
		}, this);
		this.removeChildren();
		this.addChild(...Array.from(this.sortedChildren).sort(function(a, b){
			return a._knsZIndex() - b._knsZIndex();
		}));
	}
	__start(){
		this.sortedChildren.forEach(sp => sp.refresh());
		this.refreshInfoWindow();
		this.updatePosition();
	}
	__terminate(){
		this.sortedChildren.forEach(sp => sp.destroy());
		this.destroy();
	}
}

//======================================================
// new Window_SSStatus
//======================================================
class Window_SSStatus extends Window_Base{
	constructor(h){
		super(0, Graphics.height - h - 24, Graphics.width, h + 24);
	}
	refresh(idx, info){
		this.contents.clear();
		this.contents.fillRect(0,34,this.contents.width,2, 'gray')
		this.drawText(KNS_TERMS.FILE_TITLE + (idx + 1), 0, 0, 200);
		if (!info) return;
		if (info.playtime){
			this.drawText(info.playtime, 0, 0, this.contents.width, "right");
		}
		this.contents.fontSize = 24;
		let x = 0, y = 40, levelY = 90 + y, w = 124;
		if (info.faces) {
			info.faces.forEach(function(actor){
				this.drawCircleFace(actor[0], actor[1], x, y, w, w);
				// level
				this.changeTextColor(this.normalColor());
				this.drawText(actor[2], x, levelY, w-10, "right");
				this.changeTextColor(this.systemColor());
				this.drawText(KNS_TERMS.STATUS_LEVEL, x + 38, levelY, w);
				x += w+2;
			}, this);
		}
		w = 270;
		x = this.contents.width - w;
		this.drawSubInfo(
			x, 40, w, KNS_TERMS.FILE_GOLD, info.gold, KNS_TERMS.CURRENCY_UNIT);
		this.drawSubInfo(
			x, 100, w, KNS_TERMS.FILE_PLACE, $gameMap.displayName(info.place), null);
		if (info.advice != undefined){
			const text = KNS_ADVICE[info.advice];
			if (text){
				x = 0;
				const system = this.textColor(2);
				const normal = this.normalColor();
				for (let chr of text){
					if (chr == '@'){
						this.changeTextColor(
							this.contents.textColor == normal ? system : normal
						);
						continue;
					}else if (chr == '\n'){
						continue;
					}
					this.drawText(chr, x, 160, this.contents.width);
					x += this.textWidth(chr);
				}
			}
		}
		this.contents.fontSize = this.standardFontSize();
	}
	drawSubInfo(x, y, w, title, text, unit){
		if (text == undefined) return;
		this.changeTextColor(this.systemColor());
		this.drawText(title, x, y, w);
		y += 24;
		if (unit){
			let unitWidth = this.textWidth(unit);
			this.drawText(unit, x + w - unitWidth, y, w);
			w -= unitWidth;
		}
		this.changeTextColor(this.normalColor());
		this.drawText(text, x, y, w, "right");
	}
}

//======================================================
// alias Scene_File
//======================================================
// create
const _Scene_File_create = Scene_File.prototype.create;
Scene_File.prototype.create = function() {
	_Scene_File_create.apply(this, arguments);
	this.createFileDataWindow();
	this.createScreenShots();
	this.createFileTouchSprite();
	this.knsCreateCancelButton([this._listWindow], true);
	this._listWindow.hide();
	this._listWindow.y = Graphics.height;

	this._infoWindow.opacity = 0;
	this._helpWindow.opacity = 0;
	this.knsCreateBackBlacks(
		this._helpWindow.y + this._helpWindow.height,
		Graphics.height - this._infoWindow.height
	);
	this.pushKnsSlide(this._infoWindow, 8);
	this.pushKnsSlide(this._helpWindow, 2);
}
Scene_File.prototype.createHelpWindow = function() {
	this._helpWindow = new Window_Help(1);
	this._helpWindow.setText(this.helpWindowText());
	this.addChild(this._helpWindow);
};
Scene_File.prototype.createFileDataWindow = function () {
	this._infoWindow = new Window_SSStatus(200);
	this.addChild(this._infoWindow);
}
Scene_File.prototype.createFileTouchSprite = function () {
	this._fileTouchSprite = new Sprite(ImageManager.loadSystem("saveArrows"));
	this.addChild(this._fileTouchSprite);
}
Scene_File.prototype.createScreenShots = function () {
	this._spriteset = new Spriteset_File(this._listWindow, this._infoWindow, this._helpWindow);
	this.addChild(this._spriteset);
}
// start
const _Scene_File_start = Scene_File.prototype.start;
Scene_File.prototype.start = function () {
	_Scene_File_start.apply(this, arguments);
	this._spriteset.__start();
}

const _Scene_File_terminate = Scene_File.prototype.terminate;
Scene_File.prototype.terminate = function () {
	_Scene_File_terminate.apply(this, arguments);
	this._spriteset.__terminate();
	Graphics.callGC();
}

//======================================================
// alias Child Classes
//======================================================
Scene_Save.prototype.helpWindowText = function(){ return KNS_TERMS.SAVE_MESSAGE; }
Scene_Load.prototype.helpWindowText = function(){ return KNS_TERMS.LOAD_MESSAGE; }

const _Scene_Save_create = Scene_Save.prototype.create;
Scene_Save.prototype.create = function() {
	_Scene_Save_create.call(this);
	this._backgroundSprite.opacity = 96;
};

const _Scene_Load_create = Scene_Load.prototype.create;
Scene_Load.prototype.create = function() {
	_Scene_Load_create.call(this);
	this.knsSetBackgroundOpacity(96);
};

//======================================================
// alias Window_SavefileList
//======================================================
Window_SavefileList.prototype.refresh = function() {
};
Window_SavefileList.prototype.cursorDown = function(wrap) {
	Window_Selectable.prototype.cursorDown.call(this, true);
};
Window_SavefileList.prototype.cursorUp = function(wrap) {
	Window_Selectable.prototype.cursorUp.call(this, true);
};
Window_SavefileList.prototype.cursorRight = function(wrap) {
	this.cursorDown(true);
};
Window_SavefileList.prototype.cursorLeft = function(wrap) {
	this.cursorUp(true);
};
})();