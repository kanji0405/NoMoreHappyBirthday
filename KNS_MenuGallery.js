"use strict";
//======================================================
// new KNS_MenuGallery
//======================================================
class KNS_MenuGallery{
	static allDataOf(list){
		return list.filter(function(item){
			return item && item.name.length > 0 && !item.meta.noIndex;
		})
	}
	static getItemList(type){
		switch (type){
			case -1:
				return this.allDataOf($dataItems).filter(function(item){
					return item.itypeId == 2;
				});
			case 0:
				return this.allDataOf($dataItems).filter(function(item){
					return item.itypeId == 1;
				});
			case 1:	return this.allDataOf($dataWeapons);
			case 2:
				return this.allDataOf($dataArmors).filter(function(item){
					return item.atypeId != 1;
				});
			case 3:	return this.allDataOf($dataEnemies);
		}
	}
}

//======================================================
// alias Game_System
//======================================================
Game_System.prototype.knsGetItemHistory = function(type){
	if (!this._knsHistoryList) this._knsHistoryList = [];
	if (type == -1) type = 0;
	if (!this._knsHistoryList[type]){
		this._knsHistoryList[type] = [];
	}
	return this._knsHistoryList[type];
}

Game_System.prototype.addHistory = function(type, id){
	const list = this.knsGetItemHistory(type);
	if (!list.includes(id)) list.push(id);
};

Game_System.prototype.knsIsInHistory = function(type, id){
	const list = this.knsGetItemHistory(type);
	return list.includes(id);
}

Game_System.prototype.knsIsItemInHistory = function(item){
	if (!item) return false;
	let type = 0;
	if (DataManager.isWeapon(item)){
		type = 1;
	}else if (DataManager.isArmor(item)){
		type = 2;
	}else if (DataManager.isEnemy(item)){
		type = 3;
	}
	return this.knsIsInHistory(type, item.id);
}

// message
Game_System.prototype.knsGetMessageLog = function(){
	if (!this._knsMessageLog){
		this._knsMessageLog = [];
	}
	return this._knsMessageLog;
}

KNS_MenuGallery.RE_MESSAGE_NAME = /^\\c\[3\]\\>(.+?)\\c\[0\]\\<$/;
KNS_MenuGallery.RE_MESSAGE_VAR = /\\v\[(\d+)\]/g;
KNS_MenuGallery.RE_MESSAGE_NEEDLESS = /\\[\^\.\|><\$\{\}]/g;
Game_System.prototype.knsAddMessageLog = function(line){
	if (KNS_MenuGallery.RE_MESSAGE_NAME.test(line)){
		for (let i = 1; i < $dataActors.length; i++){
			if (RegExp.$1 == $gameActors.actor(i).name()){
				line = i;
				break;
			}
		}
		if (typeof line === 'string'){
			line = [line];
		}
	}else{
		line = line.replace(KNS_MenuGallery.RE_MESSAGE_VAR, function(_, id){
			return $gameVariables.value(id);
		}).replace(KNS_MenuGallery.RE_MESSAGE_NEEDLESS, '');
	}
	const array = this.knsGetMessageLog();
	array.push(line);
	if (array.length > 100) array.shift();
}

//======================================================
// alias Game_Message
//======================================================
const _Game_Message_add = Game_Message.prototype.add;
Game_Message.prototype.add = function(text){
	_Game_Message_add.call(this, text);
	$gameSystem.knsAddMessageLog(text);
}

//======================================================
// alias Game_Party
//======================================================
const _Game_Party_gainItem = Game_Party.prototype.gainItem;
Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
	_Game_Party_gainItem.apply(this, arguments);
	if (item && amount > 0) {
		let type = 0;
		if (DataManager.isWeapon(item)) {
			type = 1;
		}else if (DataManager.isArmor(item)) {
			type = 2;
		}
		$gameSystem.addHistory(type, item.id);
	}
};

//======================================================
// alias Game_Enemy
//======================================================
Game_Enemy.prototype.knsAddHistory = function(id) {
	$gameSystem.addHistory(3, id == undefined ? this.enemyId() : id);
};

const _Game_Enemy_appear = Game_Enemy.prototype.appear;
Game_Enemy.prototype.appear = function() {
	_Game_Enemy_appear.apply(this, arguments);
	this.knsAddHistory();
};

