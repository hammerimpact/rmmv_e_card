//-----------------------------------------------------------------------------
// ECardGameManager
//
// The static class that manages the ECardGame.

function ECardGameManager() {
    throw new Error('This is a static class');
}
//===============================
// CONST, Enum
//===============================
ECardGameManager.EnumAssetType = {
    VARIABLE : 'variable',
    GOLD : 'gold',
    ITEM : 'item',
};

ECardGameManager.EnumFailedReasonStart = {
    NONE : 0,
    INVALID_PLAYER_ASSET_AMOUNT : 1,
    INVALID_DEALER_ASSET_AMOUNT : 2,
    INVALID_MAX_HAND_COUNT : 3,
    INVALID_SPECIAL_CARD_COUNT : 4,
    INVALID_ROUND_COUNT_IN_ONE_GAME : 5,
};

ECardGameManager.EnumStepType = {
    NONE                : 'none',
    INIT                : 'init',
    READY_GAME          : 'ready_game',
    READY_ROUND         : 'ready_round',
    BETTING             : 'betting',
    READY_TURN          : 'ready_turn',
    SELECT_CARD         : 'select_card',
    SELECT_DEALER_CARD  : 'select_dealer_card',
    BATTLE              : 'battle',
    RESULT_TURN         : 'result_turn',
    RESULT_ROUND        : 'result_round',
    SELECT_CONTINUE     : 'select_continue',
    QUIT                : 'quit',
};

ECardGameManager.EnumCardType = {
    NONE                    : -1,
    SLAVE                   : 0,
    CITIZEN                 : 1,
    EMPEROR                 : 2,
};

ECardGameManager.EnumResultType = {
    LOSE                    : 0,
    DRAW                    : 1,
    WIN                     : 2,
};

ECardGameManager.EnumUpdaterEventID = {
    NONE             : 'updater_none',
    CHANGED_STEP     : 'updater_changed_step',
};

//===============================
// DATA
//===============================
ECardGameManager.CardData =
[
    // SLAVE CITIZEN EMPEROR
    // 0 : lose / 1 : draw / 2 : win

    // SLAVE
    { key : 0 , data : [ECardGameManager.EnumResultType.DRAW,   ECardGameManager.EnumResultType.LOSE,   ECardGameManager.EnumResultType.WIN ]  },
    // CITIZEN
    { key : 1 , data : [ECardGameManager.EnumResultType.WIN,    ECardGameManager.EnumResultType.DRAW,   ECardGameManager.EnumResultType.LOSE ] },
    // EMPEROR
    { key : 2 , data : [ECardGameManager.EnumResultType.LOSE,   ECardGameManager.EnumResultType.WIN,    ECardGameManager.EnumResultType.DRAW ] },
];
//===============================
// Input
//===============================
ECardGameManager.playerAssetType = ECardGameManager.EnumAssetType.VARIABLE;
ECardGameManager.playerAssetParam = 0;
ECardGameManager.SetPlayerAssetData  = function (playerAssetType, playerAssetParam)
{
    ECardGameManager.playerAssetType = playerAssetType;
    ECardGameManager.playerAssetParam = playerAssetParam;
    return ECardGameManager;
};

ECardGameManager.dealerAssetParam = 0;
ECardGameManager.SetDealerAssetData  = function (dealerAssetParam)
{
    ECardGameManager.dealerAssetParam = dealerAssetParam;
    return ECardGameManager;
};

// About Rule

// PlayerEmperorRoundFlag : if (round % 2 == PLAYER_EMPEROR_ROUND_FLAG) ==> player is emperor, dealer is slave
ECardGameManager.PlayerEmperorRoundFlag = 1;
ECardGameManager.SetPlayerEmperorRoundFlag = function(value) { ECardGameManager.PlayerEmperorRoundFlag = value; return ECardGameManager;}

// MaxHandCount : max count of player/dealer hand
ECardGameManager.MaxHandCount = 5;
ECardGameManager.SetMaxHandCount = function(value) { ECardGameManager.MaxHandCount = value; return ECardGameManager;}

// SpecialCardCount : special card (emperor/slave) count in hand.
ECardGameManager.SpecialCardCount = 1;
ECardGameManager.SetSpecialCardCount = function(value) { ECardGameManager.SpecialCardCount = value; return ECardGameManager;}

// ROUND_COUNT_IN_ONE_GAME : round count in 1 game.
ECardGameManager.RoundCountInGame = 3;
ECardGameManager.SetRoundCountInGame = function(value) { ECardGameManager.RoundCountInGame = value; return ECardGameManager;}

// SLAVE_WIN_BONUS_RATE : If win with slave card, gain asset amount is (betting amount * this rate)
ECardGameManager.SlaveWinBonusRate = 5;
ECardGameManager.SetSlaveWinBonusRate = function(value) { ECardGameManager.SlaveWinBonusRate = value; return ECardGameManager;}

// Set Default Rule Setting
ECardGameManager.SetDefaultRule = function()
{
    ECardGameManager.PlayerEmperorRoundFlag = 1;
    ECardGameManager.MaxHandCount = 5;
    ECardGameManager.SpecialCardCount = 1;
    ECardGameManager.RoundCountInGame = 3;
};

//===============================
// Member Variables
//===============================
// Asset Amount
ECardGameManager.playerAssetAmount = 0;
ECardGameManager.dealerAssetAmount = 0;

ECardGameManager.step = null;
ECardGameManager.prev_step_type = ECardGameManager.EnumStepType.NONE;

ECardGameManager.gameCount = 0;
ECardGameManager.roundCount = 0;
ECardGameManager.turnCount = 0;
ECardGameManager.turnBattleResult = ECardGameManager.EnumResultType.LOSE;

ECardGameManager.roundBettingAssetAmount = 0;
ECardGameManager.playerHands = [];
ECardGameManager.dealerHands = [];
ECardGameManager.playerSelectCard = ECardGameManager.EnumCardType.NONE;
ECardGameManager.dealerSelectCard = ECardGameManager.EnumCardType.NONE;

