function Routor(routes) {

	var baseURL = '',
		relativePath = location.pathname,
	firstCall = true

	console.log(location.pathname)

	function execRoute(path) {

		var available = false

		for (var direction in routes) {
			if (routes.hasOwnProperty(direction)) {

				var pattern = new RegExp(direction, "ig"),
					result = pattern.exec(path);

				if (result) {

					//If Function
					if (routes[direction].call) {

						routes[direction](result)


					} else

					//If Array
					if (routes[direction].pop) {

						routes[direction].forEach(function (func) {
							func(result)
						})


					} else

					//If String
					if (routes[direction].big)
						showRoute(routes[direction])

					available = true
				}
			}
		}

		return available
	}

	function route(path) {

		path = path || relativePath

		showRoute(path)

		if (firstCall)
			history.replaceState({'url': path}, path, baseURL + path)
		else
			history.pushState({'url': path}, path, baseURL + path)


		return this
	}

	function fromURL(url) {

		var dirs = url.split('/')

		function testIfWebsite(string) {
			return routes.some(function (page) {
				return new RegExp('^' + page + '$', 'i').test(string)
			})
		}

		if (dirs.length <= 1) {

			if (url === '' || url === '/') {
				viewPage('home')
			} else if (testIfWebsite(dirs[0])) {
				viewPage(dirs[0])
			} else {
				var error = 'The Website "' + dirs[0] + '" is not available'
				viewPage('home')

				alert(error)
				throw new Error(error)
			}

		} else if (dirs.length == 2) {
			throw new Error('The URL is too long:' + url)
		} else {
			throw new Error('Can not route the URL ' + dirs)
		}
	}

	/*
	 function route(state) {
	 // History object or URL
	 if (typeof (state) === 'object') {

	 if (state.url !== undefined) {
	 fromURL(state.url)
	 } else {
	 throw new Error('History Object does not contain an URL: ' + state.url)
	 }

	 } else if (typeof(state) === 'string') {
	 fromURL(state)
	 } else {

	 fromURL(path)

	 //throw new Error('The variable passed to route() is not an object or a string: ' + state)
	 }
	 }
	 */

	function setRoute(url) {

		showRoute(url)

		history.pushState({'url': url}, url, baseURL + url)

		return this
	}

	function showRoute(url) {

		if (!execRoute(url))
			showRoute('/error')

		return this
	}

	this.setBaseURL = function (url) {

		baseURL = url

		relativePath = location.pathname.substr(baseURL.length, location.pathname.length)

		return this
	}

	this.route = route

	window.addEventListener('popstate', function (event) {

		if (!firstCall) {

			if (event.state)
				showRoute(event.state.url)
			else
				console.log('Can not route the event "' + event.state + '".')

		} else
			firstCall = false

	}, false)
}