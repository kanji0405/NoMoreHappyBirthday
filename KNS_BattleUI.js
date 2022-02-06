(function(){
const KNS_BattleUI = {};
KNS_BattleUI.setSprites = function(proto){
	proto.numVisibleRows = function() {
		return 5;
	};

	const _refresh = proto.refresh;
	proto.refresh = function(){
		_refresh.call(this);
		if (this._knsSprites) this._knsSprites.refresh();
	}

	proto.knsSetSprites = function(sprites){
		this._knsSprites = sprites;
	}
};
//===========================================
// alias Window_PartyCommand
//===========================================
KNS_BattleUI.setSprites(Window_PartyCommand.prototype);
Window_PartyCommand.prototype.makeCommandList = function() {
	this.addCommand(KNS_TERMS.BATTLE_PARTY[0], 'fight');
	this.addCommand(KNS_TERMS.BATTLE_PARTY[1], 'escape', BattleManager.canEscape());
};

//===========================================
// alias Window_ActorCommand
//===========================================
KNS_BattleUI.setSprites(Window_ActorCommand.prototype);
Window_ActorCommand.prototype.makeCommandList = function() {
	if (this._actor){
		this.addCommand($dataSkills[this._actor.attackSkillId()].name, 'attack');
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[0], 'skill', true, 0);
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[1], 'item');
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[2], 'guard');
		this.addCommand(KNS_TERMS.BATTLE_ACTOR[3], 'cancel');
	}
};

Window_ActorCommand.prototype.knsSelect = function(n, m){
	let index = this.index();
	this.select(index == n || index == m ? 0 : n);
}
Window_ActorCommand.prototype.cursorLeft	= function(){ this.knsSelect(1, 3); }
Window_ActorCommand.prototype.cursorUp		= function(){ this.knsSelect(2, 4); }
Window_ActorCommand.prototype.cursorRight	= function(){ this.knsSelect(3, 1); }
Window_ActorCommand.prototype.cursorDown	= function(){ this.knsSelect(4, 2); }

Window_ActorCommand.prototype.processOk = function() {
	if (this._actor) {
		const symbol = this.currentSymbol();
		if (symbol !== 'cancel'){
			this._actor.setLastCommandSymbol(symbol);
		}
	}
	Window_Command.prototype.processOk.call(this);
};

Window_ActorCommand.prototype.selectLast = function() {
    this.select(0);
    if (this._actor){
        var symbol = this._actor.lastCommandSymbol();
        this.selectSymbol(symbol);
        if (symbol === 'skill') {
            var skill = this._actor.lastBattleSkill();
            if (skill) {
                this.selectExt(skill.stypeId);
            }
        }
    }
};


//===========================================
// new Sprite_BattleCommands
//===========================================
class Sprite_BattleCommands extends Sprite{
	constructor(window){
		super();
		this._window = window;
		this.knsCreateSprites();
		window.knsSetSprites(this);
	}
	knsCreateSprites(){}
	refresh(){}
	update(){
		super.update();
		this.knsUpdateVisibility();
		this.knsUpdateChildren();
	}
	knsUpdateVisibility(){
		this.opacity = this._window.openness;
		this.visible = this._window.visible;
	}
	knsUpdateChildren(){}
}
//===========================================
// new Sprite_PartyCommands < Sprite_BattleCommands
//===========================================
class Sprite_PartyCommands extends Sprite_BattleCommands{
	knsCreateSprites(){}
	refresh(){}
}