const _Game_Enemy_transform = Game_Enemy.prototype.transform;
Game_Enemy.prototype.transform = function(enemyId) {
	_Game_Enemy_transform.apply(this, arguments);
	this.knsAddHistory(enemyId);
};

//======================================================
// alias Game_Troop
//======================================================
const _Game_Troop_setup = Game_Troop.prototype.setup;
Game_Troop.prototype.setup = function(troopId) {
	_Game_Troop_setup.apply(this, arguments);
	this.members().forEach(function(enemy) {
		if (enemy.isAppeared()) enemy.knsAddHistory();
	});
};

//======================================================
// new Window_KnsGalleryCommand
//======================================================
class Window_KnsGalleryCommand extends Window_Command{
	windowWidth(){ return Graphics.width; }
	maxCols(){ return 3; }
	standardFontSize(){ return 22; }
	constructor(list, info, log, help){
		super(0, 0);
		this.y = Graphics.height - this.height;
		this.opacity = 0;
		this._listWindow = list;
		this._infoWindow = info;
		this._logWindow = log;
		this.setHelpWindow(help);
	}
	makeCommandList(){
		this.addCommand('GALLERY_MESSAGE',	'message');
		this.addCommand('GALLERY_ENEMY',	'list',	true,	3);
		this.addCommand('CATEGORY_ITEM',	'list',	true,	0);
		this.addCommand('CATEGORY_WEAPON',	'list',	true,	1);
		this.addCommand('CATEGORY_ARMOR',	'list',	true,	2);
		this.addCommand('CATEGORY_KEYITEM',	'list',	true,	-1);
	}
	knsIsListCommand(index){
		return this.commandSymbol(
			index == undefined ? this.index() : index
		) == 'list';
	}
	drawItem(index){
		const rect = this.itemRectForText(index);
		this.drawText(
			KNS_TERMS[this.commandName(index)], rect.x, rect.y, rect.width
		);
		if (!this.knsIsListCommand(index)) return;
		const list = this.knsSetGetInfo(this.commandExt(index));
		const found		= list[0].length;
		const allItem	= list[1].length;
		let rate;
		if (allItem == 0 || found == allItem){
			rate = 100;
			this.changeTextColor(this.textColor(3));
		}else{
			rate = Math.floor((found / allItem) * 100);
		}
		this.contents.fontSize = 28;
		this.drawText(rate + '%', rect.x, rect.y, rect.width, 'right');
		this.resetFontSettings();
	}
	knsSetGetInfo(type){
		if (this._obtainedList == undefined){
			this._obtainedList = {};
		}
		if (this._obtainedList[type] == undefined){
			const list = KNS_MenuGallery.getItemList(type);
			const found = list.filter(function(item){
				return $gameSystem.knsIsInHistory(type, item.id);
			});
			this._obtainedList[type] = [found, list];
		}
		return this._obtainedList[type];
	}
	updateHelp(){
		this._helpWindow.setText(KNS_TERMS[this.commandName(this.index()) + '_TEXT']);
		if (this._listWindow && this._infoWindow && this._logWindow){
			this.updateSubWindows();
		}
	}
	updateSubWindows(){
		let index = this.index();
		if (this.knsIsListCommand(index)){
			this._logWindow.hide();
			this._infoWindow.show();
			this._listWindow.show();
			this._listWindow.setData(this.commandExt(index), this._obtainedList);
		}else{
			this._infoWindow.hide();
			this._listWindow.hide();
			this._logWindow.show();
			this._logWindow.refresh();
			this._logWindow.select(this._logWindow.maxItems() - 1);
		}
	}
}


//======================================================
// new Window_KnsMessageLog
//======================================================
class Window_KnsMessageLog extends Window_Selectable{
	constructor(y, h){
		super(0, y, Graphics.width, h);
		this.hide();
		this.opacity = 0;
		this._data = $gameSystem.knsGetMessageLog();
	}
	maxItems(){ return this._data ? this._data.length : 0; }
	standardFontSize(){ return 22; }
	itemHeight(){ return 32; }
	drawItem(index){
		const text = this._data[index];
		if (text == undefined){
			return;
		}
		const rect = this.itemRectForText(index);
		if (typeof text == 'string'){
			this.drawTextEx(text, rect.x + 20, rect.y);
		}else{
			let name;
			if (typeof text == 'number'){
				name = $gameActors.actor(text).name();
			}else{
				name = text[0];
			}
			this.changeTextColor(this.textColor(3));
			this.drawText(name, rect.x, rect.y, rect.width);
		}
	}
	processCursorMove() {
		if (this.isCursorMovable()) {
			if (Input.isPressed('down')) {
				this.cursorDown(false);
			}
			if (Input.isPressed('up')) {
				this.cursorUp(false);
			}
			if (Input.isRepeated('left')) {
				this.cursorUp(false);
			}
			if (Input.isRepeated('right')) {
				this.cursorDown(false);
			}
			if (!this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
				this.cursorPagedown();
			}
			if (!this.isHandled('pageup') && Input.isTriggered('pageup')) {
				this.cursorPageup();
			}
		}
	};
	}


