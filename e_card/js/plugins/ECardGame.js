//-----------------------------------------------------------------------------
// ECardGameManager
//
// The static class that manages the ECardGame.

function ECardGameManager() {
    throw new Error('This is a static class');
}
//===============================
// Const
//===============================
ECardGameManager.EnumAssetType = {
    VARIABLE : 'variable',
    GOLD : 'gold',
    ITEM : 'item',
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

//===============================
// Member Variables
//===============================
ECardGameManager.playerAssetAmount = -1;    // init value : -1 (because zero is valid value)
ECardGameManager.dealerAssetAmount = -1;    // init value : -1 (because zero is valid value)

ECardGameManager.InitData = function()
{
    this._init_player_asset_amount_();
    this._init_dealer_asset_amount_();
};

ECardGameManager._init_player_asset_amount_ = function()
{
    var retVal = -1;

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
                if ($gameParty.hasItem($dataItems[ECardGameManager.playerAssetParam], false))
                    retVal =  $gameParty.numItems(ECardGameManager.playerAssetParam);
            break;
    }

    ECardGameManager.playerAssetAmount = retVal;
};

ECardGameManager._init_dealer_asset_amount_ = function()
{
    ECardGameManager.dealerAssetAmount = $gameVariables.value(ECardGameManager.dealerAssetParam) || -1;
};

ECardGameManager.IsVerifyStart = function()
{
    if (ECardGameManager.playerAssetAmount < 0)
        return false;

    if (ECardGameManager.dealerAssetAmount < 0)
        return false;

    return true;
};

//===============================
// Output
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

ECardGameManager.Start = function() {
    // Refresh Data
    ECardGameManager.InitData();

    // Check Verify
    if (ECardGameManager.IsVerifyStart() == false)
    {
        console.warn("ECardGameManager::Start : Not Verify Start");
        return;
    }

    // Refresh UI
    SceneManager.push(Scene_ECardGameStart);
};

ECardGameManager.Exit = function() {
    // Result Set
    ECardGameManager.SetResult();
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