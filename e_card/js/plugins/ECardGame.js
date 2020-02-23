//-----------------------------------------------------------------------------
// ECardGameManager
//
// The static class that manages the ECardGame.

function ECardGameManager() {
    throw new Error('This is a static class');
}

ECardGameManager.count       = 1;
ECardGameManager.SetCount = function(count) {
    this.count = count;
    return this;
};

ECardGameManager.Start = function() {
    SceneManager.push(Scene_ECardGameStart);
};


// 텍스트
ECardGameManager.arrText = [
    { key : "StartTitle", value : "E 카드 게임 시작화면"},
    { key : "StartMenuStart", value : "시작"},
    { key : "StartMenuExit", value : "종료"},
    { key : "MainTitle", value : "E 카드 게임 본 화면"},
    { key : "MainMenuExit", value : "뒤로"},
];
ECardGameManager.GetText = function(_key)
{
    var result = this.arrText.find(data => data.key === _key);
    if (result === undefined)
        return "";

    return result.value;
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
    _mainSelectWindow.setHandler('exit', this.onClickMainExit.bind(this));
    _pushUIGroup.call(this, "mainExit", _mainSelectWindow);

    // Main Help Window
    var _mainHelpWindow = new Window_Help(1);
    _mainHelpWindow.setText(ECardGameManager.GetText("MainTitle"));
    _pushUIGroup.call(this, "mainHelp", _mainHelpWindow);

    // Add to WindowLayer
    for (var i = 0; i < this.arrUIGroup.length; ++i)
        this.addWindow(this.arrUIGroup[i].window);
};

Scene_ECardGame.prototype.onClickMainExit = function() {
    this.popScene();
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
    this.addCommand(ECardGameManager.GetText("MainMenuExit"),   'exit');
};