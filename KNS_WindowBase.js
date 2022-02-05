//================================================
// new Sprite_KnsBackButton
//================================================
class Sprite_KnsBackButton extends Sprite{
	constructor(parents, flag){
		super(ImageManager.reserveSystem('BackButton'));
		this._knsParentWindows = parents;
		if (flag == true){
			this.rotation = Math.PI;
			this.scale.x = this.scale.y = 0;
		}
		this.knsSetPosition();
	}
	knsSetPosition(){
		this.x = Graphics.width - 32;
		this.y = 32;
		this.anchor.x = 0.5;
		this.anchor.y = 0.5;
		this._knsRotationCnt = 0;
		this._knsLastShowType = false;
	}
	knsFindActiveParent(){
		for (let window of this._knsParentWindows){
			if (window && window.active) return window;
		}
		return null;
	}
	update(){
		super.update();
		const activeWindow = this.knsFindActiveParent();
		if (activeWindow !== null){
			this.knsUpdateInput(activeWindow);
			this.knsUpdateOpening(true);
		}else{
			this.knsUpdateOpening(false);
		}
	}
	knsIsTriggered(){
		if (TouchInput.isTriggered()){
			let half = this.bitmap.width >> 1;
			if (TouchInput.x < this.x + half && this.x < TouchInput.x + half){
				half = this.bitmap.height >> 1;
				return TouchInput.y < this.y + half && this.y < TouchInput.y + half;
			}
		}
		return false;
	}
	knsUpdateInput(window){
		if (this.knsIsTriggered() && window.isCancelEnabled()){
			window.processCancel();
		}
	}
	knsUpdateOpening(found){
		if (this._knsLastShowType != found){
			this._knsLastShowType = found;
			this._knsRotationCnt = 0;
		}
		const max = 20;
		if (this._knsRotationCnt < max){
			const rate = ++this._knsRotationCnt / max;
			const tr = found ? 0 : Math.PI;
			const ts = found ? 1 : 0;
			this.rotation = this.rotation + rate * (tr - this.rotation);
			this.scale.x = this.scale.y = this.scale.y + rate * (ts - this.scale.y);
		}
	}
}

