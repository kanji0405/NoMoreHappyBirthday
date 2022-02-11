"use strict";
//=========================================================
// new KNS_COLORS
//=========================================================
const KNS_COLORS = {
	UI_BACK: '#2c7076',
	UI_BACK_DARK: '#0c5056',
	SYSTEM_ACCENT: '#ebac0e',
	SYSTEM_OUTLINE: '#2d4f2c',
	WINDOW_BACK1: '#000a',
	WINDOW_BACK2: '#0000',
}

//=========================================================
// new KNS_TERMS
//=========================================================
const KNS_TERMS = {};
KNS_TERMS.__LANGUAGE_LIST = [];
KNS_TERMS.__CURRENT_LANGUAGE = null;
KNS_TERMS.__RE_TERMS = /^KNS_Terms(.+)$/;
KNS_TERMS.__LANGUAGE_NAME = 'Language';
KNS_TERMS.__LANGUAGE_SYMBOL = 'knsLanguageId';
KNS_TERMS.__VERSION = 'ver 1.0.0 ©2022 ';

KNS_TERMS._changeLanguage = function(){
	const max = this.__LANGUAGE_LIST.length;
	let id = ((ConfigManager.knsLanguageId || 0) + max) % max;
	if (isNaN(id)) id = 0;
	this.__CURRENT_LANGUAGE = this[this.__LANGUAGE_LIST[id]];
}

// frequently called
KNS_TERMS._translate = function(name){
	return this.__CURRENT_LANGUAGE[name] || '';
}

// only once
KNS_TERMS._prepare = function(){
	this.__LANGUAGE_LIST.length = 0;
	for (let name of PluginManager._scripts){
		if (this.__RE_TERMS.test(name)){ this.__LANGUAGE_LIST.push(RegExp.$1); }
	}
	Object.keys(this[this.__LANGUAGE_LIST[0]]).forEach(function(name){
		Object.defineProperty(this, name, { get: this._translate.bind(this, name)} );
	}, this);

	// $dataSystem
	Object.defineProperty($dataSystem, 'weaponTypes',
	{ get: this._translate.bind(this, 'WEAPON_TYPE')});
	Object.defineProperty($dataSystem, 'armorTypes',
	{ get: this._translate.bind(this, 'ARMOR_TYPE')});

	// actor
	$dataActors.forEach(function(actor){
		if (!actor) return;
		Object.defineProperty(actor, 'name', {
			get: function(){ return KNS_TERMS._translate('ACTOR_NAME')[actor.id] || ''; }
		});
	}, this);
	// enemy name
	$dataEnemies.forEach(function(enemy){
		if (!enemy) return;
		Object.defineProperty(enemy, 'name', {
			get: function(){ return KNS_TERMS._translate('ENEMY_NAME')[enemy.id] || ''; }
		});
	}, this);

	// skill name description message2
	// item/weapon/armor name description
	// state name messages
	KNS_TERMS._changeLanguage();
}

;(function(){
//================================================
// alias ConfigManager
//================================================
ConfigManager._knsLanguageId = 0;

Object.defineProperty(ConfigManager, KNS_TERMS.__LANGUAGE_SYMBOL, {
	get: function(){ return ConfigManager._knsLanguageId; },
	set: function(value){
		ConfigManager._knsLanguageId = value || 0;
		KNS_TERMS._changeLanguage();
	},
	configurable: true
});

const _ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function(){
	const config = _ConfigManager_makeData.apply(this, arguments);
	config.knsLanguageId = this.knsLanguageId;
	return config;
};

const _ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function(config) {
	_ConfigManager_applyData.apply(this, arguments);
    this.knsLanguageId = this.knsReadId(config, KNS_TERMS.__LANGUAGE_SYMBOL);
};

ConfigManager.knsReadId = function(config, name) {
    return Number(config[name]) || 0;
};

//=========================================================
// alias TextManager
//=========================================================
TextManager.param = function(index){
	return KNS_TERMS.STATUS_PARAMS[index] || "";
}

//=========================================================
// alias Scene_Boot
//=========================================================
const _Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
	_Scene_Boot_start.call(this);
	KNS_TERMS._prepare();
};

//================================================
// alias Game_Actor
//================================================
Game_Actor.prototype.name = function(){
	return this.actor().name;
}
//=========================================================
// alias Game_Troop
//=========================================================
Game_Troop.prototype.letterTable = function() {
	return	KNS_TERMS.USE_ENGLISH_SYMBOL ?
			Game_Troop.LETTER_TABLE_HALF : Game_Troop.LETTER_TABLE_FULL;
};
})();