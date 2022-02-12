"use strict";
//===========================================
// new Spriteset_KnsResult
//===========================================
class Spriteset_KnsResult extends Sprite{
	constructor(window){
		super();
		this._logWindow = window;
		this._logWindow.knsSetResult(this);
		BattleManager.knsSetResultWindow(this);
		this._rewards = {};
		this._oldRoleLevels = {};
		this._levelUpBitmap = ImageManager.loadSystem('LevelUp');
		this._knsWaitInput = false;
	}
	knsCreate(reward){
		this._rewards = reward;
		this.knsExpOffset  = this.knsCalcLog(reward.exp);
		this.knsRoleOffset = this.knsCalcLog(reward._knsRole);
		this.createElements();
	}
	knsCalcLog(value){
		value = 10 ** Math.max(Math.floor(Math.log10(value)) - 1, 1);
		if (Math.floor(String(value)[0]) > 4) this.knsExpOffset *= 2;
		return value;
	}
	knsStart(){
		AudioManager.playSe({name: 'Saint4', volume: 90, pitch: 100, pan: 0});
		this._knsWaitInput = true;
	}
	createElements(){
		let i = 0;
		let y = 60;
		let sp = new Sprite_KnsResult(y, 'title', i++, this._logWindow, [this._rewards]);
		this.addChild(sp);
		$gameParty.battleMembers().forEach(function(actor){
			y += sp.height;
			this._oldRoleLevels[actor.actorId()] = actor.knsGetRoleLevel();
			sp = new Sprite_KnsResult(y, 'actor', i++, this._logWindow, [actor, this._levelUpBitmap]);
			this.addChild(sp);
		}, this);
		y += sp.height;
		sp = new Sprite_KnsResult(y, 'dropTitle', i++, this._logWindow, [this._rewards]);
		this.addChild(sp);

		y += sp.height;
		sp = new Sprite_KnsResult(y, 'dropGold', i++, this._logWindow, [this._rewards.gold]);
		this.addChild(sp);

		this._rewards.items.forEach(function(item) {
			y += sp.height+1;
			sp = new Sprite_KnsResult(y, 'dropItem', i++, this._logWindow, item);
			this.addChild(sp);
		}, this);
	}
	update(){
		super.update();
		if (this._knsWaitInput == false) return;
		if (this.isExpOrRoleRemain()){
			let diffExp = this._rewards.exp < this.knsExpOffset ? 
				this._rewards.exp : this.knsExpOffset;
			this._rewards.exp -= diffExp;

			let diffRole = this._rewards._knsRole < this.knsRoleOffset ? 
				this._rewards._knsRole : this.knsRoleOffset;
			this._rewards._knsRole -= diffRole;
			$gameParty.allMembers().forEach(function(actor) {
				actor.gainExp(diffExp);
				actor.knsGainRoleExp(diffRole);
			});
			let isSomebodyLevelUp = false;
			this.children.forEach(function(sp){
				if (sp._knsType == 'title'){
					sp.knsRefresh();
				}else if (sp._knsType == 'actor'){
					if (!isSomebodyLevelUp){
						isSomebodyLevelUp = sp.knsRefresh();
					}else{
						sp.knsRefresh();
					}
				}
			});
			if (isSomebodyLevelUp){
				BattleManager.refreshStatus();
			}
		}else if (Input.isRepeated('ok') || TouchInput.isRepeated()){
			this._knsWaitInput = false;
			this.children.forEach(function(sp){ sp.knsStartHide(); });
			BattleManager.refreshStatus();
			$gameParty.battleMembers().forEach(function(actor){
				const current = actor.knsGetRoleLevel();
				if (current != this._oldRoleLevels[actor.actorId()]){
					this._logWindow.push('knsRoleLevelUp', actor, current);
					this._logWindow.push('clear');
				}
			}, this);
		}
	}
	isExpOrRoleRemain(){
		return this._rewards && (this._rewards.exp || this._rewards._knsRole);
	}
	isBusy(){
		return this._knsWaitInput || this.isExpOrRoleRemain();
	}
}


