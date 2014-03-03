var Hebcal = require('..'),
	argv = require('./lib/argv'),
	table = require('./lib/table'),
	suntimes = require('./lib/suntimes'),
	dayInfo = require('./day'),
	main = require.main == module;

var helpString = "node week -aipdghq";

var opts = {
	lang: 's',
	times: []
}, shortargs = {
	a: function(){opts.lang = 'a'},
	i: function(){opts.lang = 'h'},
	p: function(){opts.parsha = true},
	d: function(){opts.holidays = true},
	g: function(){opts.greg = true},
	c: function(){opts.candles = true},
	t: function(times){
		if (!times) {
			times = Object.keys(new Hebcal.HDate().getZemanim()).join(',');
		}
		opts.times = times.split(',').map(function(str){return suntimes(str)});
	},
	h: function(){
		console.log(helpString);
		process.kill();
	},
	q: function(){opts.quiet = true}
};

module.exports = function(opts) {
	opts = opts || {};
	opts.times = opts.times || [];

	var day = new Hebcal.HDate(opts.day).onOrBefore(0).prev(),
		week = [],
		echo = {},
		i;

	for (i = 0; i < 7; i++) {
		week.push(day = day.next());
	}

	echo.week = 'Week of ' +
		week[0].toString(opts.lang) + ' - ' + week[6].toString(opts.lang) +
		(opts.greg ? ' / ' + week[0].greg().toDateString() + ' - ' + week[6].greg().toDateString() : '');

	week.forEach(function(day,num){
		var o = JSON.parse(JSON.stringify(opts)); // clone
		o.day = day.toString();
		o.parsha = false;
		o.times = [];
		day = dayInfo(o);
		if (!opts.always) {
			if (day.tachanun.val == 7) {
				delete day.tachanun;
			}
			if (day.hallel.val == 0) {
				delete day.hallel;
			}	
		}
		var e = '';
		for (i in day) {
			e += day[i] + '\n';
		}
		echo['day' + num] = e.trim();
	});

	if (opts.parsha) {
		echo.parsha = 'Parsha: ' + day.getParsha(opts.lang).join(', ');
	}

	if (opts.times.length) {
		echo.times = [];
		opts.times.forEach(function(t){
			echo.times.push([t.split('_').map(function(p){
				return p[0].toUpperCase() + p.slice(1).toLowerCase();
			}).join(' '), week[0].getZemanim()[t].toTimeString(), '-', week[6].getZemanim()[t].toTimeString()]);
		});
		echo.times = 'Times:\n' + table(echo.times, {prefix: '  '});
	}

	return echo;
};

if (main) {
	argv.parse(shortargs, {
		day: function(day){opts.day = day},
		ashkenazis: shortargs.a,
		ivrit: shortargs.i,
		parsha: shortargs.p,
		candles: shortargs.c,
		holidays: shortargs.d,
		showgreg: shortargs.g,
		times: shortargs.t,
		tachanun: function(){opts.tachanun = true},
		hallel: function(){opts.hallel = true},
		dafyomi: function(){opts.dafyomi = true},
		omer: function(){opts.omer = true},
		city: function(city){Hebcal.defaultCity = city},
		help: shortargs.h,
		quiet: shortargs.q,
		always: function(){opts.always = true}
	});

	if (!opts.quiet) {
		argv.warn();
	}

	var echo = module.exports(opts), i;
	for (i in echo) {
		console.log(echo[i]);
		console.log('');
	}
	process.kill();
}