//======================================================
// new Window_KnsGalleryList
//======================================================
class Window_KnsGalleryList extends Window_Selectable{
	itemHeight(){ return this._type == 1 ? 48 : super.itemHeight(); }
	knsWeaponY(){ return 28; }
	setInfoWindow(info){ this._infoWindow = info; }
	maxItems(){ return this._data ? this._data[1].length : 0; }
	knsIsDataInHistory(item){
		return item && this._data[0] && this._data[0].includes(item);
	}
	item(index){
		return this._data ? this._data[1][
			index == undefined ? this.index() : index] : null;
	}
	constructor(y, w, h){
		super(0, y, w, h);
		this.hide();
		this._type = null;
		this._data = null;
		this.opacity = 0;
	}
	drawItem(index){
		const item = this.item(index);
		if (!item) return;
		const inHistory = this.knsIsDataInHistory(item);
		this.changePaintOpacity(inHistory);
		let numWidth = 55;
		const rect = this.itemRect(index);
		this.drawText(
			String(index + 1).padZero(3) + ':', rect.x, rect.y, 
			numWidth, 'right'
		);
		rect.x += numWidth;
		rect.width -= numWidth;
		let name = KNS_TERMS.GALLERY_NO_DATA;
		if (DataManager.isEnemy(item)){
			if (inHistory) name = item.name;
			this.drawText(name, rect.x, rect.y, rect.width);
		}else{
			if (inHistory){
				this.drawItemName(item, rect.x, rect.y, rect.width);
			}else{
				this.drawText(KNS_TERMS.GALLERY_NO_DATA, 
					rect.x + this.knsIconWidth(item), rect.y, rect.width
				);
				const sp = this.knsGenerateIcon(item, rect.x, rect.y);
				if (sp){
					sp.setColorTone(Window_KnsGalleryList.COLOR_NOT_IN_HISTORY);
					sp.opacity = 255;
				}
			}
		}
	}
	setData(type, data){
		if (this._type != type){
			this._type = type;
			this._data = data[type];
			this.deselect();
			this.refresh();
		}
	}
	updateHelp(){
		const item = this.item();
		const inHistory = this.knsIsDataInHistory(item);
		if (inHistory){
			this._helpWindow.setItem(item);
		}else{
			this._helpWindow.setText('');
		}
		if (this._infoWindow){
			this._infoWindow.setItem(item, inHistory);
		}
	}
	deactivate(){
		super.deactivate();
		if (this._infoWindow) this._infoWindow.setItem(null);
	}

}
Window_KnsGalleryList.COLOR_NOT_IN_HISTORY = [-255,255,-255,255];
KNS_Menu.setIconWindow(Window_KnsGalleryList);

