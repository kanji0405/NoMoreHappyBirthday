"use strict";
(function(){
//================================================
// alias Window_SkillList
//================================================
// skill
Window_SkillList.prototype.needsNumber = function(){ return this._category != 'keyItem'; };
Window_SkillList.prototype.itemHeight = function(){ return 58; };
Window_SkillList.prototype.maxCols = function(){ return 4; };
Window_SkillList.prototype.spacing = function(){ return 10; };

KNS_Menu.setIconWindow(Window_SkillList);
Window_SkillList.prototype.includes = function(item) {
	return item && (this._stypeId == 0 || this._stypeId === item.stypeId);
};

Window_SkillList.prototype.drawItem = function(index){
	Window_ItemList.prototype.drawItem.call(this, index);
}

Window_SkillList.prototype.drawItemNumber = function(skill, x, y, width) {
	const mpCost = this._actor.skillMpCost(skill);
	if (mpCost > 0) {
		this.changeTextColor(this.mpCostColor());
		this.drawText(mpCost + ' ' + KNS_TERMS.STATUS_PARAM_SHORT[1], x, y, width, 'right');
		this.resetTextColor();
		x -= 48;
	}
	const tpCost = this._actor.skillTpCost(skill);
	if (tpCost > 0) {
		this.changeTextColor(this.tpCostColor());
		this.drawText(tpCost + ' ' + KNS_TERMS.STATUS_PARAM_SHORT[2], x, y, width, 'right');
		this.resetTextColor();
	}
};

//================================================
// alias Window_SkillType
//================================================
Window_SkillType.prototype.windowWidth = function(){ return Graphics.width - 160; };
Window_SkillType.prototype.windowHeight = function(){ return 160; };
Window_SkillType.prototype.maxCols = function(){ return 3; };
Window_SkillType.prototype.itemTextAlign = function(){ return 'center'; };
Window_SkillType.prototype.selectLast = function(){};

Window_SkillType.prototype.makeCommandList = function() {
	if (this._actor) {
		Game_Actor.KnsRoleList.forEach(function(roleId){
			this.addCommand(
				roleId == 0 ? KNS_TERMS.ALL_SKILL : 
				this._actor.knsGetRoleName(roleId), 'skill', true, roleId
			);
		}, this);
	}
	this.addCommand(KNS_TERMS.MENU_OTHER_CHARACTER, 'pagedown', true, 0);
};

//================================================
// alias Window_SkillStatus
//================================================
Window_SkillStatus.prototype.standardPadding = function(){
	return 8;
}
Window_SkillStatus.prototype.refresh = function() {
	this.contents.clear();
	if (this._actor) {
		this.drawActorFaceWithExp(this._actor, 0, 0, 220);
	}
};
//================================================
// alias Scene_Skill
//================================================
const _Scene_Skill_create = Scene_Skill.prototype.create;
Scene_Skill.prototype.create = function() {
	_Scene_Skill_create.call(this);
	this._skillTypeWindow.y = Graphics.height - this._skillTypeWindow.height;
	this._skillTypeWindow.opacity = 0;

	this._itemWindow.y = this._helpWindow.height;
	this._itemWindow.opacity = 0;

	this._helpWindow.opacity = 0;

	this.knsCreateCancelButton([
		this._itemWindow, this._actorWindow, this._skillTypeWindow]);

	this.knsCreateBackBlacks(
		this._helpWindow.y + this._helpWindow.height,
		Graphics.height - this._skillTypeWindow.y
	);

	this.pushKnsSlide(this._helpWindow, 2);
	this.pushKnsSlide(this._skillTypeWindow, 8);
	this.pushKnsSlide(this._statusWindow, 8);
	this.pushKnsSlide(this._itemWindow, 4);
	this.setBackgroundOpacity(128);
};

Scene_Skill.prototype.createItemWindow = function() {
	var wx = 0;
	var wy = this._helpWindow.y + this._helpWindow.height;
	var ww = Graphics.boxWidth;
	var wh = Graphics.boxHeight - wy - this._statusWindow.height;
	this._itemWindow = new Window_SkillList(wx, wy, ww, wh);
	this._itemWindow.setHelpWindow(this._helpWindow);
	this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
	this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
	this._skillTypeWindow.setSkillWindow(this._itemWindow);
	this.addWindow(this._itemWindow);
};

Scene_Skill.prototype.createStatusWindow = function() {
	var ww = 160;
	var wx = Graphics.width - ww;
	var wy = Graphics.height - ww;
	this._statusWindow = new Window_SkillStatus(wx-8, wy, ww, ww);
	this._statusWindow.opacity = 0;
	this._statusWindow.reserveFaceImages();
	this.addWindow(this._statusWindow);
};


//================================================
// alias Window_EquipSlot
//================================================
// equip
KNS_Menu.setIconWindow(Window_EquipSlot);
Window_EquipSlot.prototype.maxCols = function(){ return 2; };
Window_EquipSlot.prototype.itemHeight = function(){ return 58; };
Window_EquipSlot.prototype.knsWeaponY = function(){ return 22; }

Window_EquipSlot.prototype.slotName = function(index) {
	if (this._actor){
		const slots = this._actor.equipSlots();
		if (slots[index]){
			return KNS_TERMS.EQUIP_PARTS[slots[index]];
		}
	}
	return '';
};

Window_EquipSlot.prototype.drawItem = function(index) {
	if (this._actor) {
		const rect = this.itemRectForText(index);
		this.changeTextColor(this.systemColor());
		this.changePaintOpacity(this.isEnabled(index));
		this.contents.fontSize = 18;
		this.drawText(
			this.slotName(index), rect.x, rect.y-4, 96, this.lineHeight()
		);
		this.contents.fontSize = 24;
		this.drawItemName(
			this._actor.equips()[index], rect.x, rect.y + 20
		);
		this.changePaintOpacity(true);
	}
};

//================================================
// alias Window_EquipStatus
//================================================
Window_EquipStatus.prototype.windowWidth = function(){
	return 260;
};
Window_EquipStatus.prototype.windowHeight = function(){
	return 280;
};

Window_EquipStatus.prototype.numVisibleRows = function(){
    return 8;
};

Window_EquipStatus.prototype.lineHeight = function(){
    return 28;
};

Window_EquipStatus.prototype.refresh = function(){
	this.contents.clear();
	if (this._actor) {
		const hei = this.lineHeight();
		for (let i = 0; i < 8; i++){ this.drawItem(0, hei * i, i); }
	}
};

Window_EquipStatus.prototype.drawItem = function(x, y, paramId) {
	this.contents.fontSize = 18;
	this.drawParamName(x + this.textPadding(), y-3, paramId);
	if (this._actor) {
		this.contents.fontSize = 26;
		x += 70;
		this.drawCurrentParam(x, y, paramId);
		if (this._tempActor) {
			x += 50;
			this.drawRightArrow(x, y);
			x += 48;
			this.drawNewParam(x, y, paramId);
		}
	}
};

//================================================
// alias Window_EquipCommand
//================================================
KNS_Menu.linkHelp(Window_EquipCommand);
Window_EquipCommand.prototype.maxCols = function(){ return 4; };
Window_EquipCommand.prototype.makeCommandList = function(){
	this.addCommand('EQUIP_ITEM',			'equip');
	this.addCommand('EQUIP_OPTIMIZE',		'optimize');
	this.addCommand('EQUIP_CLEAR',			'clear');
	this.addCommand('MENU_OTHER_CHARACTER',	'pagedown');
};
Window_EquipCommand.prototype.drawItem = function(index){
    const rect = this.itemRect(index);
    this.resetTextColor();
    this.changePaintOpacity(this.isCommandEnabled(index));
	this.contents.fontSize = 24;
    this.drawText(
		this.commandName(index), rect.x, rect.y,
		rect.width, this.itemTextAlign()
	);
	this.contents.fillRect(
		rect.x, rect.y + rect.height - 4, rect.width, 1,
		this.contents.textColor
	);
};
Window_EquipCommand.prototype.setActor = function(actor){
	if (this._actor != actor){
		this._actor = actor;
		this.refresh();
		this.callUpdateHelp();
	}
}
Window_EquipCommand.prototype.updateHelp = function(){
	let base = Window_Command.prototype.commandName.call(this, this.index());
	let text = '';
	if (base && this._actor){
		text = KNS_TERMS[base + '_TEXT'] + '\n';
		text += KNS_TERMS.TYPE_ROLE + this._actor.knsGetRoleName(
			this._actor.knsGetRoleId()
		);
	}
	this._helpWindow.setText(text);
}

//================================================
// alias Scene_Equip
//================================================
const _Scene_Equip_create = Scene_Equip.prototype.create;
Scene_Equip.prototype.create = function() {
	_Scene_Equip_create.call(this);
	this._itemWindow.opacity = 0;
	this._slotWindow.opacity = 0;
	this._helpWindow.opacity = 0;
	this._commandWindow.opacity = 0;
	this._statusWindow.opacity = 0;
	this._helpWindow.x = this._commandWindow.x;
	this._statusWindow.y = this._slotWindow.y;

	this.knsCreateFaceWindow();
	this.knsCreateCancelButton([this._itemWindow, this._commandWindow, this._slotWindow]);

	this.knsCreateBackBlacks(
		this._commandWindow.y + this._commandWindow.height,
		Graphics.height - this._itemWindow.y
	);
	this._commandWindow.y -= 10;
	this.pushKnsSlide(this._knsFaceWindow, 2);
	this.pushKnsSlide(this._helpWindow, 2);
	this.pushKnsSlide(this._commandWindow, 2);
	this.pushKnsSlide(this._slotWindow, 6);
	this.pushKnsSlide(this._statusWindow, 4);
	this.pushKnsSlide(this._itemWindow, 8);

	this.setBackgroundOpacity(128);
	this.refreshActor();
};

Scene_Equip.prototype.createSlotWindow = function() {
	let wx = this._statusWindow.width;
	let wy = this._commandWindow.y + this._commandWindow.height;
	let ww = Graphics.boxWidth - this._statusWindow.width;
	this._slotWindow = new Window_EquipSlot(wx, wy-20, ww, 280);
	this._slotWindow.setHelpWindow(this._helpWindow);
	this._slotWindow.setStatusWindow(this._statusWindow);
	this._slotWindow.setHandler('ok',       this.onSlotOk.bind(this));
	this._slotWindow.setHandler('cancel',   this.onSlotCancel.bind(this));
	this.addWindow(this._slotWindow);
};

Scene_Equip.prototype.createItemWindow = function() {
    let wh = 238;
    this._itemWindow = new Window_EquipItem(
		0, Graphics.boxHeight - wh + 8, Graphics.boxWidth, wh
	);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setStatusWindow(this._statusWindow);
    this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
    this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
    this._slotWindow.setItemWindow(this._itemWindow);
    this.addWindow(this._itemWindow);
};
Scene_Equip.prototype.createCommandWindow = function() {
    var wx = this._statusWindow.width - 48;
    var wy = this._helpWindow.height;
    var ww = Graphics.boxWidth - wx;
    this._commandWindow = new Window_EquipCommand(wx, wy, ww);
    this._commandWindow.setHelpWindow(this._helpWindow);
    this._commandWindow.setHandler('equip',    this.commandEquip.bind(this));
    this._commandWindow.setHandler('optimize', this.commandOptimize.bind(this));
    this._commandWindow.setHandler('clear',    this.commandClear.bind(this));
    this._commandWindow.setHandler('cancel',   this.popScene.bind(this));
    this._commandWindow.setHandler('pagedown', this.nextActor.bind(this));
    this._commandWindow.setHandler('pageup',   this.previousActor.bind(this));
    this.addWindow(this._commandWindow);
};
Scene_Equip.prototype.knsCreateFaceWindow = function(){
	let wx = 28;
	let wy = 28;
	this._knsFaceWindow = new Window_Base(
		-6, -6, this._commandWindow.x+wx, this._statusWindow.y+wy
	);
	this._knsFaceWindow.opacity = 0;
	this.addWindow(this._knsFaceWindow);
}
const _Scene_Equip_refreshActor = Scene_Equip.prototype.refreshActor;
Scene_Equip.prototype.refreshActor = function() {
	_Scene_Equip_refreshActor.call(this);
	const actor = this.actor();
	this._commandWindow.setActor(actor);
	if (this._knsFaceWindow){
		if (actor){
			this._knsFaceWindow.contents.clear();
			this._knsFaceWindow.drawActorFaceWithExp(actor, 0, 0, 200);
		}
	}
};
const _Scene_Equip_terminate = Scene_Equip.prototype.terminate;
Scene_Equip.prototype.terminate = function() {
	$gamePlayer.refresh();
	_Scene_Equip_terminate.call(this);
};
})();