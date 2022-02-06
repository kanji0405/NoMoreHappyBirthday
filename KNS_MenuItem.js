//===========================================
// alias Game_Party
//===========================================
Game_Party.prototype.setupBattleTestItems = function(){
	function gainItems(list){
		list.forEach(function(item){
			if (item && item.name.length > 0) {
				this.gainItem(item, this.maxItems(item));
			}
		}, $gameParty);
	}
	gainItems($dataItems);
	gainItems($dataWeapons);
	gainItems($dataArmors);
}

//=========================================================
// alias DataManager
//=========================================================
DataManager.isItem		= function(item){ return item && item.itypeId !== undefined; };
DataManager.isWeapon	= function(item){ return item && item.wtypeId !== undefined; };
DataManager.isArmor		= function(item){ return item && item.atypeId !== undefined; };
DataManager.isSkill		= function(item){ return item && item.stypeId !== undefined; };
DataManager.isEnemy		= function(item){ return item && item.battlerName !== undefined; };
DataManager.knsDescription = function(item){
	if (!item || item.description === undefined){
		return '';
	}
	let isWeapon = this.isWeapon(item);
	let isArmor = this.isArmor(item);
	if ((isWeapon || isArmor) && item.etypeId != 6){
		let text = '\\}\\c[1]' + KNS_TERMS.TYPE_EQUIP + ': \\c[0]\\{';
		if (isWeapon){
			text += $dataSystem.weaponTypes[item.wtypeId];
		}else{
			text += $dataSystem.armorTypes[item.atypeId];
		}
		/*
		text += ' \\}\\c[1]' + KNS_TERMS.TYPE_PARTS + ': \\c[0]\\{';
		text += KNS_TERMS.EQUIP_PARTS[item.etypeId] + ' ';
		*/
		for (let i = 0; i < 8; i++){
			let param = item.params[i];
			if (param != 0){
				text += ' \\}\\c[1]%s:\\{\\c[0] %e%d\\c[0]'.replace(
					'%s', TextManager.param(i)
				).replace('%e', param > 0 ? '\\c[24]+' : '\\c[25]'
				).replace('%d', param);
			}
		}
		text += '\n' + item.description.replace(/\n/g, '');
		return text;
	}else{
		return item.description;
	}
}

//================================================
// alias Window_Base
//================================================
Window_Base.prototype.knsIconWidth = function(item) {
	return DataManager.isWeapon(item) ? 52 : 38;
};

Window_Base.prototype.knsWeaponY = function(){
	return 36;
}

Window_Base.prototype.knsGenerateIcon = function(item, x, y){
	let sp;
	if (DataManager.isWeapon(item)){
		sp = new Sprite_ObtainedWeapon(item.id);
		sp.x = x+40;
		sp.y = y+this.knsWeaponY();
	}else{
		if (!item.iconIndex) return null;
		sp = new Sprite_MenuIcon(item.iconIndex, x, y);
	}
	sp.opacity = this.contents.paintOpacity;
	this._iconSprites.addChild(sp);
	return sp;
}

//================================================
// alias KNS_Menu
//================================================
KNS_Menu.setIconWindow = function(klass){
	const _initialize = klass.prototype.initialize;
	klass.prototype.initialize = function(){
		this._iconSprites = new Sprite();
		this._iconSprites.x = this.standardPadding()+2;
		this._iconSprites.y = this._iconSprites.x;
		_initialize.apply(this, arguments);
		this.addChild(this._iconSprites);
	}

	const _refresh = klass.prototype.refresh;
	klass.prototype.refresh = function(){
		this._iconSprites.removeChildren();
		_refresh.call(this);
	}

	klass.prototype.drawItemName = function(item, x, y, width) {
		if (item){
			width = width || 312;
			this.knsGenerateIcon(item, x, y);
			this.resetTextColor();
			let pad = this.knsIconWidth(item);
			this.drawText(item.name, x + pad, y, width - pad);
		}
	};
}