//======================================================
// new Window_KnsGalleryInfo
//======================================================
class Window_KnsGalleryInfo extends Window_Base{
	constructor(y, w, h){
		super(w, y, Graphics.width - w, h);
		this.hide();
		this._item = null;
		this.setBackgroundType(1);
		this._enemySprite = new Sprite();
		this._enemySprite.x = this.width - 130;
		this._enemySprite.y = this.height;
		this._enemySprite.anchor.x = 0.5;
		this._enemySprite.anchor.y = 1;
		this.addChild(this._enemySprite);
	}
	setItem(item, has){
		if (this._item === item) return;
		this._item = item;
		this.refresh();
		if (item){
			if (DataManager.isEnemy(item)){
				this.refreshEnemy(item, has);
			}else{
				this.refreshItem(item, has);
			}
		}
	}
	refresh(){
		this.contents.clear();
		this.resetFontSettings();
		this._enemySprite.bitmap = null;
	}
	drawTitleAndValue(title, value, x, y, width){
		this.changeTextColor(this.systemColor());
		this.contents.fontSize = 24;
		this.drawText(title, x, y - 2, width);
		let pad = this.textWidth(title);
		this.changeTextColor(this.normalColor());
		this.contents.fontSize = this.standardFontSize();
		this.drawText(value, x + pad, y, width - pad, 'right');
	}
	refreshItem(item, has){
		const isWeapon	= DataManager.isWeapon(item);
		const isArmor	= DataManager.isArmor(item);

		let x = this.textPadding();
		let y = x;
		const sp = this.knsGenerateIcon(item, x, y + 16);
		if (sp){
			sp.scale.x = sp.scale.y = 2;
			if (isWeapon){
				sp.x += 4;
				sp.y += 12;
			}else{
				sp.x -= 4;
			}
			if (!has){
				sp.setColorTone(Window_KnsGalleryList.COLOR_NOT_IN_HISTORY)
			}
		}
		let iconWidth = this.knsIconWidth(item) << 1;
		let lineHeight = this.lineHeight();
		x += iconWidth;
		let width = this.contents.width - (y << 1) - iconWidth;
		if (has){
			this.drawText(item.name, x, y);
		}else{
			this.drawText(KNS_TERMS.GALLERY_NO_DATA, x, y);
			return;
		}

		this.drawTitleAndValue(
			KNS_TERMS.GALLERY_PRICE, item.price,
			x, y += lineHeight, width);
		this.drawTitleAndValue(
			KNS_TERMS.POSSESSION, $gameParty.numItems(item),
			x, y += lineHeight, width);
		// equip parts
		if (isWeapon || isArmor){
			x = this.textPadding();
			width = this.contents.width - (x << 1);
			this.drawTitleAndValue(
				KNS_TERMS.TYPE_PARTS, KNS_TERMS.EQUIP_PARTS[item.etypeId],
				x, y += lineHeight, width
			);

			// role
			const etypeId = isWeapon ? item.wtypeId : item.atypeId;
			const code = Game_BattlerBase[isWeapon ? 'TRAIT_EQUIP_WTYPE' : 'TRAIT_EQUIP_ATYPE'];
			this.contents.fontSize = 24;
			this.changeTextColor(this.systemColor());
			this.drawText(KNS_TERMS.EQUIPPABLE_ROLE, x, y += lineHeight, width);
			this.changeTextColor(this.normalColor());
			lineHeight -= 4;
			y += lineHeight;
			const actor = $gameActors.actor(1);
			width >>= 1;
			let j = 0;
			for (let i = 1; i < Game_Actor.KnsRoleList.length; i++){
				let roleId = Game_Actor.KnsRoleList[i];
				if (Game_Actor.knsGetRoleTraits(roleId, code).some(function(ft){
					return etypeId == ft.dataId;
				})){
					let x2 = x + width * (j % 2);
					let y2 = y + lineHeight * (j >> 1);
					j++;
					this.drawText(actor.knsGetRoleName(roleId), x2, y2, width, 'center');
				}
			}
		}
	}
	refreshEnemy(enemy, has){
		if (!has){
			this._enemySprite.bitmap = null;
			return;
		}else{
			this._enemySprite.bitmap = ImageManager.loadEnemy(
				enemy.battlerName, enemy.battlerHue
			);
		}
		let x = this.textPadding();
		let y = x;
		this.drawText(enemy.name, x, y);

		let lineHeight = this.lineHeight() - 4;
		y += lineHeight;
		let space = 8;
		let paramWidth = (this.contents.width - space >> 1) - x * 2;
		for (let i = 0; i < 8; i++){
			let x2 = x + (paramWidth + space * 2) * (i % 2);
			let y2 = y + lineHeight * (i >> 1);
			this.drawTitleAndValue(
				TextManager.param(i), enemy.params[i],
				x2, y2, paramWidth
			);
		}
		y += lineHeight * 3;

		let width = (this.contents.width) - x * 2;
		this.drawTitleAndValue(
			KNS_TERMS.STATUS_EXP, enemy.exp, x, 
			y += lineHeight, width
		);
		this.drawTitleAndValue(
			KNS_TERMS.CURRENCY_UNIT, enemy.gold, x, 
			y += lineHeight, width
		);
		this.drawTitleAndValue(
			KNS_TERMS.ENEMY_ROLE_POINT, 
			Game_Enemy.getKnsRolePoint(enemy.id), x, 
			y += lineHeight, width
		);

		y -= 12;
		width = width / 3;
		for (let j = 0; j < enemy.dropItems.length; j++) {
			let di = enemy.dropItems[j];
			if (di.kind > 0){
				y += 48;
				this.knsDrawDropItem(
					Game_Enemy.prototype.itemObject(di.kind, di.dataId),
					di.denominator, x, y, width
				);
			}
		}
	}
	knsDrawDropItem(item, denominator, x, y, width){
		const sp = this.knsGenerateIcon(item, x, y);
		this.contents.fontSize = 18;
		this.drawText("1 / " + denominator, x, y+24, width, 'right');
		const iconBoxWidth = this.knsIconWidth(item);
		x += iconBoxWidth
		width -= iconBoxWidth;
		this.contents.fillRect(x, y + 30, width, 1, this.contents.textColor);
		this.contents.fontSize = 22;
		if ($gameSystem.knsIsItemInHistory(item)){
			this.drawText(item.name, x, y, width, 'right');
		}else{
			this.changePaintOpacity(false);
			sp.opacity = this.contents.paintOpacity;
			sp.setColorTone(Window_KnsGalleryList.COLOR_NOT_IN_HISTORY);
			this.drawText(KNS_TERMS.GALLERY_NO_DATA, x, y, width, 'right');
			this.changePaintOpacity(true);
		}
	}
	knsWeaponY(){ return 28; }
	update(){
		super.update();
		if (this._enemySprite.bitmap && this._enemySprite.bitmap.width > 0){
			const width = this._enemySprite.bitmap.width;
			const height = this._enemySprite.bitmap.height;
			const frameWidth = 255;
			const frameHeight = 174;
			let scale = 1;
			if (width < height){
				if (width > frameWidth){
					scale = frameWidth / width;
				}
			}else{
				if (height > frameHeight){
					scale = frameHeight / height;
				}
			}
			this._enemySprite.scale.x = this._enemySprite.scale.y = scale;
		}
	}
}
KNS_Menu.setIconWindow(Window_KnsGalleryInfo);