//===========================================
// new Sprite_ActorCommands < Sprite_BattleCommands
//===========================================
class Sprite_ActorCommands extends Sprite_BattleCommands{
	knsCreateSprites(){
		this.x = 660;
		this.y = 496;
		this._commands = [];
		for (let i = 0; i < 5; i++){
			const sp = new Sprite();
			sp._knsBitmap = ImageManager.loadSystem('command' + i);
			sp._knsToneCnt = [0, 0, 0, 0];
			sp.anchor.x = sp.anchor.y = 0.5;
			switch(i){
				case 0: break;
				case 1: sp.anchor.x = 1; break;
				case 2: sp.anchor.y = 1; break;
				case 3: sp.anchor.x = 0; break;
				case 4: sp.anchor.y = 0; break;
			}
			this._commands.push(sp);
		}
		this.addChild(...this._commands, this._commands[0]);
	}
	refresh(){
		this._commands.forEach(function(sp, i){
			sp.x = 0;
			sp.y = 0;
			sp.scale.x = sp.scale.y = 1;
			const bmp = sp._knsBitmap;
			if (sp.bitmap){
				sp.bitmap.clear();
			}else{
				sp.bitmap = new Bitmap(bmp.width, bmp.height);
				sp.bitmap.smooth = true;
				sp.bitmap.fontSize = 22;
				sp.bitmap.outlineColor = 'black';
			}
			sp.bitmap.blt(bmp, 0, 0, bmp.width, bmp.height, 0, 0);
			const commandName = this._window.commandName(i);
			let x = 30, y = 0;
			let width = bmp.width;
			let align = 'center';
			if (i == 0){
				y = 100;
				width -= x * 2;
			}else{
				if (sp.anchor.y == 0){
					y = 96;//bmp.height - 48;
				}else if (sp.anchor.y == 1){
					y = 40;
				}else{
					y = bmp.height - 86;
				}
				if (sp.anchor.x == 0){
					x = 50;
					width -= 70;
					align = 'right';
				}else if (sp.anchor.x == 1){
					x = 20;
					width -= 70;
					align = 'left';
				}else{
					width -= x * 2;
				}
			}
			sp.bitmap.drawText(commandName, x, y, width, 28, align);
			const ctx = sp.bitmap._context;
			ctx.save();
			ctx.globalCompositeOperation = 'screen';
			ctx.fillStyle = Sprite_ActorCommands.KNS_COMMAND_COLORS[i];
			ctx.fillRect(0, 0, bmp.width, bmp.height);

			ctx.globalCompositeOperation = 'soft-light';
			const grad = ctx.createLinearGradient(0, 0, 0, bmp.height);
			grad.addColorStop(0, '#fff8');
			grad.addColorStop(0.25, '#fff0');
			grad.addColorStop(0.75, '#0000');
			grad.addColorStop(1.0, '#000');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, bmp.width, bmp.height);

			// trim
			ctx.globalCompositeOperation = 'destination-in';
			ctx.drawImage(bmp._canvas, 0, 0);
			ctx.restore();
			sp._knsToneCnt = [32, 32, 32, 0];
			sp.setColorTone(sp._knsToneCnt);
		}, this);
	}
	knsUpdateChildren(){
		const origin = -4;
		const target = 6;
		const change = 2;
		let index = this._window.index();
		this._commands.forEach(function(sp, i){
			if (i == index){
				if (i == 0){
					sp.scale.x = sp.scale.y = Math.min(1.125, sp.scale.y + 0.05);
				}else{
					if (sp.anchor.x == 0){
						sp.x = Math.min(target, sp.x + change);
					}else if (sp.anchor.x == 1){
						sp.x = Math.max(-target, sp.x - change);
					}else{
						if (sp.anchor.y == 0){
							sp.y = Math.min(target, sp.y + change);
						}else{
							sp.y = Math.max(-target, sp.y - change);
						}
					}
					sp.opacity = Math.min(255, sp.opacity + 18);
				}
				sp._knsToneCnt[0] -= 0.5;
				if (sp._knsToneCnt[0] < 0){
					sp._knsToneCnt[0] = 32;
				}
				sp._knsToneCnt[1] = sp._knsToneCnt[2] = sp._knsToneCnt[0];
				sp._knsToneCnt[3] = Math.max(0, sp._knsToneCnt[3] - 24);
			}else{
				if (i == 0){
					sp.scale.x = sp.scale.y = Math.max(0.9, sp.scale.y - 0.05);
				}else{
					if (sp.anchor.x == 0){
						sp.x = Math.max(origin, sp.x - change);
					}else if (sp.anchor.x == 1){
						sp.x = Math.min(-origin, sp.x + change);
					}else{
						if (sp.anchor.y == 0){
							sp.y = Math.max(origin, sp.y - change);
						}else{
							sp.y = Math.min(-origin, sp.y + change);
						}
					}
					sp.opacity = Math.max(192, sp.opacity - 18);
				}
				sp._knsToneCnt[0] = sp._knsToneCnt[1] = sp._knsToneCnt[2] = 0;
				sp._knsToneCnt[3] = Math.min(192, sp._knsToneCnt[3] + 12);
			}
			sp.setColorTone(sp._knsToneCnt);
		}, this);
	}

}
Sprite_ActorCommands.KNS_COMMAND_COLORS = [
	'#c70a0a', '#2d36a8', '#169c2e', '#b59b18', '#7f10b3'
];

