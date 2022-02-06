(function(){
//============================================
// alias Game_Battler
//============================================
Game_Battler.KNS_MAX_CTB_GAUGE = 5000;
Object.defineProperties(Game_Battler.prototype, {
	ctbGauge: {
		get: function(){ return this._ctbGauge || 0; },
		set: function(n){
			this._ctbGauge = Math.max(
				Math.floor(n), Game_Battler.KNS_MAX_CTB_GAUGE
			);
		},
		configurable: true
	},
});

const _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
Game_Battler.prototype.onBattleStart = function() {
	_Game_Battler_onBattleStart.call(this);
	this.ctbGauge = 0;
};

const _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
Game_Battler.prototype.onBattleEnd = function() {
	_Game_Battler_onBattleEnd.call(this);
	this.ctbGauge = 0;
};

const _Game_Battler_die = Game_Battler.prototype.die;
Game_Battler.prototype.die = function() {
	_Game_Battler_die.call(this);
	this.ctbGauge = 0;
};

/*
Game_Actor.prototype.makeActions = function() {
    Game_Battler.prototype.makeActions.call(this);
    if (this.numActions() > 0) {
        this.setActionState('undecided');
    } else {
        this.setActionState('waiting');
    }
    if (this.isAutoBattle()) {
        this.makeAutoBattleActions();
    } else if (this.isConfused()) {
        this.makeConfusionActions();
    }
};
*/

/*
逃走時CTB0
先制時アクターマックス
不意打ち時アクター０
死亡時CTB0

CTBアイコン

module BattleManager
  def self.actor_index=(index)
    @actor_index = index
  end
  def self.refresh_first_turn
    if @surprise
      $game_troop.alive_members.each {|actor| actor.set_max_on_ctb }
    elsif @preemptive
      $game_party.without_members_data.each {|actor| actor.set_max_on_ctb }
    end
  end
end

class Scene_Battle
  alias ctb_start start unless $!
  def start
    @turning_flag = false
    @ctb_active_members = []
    ctb_start
    create_ctb_gauge
  end
  def create_ctb_gauge
    @ctb_gauge_sprite = Spriteset_CtbGauge.new(@help_window)
    GC.start
  end

  alias ctrb_update_basic update_basic unless $!
  def update_basic
    ctrb_update_basic
    @ctb_gauge_sprite.update
  end

  alias gauge_ctb_terminate terminate unless $!
  def terminate
    @ctb_gauge_sprite.dispose
    gauge_ctb_terminate
  end

  alias ctb_process_action_end process_action_end unless $!
  def process_action_end
    @subject.ctb_gauge = 0 if @subject.ctb_gauge == -1
    ctb_process_action_end
  end
  #--------------------------------------------------------------------------
  # ● ターン終了
  #--------------------------------------------------------------------------
  def turn_end
    @turning_flag = false
    refresh_status
    BattleManager.turn_end
    process_event
  end

  #--------------------------------------------------------------------------
  # ● 戦闘開始
  #--------------------------------------------------------------------------
  def battle_start
    BattleManager.battle_start
    process_event
  end
  
  def stuck_battler(actor)
    @ctb_active_members << actor
  end
  #--------------------------------------------------------------------------
  # ● パーティコマンド選択の開始
  #--------------------------------------------------------------------------
  def start_party_command_selection
    @actor_command_window.close
    @party_command_window.setup
  end
  def ctb_not_move?
    return $game_troop.alive_members.size.zero?
  end
  def start_battler_turn(actor)
    return if ctb_not_move?
    if actor.actor?
      BattleManager.actor_index = actor.index
      if !actor.movable?
        actor.ctb_gauge = 0
        turn_start
        actor_turn_end(actor)
      elsif actor.confusion? || actor.auto_battle?
        actor.make_actions
        turn_start
        actor_turn_end(actor)
        roll_back
      else
        actor_turn_end(actor)
        if actor.movable?
          actor.make_actions
          Audio.se_play("Audio/SE/Sword1")
          @help_window.show_mode = true
          start_actor_command_selection
          set_commands(22)
          kns_update_basic
          make_commands_on_circle(@actor_command_window.index, 16)
          kns_update_basic
          make_commands_on_circle(@actor_command_window.index, 10)
          kns_update_basic
          make_commands_on_circle(@actor_command_window.index, 4)
          kns_update_basic
          make_commands_on_circle(@actor_command_window.index, 0)
        else
          actor.ctb_gauge = 0
          turn_start
          roll_back
        end
      end
    else
      actor.turn_count += 1

      if !actor.movable?
        actor.ctb_gauge = 0
        turn_start
        actor_turn_end(actor)
      elsif actor.confusion?
        actor.make_actions
        turn_start
        actor_turn_end(actor)
      else
        if actor.movable?
          actor_turn_end(actor)
          actor.make_actions
          turn_start
        else
          actor_turn_end(actor)
        end
      end

      
    end
  end
  def actor_turn_end(actor)
    actor.on_turn_end
    @log_window.display_auto_affected_status(actor)
    @log_window.display_current_state(actor)
    @log_window.clear
    refresh_status
  end
  #--------------------------------------------------------------------------
  # ● コマンド［戦う］
  #--------------------------------------------------------------------------
  def command_fight
    start_actor_command_selection
  end
  def next_command
    hide_command
    turn_start
  end
  alias ctb_update update unless $!
  def update
    ctb_update
    a = false
    unless @turning_flag
      all_battle_members.each do |member|
        next if member.is_empty_actor?
        next unless member.exist?
        if member.dead?
          
        elsif member.ctb_gauge >= member.speed_max
          member.ctb_gauge = -1
          stuck_battler(member)
          a = true
        elsif member.ctb_gauge == -1
        else
          member.ctb_gauge += member.agi + 5 + rand(5) - 2
        end
      end
      if @ctb_active_members.size.nonzero?
        item = @ctb_active_members.shift
        if item.enemy? || $game_party.battle_members.include?(item)
          start_battler_turn(item)
          @turning_flag = true
        end
      end
      refresh_status if a
    end
    
  end
  def remove_ctb_character(actor)
    @ctb_active_members.delete(actor)
  end
*/

//============================================
// alias Scene_Battle
//============================================
Scene_Battle.prototype.update = function() {
	var active = this.isActive();
	$gameTimer.update(active);
	$gameScreen.update();
	this.updateStatusWindow();
	this.updateWindowPositions();
	if (active && !this.isBusy()) {
		this.updateBattleProcess();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Battle.prototype.updateBattleProcess = function() {
	if (!this.isAnyInputWindowActive() || BattleManager.isAborting() ||
			BattleManager.isBattleEnd()) {
		BattleManager.update();
		this.changeInputWindow();
	}
};

Scene_Battle.prototype.isAnyInputWindowActive = function() {
	return (this._partyCommandWindow.active ||
			this._actorCommandWindow.active ||
			this._skillWindow.active ||
			this._itemWindow.active ||
			this._actorWindow.active ||
			this._enemyWindow.active);
};

Scene_Battle.prototype.changeInputWindow = function() {
	if (BattleManager.isInputting()) {
		if (BattleManager.actor()) {
			this.startActorCommandSelection();
		} else {
			this.startPartyCommandSelection();
		}
	} else {
		this.endCommandSelection();
	}
};

Scene_Battle.prototype.stop = function() {
	Scene_Base.prototype.stop.call(this);
	if (this.needsSlowFadeOut()) {
		this.startFadeOut(this.slowFadeSpeed(), false);
	} else {
		this.startFadeOut(this.fadeSpeed(), false);
	}
	this._statusWindow.close();
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
};

Scene_Battle.prototype.terminate = function() {
	Scene_Base.prototype.terminate.call(this);
	$gameParty.onBattleEnd();
	$gameTroop.onBattleEnd();
	AudioManager.stopMe();

	ImageManager.clearRequest();
};

Scene_Battle.prototype.needsSlowFadeOut = function() {
	return (SceneManager.isNextScene(Scene_Title) ||
			SceneManager.isNextScene(Scene_Gameover));
};

Scene_Battle.prototype.updateStatusWindow = function() {
	if ($gameMessage.isBusy()) {
		this._statusWindow.close();
		this._partyCommandWindow.close();
		this._actorCommandWindow.close();
	} else if (this.isActive() && !this._messageWindow.isClosing()) {
		this._statusWindow.open();
	}
};

Scene_Battle.prototype.updateWindowPositions = function() {
	var statusX = 0;
	if (BattleManager.isInputting()) {
		statusX = this._partyCommandWindow.width;
	} else {
		statusX = this._partyCommandWindow.width / 2;
	}
	if (this._statusWindow.x < statusX) {
		this._statusWindow.x += 16;
		if (this._statusWindow.x > statusX) {
			this._statusWindow.x = statusX;
		}
	}
	if (this._statusWindow.x > statusX) {
		this._statusWindow.x -= 16;
		if (this._statusWindow.x < statusX) {
			this._statusWindow.x = statusX;
		}
	}
};

Scene_Battle.prototype.startPartyCommandSelection = function() {
	this.refreshStatus();
	this._statusWindow.deselect();
	this._statusWindow.open();
	this._actorCommandWindow.close();
	this._partyCommandWindow.setup();
};

Scene_Battle.prototype.startActorCommandSelection = function() {
	this._statusWindow.select(BattleManager.actor().index());
	this._partyCommandWindow.close();
	this._actorCommandWindow.setup(BattleManager.actor());
};

Scene_Battle.prototype.selectPreviousCommand = function() {
	BattleManager.selectPreviousCommand();
	this.changeInputWindow();
};

Scene_Battle.prototype.selectActorSelection = function() {
	this._actorWindow.refresh();
	this._actorWindow.show();
	this._actorWindow.activate();
};

Scene_Battle.prototype.onActorOk = function() {
	var action = BattleManager.inputtingAction();
	action.setTarget(this._actorWindow.index());
	this._actorWindow.hide();
	this._skillWindow.hide();
	this._itemWindow.hide();
	this.selectNextCommand();
};

Scene_Battle.prototype.onActorCancel = function() {
	this._actorWindow.hide();
	switch (this._actorCommandWindow.currentSymbol()) {
	case 'skill':
		this._skillWindow.show();
		this._skillWindow.activate();
		break;
	case 'item':
		this._itemWindow.show();
		this._itemWindow.activate();
		break;
	}
};

Scene_Battle.prototype.selectEnemySelection = function() {
	this._enemyWindow.refresh();
	this._enemyWindow.show();
	this._enemyWindow.select(0);
	this._enemyWindow.activate();
};

Scene_Battle.prototype.onEnemyOk = function() {
	var action = BattleManager.inputtingAction();
	action.setTarget(this._enemyWindow.enemyIndex());
	this._enemyWindow.hide();
	this._skillWindow.hide();
	this._itemWindow.hide();
	this.selectNextCommand();
};

Scene_Battle.prototype.onEnemyCancel = function() {
	this._enemyWindow.hide();
	switch (this._actorCommandWindow.currentSymbol()) {
	case 'attack':
		this._actorCommandWindow.activate();
		break;
	case 'skill':
		this._skillWindow.show();
		this._skillWindow.activate();
		break;
	case 'item':
		this._itemWindow.show();
		this._itemWindow.activate();
		break;
	}
};

Scene_Battle.prototype.onSkillOk = function() {
	var skill = this._skillWindow.item();
	var action = BattleManager.inputtingAction();
	action.setSkill(skill.id);
	BattleManager.actor().setLastBattleSkill(skill);
	this.onSelectAction();
};

Scene_Battle.prototype.onSkillCancel = function() {
	this._skillWindow.hide();
	this._actorCommandWindow.activate();
};

Scene_Battle.prototype.onItemOk = function() {
	var item = this._itemWindow.item();
	var action = BattleManager.inputtingAction();
	action.setItem(item.id);
	$gameParty.setLastItem(item);
	this.onSelectAction();
};

Scene_Battle.prototype.onItemCancel = function() {
	this._itemWindow.hide();
	this._actorCommandWindow.activate();
};

Scene_Battle.prototype.onSelectAction = function() {
	var action = BattleManager.inputtingAction();
	this._skillWindow.hide();
	this._itemWindow.hide();
	if (!action.needsSelection()) {
		this.selectNextCommand();
	} else if (action.isForOpponent()) {
		this.selectEnemySelection();
	} else {
		this.selectActorSelection();
	}
};

Scene_Battle.prototype.endCommandSelection = function() {
	this._partyCommandWindow.close();
	this._actorCommandWindow.close();
	this._statusWindow.deselect();
};


})