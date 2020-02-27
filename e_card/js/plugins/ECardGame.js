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
    READY_GAME          : 'ready_game',
    READY_ROUND         : 'ready_round',
    BETTING             : 'betting',
    DRAW                : 'draw',
    SELECT_CARD         : 'select_card',
    BATTLE              : 'battle',
    RESULT_ROUND        : 'result_round',
    SELECT_CONTINUE     : 'select_continue',
};

ECardGameManager.EnumCardType = {
    NONE                    : -1,
    SLAVE                   : 0,
    CITIZEN                 : 1,
    EMPEROR                 : 2,
};
//===============================
// DATA
//===============================
ECardGameManager.CardData =
{
    // SLAVE CITIZEN EMPEROR
    // 0 : lose / 1 : draw / 2 : win

    // SLAVE
    1 :  [1, 0, 2],
    // CITIZEN
    2 :  [2, 1, 0],
    // EMPEROR
    3 :  [0, 2, 1],
};
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

ECardGameManager.gameCount = 0;
ECardGameManager.roundCount = 0;
ECardGameManager.turnCount = 0;

ECardGameManager.roundBettingAssetAmount = 0;
ECardGameManager.playerHands = [];
ECardGameManager.dealerHands = [];
ECardGameManager.playerSelectCard = ECardGameManager.EnumCardType.NONE;
ECardGameManager.dealerSelectCard = ECardGameManager.EnumCardType.NONE;

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

    ECardGameManager.gameCount = 0;
    ECardGameManager.roundCount = 0;
    ECardGameManager.turnCount = 0;

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
ECardGameManager.StartGame = function()
{
    // Change Step
    ECardGameManager.step = ECardGameManager.CreateGameStep(ECardGameManager.EnumStepType.READY_GAME);
    ECardGameManager.UpdateGame();
};

ECardGameManager.UpdateGame = function()
{
    ECardGameManager.step.Exec();

    if (ECardGameManager.step.CheckCondition())
    {
        var eNextType = ECardGameManager.step.Next();
        if (eNextType != ECardGameManager.EnumStepType.NONE)
        {
            // Change Step
            ECardGameManager.step = ECardGameManager.CreateGameStep(eNextType);
            ECardGameManager.UpdateGame();
        }
    }
};

ECardGameManager.SetBettingAssetAmount = function(assetValue)
{
    if (assetValue <= 0 || assetValue > ECardGameManager.playerAssetAmount || assetValue > ECardGameManager.dealerAssetAmount)
        return;

    ECardGameManager.roundBettingAssetAmount = assetValue;

    ECardGameManager.UpdateGame();
};
//===============================
// Step class
//===============================
ECardGameManager.CreateGameStep = function(eStepType)
{
    var retVal = new ECardGameStep();
    retVal.TYPE = eStepType;
    retVal.Init();
    return retVal;
};

function ECardGameStep ()
{

};

// Global Member Variables
ECardGameStep.prototype.TYPE = ECardGameManager.EnumStepType.NONE;
ECardGameStep.prototype.isInit = false;

ECardGameStep.prototype.Init = function()
{
    if (this.isInit)
        return;

    this.isInit = true;

    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.READY_GAME:
            this._init_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            this._init_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            this._init_BETTING_();
            break;

        case ECardGameManager.EnumStepType.DRAW:
            this._init_DRAW_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            this._init_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            this._init_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            this._init_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            this._init_SELECT_CONTINUE_();
            break;

        default:
            break;
    }
};

ECardGameStep.prototype.Exec = function()
{
    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.READY_GAME:
            this._exec_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            this._exec_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            this._exec_BETTING_();
            break;

        case ECardGameManager.EnumStepType.DRAW:
            this._exec_DRAW_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            this._exec_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            this._exec_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            this._exec_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            this._exec_SELECT_CONTINUE_();
            break;

        default:
            break;
    }
};

ECardGameStep.prototype.CheckCondition = function()
{
    var retVal = false;

    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.READY_GAME:
            retVal = this._check_condition_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            retVal = this._check_condition_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            retVal = this._check_condition_BETTING_();
            break;

        case ECardGameManager.EnumStepType.DRAW:
            retVal = this._check_condition_DRAW_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            retVal = this._check_condition_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            retVal = this._check_condition_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            retVal = this._check_condition_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            retVal = this._check_condition_SELECT_CONTINUE_();
            break;

        default:
            break;
    }

    return retVal;
};

ECardGameStep.prototype.Next = function()
{
    var retVal = ECardGameManager.EnumStepType.NONE;

    switch (this.TYPE)
    {
        case ECardGameManager.EnumStepType.READY_GAME:
            retVal = this._next_READY_GAME_();
            break;

        case ECardGameManager.EnumStepType.READY_ROUND:
            retVal = this._next_READY_ROUND_();
            break;

        case ECardGameManager.EnumStepType.BETTING:
            retVal = this._next_BETTING_();
            break;

        case ECardGameManager.EnumStepType.DRAW:
            retVal = this._next_DRAW_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CARD:
            retVal = this._next_SELECT_CARD_();
            break;

        case ECardGameManager.EnumStepType.BATTLE:
            retVal = this._next_BATTLE_();
            break;

        case ECardGameManager.EnumStepType.RESULT_ROUND:
            retVal = this._next_RESULT_ROUND_();
            break;

        case ECardGameManager.EnumStepType.SELECT_CONTINUE:
            retVal = this._next_SELECT_CONTINUE_();
            break;

        default:
            break;
    }

    return retVal;
}

