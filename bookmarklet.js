

var voteTimeout = null;
var djCheckTimeout = null;
var user = null;
var themes = [];
var autoResponseSentTimes = {}
themes.push({name: 'none', url: null});
themes.push({name: "bayan's theme", url: 'zuEvBkP'});
themes.push({name: 'Chillout Mixer Theme', url: 'nptZvUk'});
themes.push({name: 'Chillout Mixer Theme II', url: 'mL0fuwb'});
themes.push({name: 'Digital Dungeon Theme', url: 'WTylHRy'});
themes.push({name: 'TT.fm Red Theme', url: 'u36VR4n'});
themes.push({name: 'TT.fm After Party Theme', url: 'GZKgCpk'});
themes.push({name: 'Red Rocks Theme', url: 'lK4GttQ'});

themes.push({name: 'Orbital Lounge', url: 'EFXFnql'});
themes.push({name: 'Bomb Shelter', url: 'XjiQctM'});
themes.push({name: 'Christmas Classic', url: '2Q89Rn2'});
themes.push({name: 'Chillout Mixer Christmas', url: 'ILrUcVK'});
themes.push({name: 'Chillout Mixer Christmas Lite', url: 'nb4ibg4'});
themes.push({name: 'plug.dj Christmas Classic', url: 'P4GVhF4'});
themes.push({name: 'plug.dj Christmas Ice', url: 'M0CeHah'});
themes.push({name: 'Digital Dungeon Lite', url: 'zSMRtE6'});
themes.push({name: 'Fairy Tale Land', url: 'XZNVZmj'});

var autowoot = [];
autowoot.push({name: 'off', vote: null});
autowoot.push({name: 'on', vote: vote});
autowoot.push({name: 'ranked ONLY', vote: rankedVote});

var settings = {
	showAudience: false,
	videoOpacity: 0,
	autowoot: 0,
	inlineImages: true,
	theme:0,
	spaceMute: true,
	autoWootMinTime: 10,
	autoWootMaxTime: 30,
	frontOfLineMessage:true,
	autoRespond: false,
	autoRespondMsg: "I'm away from plug.dj at the moment.",
	disableOnChat: true,
	chatReplacement: true
}
var KEYS = {
	SPACE: 32
}
var gui = new dat.GUI();
gui.remember(settings);
gui.add(settings, 'showAudience').onChange(showHideAudience);
gui.add(settings, 'videoOpacity',0,1).onChange(showHideVideo);
var autowootSettingsObject = {};
for(var i = 0; i < autowoot.length; i++) {
	var woot = autowoot[i];
	autowootSettingsObject[woot.name] = i;
}
gui.add(settings, 'autowoot', autowootSettingsObject).onChange(setWootBehavior);
gui.add(settings, 'inlineImages').onChange(doInlineImages);
var themeSettingsObject = {}
for(var i = 0; i < themes.length; i++) {
	var theme = themes[i];
	themeSettingsObject[theme.name] = i;
}
gui.add(settings, 'theme', themeSettingsObject).onChange(showTheme)
var afk = gui.addFolder('autoRespond')
afk.add(settings, "autoRespond")
afk.add(settings, "autoRespondMsg")
afk.add(settings, "disableOnChat") //listen didn't seem to work


var advanced = gui.addFolder('advanced')
advanced.add(settings,'spaceMute')
advanced.add(settings,'autoWootMinTime',0,120)
advanced.add(settings,'autoWootMaxTime',0,120)
advanced.add(settings,'frontOfLineMessage')
advanced.add(settings, "chatReplacement")
$('.dg').css("z-index",30).css('right','auto').css('top','65px')
$('.dg .save-row').hide()
$('.dg select').css('width', '130px')
//$('body').css('background-size', '100%')
var originalTheme = null;
var inlineImagesInterval = null;
$(once);
function once() {
	if(typeof ran !== "undefined") {
		return;
	}
	ran = true;
	user = API.getUser();
	API.on(API.DJ_ADVANCE,advance);
	API.on(API.CHAT, chatReceived);
	$('body').append('<style type="text/css">#volume .slider { display: block !important; }</style>')
	$('#meh').on('click', mehClicked);
	console.log('window key handler');
	window.addEventListener('keyup', documentKeyDown)
	showHideAudience();

	showHideVideo();

	doInlineImages();

	showTheme();

	setWootBehavior()
}
function documentKeyDown(event) {
	var target = event.target.tagName.toLowerCase()
	if(target === 'input') {
		if($(event.target).attr('id') === 'chat-input-field' && settings.chatReplacement) {
			replaceText(event.target)
		}
		return;
	}
	if(event.which === KEYS.SPACE && settings.spaceMute) {
		$('#volume .button').click()
	}

}
function replaceText(ele) {
	var replacements = {
		'/whatever': '¯\\_(ツ)_/¯',
		'/tableflip': '(╯°□°）╯︵ ┻━┻',
		'/tablefix': '┬─┬ノ( º _ ºノ)'
	}
	$ele = $(ele);
	var curText = $ele.val();
	var newText = "" + curText;
	for(var replacement in replacements) {
		var replacementText = replacements[replacement];
		var reg = new RegExp(replacement,'gi');
		newText = newText.replace(reg,replacementText)
	}
	if(curText !== newText) {
		$ele.val(newText)
	}
}
function showHideAudience() {
	if(settings.showAudience) {
		$('#audience').show()
	} else {
		$('#audience').hide()	
	}
}
function showHideVideo() {
	$('#playback').css('opacity',settings.videoOpacity)

}

