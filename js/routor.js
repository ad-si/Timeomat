function Routor(routes) {

	var baseURL = '',
		relativePath = location.pathname,
		firstCall = true

	function execRoute(path) {

		var available = false

		for (var direction in routes) {
			if (routes.hasOwnProperty(direction)) {

				var pattern = new RegExp(direction, "ig"),
					result = pattern.exec(path);

				if (result) {

					console.log(direction)

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
					if (routes[direction].big) {

						direction = relativePath.replace(new RegExp(direction, "ig"), routes[direction])

						showRoute(direction)
					}

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