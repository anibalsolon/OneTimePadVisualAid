// http://stackoverflow.com/questions/7695450/how-to-program-hex2bin-in-javascript
function checkBin(n){return/^[01]+$/.test(n)}
function checkDec(n){return/^[0-9]+$/.test(n)}
function checkHex(n){return/^[0-9A-Fa-f]+$/.test(n)}
function pad(s,z){s=""+s;return s.length<z?pad("0"+s,z):s}
function unpad(s){s=""+s;return s.replace(/^0+/,'')}

function Dec2Bin(n){if(!checkDec(n)||n<0)return 0;return pad(n.toString(2),8)}
function Dec2Hex(n){if(!checkDec(n)||n<0)return 0;return n.toString(16)}
function Bin2Dec(n){if(!checkBin(n))return 0;return parseInt(n,2).toString(10)}
function Bin2Hex(n){if(!checkBin(n))return 0;return parseInt(n,2).toString(16)}
function Hex2Bin(n){if(!checkHex(n))return 0;return pad(parseInt(n,16).toString(2),8)}
function Hex2Dec(n){if(!checkHex(n))return 0;return parseInt(n,16).toString(10)}

String.prototype.replaceAt=function(index, character) {
	return this.substr(0, index) + character + this.substr(index+character.length);
}

function Character(content, mode) {
	if(mode == 'dec'){
		this.bin = Dec2Bin(content);
		this.dec = content;
		this.hex = Dec2Hex(content);
	} else if(mode == 'hex'){
		this.bin = Hex2Bin(content);
		this.dec = Hex2Dec(content);
		this.hex = content;
	} else if(mode == 'bin'){
		this.bin = content;
		this.dec = Bin2Dec(content);
		this.hex = Bin2Hex(content);
	} else if(mode == 'chr'){
		this.dec = content.charCodeAt(0);
		this.bin = Dec2Bin(this.dec);
		this.hex = Dec2Hex(this.dec);
	}
}

Character.prototype.xor = function(chr) {
	var binfinal = "11111111";
	for(var i = 0; i < 8; i++){
		if(this.bin.charAt(i) == chr.bin.charAt(i)){
			binfinal = binfinal.replaceAt(i, '0');
		}
	}
	return new Character(binfinal, 'bin');
};

function $$$(sel1, sel2){
	return jQuery(sel1).add(jQuery(sel2));
}

var $c, $t;

