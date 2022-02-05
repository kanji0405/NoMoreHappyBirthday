//======================================================
// new KNS_MenuGallery
//======================================================
class KNS_MenuGallery{
	static allDataOf(list){
		return list.filter(function(item){
			return item && item.name.length > 0 && !item.meta.notOnList;
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
			case 2:	return this.allDataOf($dataArmors);
			case 3:	return this.allDataOf($dataEnemies);
		}
	}
}

//======================================================
// alias Game_System
//======================================================
Game_System.prototype.addHistory = function(type, id){
	if (this._knsHistoryList === undefined){
		this._knsHistoryList = [];
	}
	if (this._knsHistoryList[type] === undefined){
		this._knsHistoryList[type] = [];
	}else if (!this._knsHistoryList[type].includes(id)){
		this._knsHistoryList[type].push(id);
	}
};

Game_System.prototype.knsIsItemRecorded = function(type, id){
	if (
		this._knsHistoryList === undefined ||
		this._knsHistoryList[type] === undefined
	){
		return false;
	}
	return this._knsHistoryList[type].includes(id);
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
	makeCommandList(){
		this.addCommand('GALLERY_MESSAGE',	'message');
		this.addCommand('GALLERY_ENEMY',	'list',	true,	3);
		this.addCommand('CATEGORY_ITEM',	'list',	true,	0);
		this.addCommand('CATEGORY_WEAPON',	'list',	true,	1);
		this.addCommand('CATEGORY_ARMOR',	'list',	true,	2);
		this.addCommand('CATEGORY_KEYITEM',	'list',	true,	-1);
	}
	knsIsListCommand(index){ return this.commandSymbol(index) == 'list'; }
	drawItem(index){
		super.drawItem(index);
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
		const rect = this.itemRectForText(index);
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
				return $gameSystem.knsIsItemRecorded(type, item.id);
			});
			this._obtainedList[type] = [found, list];
		}
		return this._obtainedList[type];
	}
	setListWindow(){}
}
KNS_Menu.linkHelp(Window_KnsGalleryCommand);

class Window_KnsGalleryList extends Window_Selectable{
	
}
class Window_KnsGalleryInfo extends Window_Base{
	
}
class Window_KnsMessageLog extends Window_Selectable{

}

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

		this._helpWindow.opacity = 0;
		this.knsCreateBackBlacks(this._helpWindow.height, this._commandWindow.height);
		this.knsCreateCancelButton([
			this._commandWindow, this._listWindow, this._logWindow
		]);
		this.pushKnsSlide(this._commandWindow, 8);
		this.pushKnsSlide(this._helpWindow, 2);
//		this.pushKnsSlide(this._itemWindow, 4);
		this.setBackgroundOpacity(128);
	}
	knsCreateCategoryWindow(){
		this._commandWindow = new Window_KnsGalleryCommand(0, 0);
		this._commandWindow.y = Graphics.height - this._commandWindow.height;
		this._commandWindow.opacity = 0;
		this._commandWindow.setHelpWindow(this._helpWindow);
		this._commandWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._commandWindow);
	}
	knsCreateListWindow(){
		this._listWindow = new Window_KnsGalleryList();
		this.addWindow(this._listWindow);
	}
	knsCreateInfoWindow(){
		this._infoWindow = new Window_KnsGalleryInfo();
		this.addWindow(this._infoWindow);
	}
	knsCreateMessageLogWindow(){
		this._logWindow = new Window_KnsMessageLog();
		this.addWindow(this._logWindow);
	}
}


