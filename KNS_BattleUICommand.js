(function(){
//===========================================
// new KNS_BattleUICommand
//===========================================
const KNS_BattleUICommand = {};
KNS_BattleUICommand.KNS_COMMAND_COLORS = [
	'#c70a0a', '#2d36a8', '#169c2e', '#b59b18', '#7f10b3'
];

KNS_BattleUICommand.setSprites = function(proto){
	proto.knsSetSprites = function(sprites){
		this._knsSprites = sprites;
	}

	const _refresh = proto.refresh;
	proto.refresh = function(){
		_refresh.call(this);
		this.y = Graphics.height;
		if (this._knsSprites) this._knsSprites.refresh();
	}
	const _open = proto.open;
	proto.open = function(){
		_open.call(this);
		if (this._helpWindow) this._helpWindow.show();
	}
	const _close = proto.close;
	proto.close = function(){
		_close.call(this);
		if (this._helpWindow) this._helpWindow.hide();
	}
	proto.drawItem = function(index){}

	const oldCommandName = proto.commandName;
	proto.commandName = function(i){
		const name = oldCommandName.call(this, i);
		if (typeof name == 'number'){
			return $dataSkills[name].name;
		}else{
			return KNS_TERMS[name];
		}
	}

	proto.updateHelp = function(){
		const name = oldCommandName.call(this, this.index());
		if (typeof name == 'number'){
			this._helpWindow.setItem($dataSkills[name]);
		}else{
			this._helpWindow.setText(KNS_TERMS[name + '_TEXT']);
		}
	}
};
//===========================================
// alias Window_PartyCommand
//===========================================
KNS_BattleUICommand.setSprites(Window_PartyCommand.prototype);
Window_PartyCommand.prototype.numVisibleRows = function(){ return 2; };
Window_PartyCommand.prototype.makeCommandList = function(){
	this.addCommand('BATTLE_PARTY_FIGHT', 'fight');
	this.addCommand('BATTLE_PARTY_ESCAPE', 'escape', BattleManager.canEscape());
};

//===========================================
// alias Window_ActorCommand
//===========================================
KNS_BattleUICommand.setSprites(Window_ActorCommand.prototype);
Window_ActorCommand.prototype.numVisibleRows = function(){ return 4; };
Window_ActorCommand.prototype.makeCommandList = function() {
	if (this._actor){
		this.addCommand(this._actor.attackSkillId(), 'attack');
		this.addCommand('BATTLE_ACTOR_SKILL', 'skill', true, 0);
		this.addCommand(this._actor.guardSkillId(), 'guard');
		this.addCommand('BATTLE_ACTOR_ITEM', 'item');
	}
};

Window_ActorCommand.prototype.cursorLeft	= function(){ this.select(1); }
Window_ActorCommand.prototype.cursorUp		= function(){ this.select(0); }
Window_ActorCommand.prototype.cursorRight	= function(){ this.select(2); }
Window_ActorCommand.prototype.cursorDown	= function(){ this.select(3); }

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
        const symbol = this._actor.lastCommandSymbol();
        this.selectSymbol(symbol);
    }
};

//===========================================
// new Sprite_BattleCommands
//===========================================
class Sprite_BattleCommands extends Sprite{
	constructor(window, help){
		super();
		this._commands = [];
		this._window = window;
		window.setHelpWindow(help);
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
	knsCommandSize(){ return 2; }
	knsCreateSprites(){
		this._knsBitmap = ImageManager.loadSystem('commandParty');
		const size = this.knsCommandSize();
		this.x = Graphics.width;
		this.y = 390;
		for (let i = 0; i < size; i++){
			const sp = new Sprite();
			sp.y = i * 90;
			sp.anchor.x = 1;
			this._commands.push(sp);
			this.addChild(sp);
		}
	}
	refresh(){
		const size = this.knsCommandSize();
		const bmp = this._knsBitmap;
		const height = bmp.height / size;
		const iconWidth = 55;
		this._commands.forEach(function(sp, i){
			sp.opacity = 192;
			if (sp.bitmap){
				sp.bitmap.clear();
			}else{
				sp.bitmap = new Bitmap(bmp.width, height);
				sp.bitmap.smooth = true;
				sp.bitmap.fontSize = 26;
				sp.bitmap.outlineColor = 'white';
			}
			sp.bitmap.blt(bmp,0,height*i,bmp.width,height,0,0,bmp.width,height);
			sp.bitmap.textColor = sp.bitmap.getPixel(0, 0);
			const name = this._window.commandName(i);
			sp.bitmap.drawText(name, iconWidth, 8, bmp.width - iconWidth - 12, 36);
		}, this);
	}
	knsUpdateChildren(){
		const index = this._window.index();
		this._commands.forEach(function(sp, i){
			if (i == index){
				sp.x = Math.max(0, sp.x - 2);
				sp.opacity = Math.min(255, sp.opacity + 5);
			}else{
				sp.x = Math.min(20, sp.x + 2);
				sp.opacity = Math.max(192, sp.opacity - 5);
			}
		}, this);
	}
}

//===========================================
// new Sprite_ActorCommands < Sprite_BattleCommands
//===========================================
class Sprite_ActorCommands extends Sprite_BattleCommands{
	knsCreateSprites(){
		this.x = 660;
		this.y = 496;
		for (let i = 0; i < this._window.numVisibleRows(); i++){
			const sp = new Sprite();
			sp._knsBitmap = ImageManager.loadSystem('command' + i);
			sp._knsToneCnt = [0, 0, 0, 0];
			sp.anchor.x = sp.anchor.y = 0.5;
			switch(i){
				case 0: sp.anchor.y = 1; break;
				case 1: sp.anchor.x = 1; break;
				case 2: sp.anchor.x = 0; break;
				case 3: sp.anchor.y = 0; break;
			}
			this._commands.push(sp);
		}
		this.addChild(...this._commands, this._commands[0]);
	}
	knsIsCenterButton(i){ return false; }
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
			if (this.knsIsCenterButton(i)){
				y = 100;
				width -= x * 2;
			}else{
				if (sp.anchor.y == 0){
					y = 96;
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
			ctx.fillStyle = KNS_BattleUICommand.KNS_COMMAND_COLORS[i];
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
				if (this.knsIsCenterButton(i)){
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
				if (this.knsIsCenterButton(i)){
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
	this._knsPartySprite = new Sprite_PartyCommands(this._partyCommandWindow, this._helpWindow);
	this.addChild(this._knsPartySprite);
}

Scene_Battle.prototype.knsCreateActorSprite = function(){
	this._knsActorSprite = new Sprite_ActorCommands(this._actorCommandWindow, this._helpWindow);
	this.addChild(this._knsActorSprite);
}

// status keep
Scene_Battle.prototype.stop = function() {
	Scene_Base.prototype.stop.call(this);
	if (this.needsSlowFadeOut()) {
		this.startFadeOut(this.slowFadeSpeed(), false);
	} else {
		this.startFadeOut(this.fadeSpeed(), false);
	}
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
};

Scene_Battle.prototype.updateStatusWindow = function() {
	if ($gameMessage.isBusy()) {
		this._partyCommandWindow.close();
		this._actorCommandWindow.close();
	}
};

Scene_Battle.prototype.updateWindowPositions = function(){
	this._statusWindow.x = 0;
};

})();