//===========================================
// alias Scene_Battle
//===========================================
const _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
Scene_Battle.prototype.createDisplayObjects = function(){
	_Scene_Battle_createDisplayObjects.call(this);
	this.knsCreatePartySprite();
	this.knsCreateActorSprite();
}

Scene_Battle.prototype.knsCreatePartySprite = function(){
	this._knsPartySprite = new Sprite_PartyCommands(this._partyCommandWindow);
	this.addChild(this._knsPartySprite);
}

Scene_Battle.prototype.knsCreateActorSprite = function(){
	this._knsActorSprite = new Sprite_ActorCommands(this._actorCommandWindow);
	this.addChild(this._knsActorSprite);
}

// help window
Scene_Battle.prototype.createHelpWindow = function() {
    this._helpWindow = new Window_Help();
	this._helpWindow.setBackgroundType(2);
    this._helpWindow.visible = false;
    this.addWindow(this._helpWindow);

	const bmp = new Bitmap(this._helpWindow.width - 20, this._helpWindow.height);
	let pad = 96;
	let wid = bmp.width - pad;
	const color1 = this._helpWindow.dimColor1();
	const color2 = this._helpWindow.dimColor2();
	bmp.fillRect(0, 0, wid, bmp.height, color1);
	bmp.gradientFillRect(wid, 0, pad, bmp.height, color1, color2);
	this._helpWindow.addChildAt(new Sprite(bmp), 0);
};

//===========================================
// item skill
//===========================================
KNS_BattleUI.setItemWindow = function(klass){
	const _initialize = klass.prototype.initialize;
	klass.prototype.initialize = function(x, y, width, height){
		_initialize.call(this, x, y, 440, height);
		this.setBackgroundType(1);
	};

	klass.prototype.maxCols = function(){ return 2; };

	const _klass_update = klass.prototype.update;
	klass.prototype.update = function(){
		_klass_update.call(this);
		if (this.visible){
			this.x = (-12 - this.x >> 1) + this.x;
		}else{
			this.x = -480;
		}
	}

	klass.prototype.refreshDimmerBitmap = function() {
		if (this._dimmerSprite) {
			var bitmap = this._dimmerSprite.bitmap;
			var w = this.width;
			var h = this.height;
			var m = this.padding;
			var c1 = this.dimColor1();
			var c2 = this.dimColor2();
			bitmap.resize(w, h);
			bitmap.gradientFillRect(0, 0, m, h, c2, c1);
			bitmap.fillRect(m, 0, w - m * 2, h, c1);
			bitmap.gradientFillRect(w - m, 0, m, h, c1, c2);
			this._dimmerSprite.setFrame(0, 0, w, h);
		}
	};
}
KNS_BattleUI.setItemWindow(Window_BattleSkill);
KNS_BattleUI.setItemWindow(Window_BattleItem);


KNS_BattleUI.setSelectWindow = function(klass){}

//===========================================
// alias Window_BattleStatus
//===========================================
Window_BattleStatus.prototype.initialize = function() {
	var width = this.windowWidth();
	var height = this.windowHeight();
	var x = Graphics.boxWidth - width;
	var y = Graphics.boxHeight - height;
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this.refresh();
	this.openness = 0;
};

Window_BattleStatus.prototype.windowWidth = function() {
	return Graphics.boxWidth - 192;
};

Window_BattleStatus.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows());
};

Window_BattleStatus.prototype.numVisibleRows = function() {
	return 4;
};

Window_BattleStatus.prototype.maxItems = function() {
	return $gameParty.battleMembers().length;
};

Window_BattleStatus.prototype.refresh = function() {
	this.contents.clear();
	this.drawAllItems();
};

Window_BattleStatus.prototype.drawItem = function(index) {
	var actor = $gameParty.battleMembers()[index];
	this.drawBasicArea(this.basicAreaRect(index), actor);
	this.drawGaugeArea(this.gaugeAreaRect(index), actor);
};

Window_BattleStatus.prototype.basicAreaRect = function(index) {
	var rect = this.itemRectForText(index);
	rect.width -= this.gaugeAreaWidth() + 15;
	return rect;
};