//===========================================
// new Sprite_KnsResult
//===========================================
class Sprite_KnsResult extends Sprite{
	isRightMode(){
		return BattleManager.knsFieldPosition == 1;
	}
	constructor(y, type, i, window, args){
		super();
		this.y = y;
		this._knsCnt = -i * 4;
		this._knsHideCnt = i * 4;
		this._knsHide = false;
		this._window = window;
		this._knsArgs = args;
		this._knsType = type;
		if (this._knsType == 'actor'){
			this._knsLevelUp = false;
			const actor = this._knsArgs[0];
			this._knsActorLevel = actor.level;
			this._knsActorRole = actor.knsGetRoleLevel();
		}
		this._knsUiSprite = new Sprite();
		if (this.isRightMode()){
			this.x = Graphics.width << 1;
			this._knsX = Graphics.width;
			this.anchor.x = 1;
			this._knsUiSprite.anchor.x = 1;
		}else{
			this.x = -Graphics.width;
			this._knsX = 0;
		}
		this.addChild(this._knsUiSprite);
		this.knsRefresh();
	}
	update(){
		super.update();
		if (this._knsHide){
			if (0 < this._knsHideCnt){
				this._knsHideCnt--;
			}else if (this.opacity > 0){
				this.opacity -= 16;
				this.x += this.isRightMode() ? 1 : -1;
			}
			return;
		}
		const max = 8;
		if (0 > this._knsCnt){
			this._knsCnt++;
		}else if (this._knsCnt < max){
			const rate = ++this._knsCnt / max;
			this.x = (this._knsX - this.x) * rate + this.x;
		}
	}
	knsStartHide(){
		this._knsHide = true;
	}
	knsRefresh(){
		switch(this._knsType){
			case 'title':		return this.knsRefreshTitle(0);
			case 'dropTitle':	return this.knsRefreshTitle(1);
			case 'actor':		return this.knsRefreshActor();
			case 'dropGold':	return this.knsRefreshDropItem(0);
			case 'dropItem':	return this.knsRefreshDropItem(1);
		}
	}
	knsRefreshTitle(type){
		let expX = this.isRightMode() ? 24 : 12;
		let expY = 4;
		let expWidth = 200;
		let expHeight = 44 - (expY << 1);
		let roleX = expX + expWidth + 24;
		if (this.bitmap){
			this._knsUiSprite.bitmap.clear();
		}else{
			this._knsUiSprite.bitmap = new Bitmap(480, 44);
			this._knsUiSprite.bitmap.outlineColor = '#0000';
			this.bitmap = new Bitmap(this._knsUiSprite.bitmap.width, this._knsUiSprite.bitmap.height);
			this.bitmap.outlineColor = this._knsUiSprite.bitmap.outlineColor;
			let oy = this.bitmap.height >> 1;
			const ctx = this.bitmap._context;
			ctx.save();
			ctx.beginPath();
			if (this.isRightMode()){
				let y2 = this.bitmap.height - 2;
				ctx.moveTo(oy, 2);
				ctx.lineTo(this.bitmap.width, 2);
				ctx.lineTo(this.bitmap.width, y2);
				ctx.lineTo(this.bitmap.width, y2);
				ctx.lineTo(oy, this.bitmap.height - 2);
				ctx.lineTo(0, oy);
			}else{
				ctx.moveTo(0, 2);
				ctx.lineTo(this.bitmap.width - oy, 2)
				ctx.lineTo(this.bitmap.width - 2, oy)
				ctx.lineTo(this.bitmap.width - oy, this.bitmap.height - 2);
				ctx.lineTo(0, this.bitmap.height - 2);
			}
			ctx.fillStyle = this._window.textColor(9)// + 'cc';
			ctx.fill();
			ctx.outlineWidth = 4;
			ctx.strokeStyle = this.bitmap.outlineColor;//'#fff';
			ctx.stroke();
			ctx.restore();
			this.bitmap.textColor = this._window.textColor(17);
			if (type == 1){
				this.bitmap.drawText(KNS_TERMS.RESULT_DROP_ITEM, expX, expY, expWidth*2, expHeight);
				return;
			}else{
				this.bitmap.drawText(KNS_TERMS.STATUS_EXP, expX, expY, expWidth, expHeight);
				this.bitmap.drawText(KNS_TERMS.RESULT_ROLE_POINT, roleX, expY, expWidth, expHeight);
			}
		}
		const reward = this._knsArgs[0];
		this._knsUiSprite.bitmap.drawText("+ " + reward.exp, expX, expY, expWidth, expHeight, 'right');
		this._knsUiSprite.bitmap.drawText("+ " + reward._knsRole, roleX, expY, expWidth, expHeight, 'right');
	}