function chatReceived(data) {
	var msg = data.message;
	var username = API.getUser().username;
	if(username === data.from) {
		//from self
		if(settings.disableOnChat && settings.autoRespond) {
			settings.autoRespond = false;
			updateGUI()

		}
		return;
	}
	if(msg.indexOf(username) !== -1) {
		//mentioned
		if(settings.autoRespond) {
			var timeLimitPerUser = 1000 * 60 * 3;
			var now = new Date().getTime();
			var validTime = now - timeLimitPerUser;
			if(typeof autoResponseSentTimes[data.from] === 'undefined' || autoResponseSentTimes[data.from] < validTime) {
				var response = '@' + data.from + ' ' + settings.autoRespondMsg;
				API.sendChat(response);
				autoResponseSentTimes[data.from] = now;
			}
		}
	}
}
function advance(obj)
{
	clearTimeout(voteTimeout);
	clearTimeout(djCheckTimeout);
	if (obj == null) return; // no dj

	if(settings.autowoot > 0) {
		var minTime = settings.autoWootMinTime * 1000;
		var maxTime = settings.autoWootMaxTime * 1000;
		if(maxTime < minTime) {
			maxTime = minTime;
		}
		var diffTime = maxTime - maxTime;
		var timer = minTime + diffTime * Math.random();
		var woot = autowoot[settings.autowoot];
		voteTimeout = setTimeout(woot.vote,timer);
	}
	if(settings.frontOfLineMessage) {
		if(API.getWaitListPosition() === 0) {
			API.chatLog("@" + API.getUser().username + " you are next in line, hope you got a good song ready!", true);
		}
	}
}
function setWootBehavior() {
	if(settings.autowoot > 0) {
		var woot = autowoot[settings.autowoot];
		voteTimeout = setTimeout(woot.vote,10000);
	} else {
		clearTimeout(voteTimeout)
	}

}
var vote = function() {
	$('#room #woot').click();
}
var rankedVote = function() {
	if (API.getDJ().permission >= API.ROLE.RESIDENTDJ) {
		$('#room #woot').click();
	}
}
function mehClicked() {
	clearTimeout(voteTimeout)
}
function checkIfDJing() {
	return;
	
	var curDJs = API.getDJs();
	var djing = false;
	for(var i = 0; i < curDJs.length; i++) {
		var dj = curDJs[i];
		if(dj.id === user.id) {
			djing = true;
			break;
		}
	}
	if(djing) {
		return;
	}
	var inWaitList = API.getWaitListPosition();
	if(inWaitList != -1) {
		return;
	}
	$('.button-dj:visible').click();
}
function showTheme() {
	if(originalTheme === null) {
		originalTheme = $('body').css('background-image');
	}
	var theme = themes[settings.theme];

	if(theme.name === 'none') {
		$('body').css('background-image', originalTheme);
		$('#playback .background').show();
	} else {
		$('body').css('background-image', 'url(http://i.imgur.com/'+theme.url+'.png)');
		$('#playback .background').hide()
	}
}

function doInlineImages() {
	if(settings.inlineImages) {
		console.log('set interval');
		inlineImagesInterval = setInterval(function() {
		    $(".closeImage").off("click");
		    $(".closeImage").on("click", function () {
		        var e = $(this).parent();
		        var t = $(this).next("img");
		        var n = t.attr("src");
		        $(this).remove();
		        t.remove();
		        e.append("<a href=" + n + ' class="ignore" target="_blank">' + n + "</a>")
		    });
		    function imageLoaded() {
				var objDiv = document.getElementById("chat-messages");
				objDiv.scrollTop = objDiv.scrollHeight;
		    }
		    return $("#chat-messages span.text a").each(function (e, t) {
		    	if (t.href.match(/.png|.gif|.jpg/) && !$(t).hasClass("ignore")) {
		    		var img = new Image()
		    		img.onload = imageLoaded;
		    		img.src = t.href
		            return t.outerHTML = "<img class='closeImage' style='position: absolute; right: 0px; cursor: pointer;' src='http://i.imgur.com/JvlpEy9.png' /><img style='width: 100%' src='" + t.href + "' />"
		        }
		    })
		},1e3)
	} else {
		clearInterval(inlineImagesInterval)
	}
}

function updateGUI() {
	updateControllers(gui)
	updateFolders(gui);
}
function updateFolders(f) {
	if(typeof f === 'undefined') {
		return;
	}
	for(var folderName in f.__folders) {
		var folder = f.__folders[folderName];
		updateControllers(folder);
		updateFolders(folder);
	}
}
function updateControllers(o) {
	for (var i in o.__controllers) {
		o.__controllers[i].updateDisplay();
	}
}