// item
(function() {
	return;
	Scene_ItemBook.prototype.create = function() {
		Scene_MenuBase.prototype.create.call(this);
		this._indexWindow = new Window_ItemBookIndex(0, 0);
		this._indexWindow.setHandler('cancel', this.popScene.bind(this));
		var wy = this._indexWindow.height;
		var ww = Graphics.boxWidth;
		var wh = Graphics.boxHeight - wy;
		this._statusWindow = new Window_ItemBookStatus(0, wy, ww, wh);
		this.addWindow(this._indexWindow);
		this.addWindow(this._statusWindow);
		this._indexWindow.setStatusWindow(this._statusWindow);
	};

	function Window_ItemBookIndex() {
		this.initialize.apply(this, arguments);
	}

	Window_ItemBookIndex.prototype = Object.create(Window_Selectable.prototype);
	Window_ItemBookIndex.prototype.constructor = Window_ItemBookIndex;

	Window_ItemBookIndex.lastTopRow = 0;
	Window_ItemBookIndex.lastIndex  = 0;

	Window_ItemBookIndex.prototype.initialize = function(x, y) {
		var width = Graphics.boxWidth;
		var height = this.fittingHeight(6);
		Window_Selectable.prototype.initialize.call(this, x, y, width, height);
		this.refresh();
		this.setTopRow(Window_ItemBookIndex.lastTopRow);
		this.select(Window_ItemBookIndex.lastIndex);
		this.activate();
	};

	Window_ItemBookIndex.prototype.maxCols = function() {
		return 3;
	};

	Window_ItemBookIndex.prototype.maxItems = function() {
		return this._list ? this._list.length : 0;
	};

	Window_ItemBookIndex.prototype.setStatusWindow = function(statusWindow) {
		this._statusWindow = statusWindow;
		this.updateStatus();
	};

	Window_ItemBookIndex.prototype.update = function() {
		Window_Selectable.prototype.update.call(this);
		this.updateStatus();
	};

	Window_ItemBookIndex.prototype.updateStatus = function() {
		if (this._statusWindow) {
			var item = this._list[this.index()];
			this._statusWindow.setItem(item);
		}
	};

	Window_ItemBookIndex.prototype.refresh = function() {
		var i, item;
		this._list = [];
		for (i = 1; i < $dataItems.length; i++) {
			item = $dataItems[i];
			if (item.name && item.itypeId === 1 && item.meta.book !== 'no') {
				this._list.push(item);
			}
		}
		for (i = 1; i < $dataWeapons.length; i++) {
			item = $dataWeapons[i];
			if (item.name && item.meta.book !== 'no') {
				this._list.push(item);
			}
		}
		for (i = 1; i < $dataArmors.length; i++) {
			item = $dataArmors[i];
			if (item.name && item.meta.book !== 'no') {
				this._list.push(item);
			}
		}
		this.createContents();
		this.drawAllItems();
	};

	Window_ItemBookIndex.prototype.drawItem = function(index) {
		var item = this._list[index];
		var rect = this.itemRect(index);
		var width = rect.width - this.textPadding();
		if ($gameSystem.isInItemBook(item)) {
			this.drawItemName(item, rect.x, rect.y, width);
		} else {
			var iw = Window_Base._iconWidth + 4;
			this.drawText(unknownData, rect.x + iw, rect.y, width - iw);
		}
	};

	Window_ItemBookIndex.prototype.processCancel = function() {
		Window_Selectable.prototype.processCancel.call(this);
		Window_ItemBookIndex.lastTopRow = this.topRow();
		Window_ItemBookIndex.lastIndex = this.index();
	};

	function Window_ItemBookStatus() {
		this.initialize.apply(this, arguments);
	}

	Window_ItemBookStatus.prototype = Object.create(Window_Base.prototype);
	Window_ItemBookStatus.prototype.constructor = Window_ItemBookStatus;

	Window_ItemBookStatus.prototype.initialize = function(x, y, width, height) {
		Window_Base.prototype.initialize.call(this, x, y, width, height);
	};

	Window_ItemBookStatus.prototype.setItem = function(item) {
		if (this._item !== item) {
			this._item = item;
			this.refresh();
		}
	};

	Window_ItemBookStatus.prototype.refresh = function() {
		var item = this._item;
		var x = 0;
		var y = 0;
		var lineHeight = this.lineHeight();

		this.contents.clear();

		if (!item || !$gameSystem.isInItemBook(item)) {
			return;
		}

		this.drawItemName(item, x, y);

		x = this.textPadding();
		y = lineHeight + this.textPadding();

		var price = item.price > 0 ? item.price : '-';
		this.changeTextColor(this.systemColor());
		this.drawText(priceText, x, y, 120);
		this.resetTextColor();
		this.drawText(price, x + 120, y, 120, 'right');
		y += lineHeight;

		if (DataManager.isWeapon(item) || DataManager.isArmor(item)) {
			var etype = $dataSystem.equipTypes[item.etypeId];
			this.changeTextColor(this.systemColor());
			this.drawText(equipText, x, y, 120);
			this.resetTextColor();
			this.drawText(etype, x + 120, y, 120, 'right');
			y += lineHeight;

			var type;
			if (DataManager.isWeapon(item)) {
				type = $dataSystem.weaponTypes[item.wtypeId];
			} else {
				type = $dataSystem.armorTypes[item.atypeId];
			}
			this.changeTextColor(this.systemColor());
			this.drawText(typeText, x, y, 120);
			this.resetTextColor();
			this.drawText(type, x + 120, y, 120, 'right');

			x = this.textPadding() + 300;
			y = lineHeight + this.textPadding();
			for (var i = 2; i < 8; i++) {
				this.changeTextColor(this.systemColor());
				this.drawText(TextManager.param(i), x, y, 160);
				this.resetTextColor();
				this.drawText(item.params[i], x + 160, y, 60, 'right');
				y += lineHeight;
			}
		}

		x = 0;
		y = this.textPadding() * 2 + lineHeight * 7;
		this.drawTextEx(item.description, x, y);
	};

})();

