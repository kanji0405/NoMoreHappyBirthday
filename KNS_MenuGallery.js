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
	if (this._knsHistoryList === undefined) this._knsHistoryList = [];
	if (type == -1) type = 0;
	if (this._knsHistoryList[type] === undefined){
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

// message
Game_System.prototype.knsAddMessageLog = function(line){}
Game_System.prototype.knsGetMessageLog = function(){}

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
	$gameSystem.addHistory(3, id === undefined ? this.enemyId() : id);
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
			index === undefined ? this.index() : index
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
		if (this._obtainedList === undefined){
			this._obtainedList = {};
		}
		if (this._obtainedList[type] === undefined){
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
			this._logWindow.show();
			this._infoWindow.hide();
			this._listWindow.hide();
			this._logWindow.deselect();
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
	}
}


//======================================================
// new Window_KnsGalleryList
//======================================================
class Window_KnsGalleryList extends Window_Selectable{
	itemHeight(){ return this._type == 1 ? 48 : super.itemHeight(); }
	knsWeaponY(){ return 28; }
	setInfoWindow(info){ this._infoWindow = info; }
	maxItems(){ return this._data ? this._data[1].length : 0; }
	knsIsInHistory(item){
		return item && this._data[0] && this._data[0].includes(item);
	}
	item(index){
		return this._data ? this._data[1][
			index === undefined ? this.index() : index] : null;
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
		const inHistory = this.knsIsInHistory(item);
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
			if (this.knsIsInHistory(item)){
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
		this._helpWindow.setItem(item);
		if (this._infoWindow){
			this._infoWindow.setItem(item, this.knsIsInHistory(item));
		}
	}
	deactivate(){
		super.deactivate();
		if (this._infoWindow) this._infoWindow.setItem(null);
	}

}
Window_KnsGalleryList.COLOR_NOT_IN_HISTORY = [-255,-255,-255,0];
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
		this._portraitSprite = new Sprite();
		this.addChild(this._portraitSprite);
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
		this._portraitSprite.bitmap = null;
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
		let x = 0;
		let y = 0;
		let lineHeight = this.lineHeight();

		if (!has) {
			this._portraitSprite.bitmap = null;
			return;
		}

		this._portraitSprite.bitmap = ImageManager.loadEnemy(
			enemy.battlerName, enemy.battlerHue
		);

		this.resetTextColor();
		this.drawText(enemy.name, x, y);

		x = this.textPadding();
		y = lineHeight + this.textPadding();

		for (var i = 0; i < 8; i++) {
			this.changeTextColor(this.systemColor());
			this.drawText(TextManager.param(i), x, y, 160);
			this.resetTextColor();
			this.drawText(enemy.params[i], x + 160, y, 60, 'right');
			y += lineHeight;
		}

		var rewardsWidth = 280;
		x = this.contents.width - rewardsWidth;
		y = lineHeight + this.textPadding();

		this.resetTextColor();
		this.drawText(enemy.exp, x, y);
		x += this.textWidth(enemy.exp) + 6;
		this.changeTextColor(this.systemColor());
		this.drawText(TextManager.expA, x, y);
		x += this.textWidth(TextManager.expA + '  ');

		this.resetTextColor();
		this.drawText(enemy.gold, x, y);
		x += this.textWidth(enemy.gold) + 6;
		this.changeTextColor(this.systemColor());
		this.drawText(TextManager.currencyUnit, x, y);

		x = this.contents.width - rewardsWidth;
		y += lineHeight;

		Game_Enemy.getKnsRolePoint

		for (var j = 0; j < enemy.dropItems.length; j++) {
			var di = enemy.dropItems[j];
			if (di.kind > 0) {
				var item = Game_Enemy.prototype.itemObject(di.kind, di.dataId);
				this.drawItemName(item, x, y, rewardsWidth);
				y += lineHeight;
			}
		}
	}
	update(){
		super.update();
		if (this._portraitSprite.bitmap) {
			const bitmapHeight = this._portraitSprite.bitmap.height;
			const contentsHeight = this.contents.height;
			let scale = 1;
			if (bitmapHeight > contentsHeight) {
				scale = contentsHeight / bitmapHeight;
			}
			this._portraitSprite.scale.x = 
			this._portraitSprite.scale.y = scale;
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
			this._listWindow.y, this._listWindow.width, this._listWindow.height);
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