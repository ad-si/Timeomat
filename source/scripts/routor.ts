type RouteHandler = (params: RegExpExecArray) => void
type RouteValue = RouteHandler | RouteHandler[] | string

interface Routes {
  [key: string]: RouteValue
}

export default class Routor {
  baseURL: string = ''
  relativePath: string = location.pathname
  firstCall: boolean = true
  routes: Routes

  constructor(routes: Routes) {
    this.routes = routes

    window.addEventListener('popstate', (event) => {
      if (!this.firstCall) {
        if (event.state)
          this.showRoute(event.state.url)
        else
          console.log('Can not route the event "' + event.state + '".')
      }
      else
        this.firstCall = false
    }, false)
  }

  execRoute(path: string): boolean {
    let available = false

    for (const direction in this.routes) {
      if (this.routes.hasOwnProperty(direction)) {
        const pattern = new RegExp(direction, 'ig')
        const result = pattern.exec(path)

        if (result !== null) {
          console.log(direction)

          const routeValue = this.routes[direction]

          // If Function
          if (typeof routeValue === 'function') {
            routeValue(result!)
          }
          else

          // If Array
            if (Array.isArray(routeValue)) {
              routeValue.forEach(function (func: RouteHandler) {
                func(result!)
              })
            }
            else

            // If String
              if (typeof routeValue === 'string') {
                const newDirection = this.relativePath.replace(new RegExp(direction, 'ig'), routeValue)
                this.showRoute(newDirection)
              }

          available = true
        }
      }
    }

    return available
  }

  route(path?: string): Routor {
    path = path || this.relativePath

    this.showRoute(path)

    if (this.firstCall)
      history.replaceState({ url: path }, path, this.baseURL + path)
    else
      history.pushState({ url: path }, path, this.baseURL + path)

    return this
  }

  showRoute(url: string): Routor {
    if (!this.execRoute(url))
      this.showRoute('/error')

    return this
  }

  setBaseURL(url: string): Routor {
    this.baseURL = url

    this.relativePath = location.pathname.substr(this.baseURL.length, location.pathname.length)

    return this
  }
}
