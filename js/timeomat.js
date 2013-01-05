(function (window, document, undefined) {

	var clock = new Clock(),
	//alarm = new Alarm(),
		stopwatch = new Stopwatch(),
		presentView = '',
		presentTitle,
		i,
		routor = new Routor({
			'^/$': viewPage,
			'^/clock$': viewPage,
			'^/alarm$': viewPage,
			'^/stopwatch$': viewPage,
			'^/worldclock$': viewPage,
			'^/stopwatch/start$': [viewPage, stopwatch.startStop],


			'^/timer': viewPage,
			'^/timer/(\\d+:\\d+:\\d+)$': function (params) {

				new Timer(toEndTime(params[1])).start()

				console.log(toEndTime(params[1]))
			},
			'^/nap$': '/timer/00:20:00',
			'^/brushteeth$': '/timer/00:05:00',
			'^/quickie|quicky$': '/timer/00:10:00',

			'^/countdown': function (params) {
				viewPage(params)
			},
			'^/countdown$': function (params) {
				$('#countdownControls').classList.remove('hidden')
				$('#countdowns').classList.add('hidden')
			},
			'^/countdown/(.+)/(\\d{4}-\\d{2}-\\d{2}t\\d{2}:\\d{2})$': function (params) {

				new Countdown(new Date(params[2]))
					.name(decodeURIComponent(params[1]))
					.start()

				$('#countdowns').classList.remove('hidden')
			},
			'^/christmas|xmas|x-mas$': '/countdown/Christmas/2013-12-24T20:00',
			'^/newyear|new-year|new year$': '/countdown/New Year/2013-12-24T20:00',
			'^/test/(.*)': function (params) {
				console.log(decodeURIComponent(params[1]))
			},

			'^/error$': viewPage

			/*
			 '^/(\d+)\:(\d+)\:(\d+)$': function (ctx) {

			 //viewPage('timer')

			 //var endTime =  + (ctx.params[0] || 0)  + ':' + (ctx.params[3] || 0) + ':' + (ctx.params[7] || 0)

			 console.log(ctx.params)

			 //new Timer(toEndTime(endTime))
			 //	.start()
			 },
			 '^/([0-9]*h)?([0-9]*(m|min))?([0-9]*(s|sec|sek))?$': function (ctx) {

			 viewPage('timer')

			 var endTime = +(ctx.params[0] || 0) + ':' + (ctx.params[3] || 0) + ':' + (ctx.params[7] || 0)

			 console.log(ctx.params, endTime)

			 new Timer(toEndTime(endTime))
			 .start()
			 }
			 */
		})


	function $(query) {
		query = document.querySelectorAll(query)

		return (query[1]) ? query : query[0]
	}

	function capitalise(string) {
		return string.charAt(0).toUpperCase() + string.slice(1)
	}

	function removeElement(element) {
		element.parentNode.removeChild(element)
	}

	function toTimeString(value) {

		var time = '',
			a,
			d,
			h,
			m,
			s,
			ms,
			floor = Math.floor

		value = (value >= 0) ? value : 0

		a = floor(value / 31536000000)
		value %= 31536000000
		d = floor(value / 86400000)
		value %= 86400000
		h = floor(value / 3600000)
		value %= 3600000
		m = floor(value / 60000)
		value %= 60000
		s = floor(value / 1000)
		value %= 1000
		ms = floor(value / 10)

		time += (a) ? ((a == 1) ? a + ' Year, ' : a + ' Years, ') : ''
		time += (d) ? ((d == 1) ? d + ' Day, ' : d + ' Days, ') : ''
		time += (h > 9) ? h + ':' : '0' + h + ':'
		time += (m > 9) ? m + ':' : (m == 0) ? '0' + m + ':' : '0' + m + ':'
		time += (s > 9) ? s + '.' : '0' + s + '.'
		time += (ms >= 10) ? ms : (ms < 10 && ms >= 0) ? '0' + ms : '00' + ms

		return time
	}

	function toSimpleTimeString(value) {
		var time = '',
			a,
			d,
			h,
			m,
			s,
			ms,
			floor = Math.floor

		value = (value >= 0) ? value : 0

		a = floor(value / 31536000000)
		value %= 31536000000
		d = floor(value / 86400000)
		value %= 86400000
		h = floor(value / 3600000)
		value %= 3600000
		m = floor(value / 60000)
		value %= 60000
		s = floor(value / 1000)

		time += (h > 9) ? h + ':' : '0' + h + ':'
		time += (m > 9) ? m + ':' : (m == 0) ? '0' + m + ':' : '0' + m + ':'
		time += (s > 9) ? s : '0' + s

		return time
	}

	function toEndTime(duration) {
		var dur = duration.split(':')

		return  new Date((dur[0] * 60 * 60 * 1000) + (dur[1] * 60 * 1000) + (dur[2] * 1000) + new Date().getTime())
	}

	function setTitle(value) {
		document.title = value
	}

	function timeIsOver() {

		function setFavicon(state) {
			var fav = $('#favicon')

			if (state == null)
				fav.href = 'img/favicon.png'
			else if (state == 'warn')
				fav.href = 'img/favicon2.png'
		}

		var audio = new Audio()
		audio.src = 'sounds/alarm.wav'
		audio.volume = 1
		audio.addEventListener('canplay', function () {
			audio.play()
			setFavicon('warn')
			setTitle('+++ Time is up! +++')
			//document.documentElement.style.background = 'rgb(100,0,0)'
			var notification = alert('Your Time Is Up!')

			if (notification === undefined) {
				audio.pause()
				document.documentElement.style.background = 'url(img/bg.jpg) black'
				setFavicon()
				setTitle(presentTitle)
			}
		}, false)
	}


	function Clock() {

		var weekdays = [
				'Sunday',
				'Monday',
				'Tuesday',
				'Wednesday',
				'Thursday',
				'Friday',
				'Saturday'
			],

			months = ['January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'
			]

		this.showTime = function () {
			$('#digitalclock').innerHTML = new Date().toLocaleTimeString().substr(0, 8)

			setTimeout(function () {
				clock.showTime()
			}, 200)
		}

		this.showDate = function () {
			var d = new Date()

			$('#date').innerHTML = weekdays[d.getDay()] + ', ' + d.getDate() + '.' + months[d.getMonth()] + ' ' + d.getFullYear()

			setTimeout(function () {
				clock.showDate()
			}, 1000)
		}
	}

	function Alarm() {

		var now,
			alarmTimer,
			weekdays = new Array('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')

		this.check = function (time, days, sound) {
			now = new Date()

			if (time == now.toLocaleTimeString().substr(0, 5)) {
				days.forEach(function (day) {
					if (day == weekdays[now.getDay()]) {
						clearTimeout(alarmTimer)
						timeIsOver()
					}
				})
			} else {
				alarmTimer = window.setTimeout(function () {
					alarm.check(time, days, sound)
				}, 900)
			}
		}
	}

	function Stopwatch() {

		var timer,
			startTime = 0,
			time = 0,
			firstTime = true,
			isRunning = false,
			tableStatus = false,
			roundCounter = 0,
			lastRound = 0,
			stopwatchDisplay = $('#stopwatchDisplay'),
			stopwatchStart = $('#stopwatchStart'),
			stopwatchReset = $('#stopwatchReset'),
			stopwatchRound = $('#stopwatchRound'),
			table = $('#rounds'),
			nextRound = $('#nextRound'),
			nextDuration = $('#nextDuration'),
			nextTime = $('#nextTime')

		this.startStop = function () {

			if (!isRunning) {
				if (firstTime) {
					startTime = new Date()
					firstTime = false
				}

				isRunning = true

				stopwatch.showTime()

				stopwatchStart.innerHTML = 'Stop'
				stopwatchReset.classList.add('hidden')
				stopwatchRound.classList.remove('hidden')

			} else {
				clearTimeout(timer)
				isRunning = false
				stopwatchStart.innerHTML = 'Continue'
				stopwatchReset.classList.remove('hidden')
				stopwatchRound.classList.add('hidden')
			}
		}

		this.showTime = function () {

			if (isRunning) {
				var now = new Date()
				time = now - startTime

				stopwatchDisplay.innerHTML = toTimeString(time)

				if (tableStatus) {
					nextRound.innerHTML = roundCounter + 1
					nextDuration.innerHTML = toTimeString(time - lastRound)
					nextTime.innerHTML = toTimeString(time)
				}

				timer = window.setTimeout(function () {
					stopwatch.showTime()
				}, 10)

			} else {
				stopwatchDisplay.innerHTML = '00:00:00.00'
			}
		}

		this.showRound = function () {

			table.classList.remove('hidden')

			var row = DOMinate(
				[table.tBodies[0],
					['tr.row',
						['td', String(++roundCounter)],
						['td', toTimeString(time - lastRound)],
						['td', toTimeString(time)]
					]
				]
			)

			lastRound = time
			tableStatus = true
		}

		this.reset = function () {
			firstTime = true
			roundCounter = 0
			lastRound = 0

			stopwatchDisplay.innerHTML = '00:00:00.00'
			stopwatchStart.innerHTML = 'Start'
			stopwatchReset.classList.add('hidden')
			table.classList.add('hidden')


			var rows = document.querySelectorAll('.row')

			for (var a = 0; a < rows.length; a++) {
				removeElement(rows[a]);
			}
		}
	}

	function Timer(endTime) {
		var running = false,
			leftTime,
			timeout,
			delayStart,
			timer = DOMinate(
				[$('#timers'),
					['div$el',
						['span$time'],
						['div',
							['button$pauseButton', 'Pause', function (e) {
								e.addEventListener('click', pauseResume)
							}],
							['button', 'x', function (e) {
								e.addEventListener('click', cancel)
							}]
						]
					]
				]
			);

		function update() {
			leftTime = endTime - new Date()

			timer.time.innerHTML = toTimeString(leftTime)
			//setTitle(toTimeString(leftTime))

			if (leftTime <= 0) {
				clearTimeout(timeout)
				removeElement(timer.pauseButton)
				timeIsOver()
			} else {
				timeout = setTimeout(update, 10)
			}
		}

		function pauseResume() {
			if (running) {
				this.innerHTML = 'Resume'
				clearTimeout(timeout)
				delayStart = new Date()
				running = false
			} else {
				this.innerHTML = 'Pause'
				endTime.setTime(endTime.getTime() + (new Date() - delayStart))
				timeout = setTimeout(update, 10)
				running = true
			}
		}

		function cancel() {
			removeElement(timer.el)
			clearTimeout(timeout)
		}

		this.start = function () {
			running = true

			update()

			return this
		}
	}

	function Countdown(endTime) {
		var running = false,
			leftTime,
			timeout,
			delayStart,
			name,
			countdown,
			countdowns = $('#countdowns')

		function update() {
			leftTime = endTime - new Date()

			countdown.time.innerHTML = toTimeString(leftTime)
			//setTitle(toTimeString(leftTime))

			if (leftTime <= 0) {
				clearTimeout(timeout)
				removeElement(countdown.pauseButton)
				timeIsOver()
			} else {
				timeout = setTimeout(update, 10)
			}
		}

		function pauseResume() {
			if (running) {
				this.innerHTML = 'Resume'

				clearTimeout(timeout)
				delayStart = new Date()
				running = false
			} else {
				this.innerHTML = 'Pause'

				endTime.setTime(endTime.getTime() + (new Date() - delayStart))

				timeout = setTimeout(update, 10)
				running = true
			}
		}

		function cancel() {
			removeElement(countdown[0])
			clearTimeout(timeout)
		}


		this.name = function (value) {
			name = value
			return this
		}

		this.start = function () {
			$('#countdownControls').classList.add('hidden')
			update()
			countdown.name.innerHTML = name
			running = true
			return this
		}


		countdowns.innerHTML = ''

		countdown = DOMinate(
			[countdowns,
				['div$el',
					['h2$name'],
					['span$time', toTimeString(leftTime)]
					/*
					 ['div',
					 ['button$pauseButton', 'Pause', function (e) {
					 e.addEventListener('click', pauseResume)
					 }],
					 ['button$cancelButton', 'x', function (e) {
					 e.addEventListener('click', cancel)
					 }]
					 ]
					 */
				]
			]
		);


	}

	function Worldclock() {

	}


	function viewPage(params) {

		var page,
			url,
			title,
			wrapper = $('.wrapper')

		if (typeof params !== 'string')
			url = params[0]
		else
			url = params

		page = (url == '/') ? 'home' : url.split('/')[1]

		//console.log(page)

		if (page != presentView) {

			for (i = 0; i < wrapper.length; i++)
				wrapper[i].classList.remove('visible')

			$('#' + page + 'wrapper').classList.add('visible')

			title = capitalise(page) + ' | Timeomat';
			setTitle(title)
			presentTitle = title
		}

		presentView = page
	}

	function setShortcuts() {
		addEventListener('keyup', function (e) {

			switch (e.keyCode) {
				case 32: //spacebar
					break
			}

		}, false)

		addEventListener('keydown', function (e) {

			switch (e.keyCode) {
				case 37: //left
					break
				case 39: //right
					break
				case 38: //up
					break
				case 40: //down
					break
			}

		}, false)

	}

	function initEvents() {

		var menuItems = [
			'home',
			'clock',
			//'alarm',
			'stopwatch',
			'timer',
			'countdown'
			//'worldclock'
		]

		menuItems.forEach(function (item) {
			$('#' + item).addEventListener('click', function (event) {
				event.preventDefault()

				if (item == 'home')
					routor.route('/')
				else
					routor.route('/' + item)
			}, false)
		})

		$('#startTimer').addEventListener('click', function (e) {

			e.preventDefault()

			new Timer(toEndTime($('#timerTime').value)).start()

			//routor.route('/timer/' + $('#timerTime').value)

		}, false)

		$('#startCountdown').addEventListener('click', function (e) {
			e.preventDefault()

			routor.route('/countdown/' +
				$('#countdownName').value +
				'/' +
				$('#countdownDate').value +
				'T' +
				$('#countdownTime').value)

		}, false)

		/*
		 $('#setAlarm').addEventListener('click', function (e) {
		 e.preventDefault()

		 var days = [],
		 inputs = $('#alarmDays').getElementsByTagName('input')

		 for (var a in inputs) {
		 if (inputs.hasOwnProperty(a)) {
		 if (inputs[a].checked)
		 days.push(inputs[a].id)
		 }
		 }

		 alarm.check($('#alarmTime').value, days, $('#alarmSound').value)

		 //var url = 'timer'
		 //history.pushState({'url': url}, url, baseURL + url)
		 }, false)
		 */

		clock.showTime()
		clock.showDate()

		stopwatch.showTime()

		$('#stopwatchStart').addEventListener('click', function () {
			stopwatch.startStop()
		}, false)

		$('#stopwatchRound').addEventListener('click', function () {
			stopwatch.showRound()
		}, false)

		$('#stopwatchReset').addEventListener('click', function () {
			stopwatch.reset()
		}, false)

	}


	initEvents()

	//Preload favicon
	new Image().src = 'img/favicon2.png'

	routor.route()


}(window, document))