function ObserverEventData () {};
ObserverEventData.prototype.id = '';
ObserverEventData.prototype.observer = null;
ObserverEventData.prototype.eventIDs = [];

ECardGameManager.observerEvents = [];
ECardGameManager.updaterEvents = [];

ECardGameManager.InitData = function()
{
    ECardGameManager._init_player_asset_amount_();
    ECardGameManager._init_dealer_asset_amount_();
    ECardGameManager._init_playing_data_();
};

ECardGameManager._init_player_asset_amount_ = function()
{
    var retVal = 0;

    switch (ECardGameManager.playerAssetType)
    {
        case ECardGameManager.EnumAssetType.VARIABLE:
            retVal = $gameVariables.value(ECardGameManager.playerAssetParam);
            break;

        case ECardGameManager.EnumAssetType.GOLD:
            retVal = $gameParty.gold();
            break;

        case ECardGameManager.EnumAssetType.ITEM:
            if (ECardGameManager.playerAssetParam >= 0 && ECardGameManager.playerAssetParam < $dataItems.length)
            {
                var item = $dataItems[ECardGameManager.playerAssetParam];
                if ($gameParty.hasItem(item, false))
                    retVal =  $gameParty.numItems(item);
            }
            break;
    }

    ECardGameManager.playerAssetAmount = retVal;
};

ECardGameManager._init_dealer_asset_amount_ = function()
{
    ECardGameManager.dealerAssetAmount = $gameVariables.value(ECardGameManager.dealerAssetParam) || -1;
};

ECardGameManager._init_playing_data_ = function()
{
    ECardGameManager.step = null;
    ECardGameManager.prev_step_type = ECardGameManager.EnumStepType.NONE;

    ECardGameManager.gameCount = 0;
    ECardGameManager.roundCount = 0;
    ECardGameManager.turnCount = 0;
    ECardGameManager.turnBattleResult = ECardGameManager.EnumResultType.LOSE;

    ECardGameManager.roundBettingAssetAmount = 0;
    ECardGameManager.playerHands = [];
    ECardGameManager.dealerHands = [];
    ECardGameManager.playerSelectCard = ECardGameManager.EnumCardType.NONE;
    ECardGameManager.dealerSelectCard = ECardGameManager.EnumCardType.NONE;
};

ECardGameManager.IsVerifyStart = function()
{
    if (ECardGameManager.playerAssetAmount <= 0)
        return ECardGameManager.EnumFailedReasonStart.INVALID_PLAYER_ASSET_AMOUNT;

    if (ECardGameManager.dealerAssetAmount <= 0)
        return ECardGameManager.EnumFailedReasonStart.INVALID_DEALER_ASSET_AMOUNT;

    // Check Const Verify
    if (ECardGameManager.MaxHandCount <= 1)
        return ECardGameManager.EnumFailedReasonStart.INVALID_MAX_HAND_COUNT;

    if (ECardGameManager.SpecialCardCount <= 0)
        return ECardGameManager.EnumFailedReasonStart.INVALID_SPECIAL_CARD_COUNT;

    if (ECardGameManager.RoundCountInGame <= 0)
        return ECardGameManager.EnumFailedReasonStart.INVALID_ROUND_COUNT_IN_ONE_GAME;

    return ECardGameManager.EnumFailedReasonStart.NONE;
};

ECardGameManager.IsPlayerEmperorGame = function()
{
    return (ECardGameManager.gameCount % 2 ==ECardGameManager.PlayerEmperorRoundFlag);
};

ECardGameManager.AddObserverEvent = function(observerID, observerCallback, observeEventIDs)
{
    if (observeEventIDs.constructor != Array)
        return;

    var nIndex = -1;
    for (var i = 0; i < ECardGameManager.observerEvents.length; ++i)
    {
        if (ECardGameManager.observerEvents[i].id != observerID)
            continue;

        break;
    }

    if (nIndex < 0)
    {
        var data = new ObserverEventData();
        data.id = observerID;
        data.observer = observerCallback;
        data.eventIDs = [];
        nIndex = ECardGameManager.observerEvents.push(data) - 1; // return value is new length.
    }

    if (nIndex < 0)
        return; // push failed

    for (var i = 0; i < observeEventIDs.length; ++i)
        ECardGameManager.observerEvents[nIndex].eventIDs.push(observeEventIDs[i]);
};

ECardGameManager.RemoveObserverEvent = function(observerID)
{
    var nIndex = ECardGameManager.observerEvents.findIndex((data)=>data.id == observerID);
    if (nIndex != -1)
        ECardGameManager.observerEvents.splice(nIndex, 1);
};

ECardGameManager.AddUpdaterEventID = function(eventID)
{
    if (ECardGameManager.updaterEvents.find((id)=>id == eventID) == undefined)
        ECardGameManager.updaterEvents.push(eventID);
};

ECardGameManager.observerUpdaterCache = [];
ECardGameManager.ExecUpdaterEvent = function()
{
    // Clear Cache
    ECardGameManager.observerUpdaterCache = [];

    // Find Target observer
    for (var i = 0; i < ECardGameManager.observerEvents.length; ++i)
    {
        for (var j = 0; j < ECardGameManager.observerEvents[i].eventIDs.length; ++j)
        {
            if (ECardGameManager.updaterEvents.find((eventID)=> eventID == ECardGameManager.observerEvents[i].eventIDs[j]) != undefined){
                ECardGameManager.observerUpdaterCache.push(ECardGameManager.observerEvents[i].observer);
                break;
            }
        }
    }

    // Exec
    for (var i = 0; i < ECardGameManager.observerUpdaterCache.length; ++i)
    {
        if (ECardGameManager.observerUpdaterCache[i] != null)
            ECardGameManager.observerUpdaterCache[i].call(ECardGameManager.observerEvents[i]);
    }

    // Clear UpdaterEvent
    ECardGameManager.updaterEvents = [];
};