	knsRefreshActor(){
		let levelUpped = false
		const actor = this._knsArgs[0];
		const level = actor.level;
		const roleId = actor.knsGetRoleId();
		const roleLevel = actor.knsGetRoleLevel(roleId);
		const bmp = this._knsArgs[1];
		let x = 6;
		let y = 2;
		let height = 48;
		let gainHeight = height >> 1;
		let iconHeight = bmp.height >> 1;
		if (this.bitmap){
			this._knsUiSprite.bitmap.clear();
		}else{
			this.bitmap = new Bitmap(460, height + (y << 1));
			this._knsUiSprite.bitmap = new Bitmap(this.bitmap.width, this.bitmap.height);
			this._knsUiSprite.bitmap.fontSize = 19;

			let faceX, backX;
			if (this.isRightMode()){
				faceX = this.bitmap.width - height - 6;
				backX = bmp.width >> 1;
				this._knsupX = 0;
			}else{
				faceX = 6;
				backX = 0;
				this._knsupX = this.bitmap.width - bmp.width;
			}
			const realWidth = this.bitmap.width - (bmp.width >> 1);
			this.bitmap.fillRect(backX, 0, realWidth, this.bitmap.height, '#000c');
			const lineColor = bmp.getPixel(25, 0);
			this.bitmap.fillRect(backX, 0, realWidth, 2, lineColor);
			this.bitmap.fillRect(backX, this.bitmap.height - 2, realWidth, 2, lineColor);
			const index = actor.faceIndex();
			const faceWidth  = Window_Base._faceWidth;
			const faceHeight = Window_Base._faceHeight;
			this.bitmap.blt(
				ImageManager.loadFace(actor.faceName()),
				faceWidth * (index % 4), faceHeight * (index >> 2),
				faceWidth, faceHeight, faceX, y, height, height
			);
			this.bitmap.blt(bmp, 0, 0, bmp.width, iconHeight, this._knsupX, 0);
			let titleX = x + 53;
			let titleWidth = 48;
			this.bitmap.fontSize = 19;
			this.bitmap.textColor = this._window.systemColor();
			if (roleId == 0){
				this.bitmap.drawText(KNS_TERMS.STATUS_EXP, titleX, y + (gainHeight >> 1), titleWidth, gainHeight);
			}else{
				this.bitmap.drawText(KNS_TERMS.STATUS_EXP, titleX, y, titleWidth, gainHeight);
				this.bitmap.drawText(KNS_TERMS.RESULT_ROLE_POINT, titleX, y + gainHeight, titleWidth, gainHeight);
			}
		}
		if (this._knsActorLevel != level || this._knsActorRole != roleLevel){
			levelUpped = true;
			if (this._knsLevelUp){
			}else{
				this._knsLevelUp = true;
				actor.startAnimation(46);
				this.bitmap.blt(bmp, 0, iconHeight, bmp.width, iconHeight,
					this._knsupX, 0);
			}
		}
		x += height + 60;
		let width = 192;
		const maxColor = this._window.textColor(17);
		const backColor = this._window.gaugeBackColor();
		const exps = actor.knsGetCurrentExp();
		if (roleId == 0){
			y += gainHeight >> 1;
		}
		this.drawSimpleGauge(
			x, y, width, gainHeight, level,
			...(exps ? [exps[0], exps[1]] : [1, 1]), 
			backColor, this._window.powerUpColor(), maxColor, !exps
		);
		if (roleId != 0){
			let roleNext = actor.knsGetRoleNextExp(roleId);
			this.drawSimpleGauge(
				x, y + gainHeight, width, gainHeight, roleLevel,
				actor.knsGetRoleCurrentExp(roleId), roleNext, 
				backColor, this._window.textColor(31), maxColor, roleNext == 0
			);
		}
		return levelUpped;
	}
	drawSimpleGauge(
		x, y, width, height, level, cur, next,
		backColor, color1, color2, isMax
	){
		let rate;
		if (isMax){
			cur = '-------';
			next = '-------';
			rate = 1;
		}else{
			rate = cur / next;
		}
		const bmp = this._knsUiSprite.bitmap;
		const ctx = bmp._context;
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(x, y + 9);
		ctx.lineTo(x, y + 20)
		ctx.lineTo(x + width + 6, y + 20)
		ctx.lineTo(x + width, y + 6)
		ctx.closePath();
		ctx.fillStyle = backColor;
		ctx.fill();
		ctx.strokeStyle = backColor;
		ctx.lineWidth = 3;
		ctx.stroke();

		ctx.beginPath();
		ctx.lineWidth = 0;
		ctx.moveTo(x, y + 9);
		ctx.lineTo(x, y + 20)
		ctx.lineTo(x + (width + 6) * rate, y + 20)
		ctx.lineTo(x + (width) * rate, y + 9 - 6 * rate)
		ctx.closePath();
		ctx.fillStyle = isMax ? color2 : color1;
		ctx.fill();
		ctx.restore();

		let gaugeWidth = width >> 1;
		bmp.textColor = this._window.normalColor();
		bmp.fontSize -= 4;
		bmp.drawText('/', x + gaugeWidth + 16, y + 2, width, height);
		bmp.fontSize += 4;
		bmp.drawText(cur, x + 12, y, gaugeWidth, height, 'right');
		bmp.drawText(next, x + gaugeWidth, y, gaugeWidth, height, 'right');

		x += width + 24;
		width = 60;
		bmp.textColor = this._window.systemColor();
		bmp.drawText(KNS_TERMS.STATUS_LEVEL, x, y, width, height);
		bmp.textColor = this._window.normalColor();
		bmp.drawText(level, x, y, width, height, 'right');
	}
	knsRefreshDropItem(type){
		let x = 4;
		let y = 2;
		let height = 40;
		this.bitmap = new Bitmap(460, height + (y << 1));
		let oy = this.bitmap.height >> 1;
		const ctx = this.bitmap._context;
		ctx.save();
		ctx.beginPath();
		if (this.isRightMode()){
			x += 24;
			ctx.moveTo(oy, 0);
			ctx.lineTo(this.bitmap.width, 0)
			ctx.lineTo(this.bitmap.width, this.bitmap.height)
			ctx.lineTo(oy, this.bitmap.height);
			ctx.lineTo(0, oy);
		}else{
			ctx.moveTo(0, 0);
			ctx.lineTo(this.bitmap.width - oy, 0)
			ctx.lineTo(this.bitmap.width, oy)
			ctx.lineTo(this.bitmap.width - oy, this.bitmap.height);
			ctx.lineTo(0, this.bitmap.height);
		}
		ctx.fillStyle = '#000c';
		ctx.fill();
		ctx.restore();
		let width = this.bitmap.width - x - 32;
		if (type == 0){
			this.bitmap.drawText(this._knsArgs[0], x+4, y, width, height);
			this.bitmap.textColor = this._window.systemColor();
			this.bitmap.drawText(KNS_TERMS.CURRENCY_UNIT, x, y, width, height, 'right');
		}else{
			const item = this._knsArgs[0];
			this.removeChild(this._knsUiSprite);
			if (DataManager.isWeapon(item)){
				this._knsUiSprite = new Sprite_ObtainedWeapon(item.id);
				this._knsUiSprite.x += x - 4;
				this.addChild(this._knsUiSprite);
			}else if (item.iconIndex){
				this._knsUiSprite = new Sprite_MenuIcon(item.iconIndex, x+8, y+4);
				this.addChild(this._knsUiSprite);
			}
			if (this.isRightMode()){
				this._knsUiSprite.x -= this.bitmap.width;
			}
			this.bitmap.drawText(item.name, x + 48, y, width, height);
			this.bitmap.drawText("×", x, y, width - 48, height, 'right');
			this.bitmap.drawText(this._knsArgs[1], x, y, width, height, 'right');
		}
	}
}