// enemy
(function() {
	return;
	function Scene_EnemyBook() {
		this.initialize.apply(this, arguments);
	}

	Scene_EnemyBook.prototype = Object.create(Scene_MenuBase.prototype);
	Scene_EnemyBook.prototype.constructor = Scene_EnemyBook;

	Scene_EnemyBook.prototype.initialize = function() {
		Scene_MenuBase.prototype.initialize.call(this);
	};

	Scene_EnemyBook.prototype.create = function() {
		Scene_MenuBase.prototype.create.call(this);
		this._indexWindow = new Window_EnemyBookIndex(0, 0);
		this._indexWindow.setHandler('cancel', this.popScene.bind(this));
		var wy = this._indexWindow.height;
		var ww = Graphics.boxWidth;
		var wh = Graphics.boxHeight - wy;
		this._statusWindow = new Window_EnemyBookStatus(0, wy, ww, wh);
		this.addWindow(this._indexWindow);
		this.addWindow(this._statusWindow);
		this._indexWindow.setStatusWindow(this._statusWindow);
	};

	function Window_EnemyBookIndex() {
		this.initialize.apply(this, arguments);
	}

	Window_EnemyBookIndex.prototype = Object.create(Window_Selectable.prototype);
	Window_EnemyBookIndex.prototype.constructor = Window_EnemyBookIndex;

	Window_EnemyBookIndex.lastTopRow = 0;
	Window_EnemyBookIndex.lastIndex  = 0;

	Window_EnemyBookIndex.prototype.initialize = function(x, y) {
		var width = Graphics.boxWidth;
		var height = this.fittingHeight(6);
		Window_Selectable.prototype.initialize.call(this, x, y, width, height);
		this.refresh();
		this.setTopRow(Window_EnemyBookIndex.lastTopRow);
		this.select(Window_EnemyBookIndex.lastIndex);
		this.activate();
	};

	Window_EnemyBookIndex.prototype.maxCols = function() {
		return 3;
	};

	Window_EnemyBookIndex.prototype.maxItems = function() {
		return this._list ? this._list.length : 0;
	};

	Window_EnemyBookIndex.prototype.setStatusWindow = function(statusWindow) {
		this._statusWindow = statusWindow;
		this.updateStatus();
	};

	Window_EnemyBookIndex.prototype.update = function() {
		Window_Selectable.prototype.update.call(this);
		this.updateStatus();
	};

	Window_EnemyBookIndex.prototype.updateStatus = function() {
		if (this._statusWindow) {
			var enemy = this._list[this.index()];
			this._statusWindow.setEnemy(enemy);
		}
	};

	Window_EnemyBookIndex.prototype.refresh = function() {
		this._list = [];
		for (var i = 1; i < $dataEnemies.length; i++) {
			var enemy = $dataEnemies[i];
			if (enemy.name && enemy.meta.book !== 'no') {
				this._list.push(enemy);
			}
		}
		this.createContents();
		this.drawAllItems();
	};

	Window_EnemyBookIndex.prototype.drawItem = function(index) {
		var enemy = this._list[index];
		var rect = this.itemRectForText(index);
		var name;
		if ($gameSystem.isInEnemyBook(enemy)) {
			name = enemy.name;
		} else {
			name = unknownData;
		}
		this.drawText(name, rect.x, rect.y, rect.width);
	};

	Window_EnemyBookIndex.prototype.processCancel = function() {
		Window_Selectable.prototype.processCancel.call(this);
		Window_EnemyBookIndex.lastTopRow = this.topRow();
		Window_EnemyBookIndex.lastIndex = this.index();
	};

	function Window_EnemyBookStatus() {
		this.initialize.apply(this, arguments);
	}

	Window_EnemyBookStatus.prototype = Object.create(Window_Base.prototype);
	Window_EnemyBookStatus.prototype.constructor = Window_EnemyBookStatus;

	Window_EnemyBookStatus.prototype.initialize = function(x, y, width, height) {
		Window_Base.prototype.initialize.call(this, x, y, width, height);
		this._enemy = null;
		this._enemySprite = new Sprite();
		this._enemySprite.anchor.x = 0.5;
		this._enemySprite.anchor.y = 0.5;
		this._enemySprite.x = width / 2 - 20;
		this._enemySprite.y = height / 2;
		this.addChildToBack(this._enemySprite);
		this.refresh();
	};

	Window_EnemyBookStatus.prototype.setEnemy = function(enemy) {
		if (this._enemy !== enemy) {
			this._enemy = enemy;
			this.refresh();
		}
	};

	Window_EnemyBookStatus.prototype.update = function() {
		Window_Base.prototype.update.call(this);
		if (this._enemySprite.bitmap) {
			var bitmapHeight = this._enemySprite.bitmap.height;
			var contentsHeight = this.contents.height;
			var scale = 1;
			if (bitmapHeight > contentsHeight) {
				scale = contentsHeight / bitmapHeight;
			}
			this._enemySprite.scale.x = scale;
			this._enemySprite.scale.y = scale;
		}
	};

	Window_EnemyBookStatus.prototype.refresh = function() {
		var enemy = this._enemy;
		var x = 0;
		var y = 0;
		var lineHeight = this.lineHeight();

		this.contents.clear();

		if (!enemy || !$gameSystem.isInEnemyBook(enemy)) {
			this._enemySprite.bitmap = null;
			return;
		}

		var name = enemy.battlerName;
		var hue = enemy.battlerHue;
		var bitmap;
		if ($gameSystem.isSideView()) {
			bitmap = ImageManager.loadSvEnemy(name, hue);
		} else {
			bitmap = ImageManager.loadEnemy(name, hue);
		}
		this._enemySprite.bitmap = bitmap;

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

		for (var j = 0; j < enemy.dropItems.length; j++) {
			var di = enemy.dropItems[j];
			if (di.kind > 0) {
				var item = Game_Enemy.prototype.itemObject(di.kind, di.dataId);
				this.drawItemName(item, x, y, rewardsWidth);
				y += lineHeight;
			}
		}

		var descWidth = 480;
		x = this.contents.width - descWidth;
		y = this.textPadding() + lineHeight * 7;
		this.drawTextEx(enemy.meta.desc1, x, y + lineHeight * 0, descWidth);
		this.drawTextEx(enemy.meta.desc2, x, y + lineHeight * 1, descWidth);
	};
})();