ECardGameManager.ConsoleDebugState = function()
{
    console.log("===================================");
    console.log("playerAssetAmount : " + ECardGameManager.playerAssetAmount);
    console.log("dealerAssetAmount : " + ECardGameManager.dealerAssetAmount);

    console.log(ECardGameManager.step);
    console.log(ECardGameManager.prev_step_type);

    console.log("gameCount : " + ECardGameManager.gameCount);
    console.log("roundCount : " + ECardGameManager.roundCount);
    console.log("turnCount : " + ECardGameManager.turnCount);
    console.log("turnBattleResult : " + ECardGameManager.turnBattleResult);

    console.log("roundBettingAssetAmount : " + ECardGameManager.roundBettingAssetAmount);
    console.log("playerHands : " + ECardGameManager.playerHands);
    console.log("dealerHands : " + ECardGameManager.dealerHands);
    console.log("playerSelectCard : " + ECardGameManager.playerSelectCard);
    console.log("dealerSelectCard : " + ECardGameManager.dealerSelectCard);
    console.log("===================================");
};
//===============================
// SetResult
//===============================
ECardGameManager.SetResult = function()
{
    ECardGameManager._set_result_player_();
    ECardGameManager._set_result_dealer_();
};

ECardGameManager._set_result_player_ = function()
{
    switch (ECardGameManager.playerAssetType)
    {
        case ECardGameManager.EnumAssetType.VARIABLE:
            $gameVariables.setValue(ECardGameManager.playerAssetParam, ECardGameManager.playerAssetAmount);
            break;

        case ECardGameManager.EnumAssetType.GOLD:
            $gameParty.gainGold(-$gameParty.maxGold); // Init to Zero
            $gameParty.gainGold(ECardGameManager.playerAssetAmount);
            break;

        case ECardGameManager.EnumAssetType.ITEM:
            $gameParty.gainItem(-$gameParty.maxItems(ECardGameManager.playerAssetParam), ECardGameManager.playerAssetAmount, false);
            break;
    }
};

ECardGameManager._set_result_dealer_ = function()
{
    $gameVariables.setValue(ECardGameManager.dealerAssetParam, ECardGameManager.dealerAssetAmount);
};

//===============================
// Manage Game
//===============================
ECardGameManager.SetStart = function()
{
    // Change Step
    ECardGameManager.step = ECardGameManager.CreateGameStep(ECardGameManager.EnumStepType.INIT);
};

ECardGameManager.UpdateGame = function()
{
    // Update Step
    if (ECardGameManager.step != null)
    {
        ECardGameManager.step.Update();

        if (ECardGameManager.step.isConfirmToContinue)
        {
            var eNextType = ECardGameManager.step.Next();
            if (eNextType != ECardGameManager.EnumStepType.NONE)
            {
                // Save Prev Step Type
                ECardGameManager.prev_step_type = ECardGameManager.step.TYPE;

                // Change Step
                ECardGameManager.step = ECardGameManager.CreateGameStep(eNextType);

                // Add Updater Event
                ECardGameManager.AddUpdaterEventID(ECardGameManager.EnumUpdaterEventID.CHANGED_STEP);
            }
        }
    }
};

ECardGameManager.SetContinue = function(isContinue)
{
    if (ECardGameManager.step == null || ECardGameManager.step.TYPE != ECardGameManager.EnumStepType.SELECT_CONTINUE)
        return;

    ECardGameManager.step.SetContinueData(isContinue);
};

ECardGameManager.SetBettingAssetAmount = function(assetValue)
{
    if (ECardGameManager.step == null || ECardGameManager.step.TYPE != ECardGameManager.EnumStepType.BETTING)
        return;

    if (assetValue <= 0 || assetValue > ECardGameManager.playerAssetAmount || assetValue > ECardGameManager.dealerAssetAmount)
        return;

    ECardGameManager.roundBettingAssetAmount = assetValue;
};

ECardGameManager.SelectPlayerCard = function(index)
{
    if (ECardGameManager.step == null || ECardGameManager.step.TYPE != ECardGameManager.EnumStepType.SELECT_CARD)
        return;

    if (index < 0 || index >= ECardGameManager.playerHands.length)
        return;

    // Set Player Card Select
    ECardGameManager.playerSelectCard = ECardGameManager.playerHands[index];

    // Remove from hand
    ECardGameManager.playerHands.splice(index, 1);
};

//===============================
// Step class
//===============================
ECardGameManager.CreateGameStep = function(eStepType)
{
    var retVal = new ECardGameStep();
    retVal.TYPE = eStepType;
    retVal.isConfirmToContinue = false;
    retVal.Init();
    return retVal;
};

function ECardGameStep ()
{

};

// Global Member Variables
ECardGameStep.prototype.TYPE = ECardGameManager.EnumStepType.NONE;
ECardGameStep.prototype.isInit = false;
ECardGameStep.prototype.isConfirmToContinue = false;

ECardGameStep.prototype.Init = function()
{
    if (this.isInit)
        return;

    this.isInit = true;

    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.INIT:
            this._init_INIT_();
            break;

        case ECardGameManager.EnumStepType.READY_GAME:
            this._init_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            this._init_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            this._init_BETTING_();
            break;

        case ECardGameManager.EnumStepType.READY_TURN:
            this._init_READY_TURN_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            this._init_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.SELECT_DEALER_CARD:
            this._init_SELECT_DEALER_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            this._init_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_TURN:
            this._init_RESULT_TURN_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            this._init_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            this._init_SELECT_CONTINUE_();
            break;

        case ECardGameManager.EnumStepType.QUIT:
            this._init_QUIT_();
            break;

        default:
            break;
    }
};

ECardGameStep.prototype.Update = function()
{
    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.INIT:
            this._update_INIT_();
            break;

        case ECardGameManager.EnumStepType.READY_GAME:
            this._update_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            this._update_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            this._update_BETTING_();
            break;

        case ECardGameManager.EnumStepType.READY_TURN:
            this._update_READY_TURN_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            this._update_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.SELECT_DEALER_CARD:
            this._update_SELECT_DEALER_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            this._update_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_TURN:
            this._update_RESULT_TURN_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            this._update_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            this._update_SELECT_CONTINUE_();
            break;

        case ECardGameManager.EnumStepType.QUIT:
            this._update_QUIT_();
            break;

        default:
            break;
    }
};