;(function(){
//===========================================
// alias BattleManager
//===========================================
const _BattleManager_isBusy = BattleManager.isBusy;
BattleManager.isBusy = function(){
	return this._knsResultSpriteset.isBusy() || _BattleManager_isBusy.call(this);
};

BattleManager.knsSetResultWindow = function(window){
	this._knsResultSpriteset = window;
};

// reward
const _BattleManager_makeRewards = BattleManager.makeRewards;
BattleManager.makeRewards = function() {
	_BattleManager_makeRewards.call(this);
	this._rewards._knsRole = $gameTroop.knsRoleTotal();
	const items = [];
	this._rewards.items.forEach(function(item){
		const found = items.find(function(array){ return array[0] == item; });
		if (found){
			found[1] += 1;
		}else{
			items.push([item, 1]);
		}
	})
	this._rewards.items = items;
};

BattleManager.displayRewards = function(){
	this._knsResultSpriteset.knsCreate(this._rewards);
	this._logWindow.push('knsStartResult');
};

BattleManager.gainExp = function() {};
BattleManager.gainGold = function(){ $gameParty.gainGold(this._rewards.gold); };
BattleManager.gainDropItems = function() {
    const items = this._rewards.items;
    items.forEach(function(item){ $gameParty.gainItem(item[0], item[1]); });
};

//===========================================
// alias Scene_Battle
//===========================================
Game_Troop.prototype.knsRoleTotal = function() {
	return this.deadMembers().reduce(function(r, enemy){
		return r + Math.floor(enemy.enemy().meta.role) || 0;
	}, 0);
};
//===========================================
// alias Scene_Battle
//===========================================
const _Scene_Battle_createDisplayObjects = Scene_Battle.prototype.createDisplayObjects;
Scene_Battle.prototype.createDisplayObjects = function(){
	_Scene_Battle_createDisplayObjects.call(this);
	this.knsCreateResultWindow();
};

Scene_Battle.prototype.knsCreateResultWindow = function(){
	this._knsResultSpriteset = new Spriteset_KnsResult(this._logWindow);
	this.addChild(this._knsResultSpriteset);
}
})();