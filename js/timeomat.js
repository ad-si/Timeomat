(function(window, document, undefined) {

	var clock = new Clock(),
	//alarm = new Alarm(),
		stopwatch = new Stopwatch(),
		presentView = '',
		presentTitle,
		i,
		routor = new Routor({
			//'^/$': '/countdown',
			'^/$': viewPage,
			'^/clock$': viewPage,
			'^/alarm$': viewPage,
			'^/stopwatch': viewPage,
			'^/worldclock$': viewPage,
			'^/stopwatch/start$': stopwatch.start,


			'^/timer': viewPage,
			'^/timer/(\\d*:\\d*:\\d*)$': function(params) {

				$('#timers').innerHTML = ''

				new Timer(toEndTime(params[1])).start()
			},
			'^/(\\d+:\\d+:\\d+)$': '/timer/$1',
			'^/(?:(\\d+)h)?(?:(\\d+)(?:m|min))?(?:(\\d+)(?:s|sec|sek))?$': function(params) {

				var array = params.slice(1, 4)

				if(array.join('')) {

					viewPage('/timer')

					new Timer(toEndTime(array.join(':'))).start()
				}

			},
			'^/nap$': '/timer/00:20:00',
			'^/brushteeth$': '/timer/00:05:00',
			'^/quickie|quicky$': '/timer/00:10:00',

			'^/countdown': viewPage,
			'^/countdown/(.+)/(\\d{4}-\\d{2}-\\d{2}t\\d{2}:\\d{2})$': function(params) {

				$('#countdowns').innerHTML = ''

				new Countdown(new Date(params[2]))
					.name(decodeURIComponent(params[1]))
					.start()
			},
			'^/christmas|xmas|x-mas$': '/countdown/Christmas/2013-12-24T20:00',
			'^/newyear|new-year|new year$': '/countdown/New Year/2013-12-24T20:00',
			'^/test/(.*)': function(params) {
				console.log(decodeURIComponent(params[1]))
			},

			'^/error$': viewPage
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

			if(state == null)
				fav.href = 'img/favicon.png'
			else if(state == 'warn')
				fav.href = 'img/favicon2.png'
		}

		var audio = new Audio()
		audio.src = 'sounds/alarm.wav'
		audio.volume = 1
		audio.addEventListener('canplay', function() {
			audio.play()
			setFavicon('warn')
			setTitle('+++ Time is up! +++')
			//document.documentElement.style.background = 'rgb(100,0,0)'
			var notification = alert('Your Time Is Up!')

			if(notification === undefined) {
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

		this.showTime = function() {

			var date = new Date()

			$('#digitalclock').innerHTML = toSimpleTimeString(date.getTime() - date.getTimezoneOffset() * 60000)

			setTimeout(function() {
				clock.showTime()
			}, 200)
		}

		this.showDate = function() {
			var d = new Date()

			$('#date').innerHTML = weekdays[d.getDay()] + ', ' + d.getDate() + '.' + months[d.getMonth()] + ' ' + d.getFullYear()

			setTimeout(function() {
				clock.showDate()
			}, 1000)
		}
	}

	function Alarm() {

		var now,
			alarmTimer,
			weekdays = new Array('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')

		this.check = function(time, days, sound) {
			now = new Date()

			if(time == now.toLocaleTimeString().substr(0, 5)) {
				days.forEach(function(day) {
					if(day == weekdays[now.getDay()]) {
						clearTimeout(alarmTimer)
						timeIsOver()
					}
				})
			} else {
				alarmTimer = window.setTimeout(function() {
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

		function start() {

			if(!isRunning) {
				if(firstTime) {
					startTime = new Date()
					firstTime = false
				}

				isRunning = true

				stopwatch.showTime()

				stopwatchStart.innerHTML = 'Stop'
				stopwatchReset.classList.add('hidden')
				stopwatchRound.classList.remove('hidden')
			}
		}

		function stop() {

			clearTimeout(timer)
			isRunning = false
			stopwatchStart.innerHTML = 'Continue'
			stopwatchReset.classList.remove('hidden')
			stopwatchRound.classList.add('hidden')
		}

		this.startStop = function() {

			if(!isRunning)
				start()
			else
				stop()
		}

		this.showTime = function() {

			if(isRunning) {
				var now = new Date()
				time = now - startTime

				stopwatchDisplay.innerHTML = toTimeString(time)

				if(tableStatus) {
					nextRound.innerHTML = roundCounter + 1
					nextDuration.innerHTML = toTimeString(time - lastRound)
					nextTime.innerHTML = toTimeString(time)
				}

				timer = window.setTimeout(function() {
					stopwatch.showTime()
				}, 10)

			} else {
				stopwatchDisplay.innerHTML = '00:00:00.00'
			}
		}

		this.showRound = function() {

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

		this.reset = function() {
			firstTime = true
			roundCounter = 0
			lastRound = 0

			stopwatchDisplay.innerHTML = '00:00:00.00'
			stopwatchStart.innerHTML = 'Start'
			stopwatchReset.classList.add('hidden')
			table.classList.add('hidden')


			var rows = document.querySelectorAll('.row')

			for(var a = 0; a < rows.length; a++) {
				removeElement(rows[a]);
			}
		}

		this.start = start
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
							['button$pauseButton', 'Pause', function(e) {
								e.addEventListener('click', pauseResume)
							}],
							['button', 'X', function(e) {
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

			if(leftTime <= 0) {
				clearTimeout(timeout)
				removeElement(timer.pauseButton)
				timeIsOver()
			} else {
				timeout = setTimeout(update, 10)
			}
		}

		function pauseResume() {
			if(running) {
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

		this.start = function() {
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
			countdowns = $('#countdowns'),
			countdown = DOMinate(
				[countdowns,
					['div$el',
						['div',
							['p$name'],
							['time$time', toTimeString(leftTime)]
						],
						['div',
							['button$cancelButton', 'X', function(e) {
								e.addEventListener('click', cancel)
							}]
						]
					]
				]
			);


		function update() {
			leftTime = endTime - new Date()

			countdown.time.innerHTML = toTimeString(leftTime)
			//setTitle(toTimeString(leftTime))

			if(leftTime <= 0) {
				clearTimeout(timeout)
				removeElement(countdown.pauseButton)
				timeIsOver()
			} else {
				timeout = setTimeout(update, 10)
			}
		}

		function pauseResume() {
			if(running) {
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
			removeElement(countdown.el)
			clearTimeout(timeout)
		}


		this.name = function(value) {
			name = value
			return this
		}

		this.start = function() {
			update()
			countdown.name.innerHTML = name || ' '
			running = true
			return this
		}


	}

	function Worldclock() {

	}


	function viewPage(params) {

		var page,
			url,
			title,
			wrapper = $('.wrapper')

		if(typeof params !== 'string')
			url = params[0]
		else
			url = params

		page = (url == '/') ? 'home' : url.split('/')[1]

		//console.log(page)

		if(page != presentView) {

			for(i = 0; i < wrapper.length; i++)
				wrapper[i].classList.remove('visible')

			$('#' + page + 'wrapper').classList.add('visible')

			title = capitalise(page) + ' | Timeomat';
			setTitle(title)
			presentTitle = title
		}

		presentView = page
	}

	function Shinebox() {

		var height = ''
		/*
		 new Shinebox()
		 .setContent()
		 .show()
		 */

	}

	/*
	 function Poopup(contentClass) {

	 var contentItems = contentClass || '.cOverlay';
	 var template = $(
	 '<div class="overlay">' +
	 '<div class="content">' +
	 '<div class="close">close</div>' +
	 '</div>' +
	 '</div>'
	 );

	 var overlay = template.css({
	 'position': 'absolute',
	 'width': '100%',
	 'height': '100%',
	 'backgroundColor': '#555',
	 'top': '0',
	 'left': '0',
	 'display': 'none'
	 });
	 var content = template.find(".content").css({
	 'float': 'left',
	 'backgroundColor': '#fff'

	 });
	 var close = template.find(".close");

	 content.append($(contentItems));
	 $(contentItems).show();

	 this.click(function () {

	 overlay.show();
	 content.show();


	 var height = $(document).height() / 2 - content.height() / 2;
	 var width = $(document).width() / 2 - content.width() / 2;

	 content.css('marginTop', height);
	 content.css('marginLeft', width);

	 return false;
	 });

	 content.click(function (e) {
	 e.stopPropagation();
	 return false;
	 });

	 close.click(function () {
	 overlay.hide();
	 content.hide();
	 return false;
	 });


	 overlay.click(function () {
	 overlay.hide();
	 content.hide();
	 return false;
	 });

	 $(window).resize(function () {
	 var height = $(document).height() / 2 - content.height() / 2;
	 var width = $(document).width() / 2 - content.width() / 2;
	 content.css('marginTop', height);
	 content.css('marginLeft', width);
	 });

	 $('body').append(template);
	 }
	 */

	function ShortcutsWindow() {

		var shortcuts = {
				'side wide': [
					[
						['?'],
						'Bring up this Shortcut Reference',
						function() {
						}
					],
					[
						['c'],
						'Switch to Clock Tab',
						function() {
						}
					],
					[
						['s'],
						'Switch to Stopwatch Tab',
						function() {
						}
					],
					[
						['t'],
						'Switch to Timer Tab',
						function() {
						}
					],
					[
						['d'],
						'Switch to Countdown Tab',
						function() {
						}
					]
				],
				'clock': [
					[
						['a'],
						'Toggle between Analog and Digital Clock',
						function() {
						}
					]
				],
				'timer': [
					[
						['spacebar'],
						'Pause/Resume last Timer',
						function() {
						}
					],
					[
						['n'],
						'Start New Timer',
						function() {
						}
					]
				],
				'stopwatch': [
					[
						['spacebar'],
						'Start/Pause the Stopwatch',
						function() {
						}
					],
					[
						['r'],
						'New Round',
						function() {
						}
					],
					[
						['x'],
						'Reset Stopwatch',
						function() {
						}
					]
				],
				'countdown': [
					[
						['x'],
						'Remove most recent Countdown',
						function() {
						}
					]
				]
			},
			content = ['div.content',
				['header',
					['h1', 'Keyboard Shortcuts']
				]
			],
			body,
			visible = false


		function Key(string) {

			string = string.toLowerCase()

			var object,
				keys = {
					shift: {
						character: '⇧',
						type: 'modifier'
					},
					alt: {
						character: '⌥',
						type: 'modifier'
					},
					ctrl: {
						character: '⌃',
						type: 'modifier'
					},
					cmd: {
						character: '⌘',
						type: 'modifier'
					},
					spacebar: {
						character: ' ',
						type: 'spacebar'
					}
				}

			this.get = function() {

				if(keys[string])
					object = keys[string]
				else
					object = {
						'type': '',
						'character': string
					}

				return object
			}
		}


		this.toggle = function() {

			function hide(event) {

				console.log(event)

				if(event) {
					event.stopPropagation()

					if(event.keyCode != 27 && event.type != 'click')
						return
				}

				body.shinebox.style.display = "none"
				visible = false
			}


			function stopPropagation(event) {
				event.stopPropagation()
			}

			if(visible) {
				hide()

				removeEventListener('keydown', hide, false)
				body.shinebox.removeEventListener('click', stopPropagation, false)
				document.removeEventListener('click', hide, false)

			} else {
				body.shinebox.style.display = "block"
				visible = true

				addEventListener('keydown', hide, false)
				body.shinebox.addEventListener('click', stopPropagation, false)
				document.addEventListener('click', hide, false)
			}
		}


		for(var i in shortcuts) {
			if(shortcuts.hasOwnProperty(i)) {

				var section = ['section', ['h2', i]],
					keys

				shortcuts[i].forEach(function(item) {

					var combo = ['span.keys']


					item[0].forEach(function(k) {
						keys = k.split('+')


						keys.forEach(function(key) {

							key = new Key(key).get()

							combo.push(['kbd', {'class': 'key ' + key.type}, key.character], '+')
						})

						combo.pop()
					})

					section.push(
						['p',
							combo,
							['span', item[1]]
						]
					)
				})
			}

			content.push(section)
		}

		body = DOMinate(
			[document.body,
				['div#shinebox',
					['div.wrap',
						content
					]
				]
			]
		)
	}

	function initEventListeners() {

		var menuItems = [
			'home',
			'clock',
			//'alarm',
			'stopwatch',
			'timer',
			'countdown'
			//'worldclock'
		]

		menuItems.forEach(function(item) {
			$('#' + item).addEventListener('click', function(event) {
				event.preventDefault()

				if(item == 'home')
					routor.route('/')
				else
					routor.route('/' + item)
			}, false)
		})

		$('#startTimer').addEventListener('click', function(e) {

			e.preventDefault()

			new Timer(toEndTime($('#timerTime').value)).start()

			//routor.route('/timer/' + $('#timerTime').value)

		}, false)

		$('#startCountdown').addEventListener('click', function(e) {
			e.preventDefault()

			new Countdown(new Date($('#countdownDate').value + 'T' + $('#countdownTime').value))
				.name($('#countdownName').value)
				.start()

		}, false)

		/*
		 $('#showFullscreen').addEventListener('click', function () {

		 routor.route('/countdown/' +
		 $('#countdownName').value +
		 '/' +
		 $('#countdownDate').value +
		 'T' +
		 $('#countdownTime').value)
		 })
		 */

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

		$('#stopwatchStart').addEventListener('click', function() {
			stopwatch.startStop()
		}, false)

		$('#stopwatchRound').addEventListener('click', function() {
			stopwatch.showRound()
		}, false)

		$('#stopwatchReset').addEventListener('click', function() {
			stopwatch.reset()
		}, false)
	}

	initEventListeners()


	//Preload favicon
	new Image().src = 'img/favicon2.png'

	routor.route()

	var shortcutsWindow = new ShortcutsWindow()

	key('shift+/', function() {
		shortcutsWindow.toggle()
	})


}(window, document))