ECardGameStep.prototype.Next = function()
{
    var retVal = ECardGameManager.EnumStepType.NONE;

    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.INIT:
            retVal = this._next_INIT_();
            break;

        case ECardGameManager.EnumStepType.READY_GAME:
            retVal = this._next_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            retVal = this._next_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            retVal = this._next_BETTING_();
            break;

        case ECardGameManager.EnumStepType.READY_TURN:
            retVal = this._next_READY_TURN_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            retVal = this._next_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.SELECT_DEALER_CARD:
            retVal = this._next_SELECT_DEALER_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            retVal = this._next_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_TURN:
            retVal = this._next_RESULT_TURN_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            retVal = this._next_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            retVal = this._next_SELECT_CONTINUE_();
            break;

        case ECardGameManager.EnumStepType.QUIT:
            retVal = this._next_QUIT_();
            break;

        default:
            break;
    }

    return retVal;
};

// Step_INIT
ECardGameStep.prototype._init_INIT_ = function()
{
    // init in-game varaibles

    ECardGameManager.gameCount = 0;
    ECardGameManager.roundCount = 0;
    ECardGameManager.turnCount = 0;
    ECardGameManager.turnBattleResult = ECardGameManager.EnumResultType.LOSE;

    ECardGameManager.roundBettingAssetAmount = 0;
    ECardGameManager.playerHands = [];
    ECardGameManager.dealerHands = [];
    ECardGameManager.playerSelectCard = ECardGameManager.EnumCardType.NONE;
    ECardGameManager.dealerSelectCard = ECardGameManager.EnumCardType.NONE;

    this.isConfirmToContinue = true;
};
ECardGameStep.prototype._update_INIT_ = function()
{

};
ECardGameStep.prototype._next_INIT_ = function()
{
    return ECardGameManager.EnumStepType.READY_GAME;
};

// Step_READY_GAME
ECardGameStep.prototype._init_READY_GAME_ = function()
{
    ECardGameManager.gameCount++;
    ECardGameManager.roundCount = 0;

    this.isConfirmToContinue = true;
};
ECardGameStep.prototype._update_READY_GAME_ = function()
{

};
ECardGameStep.prototype._next_READY_GAME_ = function()
{
    return ECardGameManager.EnumStepType.READY_ROUND;
};

// Step_READY_ROUND
ECardGameStep.prototype._init_READY_ROUND_ = function()
{
    ECardGameManager.roundCount++;
    ECardGameManager.turnCount  = 0;

    ECardGameManager.playerHands = [];
    ECardGameManager.dealerHands = [];

    // Draw Special Card
    for (var i = 0; i < ECardGameManager.SpecialCardCount; ++i)
    {
        ECardGameManager.playerHands.push(ECardGameManager.IsPlayerEmperorGame() ? ECardGameManager.EnumCardType.EMPEROR : ECardGameManager.EnumCardType.SLAVE);
        ECardGameManager.dealerHands.push(ECardGameManager.IsPlayerEmperorGame() ? ECardGameManager.EnumCardType.SLAVE : ECardGameManager.EnumCardType.EMPEROR);
    }

    // Draw Citizen Card
    var CardCount = ECardGameManager.MaxHandCount - ECardGameManager.SpecialCardCount;
    CardCount = Math.max(CardCount, 1); // If CardCount is zero, game is not valid.

    for (var i = 0; i < CardCount; ++i) {
        ECardGameManager.playerHands.push(ECardGameManager.EnumCardType.CITIZEN);
        ECardGameManager.dealerHands.push(ECardGameManager.EnumCardType.CITIZEN);
    }

    // Shuffle dealerHands
    ECardGameManager.dealerHands = ECardGameManager.Shuffle(ECardGameManager.dealerHands);

    this.isConfirmToContinue = true;
};
ECardGameStep.prototype._update_READY_ROUND_ = function()
{

};
ECardGameStep.prototype._next_READY_ROUND_ = function()
{
    return ECardGameManager.EnumStepType.BETTING;
};

// Step_BETTING
ECardGameStep.prototype._init_BETTING_ = function()
{
    ECardGameManager.roundBettingAssetAmount = 0;
};
ECardGameStep.prototype._update_BETTING_ = function()
{
    this.isConfirmToContinue = ECardGameManager.roundBettingAssetAmount > 0;
};
ECardGameStep.prototype._next_BETTING_ = function()
{
    return ECardGameManager.EnumStepType.READY_TURN;
};

// Step_READY_TURN
ECardGameStep.prototype._init_READY_TURN_ = function()
{
    ECardGameManager.turnCount++;
    ECardGameManager.turnBattleResult = ECardGameManager.EnumResultType.LOSE;

    this.isConfirmToContinue = true;
};

ECardGameStep.prototype._update_READY_TURN_ = function()
{

};
ECardGameStep.prototype._next_READY_TURN_ = function()
{
    return ECardGameManager.EnumStepType.SELECT_CARD;
};

// Step_SELECT_CARD
ECardGameStep.prototype._init_SELECT_CARD_ = function()
{
    ECardGameManager.playerSelectCard = ECardGameManager.EnumCardType.NONE;
};
ECardGameStep.prototype._update_SELECT_CARD_ = function()
{
    this.isConfirmToContinue = (ECardGameManager.playerSelectCard != ECardGameManager.EnumCardType.NONE) &&
    (ECardGameManager.CardData.find((data)=>data.key == ECardGameManager.playerSelectCard) != undefined);
};
ECardGameStep.prototype._next_SELECT_CARD_ = function()
{
    return ECardGameManager.EnumStepType.SELECT_DEALER_CARD;
};

