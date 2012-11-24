(function (window, document, undefined) {

	var baseURL = '/~adrian/timeomat',
		clock = new Clock(),
	//alarm = new Alarm(),
		stopwatch = new Stopwatch(),
		countdown = new Countdown(),
		presentView = '';

	function $(e) {
		return document.querySelector(e);
	}

	function capitalise(string){
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function toHours(value) {

		var time = '',
			a,
			d,
			h,
			m,
			s,
			ms,
			floor = Math.floor;

		value = (value >= 0) ? value : 0;

		a = floor(value / 31536000000);
		value %= 31536000000;
		d = floor(value / 86400000);
		value %= 86400000;
		h = floor(value / 3600000);
		value %= 3600000;
		m = floor(value / 60000);
		value %= 60000;
		s = floor(value / 1000);
		value %= 1000;
		ms = floor(value / 10);

		time += (a) ? ((a == 1) ? a + ' Year, ' : a + ' Years, ') : '';
		time += (d) ? ((d == 1) ? d + ' Day, ' : d + ' Days, ') : '';
		time += (h > 9) ? h + ':' : '0' + h + ':';
		time += (m > 9) ? m + ':' : (m == 0) ? '0' + m + ':' : '0' + m + ':';
		time += (s > 9) ? s + '.' : '0' + s + '.';
		time += (ms >= 10) ? ms : (ms < 10 && ms >= 0) ? '0' + ms : '00' + ms;

		return time;
	}

	function setState(url) {
		history.pushState({'url': url}, url, baseURL + '/' + url);
	}

	function timeIsOver() {

		function setFavicon(state) {
			var fav = $('#favicon');

			if (state == null)
				fav.href = 'img/favicon.png';
			else if (state == 'warn')
				fav.href = 'img/favicon2.png';
		}

		var audio = new Audio();
		audio.src = 'sounds/alarm.wav';
		audio.volume = 1;
		audio.addEventListener('canplay', function () {
			audio.play();
			setFavicon('warn');
			setTitle('+++ Time is up! +++');
			//document.documentElement.style.background = 'rgb(100,0,0)';
			var notification = alert('Your Time Is Up!');

			if (notification === undefined) {
				audio.pause();
				document.documentElement.style.background = 'url(img/bg.jpg) black';
				setFavicon();
				setTitle('Timeomat')
			}
		}, false);
	}

	function setTitle(value) {
		document.title = value;
	}


	function Clock() {

		var weekdays = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
			months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

		this.showTime = function () {
			$('#digitalclock').innerHTML = new Date().toLocaleTimeString().substr(0, 8);

			setTimeout(function () {
				clock.showTime();
			}, 200);
		};

		this.showDate = function () {
			var date = new Date();

			$('#date').innerHTML = weekdays[date.getDay()] + ', ' + date.getDate() + '.' + months[date.getMonth()] + ' ' + date.getFullYear();

			setTimeout(function () {
				clock.showDate();
			}, 1000);
		};
	}

	/*function Alarm() {

	 var now,
	 alarmTimer,
	 weekdays = new Array('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

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
	 */

	function Stopwatch() {

		var timer,
			startTime = 0,
			time = 0,
			firstTime = true,
			isRunning = false,
			roundCounter = 0,
			lastRound = 0,
			stopwatchDisplay = $('#stopwatchDisplay'),
			stopwatchStart = $('#stopwatchStart'),
			stopwatchReset = $('#stopwatchReset'),
			stopwatchRound = $('#stopwatchRound'),
			table = $('#rounds');


		this.startStop = function () {

			if (!isRunning) {
				if (firstTime) {
					startTime = new Date();
					firstTime = false;
				}

				isRunning = true;

				stopwatch.showTime();

				stopwatchStart.innerHTML = 'Stop';
				stopwatchReset.style.display = 'none';
				stopwatchRound.style.display = 'inline-block';

			} else {
				clearTimeout(timer);
				isRunning = false;
				stopwatchStart.innerHTML = 'Continue';
				stopwatchReset.style.display = 'inline-block';
				stopwatchRound.style.display = 'none';
			}
		};

		this.showTime = function () {

			if (isRunning) {
				var now = new Date();
				time = now - startTime;

				stopwatchDisplay.innerHTML = toHours(time);

				timer = window.setTimeout(function () {
					stopwatch.showTime();
				}, 10);

			} else {
				stopwatchDisplay.innerHTML = '00:00:00.00';
			}
		};

		this.showRound = function () {

			table.classList.remove('hidden');

			DOMinate(
				[table.lastElementChild,
					['tr',
						['td', String(++roundCounter)],
						['td', toHours(time - lastRound)],
						['td', toHours(time)]
					]
				]
			);

			lastRound = time;
		};

		this.reset = function () {
			firstTime = true;
			roundCounter = 0;
			lastRound = 0;

			stopwatchDisplay.innerHTML = '00:00:00.00';
			stopwatchStart.innerHTML = 'Start';
			stopwatchReset.style.display = 'none';
			table.classList.add('hidden');
			table.lastElementChild.innerHTML = '';
		};
	}

	function Timer(endTime) {
		var timeoutTimer,
			leftTime = endTime - new Date(),
			running = false,
			delayStart,
			timerElement,
			pauseButton,
			cancelButton;

		function update() {
			leftTime = endTime - new Date();

			timerElement.firstChild.innerHTML = toHours(leftTime);
			//setTitle(toHours(leftTime));

			if (leftTime <= 0) {
				clearTimeout(timeoutTimer);
				timerElement.childNodes[1].removeChild(pauseButton);
				timeIsOver();
			} else {
				timeoutTimer = setTimeout(update, 10);
			}
		}

		function pauseResume() {
			if (running) {
				pauseButton.innerHTML = 'Resume';
				clearTimeout(timeoutTimer);
				delayStart = new Date();
				running = false;
			} else {
				pauseButton.innerHTML = 'Pause';
				endTime.setTime(endTime.getTime() + (new Date() - delayStart));
				timeoutTimer = setTimeout(update, 10);
				running = true;
			}
		}

		function cancel() {
			timerElement.parentNode.removeChild(timerElement);
			clearTimeout(timeoutTimer);
		}

		this.start = function () {
			running = true;
			update();
		};


		pauseButton = DOMinate(['button', 'Pause']);
		pauseButton.addEventListener('click', pauseResume);

		cancelButton = DOMinate(['button', 'x']);
		cancelButton.addEventListener('click', cancel);

		timerElement = DOMinate(
			['div',
				['span', toHours(leftTime)],
				['div',
					[pauseButton],
					[cancelButton]
				]
			]
		);

		DOMinate([$('#timers'), [timerElement]]);
	}

	function Countdown() {
		var timer,
			rest,
			endTime,
			leftTime = 0;

		this.start = function (value) {
			endTime = value;
		};

		this.showTime = function () {

			leftTime = endTime - new Date();


			//$('#rest').innerHTML = toHours(leftTime);

			if (leftTime <= 0) {
				clearTimeout(timer);
				timeIsOver();
			} else {
				timer = setTimeout(countdown.showTime, 10);
			}
		};
	}

	function Worldclock() {

	}


	function route(state) {

		// History object or URL
		if (typeof (state) === 'object') {

			if (state.url !== undefined) {
				fromURL(state.url);
			} else {
				throw new Error('History Object does not contain an URL: ' + state.url);
			}

		} else if (typeof(state) === 'string') {
			fromURL(state);
		} else {
			throw new Error('The variable passed to route() is not an object or a string: ' + state);
		}

		function fromURL(url) {
			var dirs = url.split('/');

			if (dirs.length == 1) {

				var pages = [
					'clock',
					'alarm',
					'stopwatch',
					'timer',
					'countdown',
					'worldclock'
				];

				if (pages.indexOf(dirs[0]) >= 0) {
					viewPage(dirs[0]);
				}else if (url === '' || url === '/') {
					viewPage('home');
				} else {
					var error = 'The Website "' + dirs[0] + '" is not available';
					viewPage('home');

					alert(error);
					throw new Error(error);
				}

			} else if (dirs.length == 2) {

				throw new Error('The URL is too long:' + url);

			} else {

				throw new Error('Can not route the URL ' + dirs);
			}
		}
	}

	function viewPage(page) {
		try {
			if (page != presentView) {
				$('#' + page + 'wrapper').classList.remove('hidden');
				$('#' + presentView + 'wrapper').classList.add('hidden');

				setTitle( capitalise(page) +' | Timeomat');
			}
		} catch (e) {
		}

		presentView = page;
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

		var menuItems = [
			'clock',
			//'alarm',
			'stopwatch',
			'timer',
			'countdown',
			//'worldclock'
		];

		menuItems.forEach(function (e) {
			$('#' + e).addEventListener('click', function () {
				viewPage(e);
				setState(e);
			}, false);
		});

		$('#home').addEventListener('click', function () {
			viewPage('home');
			setState('');
		}, false);



		$('#startTimer').addEventListener('click', function (e) {
			e.preventDefault();

			var dur = $('#timerTime').value.split(':'),
				endTime = new Date((dur[0] * 60 * 60 * 1000) + (dur[1] * 60 * 1000) + (dur[2] * 1000) + new Date().getTime());

			var timer = new Timer(endTime);
			timer.start();

			//var url = 'timer';
			//history.pushState({'url': url}, url, baseURL + url);
		}, false);

		/*
		 $('#startCountdown').addEventListener('click', function (e) {
		 e.preventDefault();

		 var endTime = new Date($('#countdownDate').value + 'T' + $('#countdownTime').value);
		 $('#name').innerHTML = $('#countdownName').value;

		 countdown.start(endTime);
		 countdown.showTime();

		 //var url = 'timer';
		 //history.pushState({'url': url}, url, baseURL + url);
		 }, false);

		 $('#setAlarm').addEventListener('click', function (e) {
		 e.preventDefault();

		 var days = [],
		 inputs = $('#alarmDays').getElementsByTagName('input');

		 for (var a in inputs) {
		 if (inputs.hasOwnProperty(a)) {
		 if (inputs[a].checked)
		 days.push(inputs[a].id);
		 }
		 }

		 alarm.check($('#alarmTime').value, days, $('#alarmSound').value);

		 //var url = 'timer';
		 //history.pushState({'url': url}, url, baseURL + url);
		 }, false);
		 */

		clock.showTime();
		clock.showDate();

		stopwatch.showTime();

		$('#stopwatchStart').addEventListener('click', function () {
			stopwatch.startStop();
		}, false);

		$('#stopwatchRound').addEventListener('click', function () {
			stopwatch.showRound();
		}, false);

		$('#stopwatchReset').addEventListener('click', function () {
			stopwatch.reset();
		}, false);


	}

	// Initialize Website
	function init() {

		var path = location.pathname.substr(baseURL.length + 1, location.pathname.length);

		history.replaceState({'url': path}, path, baseURL + '/' + path);

		initEvents();

		route(path);

		//setShortcuts();

		//preload favicon
		new Image().src = 'img/favicon2.png';

		//Popstate
		window.addEventListener('popstate', function (event) {

			try {
				if (event.state !== null)
					route(event.state);
				else
					throw new Error('Can not route the event "' + event.state + '".');

			} catch (e) {

			}

		}, false);
	}

	init();

}(window, document));