//======================================================
// new Scene_KnsGallery
//======================================================
class Scene_KnsGallery extends Scene_MenuBase{
	create(){
		super.create();
		this.createHelpWindow();
		this.knsCreateListWindow();
		this.knsCreateInfoWindow();
		this.knsCreateMessageLogWindow();
		this.knsCreateCategoryWindow();
		this._listWindow.setInfoWindow(this._infoWindow);
		this._listWindow.setHelpWindow(this._helpWindow);

		this._helpWindow.opacity = 0;
		this.knsCreateBackBlacks(this._helpWindow.height, this._commandWindow.height);
		this.knsCreateCancelButton([
			this._commandWindow, this._listWindow, this._logWindow
		]);
		this.pushKnsSlide(this._commandWindow, 8);
		this.pushKnsSlide(this._helpWindow, 2);
		this.pushKnsSlide(this._logWindow, 4);
		this.setBackgroundOpacity(128);
	}
	knsCreateListWindow(){
		this._listWindow = new Window_KnsGalleryList(
			this._helpWindow.height - 16, 410, Graphics.height - 192);
		this._listWindow.setHandler('cancel', this.onSubCancel.bind(this));
		this.addWindow(this._listWindow);
	}
	knsCreateInfoWindow(){
		this._infoWindow = new Window_KnsGalleryInfo(
			this._listWindow.y - 12, this._listWindow.width, 
			this._listWindow.height + 24);
		this.addWindow(this._infoWindow);
	}
	knsCreateMessageLogWindow(){
		this._logWindow = new Window_KnsMessageLog(this._listWindow.y, this._listWindow.height);
		this._logWindow.setHandler('cancel', this.onSubCancel.bind(this));
		this.addWindow(this._logWindow);
	}
	knsCreateCategoryWindow(){
		this._commandWindow = new Window_KnsGalleryCommand(
			this._listWindow, this._infoWindow, this._logWindow, this._helpWindow);
		this._commandWindow.setHandler('ok', this.commandOk.bind(this));
		this._commandWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._commandWindow);
	}
	commandOk(){
		if (this._commandWindow.knsIsListCommand()){
			if (this._listWindow.index() == -1) this._listWindow.select(0);
			this._listWindow.activate();
		}else{
			if (this._logWindow.index() == -1) this._logWindow.select(0);
			this._logWindow.activate();
		}
	}
	onSubCancel(){
		this._commandWindow.activate();
	}
}