(function (window, document, undefined) {

	var baseURL = "",
		clock = new Clock(),
		alarm = new Alarm(),
		stopwatch = new Stopwatch(),
		countdown = new Countdown();


	function toHours(value) {

		var time = '',
			a,
			d,
			h,
			m,
			s,
			ms;

		value = (value >= 0) ? value : 0;

		a = Math.floor(value / 31536000000);
		value %= 31536000000;
		d = Math.floor(value / 86400000);
		value %= 86400000;
		h = Math.floor(value / 3600000);
		value %= 3600000;
		m = Math.floor(value / 60000);
		value %= 60000;
		s = Math.floor(value / 1000);
		value %= 1000;
		ms = Math.floor(value / 10);

		time += (a) ? ((a == 1) ? a + ' Year, ' : a + ' Years, ') : '';
		time += (d) ? ((d == 1) ? d + ' Day, ' : d + ' Days, ') : '';
		time += (h > 9) ? h + ':' : "0" + h + ':';
		time += (m > 9) ? m + ':' : (m == 0) ? "0" + m + ':' : "0" + m + ':';
		time += (s > 9) ? s + '.' : "0" + s + '.';
		time += (ms >= 10) ? ms : (ms < 10 && ms >= 0) ? "0" + ms : "00" + ms;

		return time;
	}

	function highlight(element) {
		var links = $('c2').getElementsByTagName('div');
		for (var i = 0; i < links.length; i++) {
			links[i].className = 'song';
		}
		element.className = 'highlight song'
	}

	function $(e) {
		return document.getElementById(e);
	}

	function ajax(url, param, func) {

		var base = '/proxy.php', x = new XMLHttpRequest(), str = "", res, path;

		for (var a in param) {
			if (param.hasOwnProperty(a)) {
				str += a + '=' + param[a] + '&';
			}
		}

		// loading spinner
		if ($('spinner').style.display == "none") {
			$('spinner').style.display = "inline-block";
		}

		path = base + url + '?' + str;

		x.open('get', path, true);
		x.send(null);
		x.onreadystatechange = function () {
			if (x.readyState == 4) {

				$('spinner').style.display = "none";

				if (x.status == 200) {

					$('spinner').style.display = "none";

					res = JSON.parse(x.responseText);

					if (!res.error) {
						if (res.data)
							func(res.data); else
							throw new Error('No data available for ' + path);
					} else {
						alert('This Error occured: ' + res.error);
					}

				} else {

					throw new Error('Http error ' + x.status + ' occured during an ajax request to ' + path);
				}
			}
		}
	}

	function timeIsOver() {

		var audio = new Audio();
		audio.src = '../sounds/alarm.wav';
		audio.volume = 1;
		audio.addEventListener('canplay', function () {
			audio.play();
			document.body.style.background = "rgb(100,0,0)";
			var notification = alert('Your Time Is Over!');

			if (notification == undefined) {
				audio.pause();
				document.body.style.background = "url(img/bg.jpg) black";
			}
		}, false);
	}


	//Clock
	function Clock() {

		var weekdays = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
			months = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");


		this.showTime = function () {
			$("digitalclock").innerHTML = new Date().toLocaleTimeString().substr(0, 8);

			setTimeout(function () {
				clock.showTime();
			}, 200);
		};

		this.showDate = function () {
			var date = new Date();

			$("date").innerHTML = weekdays[date.getDay()] + ", " + date.getDate() + "." + months[date.getMonth()] + " " + date.getFullYear();

			setTimeout(function () {
				clock.showDate()
			}, 1000);
		};
	}

	//Alarm
	function Alarm() {

		var now,
			alarmTimer,
			weekdays = new Array("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday");

		this.check = function (time, days, sound) {
			now = new Date();

			if (time == now.toLocaleTimeString().substr(0, 5)) {
				days.forEach(function (day) {
					if (day == weekdays[now.getDay()]) {
						clearTimeout(alarmTimer);
						timeIsOver();
					}
				});
			} else {
				alarmTimer = window.setTimeout(function () {
					alarm.check(time, days, sound);
				}, 900);
			}
		};
	}

	//Stopwatch
	function Stopwatch() {

		var timer,
			startTime = 0,
			time = 0,
			firstTime = true,
			isRunning = false,
			roundCounter = 0,
			lastRound = 0;


		this.startStop = function () {

			if (!isRunning) {
				if (firstTime) {
					startTime = new Date();
					firstTime = false;
				}

				isRunning = true;

				stopwatch.showTime();

				$("stopwatchStart").innerHTML = 'Stop';
				$("stopwatchReset").style.display = 'none';
				$("stopwatchRound").style.display = 'inline-block';

			} else {
				clearTimeout(timer);
				isRunning = false;
				$("stopwatchStart").innerHTML = 'Continue';
				$("stopwatchReset").style.display = 'inline-block';
				$("stopwatchRound").style.display = 'none';

			}
		};
		this.showTime = function () {
			if (isRunning) {
				var now = new Date();
				time = now - startTime;

				$("stopwatchDisplay").innerHTML = toHours(time);

				timer = window.setTimeout(function () {
					stopwatch.showTime();
				}, 10);

			} else {
				$("stopwatchDisplay").innerHTML = '00:00:00.00';
			}
		};
		this.showRound = function () {

			$('rounds').style.display = 'inline-block';

			DOMinate(
				[$('rounds'),
					['tr',
						['td', String(++roundCounter)],
						['td', toHours(time)],
						['td', toHours(time - lastRound)]
					]
				]
			);

			lastRound = time;
		};
		this.reset = function () {
			firstTime = true;
			roundCounter = 0;
			lastRound = 0;

			$("stopwatchDisplay").innerHTML = '00:00:00.00';
			$("stopwatchStart").innerHTML = 'Start';
			$("stopwatchReset").style.display = 'none';
			$("rounds").style.display = 'none';
			$("rounds").innerHTML = '<tr><th>Round</th><th>Time</th><th>Duration</th></tr>';
		};
	}

	//Timer
	function Countdown() {
		var	timer,
			rest,
			endTime,
			leftTime = 0;

		this.start = function (value) {
			endTime = value;

			countdown.showTime();
		};

		this.showTime = function () {

			leftTime = endTime - new Date();

			$('rest').innerHTML = toHours(leftTime);

			if (leftTime <= 0) {
				clearTimeout(timer);
				timeIsOver();
			} else {
				timer = setTimeout(function () {
					countdown.showTime();
				}, 10);
			}
		};
	}


	function route(state) {

		// History object or URL
		if (typeof(state) == "object") {

			if (state.url !== undefined) {
				fromURL(state.url);
			} else {
				throw new Error('History Object does not contain an URL: ' + state.url);
			}

		} else if (typeof(state) == "string") {
			fromURL(state);
		} else {
			throw new Error('The variable passed to route() is not an object or a string: ' + state);
		}

		function fromURL(url) {
			var dirs = url.split('/');

			if (url == '' || url == '/') {
				view().index();
			} else if (dirs.length == 1) {
				switch (dirs[0]) {
					case 'clock':
						view().clock();
						break;
					case 'alarm':
						view().alarm();
						break;
					case 'stopwatch':
						view().stopwatch();
						break;
					case 'timer':
						view().timer();
						break;
					default:
						var error = 'The Website "' + dirs[0] + '" is not available';

						alert(error);
						throw new Error(error);
				}

			} else if (dirs.length == 2) {

				throw new Error('The URL is too long:' + url);

			} else {
				alert('The website is not available');
				throw new Error('Can not route the URL ' + url);
			}
		}
	}

	function view() {

		function show(el) {
			$('home').style.display = 'none';
			$('alarmwrapper').style.display = 'none';
			$('clockwrapper').style.display = 'none';
			$('stopwatchwrapper').style.display = 'none';
			$('timerwrapper').style.display = 'none';

			$(el).style.display = 'block';
		}

		return{
			index: function () {
				show('home');
			},

			clock: function () {
				show('clockwrapper');
				clock.showTime();
				clock.showDate();
			},

			alarm: function () {
				show('alarmwrapper');
			},

			stopwatch: function () {
				show('stopwatchwrapper');
			},

			timer: function () {
				show('timerwrapper');
			}
		};
	}

	function setShortcuts() {
		addEventListener('keyup', function (e) {

			switch (e.keyCode) {
				case 32: //spacebar
					break;
			}

		}, false);

		addEventListener('keydown', function (e) {

			switch (e.keyCode) {
				case 37: //left
					break;
				case 39: //right
					break;
				case 38: //up
					break;
				case 40: //down
					break;
			}

		}, false);

	}

	function initEvents() {

		$('logo').addEventListener('click', function () {
			view().index();

			var url = '/';
			history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('clock').addEventListener('click', function () {
			view().clock();

			var url = 'clock';
			history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('alarm').addEventListener('click', function () {
			view().alarm();

			var url = 'alarm';
			history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('stopwatch').addEventListener('click', function () {
			view().stopwatch();

			var url = 'stopwatch';
			history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('timer').addEventListener('click', function () {
			view().timer();

			var url = 'timer';
			history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('startTimer').addEventListener('click', function (e) {
			e.preventDefault();

			$('name').innerHTML = '';

			var dur = $('timerTime').value.split(':'),
				endTime = new Date((dur[0] * 60 * 60 * 1000) + (dur[1] * 60 * 1000) + (dur[2] * 1000) + new Date().getTime());

			countdown.start(endTime);
			countdown.showTime();

			//var url = 'timer';
			//history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('startCountdown').addEventListener('click', function (e) {
			e.preventDefault();

			var endTime = new Date($('countdownDate').value + 'T' + $('countdownTime').value);
			$('name').innerHTML = $('countdownName').value;

			countdown.start(endTime);
			countdown.showTime();

			//var url = 'timer';
			//history.pushState({"url": url}, url, baseURL + url);
		}, false);

		$('setAlarm').addEventListener('click', function (e) {
			e.preventDefault();

			var days = [],
				inputs = $('alarmDays').getElementsByTagName('input');

			for (var a in inputs) {
				if (inputs.hasOwnProperty(a)) {
					if (inputs[a].checked)
						days.push(inputs[a].id);
				}
			}

			alarm.check($('alarmTime').value, days, $('alarmSound').value);

			//var url = 'timer';
			//history.pushState({"url": url}, url, baseURL + url);
		}, false);


		stopwatch.showTime();

		$('stopwatchStart').addEventListener('click', function () {
			stopwatch.startStop();
		}, false);

		$('stopwatchRound').addEventListener('click', function () {
			stopwatch.showRound();
		}, false);

		$('stopwatchReset').addEventListener('click', function () {
			stopwatch.reset();
		}, false);


	}

	// Initialize Website
	(function () {
		var path = location.pathname.substr(baseURL.length + 1, location.pathname.length);

		history.replaceState({"url": path}, path, baseURL + '/' + path);

		initEvents();

		route(path);

		//setShortcuts();

		//Popstate
		window.addEventListener('popstate', function (event) {
			if (event.state != null) {
				route(event.state);
			} else {
				throw new Error('Can\'t route the event "' + event.state + '".');
			}

		}, false);

	})();

}(window, document));