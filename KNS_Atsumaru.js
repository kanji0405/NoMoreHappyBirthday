KNS_Atsumaru = {};

// アツマール環境であるか
KNS_Atsumaru.isAtsumaru = function(){
	return !!window.RPGAtsumaru;
}
// IDのスコアボードを表示
KNS_Atsumaru.showScoreBoard = function(stageId){
	if (!this.isAtsumaru()) return;
	try{
		window.RPGAtsumaru.scoreboards.display(stageId)
	}catch(e){
		console.log(e);
	}
}

// IDのスコアボードにデータを保存
KNS_Atsumaru.saveScoreBoard = function(stageId, value){
	if (!this.isAtsumaru()) return;
	try{
		window.RPGAtsumaru.scoreboards.setRecord(stageId, value);
	}catch(e){
		console.log(e);
	}
}

// ポップアップを設定
KNS_Atsumaru.atsumaruPopup = function(){
	if (!this.isAtsumaru()) return;
	try{
		window.RPGAtsumaru.popups.setThanksSettings({
			autoThanks: false,
			thanksText: "Thanks for playing!",
			thanksImage: "icon/icon.png",
			clapThanksText: "Thanks for cheering!",
			clapThanksImage: "icon/icon.png",
			giftThanksText: "Thanks for your gift!",
			giftThanksImage: "icon/icon.png"
		});
	}catch(e){
		console.log(e);
	}
};
(function(){
	const _oldOnload = window.onload;
	window.onload = function(){
		_oldOnload && _oldOnload.call(this);
		KNS_Atsumaru.atsumaruPopup();
	}
})();
