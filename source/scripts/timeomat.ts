import Mousetrap from 'mousetrap'
import key from 'keymaster'
import shaven, { ShavenResult, ShavenTree } from './shaven-wrapper.ts'
import Routor from './routor.ts'
import notificationIconUrl from '../images/icon.png'

shaven.setDefaults({ document })

type ClockMode = 'digital' | 'analog'

interface Clock {
  showTime(): void
  showDate(): void
  showAnalog(): void
  setMode(mode: ClockMode): void
}

interface Stopwatch {
  startStop(): void
  showTime(): void
  showRound(): void
  reset(): void
  start(): void
  stop(): void
}

interface Timer {
  start(): Timer
}

interface Countdown {
  name(value: string): Countdown
  start(): Countdown
}

interface ShortcutsWindow {
  toggle(): void
}

(function (window: Window, document: Document) {
  let clock: Clock
  // alarm = new Alarm(),
  let stopwatch: Stopwatch
  let presentView: string = ''
  let presentTitle: string
  let routor: Routor

  function $(query: string): Element {
    return document.querySelector(query)!
  }

  function capitalise(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  function removeElement(element: Element): void {
    element.parentNode!.removeChild(element)
  }

  function animateRemoval(el: HTMLElement, container: HTMLElement): void {
    el.classList.remove('expired', 'entering')

    if (container.children.length === 1) {
      container.classList.add('leaving')
      container.addEventListener('animationend', () => {
        container.classList.remove('leaving')
        if (el.parentNode)
          removeElement(el)
      }, { once: true })
      return
    }

    const followers: HTMLElement[] = []
    let past = false
    for (const child of Array.from(container.children)) {
      if (past && child instanceof HTMLElement)
        followers.push(child)
      if (child === el)
        past = true
    }
    const startPositions = followers.map(s => s.getBoundingClientRect().top)
    const startContainerHeight = container.offsetHeight

    const rect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    el.style.position = 'absolute'
    el.style.top = (rect.top - containerRect.top) + 'px'
    el.style.left = (rect.left - containerRect.left) + 'px'
    el.style.width = rect.width + 'px'
    el.style.margin = '0'
    el.style.zIndex = '0'
    el.classList.add('leaving')

    const endContainerHeight = container.offsetHeight
    container.style.height = startContainerHeight + 'px'
    void container.offsetHeight

    followers.forEach((s, i) => {
      const delta = startPositions[i] - s.getBoundingClientRect().top
      if (!delta)
        return
      s.style.transition = 'none'
      s.style.transform = `translateY(${delta}px)`
      s.style.position = 'relative'
      s.style.zIndex = '1'
    })

    requestAnimationFrame(() => {
      container.style.transition = 'height 0.3s ease-out'
      container.style.height = endContainerHeight + 'px'
      const onContainerEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'height')
          return
        container.style.transition = ''
        container.style.height = ''
        container.removeEventListener('transitionend', onContainerEnd)
      }
      container.addEventListener('transitionend', onContainerEnd)

      followers.forEach((s) => {
        s.style.transition = 'transform 0.3s ease-out'
        s.style.transform = 'translateY(0)'
        const onEnd = (e: TransitionEvent) => {
          if (e.propertyName !== 'transform')
            return
          s.style.transition = ''
          s.style.transform = ''
          s.style.position = ''
          s.style.zIndex = ''
          s.removeEventListener('transitionend', onEnd)
        }
        s.addEventListener('transitionend', onEnd)
      })
    })

    el.addEventListener('animationend', () => {
      if (el.parentNode)
        removeElement(el)
    }, { once: true })
  }

  function toTimeString(value: number): string {
    let time = ''
    let a: number
    let d: number
    let h: number
    let m: number
    let s: number
    let ms: number
    const floor = Math.floor

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

  function toTimeStringSeconds(value: number): string {
    return toTimeString(value).replace(/\.\d+$/, '')
  }

  function toEndTime(duration: string): Date {
    const dur = duration.split(':')

    return new Date((parseInt(dur[0]) * 60 * 60 * 1000) + (parseInt(dur[1]) * 60 * 1000) + (parseInt(dur[2]) * 1000) + new Date().getTime())
  }

  function isFutureDate(date: Date): boolean {
    return !isNaN(date.getTime()) && date.getTime() > new Date().getTime()
  }

  const STORAGE_KEY_TIMERS = 'timeomat.timers'
  const STORAGE_KEY_COUNTDOWNS = 'timeomat.countdowns'
  const STORAGE_KEY_SETTINGS = 'timeomat.settings'

  interface StoredTimer {
    id: string
    endTime: number
    paused: boolean
    leftTime: number
  }

  interface StoredCountdown {
    key: string
    endTime: number
    name: string
  }

  interface StoredSettings {
    timerInput?: string
    countdownName?: string
    clockMode?: ClockMode
  }

  const activeTimers = new Map<string, Timer>()
  const activeCountdowns = new Map<string, Countdown>()

  function saveTimers(): void {
    const list: StoredTimer[] = []
    activeTimers.forEach((timer) => {
      list.push(timer.serialize())
    })
    try {
      localStorage.setItem(STORAGE_KEY_TIMERS, JSON.stringify(list))
    }
    catch (e) {
      console.warn('Failed to save timers', e)
    }
    updateNavBadges()
  }

  function loadStoredTimers(): StoredTimer[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TIMERS)
      if (!raw)
        return []
      return JSON.parse(raw) as StoredTimer[]
    }
    catch {
      return []
    }
  }

  function saveCountdowns(): void {
    const list: StoredCountdown[] = []
    activeCountdowns.forEach((cd) => {
      list.push(cd.serialize())
    })
    try {
      localStorage.setItem(STORAGE_KEY_COUNTDOWNS, JSON.stringify(list))
    }
    catch (e) {
      console.warn('Failed to save countdowns', e)
    }
    updateNavBadges()
  }

  function loadStoredCountdowns(): StoredCountdown[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COUNTDOWNS)
      if (!raw)
        return []
      return JSON.parse(raw) as StoredCountdown[]
    }
    catch {
      return []
    }
  }

  function loadSettings(): StoredSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (!raw)
        return {}
      return JSON.parse(raw) as StoredSettings
    }
    catch {
      return {}
    }
  }

  function updateSetting<K extends keyof StoredSettings>(key: K, value: StoredSettings[K]): void {
    const settings = loadSettings()
    settings[key] = value
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
    }
    catch (e) {
      console.warn('Failed to save settings', e)
    }
  }

  function countdownKey(endTime: Date, countdownName: string): string {
    return 'countdown-' + endTime.getTime() + '-' + (countdownName || '')
  }

  function createCountdown(endTime: Date, countdownName: string): Countdown | null {
    const key = countdownKey(endTime, countdownName)
    if (activeCountdowns.has(key)) {
      alert('A countdown with the same name and end time is already running.')
      return null
    }
    return (new Countdown(endTime, key))
      .name(countdownName)
      .start()
  }

  const swRegistrationPromise: Promise<ServiceWorkerRegistration | null> = (async () => {
    if (!('serviceWorker' in navigator))
      return null
    try {
      return await navigator.serviceWorker.register('/sw.js')
    }
    catch (e) {
      console.warn('Service worker registration failed', e)
      return null
    }
  })()

  async function scheduleCountdownNotification(endTime: Date, countdownName: string, tag: string): Promise<string | null> {
    if (endTime.getTime() <= Date.now())
      return null

    if (!('TimestampTrigger' in window)) {
      console.info('Notification Triggers API not supported; notification requires tab to stay open.')
      return null
    }

    const reg = await swRegistrationPromise
    if (!reg)
      return null

    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted')
        return null
    }
    else if (Notification.permission !== 'granted') {
      return null
    }

    try {
      await reg.showNotification(countdownName || 'Countdown', {
        body: 'Your time is up!',
        icon: notificationIconUrl,
        tag,
        data: { url: '/countdown' },
        showTrigger: new (window as unknown as { TimestampTrigger: new (t: number) => unknown }).TimestampTrigger(endTime.getTime()),
      } as NotificationOptions)
      return tag
    }
    catch (e) {
      console.warn('Failed to schedule notification', e)
      return null
    }
  }

  async function cancelScheduledNotification(tag: string): Promise<void> {
    const reg = await swRegistrationPromise
    if (!reg)
      return
    const notifications = await reg.getNotifications(
      { tag, includeTriggered: true } as unknown as GetNotificationOptions,
    )
    for (const n of notifications)
      n.close()
  }

  function createRoutor(): Routor {
    return new Routor({
      // '^/$': '/countdown',
      '^/$': viewPage,
      '^/clock$': function (params: RegExpExecArray) {
        viewPage(params)
        key.setScope('clock')
      },
      /* '^/alarm$':function(){
       viewPage()
       key.setScope('alarm')
       }, */
      '^/stopwatch': function (params: RegExpExecArray) {
        viewPage(params)
        key.setScope('stopwatch')
      },
      // '^/worldclock$': viewPage,
      '^/stopwatch/start$': stopwatch.start,

      '^/timer': function (params: RegExpExecArray) {
        viewPage(params)
        key.setScope('timer')
      },
      '^/timer/(\\d*:\\d*:\\d*)$': function (params: RegExpExecArray) {
        ($('#timers') as HTMLElement).innerHTML = ''

        ;(new Timer(toEndTime(params[1]))).start()
      },
      '^/(\\d+:\\d+:\\d+)$': '/timer/$1',
      '^/(?:(\\d+)h)?(?:(\\d+)(?:m|min))?(?:(\\d+)(?:s|sec|sek))?$': function (params: RegExpExecArray) {
        const array = params.slice(1, 4)

        if (array.join('')) {
          viewPage('/timer');

          (new Timer(toEndTime(array.join(':')))).start()
        }
      },
      '^/nap$': '/timer/00:20:00',
      '^/brushteeth$': '/timer/00:05:00',
      '^/quick(ie|y)$': '/timer/00:10:00',

      '^/countdown': function (params: RegExpExecArray) {
        viewPage(params)
        key.setScope('countdown')
      },
      '^/countdown/(.+)/(\\d{4}-\\d{2}-\\d{2}t\\d{2}:\\d{2})$': function (params: RegExpExecArray) {
        const endTime = new Date(params[2])

        if (!isFutureDate(endTime)) {
          alert('The countdown must end in the future.')
          return
        }

        (($('#countdowns')) as HTMLElement).innerHTML = ''

        createCountdown(endTime, decodeURIComponent(params[1]))
      },
      '^/(christmas|xmas|x-mas)$': '/countdown/Christmas/2013-12-24T20:00',
      '^/(newyear|new-year)$': '/countdown/New Year/2013-12-24T20:00',
      '^/error$': viewPage,
    })
  }

  function setTitle(value: string): void {
    document.title = value
  }

  function setFavicon(state: 'warn' | null): void {
    const fav = $('#favicon') as HTMLLinkElement
    fav.href = state === 'warn' ? 'images/favicon2.png' : 'images/favicon.png'
  }

  function updateNavBadges(): void {
    const timerBadge = document.getElementById('timerBadge') as HTMLElement | null
    const countdownBadge = document.getElementById('countdownBadge') as HTMLElement | null
    if (timerBadge) {
      const n = activeTimers.size
      timerBadge.textContent = n > 0 ? String(n) : ''
      timerBadge.classList.toggle('hidden', n === 0)
    }
    if (countdownBadge) {
      const n = activeCountdowns.size
      countdownBadge.textContent = n > 0 ? String(n) : ''
      countdownBadge.classList.toggle('hidden', n === 0)
    }
  }

  function resetAlarmStateIfClear(): void {
    if (document.querySelectorAll('.expired').length === 0) {
      setFavicon(null)
      if (presentTitle)
        setTitle(presentTitle)
    }
  }

  function timeIsOver(element: HTMLElement): HTMLAudioElement {
    element.classList.add('expired')
    setFavicon('warn')
    setTitle('+++ Time is up! +++')

    const audio = new Audio()
    audio.src = 'sounds/alarm.wav'
    audio.volume = 1
    audio.loop = true
    audio.addEventListener('canplay', function () {
      audio.play().catch(() => {})
    }, false)
    return audio
  }

  class Clock {
    private weekdays = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    private months = [
      'January',
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
      'December',
    ]

    private digitalEl = $('#digitalclock') as HTMLElement
    private analogEl = $('#analogclock') as HTMLElement
    private hourHand = document.getElementById('hourHandGroup') as unknown as SVGGElement
    private minuteHand = document.getElementById('minuteHandGroup') as unknown as SVGGElement
    private secondHand = document.getElementById('secondHandGroup') as unknown as SVGGElement

    constructor() {
      this.buildMarkers()
    }

    private buildMarkers(): void {
      const group = document.getElementById('clockMarkers')
      if (!group)
        return
      const svgNs = 'http://www.w3.org/2000/svg'
      for (let i = 0; i < 60; i++) {
        const isHour = i % 5 === 0
        const rect = document.createElementNS(svgNs, 'rect')
        if (isHour) {
          rect.setAttribute('x', '-4')
          rect.setAttribute('y', '-95')
          rect.setAttribute('width', '8')
          rect.setAttribute('height', '20')
        }
        else {
          rect.setAttribute('x', '-1')
          rect.setAttribute('y', '-95')
          rect.setAttribute('width', '2')
          rect.setAttribute('height', '6')
        }
        rect.setAttribute('transform', `rotate(${i * 6})`)
        group.appendChild(rect)
      }
    }

    setMode(mode: ClockMode): void {
      this.digitalEl.classList.toggle('hidden', mode !== 'digital')
      this.analogEl.classList.toggle('hidden', mode !== 'analog')
      updateSetting('clockMode', mode)
    }

    showTime(): void {
      this.digitalEl.innerHTML = new Date().toTimeString().substr(0, 8)

      setTimeout(() => {
        this.showTime()
      }, 200)
    }

    showAnalog(): void {
      const now = new Date()
      const h = now.getHours() % 12
      const m = now.getMinutes()
      const s = now.getSeconds()
      const hourAngle = (h + m / 60 + s / 3600) * 30
      const minuteAngle = (m + s / 60) * 6
      const secondAngle = s * 6
      this.hourHand.setAttribute('transform', `rotate(${hourAngle})`)
      this.minuteHand.setAttribute('transform', `rotate(${minuteAngle})`)
      this.secondHand.setAttribute('transform', `rotate(${secondAngle})`)

      const delay = 1000 - now.getMilliseconds()
      setTimeout(() => {
        this.showAnalog()
      }, delay)
    }

    showDate(): void {
      const d = new Date();

      (($('#date')) as HTMLElement).innerHTML = this.weekdays[d.getDay()] + ', ' + d.getDate() + '. ' + this.months[d.getMonth()] + ' ' + d.getFullYear()

      setTimeout(() => {
        this.showDate()
      }, 1000)
    }
  }

  class Stopwatch {
    private timer: number | undefined
    private startTime: Date = new Date()
    private time = 0
    private firstTime = true
    private isRunning = false
    private tableStatus = false
    private roundCounter = 0
    private lastRound = 0
    private stopwatchDisplay = $('#stopwatchDisplay') as HTMLElement
    private stopwatchStart = $('#stopwatchStart') as HTMLElement
    private stopwatchReset = $('#stopwatchReset') as HTMLElement
    private stopwatchRound = $('#stopwatchRound') as HTMLElement
    private table = $('#rounds') as HTMLTableElement
    private exportWrapper = $('#stopwatchExportWrapper') as HTMLElement
    private nextRound = $('#nextRound') as HTMLElement
    private nextDuration = $('#nextDuration') as HTMLElement
    private nextTime = $('#nextTime') as HTMLElement

    start(): void {
      if (!this.isRunning) {
        if (this.firstTime) {
          this.startTime = new Date()
          this.firstTime = false
        }

        this.isRunning = true

        this.showTime();

        (this.stopwatchStart as HTMLElement).innerHTML = 'Stop'
        this.stopwatchReset.classList.add('hidden')
        this.stopwatchRound.classList.remove('hidden')
      }
    }

    stop(): void {
      clearTimeout(this.timer)
      this.isRunning = false;
      (this.stopwatchStart as HTMLElement).innerHTML = 'Continue'
      this.stopwatchReset.classList.remove('hidden')
      this.stopwatchRound.classList.add('hidden')
    }

    startStop(): void {
      if (!this.isRunning)
        this.start()
      else
        this.stop()
    }

    showTime(): void {
      if (this.isRunning) {
        const now = new Date()
        this.time = now.getTime() - this.startTime.getTime()

        const display = this.stopwatchDisplay as HTMLElement
        display.innerHTML = toTimeString(this.time)

        if (this.tableStatus) {
          (this.nextRound as HTMLElement).innerHTML = (this.roundCounter + 1).toString();
          (this.nextDuration as HTMLElement).innerHTML = toTimeString(this.time - this.lastRound);
          (this.nextTime as HTMLElement).innerHTML = toTimeString(this.time)
        }

        this.timer = window.setTimeout(() => {
          this.showTime()
        }, 10)
      }
      else {
        (this.stopwatchDisplay as HTMLElement).innerHTML = '00:00:00.00'
      }
    }

    showRound(): void {
      this.table.classList.remove('hidden')
      this.exportWrapper.classList.remove('hidden')

      const row = shaven(
        ['tr.row',
          ['td', (++this.roundCounter).toString()],
          ['td', toTimeString(this.time - this.lastRound)],
          ['td', toTimeString(this.time)],
        ],
      ) as ShavenResult

      if (row.rootElement)
        (this.table.tBodies[0] as HTMLTableSectionElement).appendChild(row.rootElement as HTMLElement)

      this.lastRound = this.time
      this.tableStatus = true
    }

    exportCsv(): void {
      const rows: string[] = ['Round,Duration,Time']
      const bodyRows = this.table.tBodies[0]?.rows

      if (!bodyRows || bodyRows.length === 0)
        return

      for (let i = 0; i < bodyRows.length; i++) {
        const cells = bodyRows[i].cells
        rows.push([cells[0].textContent, cells[1].textContent, cells[2].textContent].join(','))
      }

      const blob = new Blob([rows.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'stopwatch-rounds.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    reset(): void {
      this.firstTime = true
      this.roundCounter = 0
      this.lastRound = 0;

      (this.stopwatchDisplay as HTMLElement).innerHTML = '00:00:00.00';
      (this.stopwatchStart as HTMLElement).innerHTML = 'Start'
      this.stopwatchReset.classList.add('hidden')
      this.table.classList.add('hidden')
      this.exportWrapper.classList.add('hidden')

      const rows = document.querySelectorAll('.row')

      for (let a = 0; a < rows.length; a++) {
        removeElement(rows[a] as Element)
      }
    }
  }

  interface TimerRestoreOptions {
    id?: string
    paused?: boolean
    leftTime?: number
    silentOnExpire?: boolean
    restored?: boolean
  }

  class Timer {
    private running = false
    private paused = false
    private leftTime = 0
    private timeout: number | undefined
    private delayStart: Date | undefined
    private expiredAudio: HTMLAudioElement | null = null
    private silentOnExpire = false
    readonly id: string
    private timerElements: {
      el: HTMLElement
      time: HTMLElement
      pauseButton: HTMLButtonElement
      silenceButton: HTMLButtonElement
      fullscreenButton: HTMLButtonElement
      cancelButton: HTMLButtonElement
    }

    private endTime: Date

    constructor(endTime: Date, options?: TimerRestoreOptions) {
      this.endTime = endTime
      this.id = options?.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2, 8))
      this.silentOnExpire = !!options?.silentOnExpire

      const timerTree = shaven(
        ['div$el',
          ['span$time'],
          ['div',
            ['button$pauseButton', 'Pause'],
            ['button$silenceButton.silence', 'Silence'],
            ['button$fullscreenButton.fullscreen', { title: 'Fullscreen' }, '⛶'],
            ['button$cancelButton', 'X'],
          ],
        ],
      ) as ShavenResult

      this.timerElements = timerTree.references as {
        el: HTMLElement
        time: HTMLElement
        pauseButton: HTMLButtonElement
        silenceButton: HTMLButtonElement
        fullscreenButton: HTMLButtonElement
        cancelButton: HTMLButtonElement
      }

      if (timerTree.rootElement) {
        const rootEl = timerTree.rootElement as HTMLElement
        const container = $('#timers') as HTMLElement
        if (!options?.restored) {
          const target = container.children.length === 0 ? container : rootEl
          target.classList.add('entering')
          target.addEventListener('animationend', () => {
            target.classList.remove('entering')
          }, { once: true })
        }
        container.appendChild(rootEl)
      }

      this.timerElements.pauseButton.addEventListener('click', this.pauseResume, false)
      this.timerElements.silenceButton.addEventListener('click', this.silence, false)
      this.timerElements.fullscreenButton.addEventListener('click', this.toggleFullscreen, false)
      this.timerElements.cancelButton.addEventListener('click', this.cancel, false)

      if (options?.paused && options.leftTime !== undefined) {
        this.paused = true
        this.leftTime = options.leftTime
        this.timerElements.time.innerHTML = toTimeString(this.leftTime)
        this.timerElements.pauseButton.innerHTML = 'Resume'
        this.delayStart = new Date()
      }

      activeTimers.set(this.id, this)
      saveTimers()
    }

    serialize(): StoredTimer {
      let leftTime = this.leftTime
      if (this.paused && this.delayStart)
        leftTime = Math.max(0, this.endTime.getTime() - this.delayStart.getTime())

      return {
        id: this.id,
        endTime: this.endTime.getTime(),
        paused: this.paused,
        leftTime,
      }
    }

    private update = () => {
      this.leftTime = this.endTime.getTime() - new Date().getTime()

      this.timerElements.time.innerHTML = toTimeString(this.leftTime)
      // setTitle(toTimeString(leftTime))

      if (this.leftTime <= 0) {
        clearTimeout(this.timeout)
        removeElement(this.timerElements.pauseButton)
        if (this.silentOnExpire) {
          this.timerElements.el.classList.add('expired')
        }
        else {
          this.expiredAudio = timeIsOver(this.timerElements.el)
        }
        activeTimers.delete(this.id)
        saveTimers()
      }
      else {
        this.timeout = setTimeout(this.update, 10)
      }
    }

    private silence = () => {
      if (this.expiredAudio) {
        this.expiredAudio.pause()
        this.expiredAudio = null
      }
      this.timerElements.el.classList.remove('expired')
      resetAlarmStateIfClear()
    }

    private toggleFullscreen = () => {
      if (document.fullscreenElement === this.timerElements.el) {
        document.exitFullscreen().catch(() => {})
      }
      else {
        this.timerElements.el.requestFullscreen().catch((e) => {
          console.warn('Fullscreen failed', e)
        })
      }
    }

    private pauseResume = (event: MouseEvent) => {
      const button = event.currentTarget as HTMLButtonElement

      if (this.running) {
        button.innerHTML = 'Resume'
        clearTimeout(this.timeout)
        this.delayStart = new Date()
        this.running = false
        this.paused = true
        saveTimers()
      }
      else {
        button.innerHTML = 'Pause'
        this.endTime.setTime(this.endTime.getTime() + (new Date().getTime() - this.delayStart!.getTime()))
        this.timeout = setTimeout(this.update, 10)
        this.running = true
        this.paused = false
        saveTimers()
      }
    }

    private cancel = () => {
      if (this.expiredAudio) {
        this.expiredAudio.pause()
        this.expiredAudio = null
      }
      clearTimeout(this.timeout)
      activeTimers.delete(this.id)
      saveTimers()
      animateRemoval(this.timerElements.el, $('#timers') as HTMLElement)
      resetAlarmStateIfClear()
    }

    start(): Timer {
      if (this.paused)
        return this

      this.running = true
      this.update()

      return this
    }
  }

  interface CountdownRestoreOptions {
    silentOnExpire?: boolean
    restored?: boolean
  }

  class Countdown {
    private leftTime: number = 0
    private timeout: number | undefined
    private nameValue: string | undefined
    private notificationTag: string | null = null
    private expiredAudio: HTMLAudioElement | null = null
    private silentOnExpire = false
    private countdownElements: {
      el: HTMLElement
      time: HTMLElement
      name: HTMLElement
      silenceButton: HTMLButtonElement
      fullscreenButton: HTMLButtonElement
      cancelButton: HTMLElement
    }

    private endTime: Date
    readonly key: string

    constructor(endTime: Date, key: string, options?: CountdownRestoreOptions) {
      this.endTime = endTime
      this.key = key
      this.silentOnExpire = !!options?.silentOnExpire
      const countdowns = $('#countdowns') as HTMLElement
      const countdownTree = shaven(
        ['div$el',
          ['div',
            ['p$name'],
            ['time$time', toTimeStringSeconds(this.leftTime)],
          ],
          ['div',
            ['button$silenceButton.silence', 'Silence'],
            ['button$fullscreenButton.fullscreen', { title: 'Fullscreen' }, '⛶'],
            ['button$cancelButton', 'X'],
          ],
        ],
      ) as ShavenResult

      this.countdownElements = countdownTree.references as {
        el: HTMLElement
        time: HTMLElement
        name: HTMLElement
        silenceButton: HTMLButtonElement
        fullscreenButton: HTMLButtonElement
        cancelButton: HTMLElement
      }

      if (countdownTree.rootElement) {
        const rootEl = countdownTree.rootElement as HTMLElement
        if (!options?.restored) {
          const target = countdowns.children.length === 0 ? countdowns : rootEl
          target.classList.add('entering')
          target.addEventListener('animationend', () => {
            target.classList.remove('entering')
          }, { once: true })
        }
        countdowns.appendChild(rootEl)
      }
      this.countdownElements.silenceButton.addEventListener('click', this.silence, false)
      this.countdownElements.fullscreenButton.addEventListener('click', this.toggleFullscreen, false)
      this.countdownElements.cancelButton.addEventListener('click', this.cancel, false)

      activeCountdowns.set(this.key, this)
    }

    serialize(): StoredCountdown {
      return {
        key: this.key,
        endTime: this.endTime.getTime(),
        name: this.nameValue || '',
      }
    }

    private update = () => {
      this.leftTime = this.endTime.getTime() - new Date().getTime()

      this.countdownElements.time.innerHTML = toTimeStringSeconds(this.leftTime)
      // setTitle(toTimeString(leftTime))

      if (this.leftTime <= 0) {
        clearTimeout(this.timeout)
        activeCountdowns.delete(this.key)
        saveCountdowns()
        if (this.silentOnExpire) {
          this.countdownElements.el.classList.add('expired')
        }
        else {
          this.expiredAudio = timeIsOver(this.countdownElements.el)
        }
      }
      else {
        const msUntilNextSecond = this.leftTime % 1000 || 1000
        this.timeout = setTimeout(this.update, msUntilNextSecond)
      }
    }

    private silence = () => {
      if (this.expiredAudio) {
        this.expiredAudio.pause()
        this.expiredAudio = null
      }
      this.countdownElements.el.classList.remove('expired')
      resetAlarmStateIfClear()
    }

    private toggleFullscreen = () => {
      if (document.fullscreenElement === this.countdownElements.el) {
        document.exitFullscreen().catch(() => {})
      }
      else {
        this.countdownElements.el.requestFullscreen().catch((e) => {
          console.warn('Fullscreen failed', e)
        })
      }
    }

    private cancel = () => {
      if (this.expiredAudio) {
        this.expiredAudio.pause()
        this.expiredAudio = null
      }
      clearTimeout(this.timeout)
      activeCountdowns.delete(this.key)
      saveCountdowns()
      if (this.notificationTag) {
        cancelScheduledNotification(this.notificationTag)
        this.notificationTag = null
      }
      animateRemoval(this.countdownElements.el, $('#countdowns') as HTMLElement)
      resetAlarmStateIfClear()
    }

    name(value: string): Countdown {
      this.nameValue = value
      return this
    }

    start(): Countdown {
      this.update()
      this.countdownElements.name.innerHTML = this.nameValue || ' '
      saveCountdowns()
      scheduleCountdownNotification(this.endTime, this.nameValue || 'Countdown', this.key)
        .then((tag) => {
          this.notificationTag = tag
        })
      return this
    }
  }

  function viewPage(params?: RegExpExecArray | string | string[]): void {
    let page: string
    let url: string
    let title: string
    const wrapper = document.querySelectorAll('.wrapper')

    if (typeof params !== 'string') {
      if (!params)
        return
      url = params[0]
    }
    else
      url = params

    page = (url == '/') ? 'home' : url.split('/')[1]

    // console.log(page)

    if (page != presentView) {
      for (let i = 0; i < wrapper.length; i++)
        wrapper[i].classList.remove('visible')

      $('#' + page + 'wrapper').classList.add('visible')

      title = capitalise(page) + ' | Timeomat'
      setTitle(title)
      presentTitle = title
    }

    presentView = page
  }

  /*
   function Poopup(contentClass) {

   const contentItems = contentClass || '.cOverlay';
   const template = $(
   '<div class="overlay">' +
   '<div class="content">' +
   '<div class="close">close</div>' +
   '</div>' +
   '</div>'
   );

   const overlay = template.css({
   'position': 'absolute',
   'width': '100%',
   'height': '100%',
   'backgroundColor': '#555',
   'top': '0',
   'left': '0',
   'display': 'none'
   });
   const content = template.find(".content").css({
   'float': 'left',
   'backgroundColor': '#fff'

   });
   const close = template.find(".close");

   content.append($(contentItems));
   $(contentItems).show();

   this.click(function () {

   overlay.show();
   content.show();

   const height = $(document).height() / 2 - content.height() / 2;
   const width = $(document).width() / 2 - content.width() / 2;

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
   const height = $(document).height() / 2 - content.height() / 2;
   const width = $(document).width() / 2 - content.width() / 2;
   content.css('marginTop', height);
   content.css('marginLeft', width);
   });

   $('body').append(template);
   }
   */

  type ShortcutHandler = () => void | boolean
  type ShortcutItem = [string[], string, ShortcutHandler]

  class ShortcutsWindow {
    private shortcuts: Record<string, ShortcutItem[]> = {
      'side wide': [
        [
          ['?'],
          'Bring up this Shortcut Reference',
          () => {
            this.toggle()
          },
        ],
        [
          ['c'],
          'Switch to Clock Tab',
          function () {
            routor.route('/clock')
          },
        ],
        [
          ['s'],
          'Switch to Stopwatch Tab',
          function () {
            routor.route('/stopwatch')
          },
        ],
        [
          ['t'],
          'Switch to Timer Tab',
          function () {
            routor.route('/timer')
          },
        ],
        [
          ['d'],
          'Switch to Countdown Tab',
          function () {
            routor.route('/countdown')
          },
        ],
      ],
      /* 'clock': [
       [
       ['a'],
       'Toggle between Analog and Digital Clock',
       function() {
       }
       ]
       ], */
      'timer': [
        /* [
         ['space'],
         'Pause/Resume last Timer',
         function() {
         }
         ], */
        [
          ['n'],
          'Create New Timer',
          function () {
            const timerTime = $('#timerTime') as HTMLInputElement
            timerTime.focus()
            timerTime.value = ''
            return false
          },
        ],
      ],
      'stopwatch': [
        [
          ['space'],
          'Start/Pause the Stopwatch',
          function () {
            stopwatch.startStop()
            return false
          },
        ],
        [
          ['r'],
          'New Round',
          function () {
            stopwatch.showRound()
          },
        ],
        [
          ['x'],
          'Reset Stopwatch',
          function () {
            stopwatch.stop()
            stopwatch.reset()
          },
        ],
      ],
      'countdown': [
        /* [
         ['x'],
         'Remove most recent Countdown',
         function() {
         }
         ], */
        [
          ['n'],
          'Create New Countdown',
          function () {
            ($('#countdownName') as HTMLInputElement).value = '';
            ($('#countdownName') as HTMLInputElement).focus()
            return false
          },
        ],
      ],
    }

    private content: ShavenTree = ['div.content',
      ['header',
        ['h1', 'Keyboard Shortcuts'],
      ],
    ]

    private body: { shinebox: HTMLElement } | undefined
    private visible = false

    constructor() {
      this.buildContent()

      const shineboxTree = shaven(
        ['div#shinebox',
          ['div.wrap',
            this.content,
          ],
        ],
      )

      document.body.appendChild(shineboxTree.rootElement as HTMLElement)
      this.body = { shinebox: shineboxTree.rootElement as HTMLElement }
      this.body.shinebox.style.display = 'none'
    }

    private getKeyInfo(keyString: string): { character: string, type: string } {
      const keys: Record<string, { character: string, type: string }> = {
        shift: {
          character: '⇧',
          type: 'modifier',
        },
        alt: {
          character: '⌥',
          type: 'modifier',
        },
        ctrl: {
          character: '⌃',
          type: 'modifier',
        },
        cmd: {
          character: '⌘',
          type: 'modifier',
        },
        space: {
          character: ' ',
          type: 'space',
        },
      }

      const key = keys[keyString.toLowerCase()]
      if (key)
        return key

      return {
        character: keyString.toLowerCase(),
        type: '',
      }
    }

    private buildContent() {
      Object.keys(this.shortcuts).forEach((sectionName: string) => {
        const section: ShavenTree = ['section', ['h2', sectionName]]

        this.shortcuts[sectionName].forEach((item: ShortcutItem) => {
          const combo: ShavenTree = ['span.keys']

          item[0].forEach((k: string) => {
            // console.log(k, i.replace('side wide', 'all'), item[2])

            if (k != '?')
              key(k, sectionName.replace('side wide', 'all'), item[2])

            const keys = k.split('+')

            keys.forEach((keyName: string) => {
              const keyInfo = this.getKeyInfo(keyName)

              combo.push(['kbd', { class: 'key ' + keyInfo.type }, keyInfo.character], '+')
            })
            combo.pop()
          })

          section.push(
            ['p',
              combo,
              ['span', item[1]],
            ],
          )
        })

        this.content.push(section)
      })
    }

    private hide = (event?: KeyboardEvent | MouseEvent) => {
      if (event) {
        event.stopPropagation()

        if (event instanceof KeyboardEvent) {
          if (event.key !== 'Escape')
            return
        }
        else if (event.type !== 'click')
          return
      }

      if (!this.body)
        return

      this.body.shinebox.style.display = 'none'
      this.visible = false
    }

    private stopPropagation = (event: Event) => {
      event.stopPropagation()
    }

    toggle = () => {
      if (!this.body)
        return

      if (this.visible) {
        this.hide()

        removeEventListener('keydown', this.hide, false)
        this.body.shinebox.removeEventListener('click', this.stopPropagation, false)
        document.removeEventListener('click', this.hide, false)
      }
      else {
        this.body.shinebox.style.display = 'block'
        this.visible = true

        window.addEventListener('keydown', this.hide, false);
        (this.body.shinebox as HTMLElement).addEventListener('click', this.stopPropagation, false)
        document.addEventListener('click', this.hide, false)
      }
    }
  }

  clock = new Clock()
  stopwatch = new Stopwatch()
  routor = createRoutor()

  function initEventListeners() {
    const menuItems = [
      'home',
      'clock',
      // 'alarm',
      'stopwatch',
      'timer',
      'countdown',
      // 'worldclock'
    ]

    const timerTimeInput = $('#timerTime') as HTMLInputElement
    const countdownNameInput = $('#countdownName') as HTMLInputElement
    const countdownDateInput = $('#countdownDate') as HTMLInputElement
    const countdownTimeInput = $('#countdownTime') as HTMLInputElement

    function restrictInput(input: HTMLInputElement, allowed: RegExp): void {
      input.addEventListener('beforeinput', (event: Event) => {
        const ie = event as InputEvent
        if (ie.data == null)
          return
        if (!allowed.test(ie.data))
          event.preventDefault()
      }, false)
      input.addEventListener('input', () => {
        const cleaned = Array.from(input.value).filter(c => allowed.test(c)).join('')
        if (cleaned !== input.value)
          input.value = cleaned
      }, false)
    }

    restrictInput(timerTimeInput, /^[\d:]+$/)
    restrictInput(countdownDateInput, /^[\d-]+$/)
    restrictInput(countdownTimeInput, /^[\d:]+$/)

    function setDefaultCountdownInputs() {
      const defaultDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)

      countdownDateInput.value = defaultDate.toISOString().slice(0, 10)
      countdownTimeInput.value = defaultDate.toTimeString().slice(0, 5)
    }

    setDefaultCountdownInputs()

    const savedSettings = loadSettings()
    if (savedSettings.timerInput)
      timerTimeInput.value = savedSettings.timerInput
    if (savedSettings.countdownName)
      countdownNameInput.value = savedSettings.countdownName

    timerTimeInput.addEventListener('change', () => {
      updateSetting('timerInput', timerTimeInput.value)
    }, false)
    countdownNameInput.addEventListener('change', () => {
      updateSetting('countdownName', countdownNameInput.value)
    }, false)

    function restoreFromStorage() {
      const now = Date.now()

      for (const st of loadStoredTimers()) {
        if (st.paused) {
          new Timer(new Date(now + st.leftTime), {
            id: st.id,
            paused: true,
            leftTime: st.leftTime,
            restored: true,
          })
        }
        else {
          const silent = st.endTime <= now
          new Timer(new Date(st.endTime), { id: st.id, silentOnExpire: silent, restored: true }).start()
        }
      }

      for (const sc of loadStoredCountdowns()) {
        const silent = sc.endTime <= now
        new Countdown(new Date(sc.endTime), sc.key, { silentOnExpire: silent, restored: true })
          .name(sc.name)
          .start()
      }
    }

    restoreFromStorage()

    menuItems.forEach(function (item: string) {
      ($('#' + item) as HTMLElement).addEventListener('click', function (event: Event) {
        event.preventDefault()

        if (item == 'home')
          routor.route('/')
        else
          routor.route('/' + item)
      }, false)
    });

    ($('#startTimer') as HTMLElement).addEventListener('click', function (e: Event) {
      e.preventDefault();

      (new Timer(toEndTime(($('#timerTime') as HTMLInputElement).value))).start()

      // routor.route('/timer/' + (($('#timerTime') as HTMLInputElement).value))
    }, false);

    ($('#startCountdown') as HTMLElement).addEventListener('click', function (e: Event) {
      e.preventDefault()

      const countdownEndTime = new Date(countdownDateInput.value + 'T' + countdownTimeInput.value)

      if (!isFutureDate(countdownEndTime)) {
        alert('The countdown must end in the future.')
        return
      }

      createCountdown(countdownEndTime, countdownNameInput.value)
    }, false)

    /*
     (($('#showFullscreen') as HTMLElement).addEventListener('click', function (event: Event) {

     routor.route('/countdown/' +
     (($('#countdownName') as HTMLInputElement).value) +
     '/' +
     (($('#countdownDate') as HTMLInputElement).value) +
     'T' +
     $('#countdownTime').value)
     })
     */

    /*
     (($('#setAlarm') as HTMLElement).addEventListener('click', function (e: Event) {
e.preventDefault();

     const days: string[] = []
     const inputs = $('#alarmDays').getElementsByTagName('input')

      for (const a in inputs) {
        if (inputs.hasOwnProperty(a)) {
          if ((inputs[a] as HTMLInputElement).checked)
            days.push((inputs[a] as HTMLInputElement).id)
        }
      }

     alarm.check($('#alarmTime').value, days, $('#alarmSound').value)

     //const url = 'timer'
     //history.pushState({'url': url}, url, baseURL + url)
     }, false)
     */

    const clockModeRadios = document.querySelectorAll('input[name=clockMode]')
    const savedMode: ClockMode = savedSettings.clockMode === 'analog' ? 'analog' : 'digital'
    const activeRadio = document.getElementById(
      savedMode === 'analog' ? 'clockModeAnalog' : 'clockModeDigital',
    ) as HTMLInputElement | null
    if (activeRadio)
      activeRadio.checked = true
    clock.setMode(savedMode)

    clockModeRadios.forEach((radio) => {
      radio.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement
        if (target.checked)
          clock.setMode(target.value as ClockMode)
      }, false)
    })

    clock.showTime()
    clock.showAnalog()

    clock.showDate()

    stopwatch.showTime();

    ($('#stopwatchStart') as HTMLElement).addEventListener('click', function () {
      stopwatch.startStop()
    }, false);

    ($('#stopwatchRound') as HTMLElement).addEventListener('click', function () {
      stopwatch.showRound()
    }, false);

    ($('#stopwatchReset') as HTMLElement).addEventListener('click', function () {
      stopwatch.reset()
    }, false);

    ($('#stopwatchExport') as HTMLElement).addEventListener('click', function () {
      stopwatch.exportCsv()
    }, false)
  }

  initEventListeners()

  // Preload favicon
  new Image().src = 'images/favicon2.png'

  routor.route()

  const shortcutsWindow = new ShortcutsWindow()

  // Shortcuts window
  Mousetrap.bind('?', function () {
    shortcutsWindow.toggle()
  })
})(window, document)