Window_BattleStatus.prototype.gaugeAreaRect = function(index) {
	var rect = this.itemRectForText(index);
	rect.x += rect.width - this.gaugeAreaWidth();
	rect.width = this.gaugeAreaWidth();
	return rect;
};

Window_BattleStatus.prototype.gaugeAreaWidth = function() {
	return 330;
};

Window_BattleStatus.prototype.drawBasicArea = function(rect, actor) {
	this.drawActorName(actor, rect.x + 0, rect.y, 150);
	this.drawActorIcons(actor, rect.x + 156, rect.y, rect.width - 156);
};

Window_BattleStatus.prototype.drawGaugeArea = function(rect, actor) {
	if ($dataSystem.optDisplayTp) {
		this.drawGaugeAreaWithTp(rect, actor);
	} else {
		this.drawGaugeAreaWithoutTp(rect, actor);
	}
};

Window_BattleStatus.prototype.drawGaugeAreaWithTp = function(rect, actor) {
	this.drawActorHp(actor, rect.x + 0, rect.y, 108);
	this.drawActorMp(actor, rect.x + 123, rect.y, 96);
	this.drawActorTp(actor, rect.x + 234, rect.y, 96);
};

Window_BattleStatus.prototype.drawGaugeAreaWithoutTp = function(rect, actor) {
	this.drawActorHp(actor, rect.x + 0, rect.y, 201);
	this.drawActorMp(actor, rect.x + 216,  rect.y, 114);
};


//===========================================
// alias Window_BattleActor
//===========================================
Window_BattleActor.prototype.initialize = function(x, y) {
	Window_BattleStatus.prototype.initialize.call(this);
	this.x = x;
	this.y = y;
	this.openness = 255;
	this.hide();
};

Window_BattleActor.prototype.show = function() {
	this.select(0);
	Window_BattleStatus.prototype.show.call(this);
};

Window_BattleActor.prototype.hide = function() {
	Window_BattleStatus.prototype.hide.call(this);
	$gameParty.select(null);
};

Window_BattleActor.prototype.select = function(index) {
	Window_BattleStatus.prototype.select.call(this, index);
	$gameParty.select(this.actor());
};

Window_BattleActor.prototype.actor = function() {
	return $gameParty.members()[this.index()];
};


//===========================================
// alias Window_BattleEnemy
//===========================================
Window_BattleEnemy.prototype.initialize = function(x, y) {
	this._enemies = [];
	var width = this.windowWidth();
	var height = this.windowHeight();
	Window_Selectable.prototype.initialize.call(this, x, y, width, height);
	this.refresh();
	this.hide();
};

Window_BattleEnemy.prototype.windowWidth = function() {
	return Graphics.boxWidth - 192;
};

Window_BattleEnemy.prototype.windowHeight = function() {
	return this.fittingHeight(this.numVisibleRows());
};

Window_BattleEnemy.prototype.numVisibleRows = function() {
	return 4;
};

Window_BattleEnemy.prototype.maxCols = function() {
	return 2;
};

Window_BattleEnemy.prototype.maxItems = function() {
	return this._enemies.length;
};

Window_BattleEnemy.prototype.enemy = function() {
	return this._enemies[this.index()];
};

Window_BattleEnemy.prototype.enemyIndex = function() {
	var enemy = this.enemy();
	return enemy ? enemy.index() : -1;
};

Window_BattleEnemy.prototype.drawItem = function(index) {
	this.resetTextColor();
	var name = this._enemies[index].name();
	var rect = this.itemRectForText(index);
	this.drawText(name, rect.x, rect.y, rect.width);
};

Window_BattleEnemy.prototype.show = function() {
	this.refresh();
	this.select(0);
	Window_Selectable.prototype.show.call(this);
};

Window_BattleEnemy.prototype.hide = function() {
	Window_Selectable.prototype.hide.call(this);
	$gameTroop.select(null);
};

Window_BattleEnemy.prototype.refresh = function() {
	this._enemies = $gameTroop.aliveMembers();
	Window_Selectable.prototype.refresh.call(this);
};

Window_BattleEnemy.prototype.select = function(index) {
	Window_Selectable.prototype.select.call(this, index);
	$gameTroop.select(this.enemy());
};
})();