//=========================================================
// new Sprite_MenuIcon
//=========================================================
class Sprite_MenuIcon extends Sprite_InfoPop{
	constructor(iconIndex, x, y){
		super(iconIndex);
		this.x = x;
		this.y = y;
		this._oldY = y;
		this.opacity = 255;
	}
	knsUpdateRolling(){
		if (this._knsIndex < Sprite_MenuIcon.MOVE_MAX){
			const rate = Sprite_MenuIcon.MATH * ++this._knsIndex;
			this.y = this._oldY - Math.sin(rate) * 7;
		}else if (this._knsIndex == Sprite_MenuIcon.MOVE_MAX){
			this.y -= 1;
			this._knsIndex++;
		}
	}
};
Sprite_MenuIcon.MOVE_MAX = 30;
Sprite_MenuIcon.MATH = Math.PI / Sprite_MenuIcon.MOVE_MAX;

(function(){
//================================================
// alias Window_Help
//================================================
Window_Help.prototype.setItem = function(item){
    this.setText(DataManager.knsDescription(item));
};

//================================================
// alias Window_ItemList
//================================================
Window_ItemList.prototype.needsNumber = function(){ return this._category != 'keyItem'; };
Window_ItemList.prototype.itemHeight = function(){ return 58; };
Window_ItemList.prototype.maxCols = function(){ return 4; };
Window_ItemList.prototype.spacing = function(){ return 10; };

KNS_Menu.setIconWindow(Window_ItemList);
Window_ItemList.prototype.drawItem = function(index) {
	const rect = this.itemRect(index);
	rect.width -= this.textPadding();
	const item = this._data[index];
	this.resetTextColor();
	if (item) {
		this.changePaintOpacity(this.isEnabled(item));
		this.knsGenerateIcon(item, rect.x, rect.y);
		this.contents.fontSize = 18;
		this.drawItemNumber(item, rect.x, rect.y + 24, rect.width);
		const iconBoxWidth = this.knsIconWidth(item);
		rect.x += iconBoxWidth
		rect.width -= iconBoxWidth;
		this.contents.fillRect(
			rect.x, rect.y + 30, rect.width, 1, this.contents.textColor
		);
		this.contents.fontSize = 22;
		this.drawText(item.name, rect.x, rect.y, rect.width, 'right');
		this.changePaintOpacity(1);
	}else{
		this.contents.fontSize = 22;
		this.drawText(this.knsNullText(), rect.x,
			rect.y + (rect.height >> 1) - this.contents.fontSize,
			rect.width, 'center'
		);
	}
};

Window_ItemList.prototype.knsNullText = function(){
	return KNS_TERMS.EQUIP_OFF;
}

Window_ItemList.prototype.drawItemNumber = function(item, x, y, width) {
    if (this.needsNumber()) {
        this.drawText('×', x, y, width - this.textWidth('000'), 'right');
        this.drawText($gameParty.numItems(item), x, y, width, 'right');
    }
};

//================================================
// alias Window_ItemCategory
//================================================
// item
KNS_Menu.linkHelp(Window_ItemCategory);
Window_ItemCategory.prototype.makeCommandList = function() {
	this.addCommand('CATEGORY_ITEM',    'item');
	this.addCommand('CATEGORY_WEAPON',  'weapon');
	this.addCommand('CATEGORY_ARMOR',   'armor');
	this.addCommand('CATEGORY_KEYITEM', 'keyItem');
};

//================================================
// alias Scene_ItemBase
//================================================
const _Scene_ItemBase_createActorWindow = Scene_ItemBase.prototype.createActorWindow;
Scene_ItemBase.prototype.createActorWindow = function() {
	_Scene_ItemBase_createActorWindow.call(this);
	this._actorWindow.y = 112;
	this._actorWindow.setBackgroundType(1);
};

//================================================
// alias Scene_Item
//================================================
const _Scene_Item_create = Scene_Item.prototype.create;
Scene_Item.prototype.create = function(){
	_Scene_Item_create.call(this);
	this._helpWindow.opacity = 0;

	this._itemWindow.opacity = 0;
	this._itemWindow.y = this._helpWindow.y + this._helpWindow.height;

	this._categoryWindow.opacity = 0;
	this._categoryWindow.y = Graphics.height - this._categoryWindow.height;

	this.knsCreateCancelButton([
		this._itemWindow, this._actorWindow, this._categoryWindow
	]);
	this.knsCreateBackBlacks(
		this._helpWindow.y + this._helpWindow.height,
		Graphics.height - this._categoryWindow.y
	);
	this.pushKnsSlide(this._helpWindow, 2);
	this.pushKnsSlide(this._itemWindow, 4);
	this.pushKnsSlide(this._categoryWindow, 8);

	this.setBackgroundOpacity(128);
}

//================================================
// alias Window_ShopCommand
//================================================
// shop
KNS_Menu.linkHelp(Window_ShopCommand);
Window_ShopCommand.prototype.makeCommandList = function() {
	this.addCommand('SHOP_BUY', 'buy');
	this.addCommand('SHOP_SELL', 'sell', !this._purchaseOnly);
	this.addCommand('SHOP_QUIT', 'cancel');
};

//================================================
// alias Window_ShopNumber
//================================================
KNS_Menu.setIconWindow(Window_ShopNumber);
Window_ShopNumber.prototype.updateButtonsVisiblity = function() {
	this.showButtons();
};

//================================================
// alias Window_ShopBuy
//================================================
KNS_Menu.setIconWindow(Window_ShopBuy);
Window_ShopBuy.prototype.itemHeight = function(){ return 64; };
Window_ShopBuy.prototype.maxCols = function(){ return 2; };
Window_ShopBuy.prototype.spacing = function(){ return 10; };

Window_ShopBuy.prototype.updateHelp = function() {
	const item = this.item();
    this.setHelpWindowItem(item);
    if (this._statusWindow){ this._statusWindow.setItem(item); }
};

KNS_Menu.setIconWindow(Window_ShopBuy);
Window_ShopBuy.prototype.drawItem = function(index) {
	Window_ItemList.prototype.drawItem.call(this, index);
};

Window_ShopBuy.prototype.drawItemNumber = function(item, x, y, width) {
	const priceWidth = this.textWidth(KNS_TERMS.CURRENCY_UNIT);
	this.changeTextColor(this.systemColor());
	this.drawText(KNS_TERMS.CURRENCY_UNIT, x, y, width, 'right');
	this.changeTextColor(this.normalColor());
	this.drawText(this.price(item), x, y, width - priceWidth, 'right');
};
//================================================
// alias Window_ShopStatus
//================================================
KNS_Menu.setIconWindow(Window_ShopStatus);
Window_ShopStatus.prototype.refresh = function() {
	this._iconSprites.removeChildren();
	this.contents.clear();
	if (this._item){
		const x = this.textPadding();
		const height = this.lineHeight();
		this.drawPossession(x, 0);
		this.drawItemType(x, height);
		if (this.isEquipItem()) {
			this.drawEquipInfo(x, height * 2);
		}
	}
};

Window_ShopStatus.prototype.drawPossession = function(x, y) {
    var width = this.contents.width - this.textPadding() - x;
    var possessionWidth = this.textWidth('000');
    this.changeTextColor(this.systemColor());
    this.drawText(KNS_TERMS.POSSESSION, x, y, width - possessionWidth);
    this.resetTextColor();
    this.drawText($gameParty.numItems(this._item), x, y, width, 'right');
};

Window_ShopStatus.prototype.drawItemType = function(x, y) {
	let type;
	if (DataManager.isWeapon(this._item)){
		type = $dataSystem.weaponTypes[this._item.wtypeId];
	}else if (DataManager.isArmor(this._item)){
		type = $dataSystem.armorTypes[this._item.atypeId];
	}else if (DataManager.isItem(this._item)){
		type = KNS_TERMS.TYPE_ITEM;
	}
	if (type){
		var width = this.contents.width - this.textPadding() - x;
		this.changeTextColor(this.systemColor());
		this.drawText(KNS_TERMS.TYPE_EQUIP, x, y, width);
		this.resetTextColor();
		this.drawText(type, x, y, width, 'right');
	}
};

Window_ShopStatus.prototype.paramId = function() {
	if (DataManager.isWeapon(this._item)){
		return this._item.params[2] > this._item.params[4] ? 2 : 4;
	}else if (DataManager.isArmor(this._item)){
		return this._item.params[3] > this._item.params[5] ? 3 : 5;
	}else{
		return 2;
	}
};

Window_ShopStatus.prototype.drawActorEquipInfo = function(x, y, actor) {
    const enabled = actor.canEquip(this._item);
    this.changePaintOpacity(enabled);
    this.resetTextColor();
	this.contents.fontSize = 18;
    this.drawText(actor.name(), x, y-2, 168);
	this.resetFontSettings();
    const item1 = this.currentEquippedItem(actor, this._item.etypeId);
	y += 24;
    if (enabled) {
        this.drawActorParamChange(x, y, actor, item1);
    }
    this.drawItemName(item1, x, y);
    this.changePaintOpacity(true);
};

//================================================
// alias Scene_Shop
//================================================
Window_ShopSell.prototype.drawItem = function(index) {
	const item = this._data[index];
	if (item){
		Window_ItemList.prototype.drawItem.call(this, index);
		const iconBoxWidth = this.knsIconWidth(item);
		const rect = this.itemRect(index);
		this.changePaintOpacity(this.isEnabled(item));
		this.contents.fontSize = 18;
		this.drawText(
			this.getPrice(item), rect.x + iconBoxWidth,
			rect.y + 24, rect.width
		);
	}
};

Window_ShopSell.prototype.getPrice = function(item){
	return item ? Math.floor(item.price >> 1) : 0;
}

//================================================
// alias Scene_Shop
//================================================
Scene_Shop.prototype.sellingPrice = function() {
	return this._sellWindow.getPrice(this._item);
};

const _Scene_Shop_create = Scene_Shop.prototype.create;
Scene_Shop.prototype.create = function() {
    _Scene_Shop_create.call(this);
	this._helpWindow.opacity = 0;
	this._commandWindow.setHelpWindow(this._helpWindow);
	this._commandWindow.opacity = 0;
	this._buyWindow.setBackgroundType(1);
	this._sellWindow.setBackgroundType(1);
	this._sellWindow.y -= this._categoryWindow.height;
	this._categoryWindow.y = Graphics.height - this._categoryWindow.height;
	this._categoryWindow.opacity = 0;

	this._numberWindow.setBackgroundType(1);
	this._statusWindow.setBackgroundType(1);
	this._statusWindow.x += 4;
	this._goldWindow.opacity = 0;

	this.knsCreateBackBlacks(
		this._commandWindow.y + this._commandWindow.height + 24,
		this._categoryWindow.height
	);

	this.pushKnsSlide(this._helpWindow, 2);
	this.pushKnsSlide(this._commandWindow, 4);
	this.pushKnsSlide(this._goldWindow, 6);
	this.knsCreateCancelButton([
		this._commandWindow, this._buyWindow, this._sellWindow,
		this._numberWindow, this._categoryWindow
	]);
	this.knsSetBackgroundOpacity(128);
};

Scene_Shop.prototype.createDummyWindow = function() {
	var wy = this._commandWindow.y + this._commandWindow.height;
	var wh = Graphics.boxHeight - wy;
	this._dummyWindow = {
		x: 0,
		y: wy,
		width:
		Graphics.boxWidth,
		height: wh,
		show: function(){},
		hide: function(){},
	};
};

})();