"use strict";
//=========================================================
// alias KNS_Pose
//=========================================================
const KNS_Pose = {
	reEventPos: /<KNS.+?pos\((.+?),\s*(.+?)\).*?>/,
	reEventMode: /<KNS.+?mode\((.+?)(?:,\s*(\w+?))?\).*?>/,
	reEventWeapon: /<KNS.+?weapon\((.+?)\).*?>/,
	reEventActor: /<KNS.+?actor\((.+?)\).*?>/,

	reKnsCharacter: /^\$\=/,

	reParts: /^[RL]/,
	reSystem: /^_/,

	partsList: [
		"LT", "LL", "LS", "LA",
		"RT", "RL", "RS", "RA",
		"BD", "WP", "_Y"
	],

	toRadian: Math.PI / 180,

	normal:{
		RA: -4,
		RS: -7,
		LA: 7,
		LS: 3,
		LT: 5,
		RT: -5,
	
		_Y: 2,
		_TIME: 15,
		_NEXT: 'normal2'
	},
	normal2:{
		RA: 6,
		RS: 1,
		LA: -1,
		LS: -1,
	
		LT: 2,
		RT: -2,
	
		_TIME: 30,
		_NEXT: ''
	},
	walk1:{
		RA: -16,
		RS: -30,
		LA: 33,
		LS: 13,
	
		LT: 11,
		LL: 21,
		RT: -17,
		RL: -24,
		WP: 0,
		_Y: 3,
		_TIME: 8,
		_NEXT: ''
	},
	walk2:{
		RA: 24,
		RS: 4,
		LA: -4,
		LS: -4,
		LT: -10,
		LL: -32,
		RT: 21,
		RL: 13,
		WP: 0,
		_Y: 0,
		_TIME: 12,
		_NEXT: ''
	},
	dash1:{
		RA: -16,
		RS: -30,
		LA: 33,
		LS: 13,
	
		LT: 11,
		LL: 21,
		RT: -17,
		RL: -24,
		BD: 4,
		WP: 0,
	
		_Y: 3,
		_TIME: 6,
		_NEXT: ''
	},
	dash2:{
		RA: 24,
		RS: 4,
		LA: -4,
		LS: -4,
		LT: -10,
		LL: -32,
		RT: 21,
		RL: 13,
		BD: 6,
		WP: 0,
	
		_Y: 0,
		_TIME: 8,
		_NEXT: ''
	},
	sit:{
		LT:99,
		LL:0,
		RT:17,
		RL:-92,
		LS:31.46,
		LA:52,
		RA:0,
		RS:0,
		WP: -20,
	
		_Y: 24,
		_TIME: 10,
		_FACE: 1,
		_NEXT: '',
	},

	pinch:{
		RA: -4,
		RS: -7,
		LA: 7,
		LS: 3,
	
		LT: 10,
		RT: -10,
		LL: 15,
		RL: -4,
		_FACE: 1,
		WP: 13,
		BD: 8,
	
		_Y: 2,
		_TIME: 15,
		_NEXT: 'pinch2'
	},
	pinch2:{
		RA: 6,
		RS: 1,
		LA: -1,
		LS: -1,
	
		LT: 14,
		RT: -4,
		LL: 14,
		RL: -4,
		_FACE: 1,
		WP: 10,
		BD: 10,
	
		_TIME: 30,
		_NEXT: 'pinch'
	},
	dead:{
		RS:140,
		RA:170,
		LS:180,
		LA:180,
		LT: 5,
		RT: -5,
		_FACE: 2,
		WP: 90,
	
		BD: 90,
		_TIME: 10,
		_NEXT: ''
	},
	
	chair1:{
		RA: 43,
		LA: 45,
		RS: -7,
		LS: 3,
		LT: 88,
		RT: 92,
		_Y: 12,
		_TIME: 15,
		_NEXT: 'chair2'
	},
	chair2:{
		RA: 45,
		LA: 43,
		RS: 1,
		LS: -1,
	
		LT: 92,
		RT: 88,
	
		_Y: 12,
		_TIME: 40,
		_NEXT: 'chair1'
	},
	deadSit:{
		RA: 43,
		LA: 45,
		RS: -7,
		LS: 3,
		LT: 88,
		RT: 92,

		_Y: 22,
		_TIME: 15,
		_FACE: 2,
		_NEXT: ''
	},

	jump:{
		LT:11,
		LL:-18,
		RT:13,
		RL:-17,
		LS:-72,
		LA:-30,
		RA:52,
		RS:34,
	
		WP: 45,
		_Y: -24,
		_TIME: 10,
		_FACE: 0,
		_NEXT: '',
	},
	
	guard:{
		LT:0,
		LL:0,
		RT:1,
		RL:0,
		LS:42,
		LA:172,
		RA:99,
		RS:-30,
	
		WP: 90,
		_TIME: 10,
		_FACE: 1,
		_NEXT: 'guard2',
	},
	
	guard2:{
		LT:1,
		LL:0,
		RT:0,
		RL:0,
		LS:40,
		LA:172,
		RA:97,
		RS:-30,
	
		WP: 92,
		_TIME: 20,
		_FACE: 1,
		_NEXT: 'guard'
	},
	
	sleep:{
		LT:6,
		LL:12,
		RT:6,
		RL:12,
		LS:0,
		LA:3,
		RA:3,
		RS:0,
	
		WP: -20,
		BD: 12,
		_TIME: 20,
		_FACE: 2,
		_NEXT: 'sleep2'
	},
	sleep2:{
		LT:6,
		LL:10,
		RT:6,
		RL:10,
		LS:0,
		LA:4,
		RA:4,
		RS:0,
	
		WP: -20,
		BD: 10,
		_TIME: 30,
		_FACE: 2,
		_NEXT: 'sleep'
	},
	
	thrust:{
		LT:44,
		LL:-73,
		RT:0,
		RL:0,
		LS:-32,
		LA:43,
		RA:49,
		RS:0,
	
		BD: -4,
		WP: 20,
		_Y: 4,
		_TIME: 6,
		_FACE: 1,
		_NEXT: 'thrust2'
	},
	
	thrust2:{
		LT:31,
		LL:9,
		RT:0,
		RL:-30,
		LS:19,
		LA:54,
		RA:-44,
		RS:-87,

		_Y: 8,
		WP: -20,
		BD: 11,
		_TIME: 10,
		_FACE: 1,
		_NEXT: ''
	},
	
	swing:{
		LT:0,
		LL:-15,
		RT:-10,
		RL:-9,
		LS:53,
		LA:205,
		RA:-62,
		RS:0,
	
		WP: 120,
		_Y: 4,
		_TIME: 9,
		_FACE: 1,
		_NEXT: 'swing2'
	},
	
	swing2:{
		LT:14,
		LL:6,
		RT:9,
		RL:-52,
		LS:-37,
		LA:-17,
		RA:36,
		RS:0,
	
		_Y: 8,
		WP: 40,
		BD: 11,
		_TIME: 10,
		_FACE: 1,
		_NEXT: ''
	},
	
	damage:{
		LT:12,
		LL:17,
		RT:22,
		RL:-53,
		LS:-47,
		LA:41,
		RA:40,
		RS:23,
	
		_Y: 8,
		WP: 40,
		BD: -7.00,
		_TIME: 10,
		_FACE: 2,
		_NEXT: ''
	},

	victory:{
		BD: 9,
		LT:10,
		LL:14,
		RT:12,
		RL:9,
		LS:-35,
		LA:0,
		RA:48,
		RS:18,
	
		_Y: 8,
		WP: 40,
		_FACE: 1,
		_TIME: 10,
		_NEXT: 'victory2'
	},

	victory2:{
		BD: -9,
		LT:0,
		LL:0,
		RT:-6,
		RL:-11,
		LS:55+360,
		LA:81+360,
		RA:81,
		RS:-41,
	
		_Y: 8,
		WP: 720,
		_FACE: 2,
		_TIME: 60,
		_NEXT: 'victory3'
	},

	victory3:{
		BD: 0,
		LT:0,
		LL:0,
		RT:38,
		RL:-109,
		LS:60+360,
		LA:173+360,
		RA:112,
		RS:-4,
	
		_Y: 8,
		WP: 780,
		_TIME: 10,
		_NEXT: 'victory3'
	},

	evade:{
		BD:8,
		LT:21,
		LL:13,
		RT:0,
		RL:-68,
		LS:-22,
		LA:18,
		RA:48,
		RS:0,
	
		_Y: 8,
		WP: 780,
		_TIME: 10,
		_NEXT: ''
	},

	spell:{
		BD:8,
		LT:21,
		LL:13,
		RT:0,
		RL:-68,
		LS:-22,
		LA:18,
		RA:48,
		RS:0,
	
		_Y: 8,
		WP: 780,
		_TIME: 10,
		_NEXT: ''
	},

	item:{
		BD:8,
		LT:-4,
		LL:-8,
		RT:-4,
		RL:-8,
		LS:48,
		LA:134,
		RA:146,
		RS:2,
	
		_Y: 8,
		WP: 780,
		_TIME: 10,
		_NEXT: ''
	},

	chant:{
		RT:1,
		LS:48,
		LA:134,
		RA:146,
		RS:1,
	
		_Y: 8,
		WP: 45,
		_FACE: 2,
		_TIME: 10,
		_NEXT: 'chant2'
	},
	chant2:{
		LT:1,
		LS:49,
		LA:136,
		RA:146,
		RS:2,
	
		_Y: 8,
		WP: 50,
		_FACE: 2,
		_TIME: 15,
		_NEXT: 'chant'
	},

	skill:{
		RT:1,
		LS:48,
		LA:134,
		RA:146,
		RS:1,
	
		_Y: 8,
		WP: 45,
		_TIME: 30,
		_NEXT: 'skill2'
	},
	skill2:{
		LT:1,
		LS:49,
		LA:136,
		RA:146,
		RS:2,
	
		_Y: 8,
		WP: 50,
		_TIME: 30,
		_NEXT: 'skill'
	},

	badState:{
		RA: -4,
		RS: -7,
		LA: 7,
		LS: 3,
	
		BD: 8,
		LT: 10,
		RT: -10,
		LL: 15,
		RL: -4,
		_FACE: 1,
		WP: 13,
	
		_Y: 2,
		_FACE: 1,
		_TIME: 15,
		_NEXT: 'badState2'
	},
	badState2:{
		RA: 6,
		RS: 1,
		LA: -1,
		LS: -1,
	
		LT: 14,
		RT: -4,
		LL: 14,
		RL: -4,
		_FACE: 1,
		WP: 10,
		BD: 10,
	
		_FACE: 1,
		_TIME: 30,
		_NEXT: 'badState'
	},
	missile:{
		LT:0,
		LL:-15,
		RT:-10,
		RL:-9,
		LS:53,
		LA:205,
		RA:-62,
		RS:0,
	
		WP: 120,
		_Y: 4,
		_TIME: 6,
		_FACE: 1,
		_NEXT: 'missile2'
	},
	
	missile2:{
		LT:14,
		LL:6,
		RT:9,
		RL:-52,
		LS:-37,
		LA:-17,
		RA:36,
		RS:0,
	
		_Y: 8,
		WP: 40,
		BD: 11,
		_TIME: 24,
		_FACE: 1,
		_NEXT: ''
	},

};
/*
	LT:,
	LL:,
	RT:,
	RL:,
	LS:,
	LA:,
	RA:,
	RS:,
*/