var crypt = {

	mode: 'hex',
	trial: [],
	data: [],
	finaldata: [],
	max: 0,
	current: -1,
	interval: null,

	setDataAtElem: function(elem, chr){

		if(chr == null){
			elem.find('.raw').html("&#160;");
			elem.find('.bin').html("00000000");
			elem.find('.hex').html("");
			return;
		}

		var chrtext = String.fromCharCode(chr.dec);
		if(chr.dec < 32 || chr.dec > 126)
			chrtext = "&#65533;";
		if(chr.dec == 32)
			chrtext = "&#160;";

		elem.find('.raw').html(chrtext);
		elem.find('.bin').html(chr.bin);
		elem.find('.hex').html(chr.hex);
	},

	init: function(key, text){

		var biggest = 0;

		crypt.data = [];
		for(var i in text){
			text[i] = text[i].trim().match(/.{1,2}/g);
			crypt.data[i] = [];
			for(var j in text[i]){
				crypt.data[i][j] = new Character(text[i][j], 'hex');
			}
		}

		crypt.finaldata = crypt.data;

		crypt.trial = [];
		for(var i in key){
			crypt.trial[i] = new Character(key[i], 'chr');
		}

		$c.empty();
		for(var i in crypt.data){

			var line = $('<div class="line"  />');

			if(crypt.data[i].length > biggest)
				biggest = crypt.data[i].length;

			for(var j in crypt.data[i]){
				var chrdiv = $('<div class="char" data-container="#content" data-toggle="popover" data-placement="auto bottom" data-content="a"><div class="hex" /><div class="raw" /><div class="bin" /></div>');
				chrdiv.data('char', crypt.data[i][j]);
				chrdiv.data('line', i);
				chrdiv.data('column', j);
				crypt.setDataAtElem(chrdiv, crypt.data[i][j]);
				line.append(chrdiv);
			}

			$c.append(line);

		}

		$('.line .char', $c).popover().on('show.bs.popover', function () {
			var content = '';
			var data = crypt.finaldata[$(this).data('line')];
			for(var i in data){
				content += String.fromCharCode(data[i].dec);
			}
			var popover = $(this).attr('data-content', content).data('bs.popover');
			popover.setContent();
		});

		crypt.max = biggest;
		crypt.trial.length = biggest;

		$t.empty();
		var line = $('<div class="line" />');
		$t.append(line);

		for(var i in key){
			var chrdiv = $('<div class="char"><div class="raw" /><div class="bin" /></div>');
			line.append(chrdiv);
			this.updateTrial(i, key[i]);
			biggest--;
		}

		while(biggest--){
			line.append($('<div class="char"><div class="raw">&#160;</div><div class="bin">00000000</div></div>'));
			this.updateTrial(key.length + biggest, null);
		}

		$(window).resize();

	},

	select: function(i){

		$('.line .char', $$$($c,$t)).removeClass('select');
		$('.line', $c).find('.char:eq('+i+')').addClass('select');
		$('.line', $t).find('.char:eq('+i+')').addClass('select');

		var trial = {
			width: $t.width(),
			scroll: $t.scrollLeft(),
			leftBound: 0,
			rightBound: $t.width()
		};

		var sel = $('.line:first', $t).find('.char:eq('+i+')');

		if(trial.rightBound < sel.position().left + sel.width()){
			$$$($c,$t).scrollLeft(trial.scroll + sel.position().left - trial.rightBound + ( sel.width() * 2 ));
		} else if(trial.leftBound > sel.position().left){
			$$$($c,$t).scrollLeft(trial.scroll + sel.position().left - ( sel.width() * 2 ));
		}
	},

	updateTrial: function(i, chr){
		var elem = $('.line', $t).find('.char:eq('+i+')');
		if(chr == null){
			crypt.trial[i] = null;
			crypt.setDataAtElem(elem, crypt.trial[i]);
			$('.line', $c).find('.char:eq('+i+')').each(function(){
				crypt.setDataAtElem($(this), $(this).data('char'));
			});
		} else {
			crypt.trial[i] = new Character(chr, 'chr');
			crypt.setDataAtElem(elem, crypt.trial[i]);
			$('.line', $c).find('.char:eq('+i+')').each(function(){
				var xored = $(this).data('char').xor(crypt.trial[i]);
				crypt.finaldata[ $(this).data('line') ][i] = xored;
				crypt.setDataAtElem($(this), xored);
			});
		}
	}

};

$(document).ready(function(){

	$c = $('#content');
	$t = $('#trial');

	$('#inputmode div').click(function(){
		$('#inputmode div').removeClass('selected');
		$(this).addClass('selected');
		crypt.mode = $(this).data('mode');
	});

	$('#disassemble').click(function(){
		switch(crypt.mode){
			case 'hex':
				var key = $('#input input').val().trim().split("");
				var text = $('#input textarea').val().trim().split("\n");
				crypt.init(key, text);
			break;
		}
		$('#input').hide();
	});

	$('#content').scroll(function(){
		$('#trial').scrollLeft($(this).scrollLeft());
	});

	$(window).resize(function(){
		$('#content').css({top: $('#trial').position().top + $('#trial').height()});
		$('#trial .line, #content .line').css({ 'width': $('#trial')[0].scrollWidth });
	});

	$(document).keypress(function(e){
		if(e.keyCode >= 32 && e.keyCode <= 126){
			var code = String.fromCharCode(e.keyCode);
			crypt.updateTrial(crypt.current, code);
			return false;
		}
	});

	$(document).keydown(function(e){
		switch(e.keyCode){
			case 37: // left
				crypt.current--
				if(crypt.current <= -1){
					crypt.current = crypt.max - 1;
				}
				crypt.select(crypt.current);
				return false;
			break;
			case 39: // right
				crypt.current++;
				if(crypt.current >= crypt.max){
					crypt.current = 0;
				}
				crypt.select(crypt.current);
				return false;
			break;
			case 46: //delete
				crypt.updateTrial(crypt.current, null);
			break;
		}
	});

});