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
    { key : "StartTitle", value : "E 카드 게임"},
    { key : "MenuStart", value : "시작"},
    { key : "MenuExit", value : "종료"},
];
ECardGameManager.GetText = function(_key)
{
    var result = this.arrText.find(data => data.key === _key);
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
    function _pushStartUIGroup (winName, winObj)
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

};

Scene_ECardGameStart.prototype.onClickStartWindowExit = function() {
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
    this.addCommand(ECardGameManager.GetText("MenuStart"),   'start', false);
    this.addCommand(ECardGameManager.GetText("MenuExit"),   'exit');
};