// Step_SELECT_DEALER_CARD
ECardGameStep.prototype._init_SELECT_DEALER_CARD_ = function()
{
    ECardGameManager.dealerSelectCard = ECardGameManager.dealerHands[0];
    ECardGameManager.dealerHands.splice(0, 1);
};
ECardGameStep.prototype._update_SELECT_DEALER_CARD_ = function()
{
    this.isConfirmToContinue = (ECardGameManager.dealerSelectCard != ECardGameManager.EnumCardType.NONE) &&
    (ECardGameManager.CardData.find((data)=>data.key == ECardGameManager.dealerSelectCard) != undefined);;
};
ECardGameStep.prototype._next_SELECT_DEALER_CARD_ = function()
{
    return ECardGameManager.EnumStepType.BATTLE;
};

// Step_BATTLE
ECardGameStep.prototype._init_BATTLE_ = function()
{
    // battle result
    ECardGameManager.turnBattleResult = ECardGameManager.EnumResultType.LOSE;

    var dataPlayerCard = ECardGameManager.CardData.find((data)=>data.key == ECardGameManager.playerSelectCard);
    var dataDealerCard = ECardGameManager.CardData.find((data)=>data.key == ECardGameManager.dealerSelectCard);

    if (dataPlayerCard == undefined || dataDealerCard == undefined)
        return;

    ECardGameManager.turnBattleResult = dataPlayerCard.data[ECardGameManager.dealerSelectCard];

    this.isConfirmToContinue = true;
};
ECardGameStep.prototype._update_BATTLE_ = function()
{

};
ECardGameStep.prototype._next_BATTLE_ = function()
{
    return ECardGameManager.EnumStepType.RESULT_TURN;
};

// Step_RESULT_TURN
ECardGameStep.prototype._data_RESULT_TURN = { waitTime : 0 };
ECardGameStep.prototype._init_RESULT_TURN_ = function()
{
    this._data_RESULT_TURN = { waitTime : 60 }; // 180 / 60frame = 3 sec

    console.log("_init_RESULT_TURN_");
};
ECardGameStep.prototype._update_RESULT_TURN_ = function()
{
    this._data_RESULT_TURN.waitTime = this._data_RESULT_TURN.waitTime - 1;
    this.isConfirmToContinue = (this._data_RESULT_TURN.waitTime < 0);

    if (this.isConfirmToContinue)
        console.log("_update_RESULT_TURN_ confirmed");
};
ECardGameStep.prototype._next_RESULT_TURN_ = function()
{
    // Check (go to RESULT_ROUND) or (back to READY_TURN)
    if (ECardGameManager.turnBattleResult != ECardGameManager.EnumResultType.DRAW)
        return ECardGameManager.EnumStepType.RESULT_ROUND;
    else
        return ECardGameManager.EnumStepType.READY_TURN;
};

// Step_RESULT_ROUND
ECardGameStep.prototype._init_RESULT_ROUND_ = function()
{
    // Set Round Result
    var gainAmount = ECardGameManager.roundBettingAssetAmount;

    switch (ECardGameManager.turnBattleResult)
    {
        case ECardGameManager.EnumResultType.WIN:
            {
                if (ECardGameManager.IsPlayerEmperorGame() == false)
                    gainAmount *= ECardGameManager.SlaveWinBonusRate;

                ECardGameManager.playerAssetAmount += gainAmount;
                ECardGameManager.dealerAssetAmount -= gainAmount;
            }
            break;

        case ECardGameManager.EnumResultType.LOSE:
            ECardGameManager.playerAssetAmount -= gainAmount;
            ECardGameManager.dealerAssetAmount += gainAmount;
            break;

        default:
            break;
    }
};
ECardGameStep.prototype._update_RESULT_ROUND_ = function()
{
    this.isConfirmToContinue = true;
};
ECardGameStep.prototype._next_RESULT_ROUND_ = function()
{
    if (ECardGameManager.playerAssetAmount <= 0)
    {
        console.log("_next_RESULT_ROUND_ : playerAssetAmount is zero. QUIT.");
        return ECardGameManager.EnumStepType.QUIT;
    }

    if (ECardGameManager.roundCount >= ECardGameManager.RoundCountInGame)
    {
        // One Game is Over

        if (ECardGameManager.gameCount % 2 == 0) // Each 2 Game is over, Check continue or not.
        {
            // Wait Continue;
            return ECardGameManager.EnumStepType.SELECT_CONTINUE;
        }
        else
        {
            // Start Next Game
            return ECardGameManager.EnumStepType.READY_GAME;
        }
    }
    else
    {
        return ECardGameManager.EnumStepType.READY_ROUND;
    }
};

// Step_SELECT_CONTINUE
ECardGameStep.prototype._data_SELECT_CONTINUE = {
    isContinueFlag : 0 // 0 : wait input, 1 : continue, -1 : quit
};
ECardGameStep.prototype.SetContinueData = function (isContinue) {
    this._data_SELECT_CONTINUE.isContinueFlag = isContinue ? 1 : -1;
};
ECardGameStep.prototype._init_SELECT_CONTINUE_ = function()
{
    this._data_SELECT_CONTINUE.isContinueFlag = 0;
};
ECardGameStep.prototype._update_SELECT_CONTINUE_ = function()
{
    this.isConfirmToContinue = this._data_SELECT_CONTINUE.isContinueFlag != 0;
};
ECardGameStep.prototype._next_SELECT_CONTINUE_ = function()
{
    var retVal = ECardGameManager.EnumStepType.READY_ROUND;

    switch (this._data_SELECT_CONTINUE.isContinueFlag)
    {
        case -1 :
            retVal = ECardGameManager.EnumStepType.QUIT;
            break;

        case 1 :
            // Start Next Game
            retVal = ECardGameManager.EnumStepType.READY_GAME;
            break;

        default:
            break;
    }

    return retVal;
};

// Step_QUIT
ECardGameStep.prototype._init_QUIT_ = function()
{
    this.isConfirmToContinue = true;
};
ECardGameStep.prototype._update_QUIT_ = function()
{

};
ECardGameStep.prototype._next_QUIT_ = function()
{
    return ECardGameManager.EnumStepType.NONE;
};