;(function(){
//============================================
// alias Bitmap
//============================================
Bitmap.prototype.knsDrawIcon = function(iconIndex, x, y){
	const img = ImageManager.reserveSystem('IconSet');
	if (img._canvas && this._context){
		let size = 32;
		let col = 16;
		let sx = size * (iconIndex % col);
		let sy = size * (iconIndex / col);
		this._context.drawImage(img._canvas, sx, sy, size, size, x, y, size, size);
	}
}

Bitmap.prototype.knsUpperGradient = function(
	x, y, width, height, padY, color1, color2
){
	let firstHeight = height - padY
	this.fillRect(x, y, width, firstHeight, color1);
	this.gradientFillRect(x, y + firstHeight, width, padY, color1, color2, true);
}

Bitmap.prototype.knsDownerGradient = function(
	x, y, width, height, padY, color1, color2
){
	this.fillRect(x, y + padY, width, height - padY, color1);
	this.gradientFillRect(x, y, width, padY, color2, color1, true);
}


//============================================
// alias Window_Base
//============================================
Window_Base.prototype.getCircleFace = function(name, index){
	const cvs = document.createElement('canvas');
	cvs.width = Window_Base._faceWidth;
	cvs.height = Window_Base._faceHeight;
	const ctx = cvs.getContext('2d');
	ctx.fillStyle = 'white';
	ctx.beginPath();
	const math = Math.PI*2;
	ctx.arc(cvs.width >> 1, cvs.height >> 1, 70, 0, math);
	ctx.fill();
	ctx.globalCompositeOperation = 'source-in';
	ctx.drawImage(ImageManager.loadFace(name).canvas, 
		cvs.width * (index % 4), cvs.height * (index >> 2), cvs.width, cvs.height, 
		0, 0, cvs.width, cvs.height
	);
	ctx.closePath();
	return cvs;
}

Window_Base.prototype.drawCircleFace = function(name, index, x, y, w, h){
	const cvs = this.getCircleFace(name, index);
	this.contents._context.drawImage(
		cvs, 0, 0, cvs.width, cvs.height, 
		x, y, w || cvs.width, h || cvs.height
	);
}

Window_Base.prototype.drawCircleBar = function(
	x, y, width, barWidth, startR, endR, rate, color1, color2
){
	let rx = x + width + barWidth;
	let ry = y + width + barWidth;
	const ctx = this.contents._context;
	ctx.save();
	ctx.lineWidth = barWidth;
	ctx.beginPath();
		ctx.strokeStyle = color1;
		ctx.arc(rx, ry, width, startR, endR);
		ctx.stroke();
	ctx.closePath();

	ctx.lineWidth = barWidth-2;
	ctx.beginPath();
		ctx.strokeStyle = color2;
		ctx.arc(rx, ry, width, startR, (endR - startR) * rate + startR);
		ctx.stroke();
	ctx.restore();
	this.contents._setDirty();
}

Window_Base.prototype.drawGauge = function(x, y, width, rate, color1, color2) {
	const ctx = this.contents._context;
	if (!ctx) return;

	let height = 6;
	y += this.lineHeight() - height-6;

	ctx.save();
	ctx.fillStyle = this.gaugeBackColor();
	ctx.strokeStyle = ctx.fillStyle;//'white';
	ctx.lineWidth = 2;

	// max gauge
	ctx.beginPath();
	ctx.moveTo(x+3, y);
	ctx.lineTo(x+width, y-4);
	ctx.lineTo(x+width-3, y+height);
	ctx.lineTo(x, y+height);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();

	let fillW = rate * width;
	ctx.strokeStyle = color1;
	ctx.fillStyle = color2;
	//ctx.lineWidth = 3;
	// current gauge
	ctx.beginPath();
	ctx.moveTo(x+3, y);
	ctx.lineTo(x+fillW, y-4*rate);
	ctx.lineTo(x+fillW-3, y+height);
	ctx.lineTo(x, y+height);
	//ctx.stroke();
	ctx.fill();
	ctx.closePath();

	ctx.restore();
};

Window_Base.prototype.drawCurrentAndMax = function(
	current, max, x, y, width, color1, color2
){
	var labelWidth = this.textWidth('HP');
	var valueWidth = this.textWidth('0000');

	let biggerFont = this.contents.fontSize;
	let smallFont = this.contents.fontSize - 5.5;
	this.contents.fontSize = smallFont;
	var maxWidth = this.textWidth('0000');
	var slashWidth = this.textWidth('/');

	var x1 = x + width - maxWidth;
	var x2 = x1 - slashWidth;
	var x3 = x2 - valueWidth;
	x1 = x + width - valueWidth;
	if (x3 >= x + labelWidth) {
		this.changeTextColor(color2);
        this.drawText('/', x2, y+2, slashWidth, 'right');
		this.drawText(max, x1, y+2, valueWidth, 'right');
		this.contents.fontSize = biggerFont;
		this.changeTextColor(color1);
		this.drawText(current, x3, y, valueWidth, 'right');
	} else {
		this.contents.fontSize = biggerFont;
		this.changeTextColor(color1);
		this.drawText(current, x1, y, valueWidth, 'right');
	}
};

// drawActorFaceWithExp
Window_Base.prototype.drawActorFaceWithExp = function(actor, x, y, width){
	const faceWidth  = Window_Base._faceWidth;
	const faceHeight = Window_Base._faceHeight;
	this.drawCircleFace(actor.faceName(), actor.faceIndex(), 
		x + 7, y + 7, faceWidth-2, faceHeight-2);

	let rate = 1, exp1, exp2;
	const exps = actor.knsGetCurrentExp();
	if (exps){
		exp1 = exps[0];
		exp2 = exps[1];
		rate = exp1 / exp2;
	}else{
		exp1 = '-------';
		exp2 = '-------';
	}
	this.drawCircleBar(
		x, y, faceWidth >> 1, 6, Math.PI * 0.4, Math.PI * 1.95,
		rate, this.gaugeBackColor(), this.powerUpColor(), true
	);

	// name
	this.contents.fontSize = 22;
	this.changeTextColor(this.hpColor(actor));
	this.drawText(actor.name(), x, y + 64, width, 'right');
	// level
	this.drawKnsLevel(actor, x + width - 5, y + 100);
	// icon
	this.drawActorIcons(actor, x, y, 165);
	// exp
	let expX = x + 24;
	let expWidth = width >> 1;
	this.contents.fontSize = 28;
	this.drawText(exp1, expX, y, expWidth, 'right');
	this.contents.fontSize = 20;
	expX += expWidth + 4;
	this.drawText("/", expX, y - 2, expWidth, 'left');
	this.drawText(exp2, x, y - 2, width, 'right');
	this.changeTextColor(this.systemColor());
	this.drawText(KNS_TERMS.STATUS_EXP, x, y + 18, width, 'right');
}


Window_Base.prototype.drawKnsLevel = function(actor, x, y){
	this.changeTextColor(this.systemColor());
	let levelWidth = 80;
	x -= levelWidth;
	this.contents.fontSize = 22;
	this.drawText(KNS_TERMS.STATUS_LEVEL, x, y + 7, levelWidth);
	this.resetTextColor();
	this.contents.fontSize = 36;
	this.drawText(actor.level, x, y, levelWidth, 'right');
	this.contents.fontSize = this.standardFontSize();
}

Window_Base.prototype.knsDrawJobGauge = function(actor, x, y, width, roleId){
	this.contents.fontSize = 22;
	if (roleId == undefined){
		roleId = actor.knsGetRoleId();
	}
	if (roleId !== 0){
		// draw bar
		let next = actor.knsGetRoleNextExp(roleId);
		let roleHeight = 64;
		let border = 13;
		let circleX = x + (width >> 1) - roleHeight - border;
		let circleY = y - roleHeight + (border >> 1);

		let pad1 = 24;
		let pad2 = 50;
		const gaugeBack = this.gaugeBackColor();
		if (next == 0){
			pad1 = 8;
			pad2 = 24;
			this.drawCircleBar(circleX, circleY, roleHeight,
				border, 0, Math.PI * 2, 1, gaugeBack, this.textColor(29));
		}else{
			let cur = actor.knsGetRoleCurrentExp(roleId);
			this.drawCircleBar(circleX, circleY, roleHeight,
				border, Math.PI*1.5, Math.PI * 3.5, cur / next, 
				gaugeBack, this.textColor(31)
			);
			let roleWidth = width >> 1;
			this.contents.fontSize = 26;
			this.drawText(cur, x+8, y, roleWidth, 'right');
			this.contents.fontSize = 20;
			this.drawText("/"+next, x+10 + roleWidth, y, roleWidth, 'left');
			this.contents.fontSize = 22;
		}
		// drawInfo
		let roleWidth = 90;
		let roleX = x + (width - roleWidth >> 1);
		y -= pad1;
		this.drawText(actor.knsGetRoleName(roleId), x, y, width, 'center');
		y += pad2;

		this.changeTextColor(this.systemColor());
		this.drawText(KNS_TERMS.STATUS_LEVEL, roleX, y, roleWidth, 'left');
		this.resetTextColor();
		let roleLevel = actor.knsGetRoleLevel(roleId);
		this.drawText(roleLevel, roleX, y, roleWidth, 'right');
	}
}

// gauge
Window_Base.prototype.drawActorHp = function(actor, x, y, width) {
    width = width || 186;
    var color1 = this.hpGaugeColor1();
    var color2 = this.hpGaugeColor2();
    this.drawGauge(x, y, width, actor.hpRate(), color1, color2);
    this.changeTextColor(color2);
	this.contents.fontSize -= 4;
    this.drawText(KNS_TERMS.STATUS_PARAM_SHORT[0], x, y, 44);
	this.contents.fontSize += 4;
    this.drawCurrentAndMax(
		actor.hp, actor.mhp, x, y, width,
		this.hpColor(actor), this.normalColor()
	);
};

Window_Base.prototype.drawActorMp = function(actor, x, y, width) {
    width = width || 186;
    var color1 = this.mpGaugeColor1();
    var color2 = this.mpGaugeColor2();
    this.drawGauge(x, y, width, actor.mpRate(), color1, color2);
    this.changeTextColor(color2);
	this.contents.fontSize -= 4;
    this.drawText(KNS_TERMS.STATUS_PARAM_SHORT[1], x, y, 44);
	this.contents.fontSize += 4;
    this.drawCurrentAndMax(
		actor.mp, actor.mmp, x, y, width,
        this.mpColor(actor), this.normalColor()
	);
};

Window_Base.prototype.drawActorTp = function(actor, x, y, width) {
    width = width || 96;
    var color1 = this.tpGaugeColor1();
    var color2 = this.tpGaugeColor2();
    this.drawGauge(x, y, width, actor.tpRate(), color1, color2);
    this.changeTextColor(color2);
	this.contents.fontSize -= 4;
    this.drawText(KNS_TERMS.STATUS_PARAM_SHORT[2], x, y, 44);
	this.contents.fontSize += 4;
    this.changeTextColor(this.tpColor(actor));
    this.drawText(actor.tp, x + width - 64, y, 64, 'right');
};

//================================================
// alias Window_Command
//================================================
Window_Command.prototype.commandExt = function(index) {
    return this._list[index].ext;
};

//================================================
// alias Window_Gold
//================================================
Window_Gold.prototype.currencyUnit = function() {
    return KNS_TERMS.CURRENCY_UNIT;
};
})();

//============================================
// alias Window_Playtime
//============================================
class Window_Playtime extends Window_Base{
	constructor(width, height){
		super(0, Graphics.height - height, width, height);
		this._knsFrameCount = 0;
		this.refresh();
	}
	update(){
		super.update();
		this.knsUpdateTime();
	}
	knsUpdateTime(){
		const max = 30;
		if (this._knsFrameCount > max){
			this._knsFrameCount = 0;
			this.refresh();
		}else{
			this._knsFrameCount++;
		}
	}
	refresh(){
		const text = $gameSystem.playtimeText()
		if (this._knsLastText != text){
			this._knsLastText = text;
			this.contents.clear();
			this.drawText(text, 0, 0, this.contents.width);
		}
	}
}