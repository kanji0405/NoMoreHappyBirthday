
/*
SentenceDataExtractor.js

2016/12/10 version 1.0

更新履歴
2016/12/10　公開

  利用規約
  ・商用・非商用問わず使えます。
　・改変公開可能

*/


/*:ja
 * @plugindesc ゲーム起動時にゲーム中の全メッセージをテキストファイルに書き出す
 * @author さうと
 * @help プラグインコマンドはありません
 */

(function () {
var parameters = PluginManager.parameters('SentenceDataExtractor');

var path = require('path');
//alert(window.location);

//jsonから直接抜く
var fs = require('fs');

var projectFilePath = decodeURIComponent(path.dirname(window.location.pathname.slice(1))); 

var mapinfod = fs.readFileSync(projectFilePath+'/data/MapInfos.json');
var jsonmapd = JSON.parse(mapinfod);

//マップファイルの数だけテキストを作る
for(num=1;num<jsonmapd.length;num++)
{
  var data = fs.readFileSync(projectFilePath+'/data/Map'+("00"+num).slice(-3)+'.json');

  var jsond = JSON.parse(data);
  //alert(jsond.events[5].pages[0].list[5].parameters[0]);
  var isExist40x = false;
  var dataStr='';
  //イベント総ざらい
  for(n=1;n<jsond.events.length;n++)
  {
    if(jsond.events[n]==null)
      continue;
    dataStr+='\r\n・'+jsond.events[n].name+'\r\n';
    //イベントページ総ざらい
    for(m=0;m<jsond.events[n].pages.length;m++)
    {
      dataStr+="-"+(m+1)+"ページ目"+'\r\n';
      //イベントコマンド総ざらい
      for(l=0;l<jsond.events[n].pages[m].list.length;l++)
      {
        //メッセージ表示コマンドか文章スクロールだったらだったら
        if(jsond.events[n].pages[m].list[l].code==401
        ||jsond.events[n].pages[m].list[l].code==405)
        {
          dataStr+=jsond.events[n].pages[m].list[l].parameters[0]+'\r\n';
          isExist40x=true;
        }
        //選択肢の表示だったら
        if(jsond.events[n].pages[m].list[l].code==402)
        {
          dataStr+=jsond.events[n].pages[m].list[l].parameters[1]+'\r\n';
          isExist40x=true;
        }
      }
    }
  }
  if(isExist40x)
  {
    fs.writeFileSync(projectFilePath+'/'+jsonmapd[num].name+'.txt', dataStr);
  }
}

//コモンイベントのやつ　ファイル構造が微妙に違うのでまとめられない
  var data = fs.readFileSync(projectFilePath+'/data/CommonEvents.json');

  var jsond = JSON.parse(data);
  var isExist40x = false;
  var dataStr='';
  //イベント総ざらい
  for(n=1;n<jsond.length;n++)
  {
    if(jsond[n]==null)
      continue;
    dataStr+='\r\n・'+jsond[n].name+'\r\n';
      //イベントコマンド総ざらい
      for(l=0;l<jsond[n].list.length;l++)
      {
        //メッセージ表示コマンドか文章スクロールだったら
        if(jsond[n].list[l].code==401
        ||jsond[n].list[l].code==405)
        {
          dataStr+=jsond[n].list[l].parameters[0]+'\r\n';
          isExist40x=true;
        }
        //選択肢表示だったら
        if(jsond[n].list[l].code==402)
        {
          dataStr+=jsond[n].list[l].parameters[1]+'\r\n';
          isExist40x=true;
        }
      }
  }
  if(isExist40x)
  {
    fs.writeFileSync(projectFilePath+'/CommonEvents.txt', dataStr);
  }



})();