//===============================
// Util Function
//===============================
ECardGameManager.Shuffle = function(array)
{
    if (array.constructor != Array)
        return array;

    if (array.length < 2)
        return array; // if array size less than 2, card shuffle is useless.

    // Knuth Shuffle Algorithm
    var tmp = array[0];
    for (var i = array.length; i >= 1; --i)
    {
        var sourIndex = i - 1;
        var destIndex = Math.randomInt(i); // random 0 ~ (i - 1);

        // Swap
        tmp = array[destIndex];
        array[destIndex] = array[sourIndex];
        array[sourIndex] = tmp;
    }

    return array;
};
//===============================
// Main Function
//===============================
ECardGameManager.Start = function() {

    // Init, Refresh Data
    ECardGameManager.InitData();

    // Check Verify
    var eFailedReason = ECardGameManager.IsVerifyStart();
    if (eFailedReason != ECardGameManager.EnumFailedReasonStart.NONE)
    {
        console.warn("ECardGameManager::Start : Not Verify Start : " + eFailedReason);
        return;
    }

    // Refresh UI
    SceneManager.push(Scene_ECardGameStart);
};

ECardGameManager.Exit = function() {
    // Set Result
    ECardGameManager.SetResult();

    // Init All Data
    ECardGameManager.InitData();
    ECardGameManager.SetDefaultRule();
};

// 텍스트
ECardGameManager.arrText = [
    { key : "StartTitle", value : "E 카드 게임 시작화면"},
    { key : "StartMenuStart", value : "시작"},
    { key : "StartMenuExit", value : "종료"},
    { key : "MainTitle", value : "E 카드 게임 본 화면"},
    { key : "MainMenuStart", value : "카드"},
    { key : "MainMenuExit", value : "뒤로"},
];
ECardGameManager.GetText = function(_key)
{
    var retVal = ECardGameManager.arrText.find(data => data.key === _key);
    if (retVal === undefined)
        return "";

    return retVal.value;
};


//-----------------------------------------------------------------------------
// Scene_ECardGameStart
//
// The scene class of the ECardGame Start

function Scene_ECardGameStart() {
    this.initialize.apply(this, arguments);
}

Scene_ECardGameStart.prototype = Object.create(Scene_MenuBase.prototype);
Scene_ECardGameStart.prototype.constructor = Scene_ECardGameStart;

Scene_ECardGameStart.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_ECardGameStart.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createStartUIGroup();
};

Scene_ECardGameStart.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
};

Scene_ECardGameStart.prototype.createStartUIGroup = function() {
    Scene_ECardGameStart.prototype.arrStartUIGroup = [];
    var _pushStartUIGroup = function (winName, winObj)
    {
        this.arrStartUIGroup.push({ name : winName, window: winObj});
    };

    // StartWindow
    var _startWindow = new Window_ECardGameStart();
    _startWindow.setHandler('start', this.onClickStartWindowStart.bind(this));
    _startWindow.setHandler('exit', this.onClickStartWindowExit.bind(this));
    _pushStartUIGroup.call(this, "startWindow", _startWindow);

    // Start Help Window
    var _startHelpWindow = new Window_Help(1);
    _startHelpWindow.setText(ECardGameManager.GetText("StartTitle"));
    _pushStartUIGroup.call(this, "startHelp", _startHelpWindow);

    // Player Asset Window
    var _playerAssetWindow = new Window_ECardGameText(0, 100, 300, 2);
    _playerAssetWindow.setText("Player Asset\n" + ECardGameManager.playerAssetAmount);
    _pushStartUIGroup.call(this, "playerAsset", _playerAssetWindow);

    // Dealer Asset Window
    var _dealerAssetWindow = new Window_ECardGameText(Graphics.width - 300, 100, 300, 2);
    _dealerAssetWindow.setText("Dealer Asset\n" + ECardGameManager.dealerAssetAmount);
    _pushStartUIGroup.call(this, "dealerAsset", _dealerAssetWindow);

    // Add to WindowLayer
    for (var i = 0; i < this.arrStartUIGroup.length; ++i)
        this.addWindow(this.arrStartUIGroup[i].window);
};

Scene_ECardGameStart.prototype.onClickStartWindowStart = function() {
    SceneManager.push(Scene_ECardGame);
};

Scene_ECardGameStart.prototype.onClickStartWindowExit = function() {
    this.popScene();
};

//-----------------------------------------------------------------------------
// Scene_ECardGame
//
// The scene class of the ECardGame Start

function Scene_ECardGame() {
    this.initialize.apply(this, arguments);
}

Scene_ECardGame.prototype = Object.create(Scene_MenuBase.prototype);
Scene_ECardGame.prototype.constructor = Scene_ECardGame;

Scene_ECardGame.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_ECardGame.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createUIGroup();
};

Scene_ECardGame.prototype.start = function() {
    ECardGameManager.AddObserverEvent('Scene_ECardGame', this.onUpdaterEvent.bind(this),
    [
        ECardGameManager.EnumUpdaterEventID.CHANGED_STEP
    ]);

    Scene_MenuBase.prototype.start.call(this);
};

Scene_ECardGame.prototype.createUIGroup = function() {
    Scene_ECardGame.prototype.arrUIGroup = [];
    var _pushUIGroup = function (winName, winObj)
    {
        this.arrUIGroup.push({ name : winName, window: winObj});
    };

    // Main Select Window
    var _bettingInputWindow = new Window_ECardGameBettingInput();
    _bettingInputWindow.setHandler('ok', this.onClickBettingOK.bind(this));
    _pushUIGroup.call(this, "bettingInput", _bettingInputWindow);

    // Main Select Window
    var _mainSelectWindow = new Window_ECardGameMain();
    _mainSelectWindow.setHandler('start', this.onClickMainStart.bind(this));
    _mainSelectWindow.setHandler('exit', this.onClickMainExit.bind(this));
    _mainSelectWindow.deselect();
    _mainSelectWindow.deactivate();
    _pushUIGroup.call(this, "mainMenu", _mainSelectWindow);

    // Main Player Card Window
    var _mainPlayerCardWindow = new Window_ECardGameMainPlayerCardSelect(0, 80, 500);
    for (var i = 0; i < _mainPlayerCardWindow.maxCols(); ++i)
        _mainPlayerCardWindow.setHandler('card' + i, this.onClickSelectPlayerCard.bind(this, i));
    _mainPlayerCardWindow.deselect();
    _mainPlayerCardWindow.deactivate();
    _pushUIGroup.call(this, "mainPlayerCard", _mainPlayerCardWindow);

    // Main Help Window
    var _mainHelpWindow = new Window_Help(1);
    _mainHelpWindow.setText(ECardGameManager.GetText("MainTitle"));
    _pushUIGroup.call(this, "mainHelp", _mainHelpWindow);

    // Add to WindowLayer
    for (var i = 0; i < this.arrUIGroup.length; ++i)
        this.addWindow(this.arrUIGroup[i].window);
};

