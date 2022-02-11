"use strict";
(function(){
//============================================
// alias Game_Map
//============================================
Game_Map.KNS_RE_MAP_NAME = /^(\d+)$/
Game_Map.prototype.displayName = function(name) {
	const base = name == undefined ? $dataMap.displayName : name;
	if (Game_Map.KNS_RE_MAP_NAME.test(base)){
		return KNS_TERMS.MAP_NAMES[Math.floor(base)];
	}else{
		return base;
	}
};

//============================================
// alias Scene_Map
//============================================
Scene_Map.prototype.createMapNameWindow = function() {
	this._mapNameWindow = new Sprite_KnsMapName();
	this.addChild(this._mapNameWindow);
};
})();

//============================================
// new Sprite_KnsMapName
//============================================
class Sprite_KnsMapName extends Sprite{
	open(){
		const name = $gameMap.displayName();
		if (!name || Sprite_KnsMapName.LAST_NAME === name){
			return;
		}else{
			Sprite_KnsMapName.LAST_NAME = name;
		}
		this.refresh();
		this._showCount = this.knsMaxFrame();
	};
	close(){ this._showCount = 0; };
	hide(){ this.visible = false; }
	knsMaxFrame(){ return 180; }

	constructor(){
		super();
		this.knsCreateBitmap();
		this.opacity = 0;
		this.x = -Graphics.width;
		this.y = Graphics.height - 40;
		this._showCount = 0;
		this.refresh();
	}
	knsCreateBitmap(){
		this.bitmap = new Bitmap(320, 4);
		let pad = 48, width = this.bitmap.width - pad;
		// back
		let height = 4, color1 = KNS_COLORS.WINDOW_BACK1, color2 = KNS_COLORS.WINDOW_BACK2;
		this.bitmap.fillRect(0, 0, width, height, color1);
		this.bitmap.gradientFillRect(width, 0, pad, height, color1, color2);
		// front
		height = 2, color1 = '#fff', color2 = '#fff0';
		this.bitmap.fillRect(0, 1, width, height, color1);
		this.bitmap.gradientFillRect(width, 1, pad, height, color1, color2);
	}
	update(){
		super.update();
		if (this._showCount > 0 && $gameMap.isNameDisplayEnabled()) {
			this.updateFadeIn();
			this._showCount--;
		} else {
			this.updateFadeOut();
		}
		this.updateChrChildren();
	};
	updateFadeIn(){
		this.opacity += 16;
		const max = this.knsMaxFrame();
		const rate = (max - this._showCount) / max;
		this.x = this.x - this.x * rate;
	}
	updateFadeOut(){
		this.opacity -= 16;
		if (this.opacity > 0){
			this.x -= 4;
		}
	}
	updateChrChildren(){
		const waveMax = 30;
		this.children.forEach(function(sp){
			if (sp._knsCnt < 0){
				sp._knsCnt++;
			}else if (sp._knsCnt < waveMax){
				sp._knsCnt++;
				const rate = sp._knsCnt / waveMax;
				sp.y = Math.sin(Math.PI * rate) * 9 - 55;
				sp.opacity += 10;
			}
		});
	}
	refresh(){
		this.removeChildren();
		const name = $gameMap.displayName();
		if (!name) return;
		let x = 12;
		for (let i = 0; i < name.length; i++){
			const bmp = new Bitmap(60, 60);
			bmp.fontSize = i == 0 ? 48 : 36;
			bmp.outlineColor = KNS_COLORS.WINDOW_BACK1;
			bmp.outlineWidth = 3;
			bmp.drawText(name[i], 0, 0, bmp.width, bmp.height);
			const sp = new Sprite(bmp);
			sp.x = x;
			sp.opacity = 0;
			sp._knsCnt = -i * 4 - 10;
			x += bmp.measureTextWidth(name[i]);
			this.addChild(sp);
		}
	};
};