(function(){
//===========================================
// alias Window_BattleItem
//===========================================
Window_BattleItem.prototype.makeItemList = function() {
	Window_ItemList.prototype.makeItemList.call(this);
	this._data.unshift(null);
};

Window_BattleItem.prototype.knsNullText = function(){
	return KNS_TERMS.BATTLE_EQUIP;
}

const _Window_BattleItem_updateHelp = Window_BattleItem.prototype.updateHelp;
Window_BattleItem.prototype.updateHelp = function(){
	if (this.item() == null){
		this._helpWindow.setText(KNS_TERMS.BATTLE_EQUIP_TEXT);
	}else{
		_Window_BattleItem_updateHelp.call(this);
	}
}

const _Window_BattleItem_isEnabled = Window_BattleItem.prototype.isEnabled;
Window_BattleItem.prototype.isEnabled = function(item){
	return !item || _Window_BattleItem_isEnabled.call(this, item);
}


//===========================================
// local KNS_BattleUIEquip
//===========================================
const KNS_BattleUIEquip = {};
KNS_BattleUIEquip.setDimmer = function(klass, edgeFade){
	klass.prototype.refreshDimmerBitmap = function() {
		if (this._dimmerSprite) {
			var bitmap = this._dimmerSprite.bitmap;
			var w = this.width;
			var h = this.height;
			var c1 = this.dimColor1();
			bitmap.resize(w, h);
			if (edgeFade){
				const m = 96;
				bitmap.fillRect(0, 0, w-m, h, c1);
				bitmap.gradientFillRect(w-m, 0, m, h, c1, this.dimColor2());
			}else{
				bitmap.fillRect(0, 0, w, h, c1);
			}
			this._dimmerSprite.setFrame(0, 0, w, h);
		}
	};
}

//===========================================
// new Window_BattleEquipSlot
//===========================================
class Window_BattleEquipStatus extends Window_EquipStatus{}
KNS_BattleUIEquip.setDimmer(Window_BattleEquipStatus);

//===========================================
// new Window_BattleEquipItem
//===========================================
class Window_BattleEquipItem extends Window_EquipItem{}
KNS_BattleUIEquip.setDimmer(Window_BattleEquipItem, true);

//===========================================
// new Window_BattleEquipSlot
//===========================================
class Window_BattleEquipSlot extends Window_EquipSlot{
	constructor(help, status, item){
		super(status.width, help.height, Graphics.width - status.width+10, 280);
		this.setStatusWindow(status);
		this.setHelpWindow(help);
		this.setItemWindow(item);
		item.setHelpWindow(help);
		item.setStatusWindow(status);
		// background
		item.setBackgroundType(1);
		status.setBackgroundType(1);
		this.setBackgroundType(1);
		// input
		this.deactivate();
		this.select(0);
		this.hide();
	}
	knsStartActor(actor){
		this.setActor(actor);
		this.activate();
		this.show();
		if (this._statusWindow){
			this._statusWindow.setActor(actor);
			this._statusWindow.show();
		}
		if (this._itemWindow){
			this._itemWindow.setActor(actor);
			this._itemWindow.show();
		}
		if (this._helpWindow){
			this._helpWindow.show();
		}
	}
	hide(){
		super.hide();
		if (this._statusWindow) this._statusWindow.hide();
		if (this._helpWindow) this._helpWindow.hide();
		if (this._itemWindow) this._itemWindow.hide();
	}
	isEnabled(index){
		if ($gameTemp.isPlaytest()){
			return true;
		}
		if (!this._actor || this._actor.equipSlots()[index] == 6){
			return false;
		}
		return super.isEnabled(index);
	};
}
KNS_BattleUIEquip.setDimmer(Window_BattleEquipSlot, true);


//===========================================
// alias Scene_Battle
//===========================================
// equip
const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
Scene_Battle.prototype.createAllWindows = function(){
	_Scene_Battle_createAllWindows.call(this);
	this.knsCreateEquipSlotWindow();
};

Scene_Battle.prototype.knsCreateEquipSlotWindow = function(){
    this._knsEquipStatusWindow = new Window_BattleEquipStatus(0, this._helpWindow.height);
    this.addWindow(this._knsEquipStatusWindow);

	let wy = this._knsEquipStatusWindow.y + this._knsEquipStatusWindow.height;
	this._knsEquipItemWindow = new Window_BattleEquipItem(
		0, wy, Graphics.boxWidth, Graphics.boxHeight - wy);
	this._knsEquipItemWindow.setHandler('ok',		this.onKnsEquipItemOk.bind(this));
	this._knsEquipItemWindow.setHandler('cancel',	this.onKnsEquipItemCancel.bind(this));
	this.addWindow(this._knsEquipItemWindow);

	this._knsEquipSlotWindow = new Window_BattleEquipSlot(
		this._helpWindow, this._knsEquipStatusWindow, this._knsEquipItemWindow);
    this._knsEquipSlotWindow.setHandler('ok',		this.onKnsSlotOk.bind(this));
    this._knsEquipSlotWindow.setHandler('cancel',	this.onKnsSlotCancel.bind(this));
	this.addWindow(this._knsEquipSlotWindow);
}

// slot
Scene_Battle.prototype.onKnsSlotOk = function(){
    this._knsEquipItemWindow.activate();
    this._knsEquipItemWindow.select(0);
}
Scene_Battle.prototype.onKnsSlotCancel = function(){
	this._knsEquipSlotWindow.hide();
	this._actorCommandWindow.refresh();
	this._actorCommandWindow.show();
	this._statusWindow.show();
	this._helpWindow.show();
	this.commandItem();
}

// item
Scene_Battle.prototype.onKnsEquipItemOk = function(){
    SoundManager.playEquip();
    BattleManager.actor().changeEquip(
		this._knsEquipSlotWindow.index(), this._knsEquipItemWindow.item()
	);
    this._knsEquipSlotWindow.activate();
    this._knsEquipSlotWindow.refresh();
    this._knsEquipItemWindow.deselect();
    this._knsEquipItemWindow.refresh();
    this._knsEquipStatusWindow.refresh();
}
Scene_Battle.prototype.onKnsEquipItemCancel = function(){
    this._knsEquipSlotWindow.activate();
    this._knsEquipItemWindow.deselect();
}

const _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
Scene_Battle.prototype.isAnyInputWindowActive = function() {
    return	this._knsEquipSlotWindow.active || 
			this._knsEquipItemWindow.active || 
			_Scene_Battle_isAnyInputWindowActive.call(this);
};

Scene_Battle.prototype.onItemOk = function() {
	var item = this._itemWindow.item();
	if (item){
		const action = BattleManager.inputtingAction();
		action.setItem(item.id);
		$gameParty.setLastItem(item);
		this.onSelectAction();
	}else{
		this._itemWindow.hide();
		const actor = BattleManager.actor();
		this._knsEquipSlotWindow.knsStartActor(actor);
		this._actorCommandWindow.hide();
		this._statusWindow.hide();
	}
};

})();