Scene_ECardGame.prototype.findUIInGroup = function(name) {
    var retVal = this.arrUIGroup.find((data)=>data.name == name);
    if (retVal === undefined)
        return undefined;

    return retVal.window;
};

Scene_ECardGame.prototype.update = function()
{
    ECardGameManager.UpdateGame();
    ECardGameManager.ExecUpdaterEvent();

    Scene_MenuBase.prototype.update.call(this);
};

Scene_ECardGame.prototype.terminate = function()
{
    ECardGameManager.RemoveObserverEvent('Scene_ECardGame');
    Scene_Menu.prototype.terminate.call(this);
};

Scene_ECardGame.prototype.onUpdaterEvent = function(eventIDs)
{
    console.log("Scene_ECardGame.prototype.onUpdaterEvent : current step = " + ECardGameManager.step.TYPE);
};

Scene_ECardGame.prototype.onClickBettingOK = function() {
    console.log("Scene_ECardGame.prototype.onClickBettingOK");
};

Scene_ECardGame.prototype.onClickMainStart = function() {
    var _deactiveTarget = this.findUIInGroup("mainMenu");
    var _activeTarget = this.findUIInGroup("mainPlayerCard");

    if (_deactiveTarget === undefined || _activeTarget === undefined)
        return;

    console.log("onClickMainStart");

    _deactiveTarget.deactivate();

    _activeTarget.activate();
    _activeTarget.select(0);
};

Scene_ECardGame.prototype.onClickMainExit = function() {
    ECardGameManager.Exit();
    this.popScene();
};

Scene_ECardGame.prototype.onClickSelectPlayerCard = function(index) {
    var _deactiveTarget = this.findUIInGroup("mainPlayerCard");
    var _activeTarget = this.findUIInGroup("mainMenu");

    if (_deactiveTarget === undefined || _activeTarget === undefined)
        return;

    console.log("onClickSelectPlayerCard" + index);

    _deactiveTarget.deselect();
    _deactiveTarget.deactivate();

    _activeTarget.activate();
};

//-----------------------------------------------------------------------------
// Window_ECardGameStart
//
// The window for ECardGame Start Select.

function Window_ECardGameStart() {
    this.initialize.apply(this, arguments);
}

Window_ECardGameStart.prototype = Object.create(Window_Command.prototype);
Window_ECardGameStart.prototype.constructor = Window_ECardGameStart;

Window_ECardGameStart.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.updatePlacement();
};

Window_ECardGameStart.prototype.windowWidth = function() {
    return 240;
};

Window_ECardGameStart.prototype.updatePlacement = function() {
    this.x = (Graphics.boxWidth - this.width) / 2;
    this.y = Graphics.boxHeight - this.height - 96;
};

Window_ECardGameStart.prototype.makeCommandList = function() {
    this.addCommand(ECardGameManager.GetText("StartMenuStart"),   'start');
    this.addCommand(ECardGameManager.GetText("StartMenuExit"),   'exit');
};

//-----------------------------------------------------------------------------
// Window_ECardGameText
//
// The window for displaying the description of the selected item.

function Window_ECardGameText() {
    this.initialize.apply(this, arguments);
}

Window_ECardGameText.prototype = Object.create(Window_Base.prototype);
Window_ECardGameText.prototype.constructor = Window_ECardGameText;

Window_ECardGameText.prototype.initialize = function(x, y, width, numLines) {
    var height = this.fittingHeight(numLines || 2);
    Window_Base.prototype.initialize.call(this, x, y, width, height);
};

Window_ECardGameText.prototype.setText = function(text) {
    if (this._text !== text) {
        this._text = text;
        this.refresh();
    }
};

Window_ECardGameText.prototype.clear = function() {
    this.setText('');
};

Window_ECardGameText.prototype.refresh = function() {
    this.contents.clear();
    this.drawTextEx(this._text, this.textPadding(), 0);
};


//-----------------------------------------------------------------------------
// Window_ECardGameMain
//
// The window for ECardGame Start Select.

function Window_ECardGameMain() {
    this.initialize.apply(this, arguments);
}

Window_ECardGameMain.prototype = Object.create(Window_Command.prototype);
Window_ECardGameMain.prototype.constructor = Window_ECardGameMain;

Window_ECardGameMain.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.updatePlacement();
};

Window_ECardGameMain.prototype.windowWidth = function() {
    return 240;
};

Window_ECardGameMain.prototype.updatePlacement = function() {
    this.x = (Graphics.boxWidth - this.width) / 2;
    this.y = Graphics.boxHeight - this.height - 96;
};

Window_ECardGameMain.prototype.makeCommandList = function() {
    this.addCommand(ECardGameManager.GetText("MainMenuStart"),   'start');
    this.addCommand(ECardGameManager.GetText("MainMenuExit"),   'exit');
};

//-----------------------------------------------------------------------------
// Window_ECardGameMainPlayerCardSelect
//
// The window for selecting a category of items on the item and shop screens.

function Window_ECardGameMainPlayerCardSelect() {
    this.initialize.apply(this, arguments);
}

Window_ECardGameMainPlayerCardSelect.prototype = Object.create(Window_HorzCommand.prototype);
Window_ECardGameMainPlayerCardSelect.prototype.constructor = Window_ECardGameMainPlayerCardSelect;