// Step_READY_GAME
ECardGameStep.prototype._init_READY_GAME_ = function()
{
    ECardGameManager.gameCount++;
};
ECardGameStep.prototype._exec_READY_GAME_ = function()
{

};
ECardGameStep.prototype._check_condition_READY_GAME_ = function()
{
    return true;
};
ECardGameStep.prototype._next_READY_GAME_ = function()
{
    return ECardGameManager.EnumStepType.READY_ROUND;
};

// Step_READY_ROUND
ECardGameStep.prototype._init_READY_ROUND_ = function()
{
    ECardGameManager.roundCount++;
};
ECardGameStep.prototype._exec_READY_ROUND_ = function()
{

};
ECardGameStep.prototype._check_condition_READY_ROUND_ = function()
{
    return true;
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
ECardGameStep.prototype._exec_BETTING_ = function()
{

};
ECardGameStep.prototype._check_condition_BETTING_ = function()
{
    return ECardGameManager.roundBettingAssetAmount > 0;
};
ECardGameStep.prototype._next_BETTING_ = function()
{
    return ECardGameManager.EnumStepType.DRAW;
};

// Step_DRAW
ECardGameStep.prototype._init_DRAW_ = function()
{
    ECardGameManager.playerHands = [];
    ECardGameManager.dealerHands = [];
    ECardGameManager.playerSelectCard = ECardGameManager.EnumCardType.NONE;
    ECardGameManager.dealerSelectCard = ECardGameManager.EnumCardType.NONE;

    // Draw Special Card
    for (var i = 0; i < ECardGameManager.SpecialCardCount; ++i)
        ECardGameManager.playerHands.push(ECardGameManager.IsPlayerEmperorGame() ? ECardGameManager.EnumCardType.EMPEROR : ECardGameManager.EnumCardType.SLAVE);

    for (var i = 0; i < ECardGameManager.SpecialCardCount; ++i)
        ECardGameManager.dealerHands.push(ECardGameManager.IsPlayerEmperorGame() ? ECardGameManager.EnumCardType.SLAVE : ECardGameManager.EnumCardType.EMPEROR);

    // Draw Citizen Card
    var CardCount = ECardGameManager.MaxHandCount - ECardGameManager.SpecialCardCount;
    CardCount = Math.max(CardCount, 1); // If CardCount is zero, game is not valid.

    for (var i = 0; i < CardCount; ++i)
    {
        ECardGameManager.playerHands.push(ECardGameManager.EnumCardType.CITIZEN);
        ECardGameManager.dealerHands.push(ECardGameManager.EnumCardType.CITIZEN);
    }
};
ECardGameStep.prototype._exec_DRAW_ = function()
{

};
ECardGameStep.prototype._check_condition_DRAW_ = function()
{
    return true;
};
ECardGameStep.prototype._next_DRAW_ = function()
{
    return ECardGameManager.EnumStepType.SELECT_CARD;
};

// Step_SELECT_CARD
ECardGameStep.prototype._init_SELECT_CARD_ = function()
{

};
ECardGameStep.prototype._exec_SELECT_CARD_ = function()
{

};
ECardGameStep.prototype._check_condition_SELECT_CARD_ = function()
{

};
ECardGameStep.prototype._next_SELECT_CARD_ = function()
{

};

// Step_BATTLE
ECardGameStep.prototype._init_BATTLE_ = function()
{

};
ECardGameStep.prototype._exec_BATTLE_ = function()
{

};
ECardGameStep.prototype._check_condition_BATTLE_ = function()
{

};
ECardGameStep.prototype._next_BATTLE_ = function()
{

};

// Step_RESULT_ROUND
ECardGameStep.prototype._init_RESULT_ROUND_ = function()
{

};
ECardGameStep.prototype._exec_RESULT_ROUND_ = function()
{

};
ECardGameStep.prototype._check_condition_RESULT_ROUND_ = function()
{

};
ECardGameStep.prototype._next_RESULT_ROUND_ = function()
{

};

// Step_SELECT_CONTINUE
ECardGameStep.prototype._init_SELECT_CONTINUE_ = function()
{

};
ECardGameStep.prototype._exec_SELECT_CONTINUE_ = function()
{

};
ECardGameStep.prototype._check_condition_SELECT_CONTINUE_ = function()
{

};
ECardGameStep.prototype._next_SELECT_CONTINUE_ = function()
{

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
    Scene_MenuBase.prototype.start.call(this);
};

Scene_ECardGame.prototype.createUIGroup = function() {
    Scene_ECardGame.prototype.arrUIGroup = [];
    var _pushUIGroup = function (winName, winObj)
    {
        this.arrUIGroup.push({ name : winName, window: winObj});
    };

    // Main Select Window
    var _mainSelectWindow = new Window_ECardGameMain();
    _mainSelectWindow.setHandler('start', this.onClickMainStart.bind(this));
    _mainSelectWindow.setHandler('exit', this.onClickMainExit.bind(this));
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
// Window_ItemCategory
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

Window_ECardGameMainPlayerCardSelect.prototype.maxCols = function() {
    return 5;
};

Window_ECardGameMainPlayerCardSelect.prototype.makeCommandList = function() {
    for (var i = 0; i < this.maxCols(); ++i)
        this.addCommand(i.toString(), 'card' + i);
};