Window_ECardGameMainPlayerCardSelect.prototype.initialize = function(x, y, width) {
    this._windowWidth = width;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
};

Window_ECardGameMainPlayerCardSelect.prototype.numVisibleRows = function() {
    return 3;
};

Window_ECardGameMainPlayerCardSelect.prototype.maxCols = function() {
    return 5;
};

Window_ECardGameMainPlayerCardSelect.prototype.makeCommandList = function() {
    for (var i = 0; i < this.maxCols(); ++i)
        this.addCommand(i.toString(), 'card' + i);
};

//-----------------------------------------------------------------------------
// Window_ECardGameBettingInput
//
// The window for selecting a category of items on the item and shop screens.

Window_ECardGameBettingInput.INPUT =
    [ "7","8","9",
      "4","5","6",
      "1","2","3",
      "정정","0","결정"];

function Window_ECardGameBettingInput() {
    this.initialize.apply(this, arguments);
}

Window_ECardGameBettingInput.prototype = Object.create(Window_Selectable.prototype);
Window_ECardGameBettingInput.prototype.constructor = Window_ECardGameBettingInput;

Window_ECardGameBettingInput.prototype.maxValue = 0;
Window_ECardGameBettingInput.prototype.minValue = 0;
Window_ECardGameBettingInput.prototype.inputValue = "";
Window_ECardGameBettingInput.prototype.initialize = function(maxValue) {
    this._windowWidth = this.fittingWidth(3);
    this._windowHeight = this.fittingHeight(4);
    this._index = 0;
    this.maxValue = maxValue;
    this.minValue = 1;
    this.inputValue = "1";

    var x = Graphics.width / 2 - this._windowWidth / 2;
    var y = Graphics.height / 2 - this._windowHeight / 2;
    Window_Selectable.prototype.initialize.call(this, x, y, this.windowWidth(), this.windowHeight());

    this.refresh();
    this.select(0);
    this.updateCursor();
    this.activate();
};

Window_ECardGameBettingInput.prototype.windowWidth = function() {
    return this._windowWidth;
};

Window_ECardGameBettingInput.prototype.windowHeight = function() {
    return this._windowHeight;
};

Window_ECardGameBettingInput.prototype.maxCols = function() {
    return 3;
};

Window_ECardGameBettingInput.prototype.maxItems = function() {
    return Window_ECardGameBettingInput.INPUT.length;
};

Window_ECardGameBettingInput.prototype.isCursorNumber = function()
{
    return !this.isCursorOK() && !this.isCursorRemove();
};

Window_ECardGameBettingInput.prototype.isCursorRemove = function()
{
    return this._index == 9;
};

Window_ECardGameBettingInput.prototype.isCursorOK = function()
{
    return this._index == 11;
};

Window_ECardGameBettingInput.prototype.fittingWidth = function(cols)
{
    return cols * this.lineWidth() + (cols - 1) * this.lineColSpacing() + this.standardPadding() * 2;
};

Window_ECardGameBettingInput.prototype.lineWidth = function()
{
    return 42;
};

Window_ECardGameBettingInput.prototype.lineColSpacing = function()
{
    return 3;
};

Window_ECardGameBettingInput.prototype.itemRect = function(index, isForCursor) {
    return {
        x: index % this.maxCols() * this.lineWidth() + (index % this.maxCols()) * this.lineColSpacing() + (isForCursor ? 0 : 3),
        y: Math.floor(index / this.maxCols()) * this.lineHeight(),
        width: this.lineWidth()  + (isForCursor ? 0 : -6),
        height: this.lineHeight()
    };
};

Window_ECardGameBettingInput.prototype.refresh = function() {
    var table = Window_ECardGameBettingInput.INPUT;
    this.contents.clear();
    this.resetTextColor();
    for (var i = 0; i < table.length; i++) {
        var rect = this.itemRect(i, false);
        this.drawText(table[i], rect.x, rect.y, rect.width, 'center');
    }
};

Window_ECardGameBettingInput.prototype.updateCursor = function() {
    var rect = this.itemRect(this._index, true);
    this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
};


Window_ECardGameBettingInput.prototype.isCursorMovable = function() {
    return this.active;
};

Window_ECardGameBettingInput.prototype.processCursorMove = function() {
    Window_Selectable.prototype.processCursorMove.call(this);
    this.updateCursor();
};

Window_ECardGameBettingInput.prototype.getNextLineFirstIndex = function() { return this.maxCols(); }
Window_ECardGameBettingInput.prototype.getLastLineFirstIndex = function() { return this.maxItems() - this.maxCols(); }
Window_ECardGameBettingInput.prototype.cursorDown = function(wrap) {
    if (this._index < this.getLastLineFirstIndex() || wrap) {
        this._index = (this._index + this.maxCols()) % this.maxItems();
    }
};

Window_ECardGameBettingInput.prototype.cursorUp = function(wrap) {
    if (this._index >= this.getNextLineFirstIndex() || wrap) {
        this._index = (this._index + this.getLastLineFirstIndex()) % this.maxItems();
    }
};

Window_ECardGameBettingInput.prototype.cursorRight = function(wrap) {
    if (this._index % this.maxCols() < (this.maxCols() - 1)) {
        this._index++;
    } else if (wrap) {
        this._index -= (this.maxCols() - 1);
    }
};

Window_ECardGameBettingInput.prototype.cursorLeft = function(wrap) {
    if (this._index % this.maxCols() > 0) {
        this._index--;
    } else if (wrap) {
        this._index += (this.maxCols() - 1);
    }
};

Window_ECardGameBettingInput.prototype.processOk = function() {
    if (this.isCursorNumber()) {
        this.onInputAdd();
    } else if (this.isCursorRemove()) {
        this.onInputRemove();
    } else if (this.isCursorOK()) {
        this.onInputOk();
    }
};

Window_ECardGameBettingInput.prototype.onInputAdd = function() {

};

Window_ECardGameBettingInput.prototype.onInputRemove = function() {

};

Window_ECardGameBettingInput.prototype.onInputOk = function() {
    this.callOkHandler();
};
