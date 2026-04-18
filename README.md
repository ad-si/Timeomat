# Timeomat

Webapp including a clock, alarm, stopwatch, and timer.
It is designed to be simple and easy to use, with a clean and modern interface.


## Related

Name                                   | Features | Pros                        | Cons
---------------------------------------|----------|-----------------------------|------
[Onlineclock](http://onlineclock.net/) | alarm    | probably largest site       | ugly
[Eggtimer](http://e.ggtimer.com/)      | timer    | Nice Urls, clean design     | few features
[time.fyi](https://time.fyi)           | clock, timer, stopwatch | clean design | -


## URLs

### Timer

URL                                                    | Time
-------------------------------------------------------|------
`([0-9]*h)?([0-9]*(m / min))?([0-9]*(s / sec / sek))?` | `$1:$2:$4`
brushteeth                                             | 00:03:00
nap                                                    | 00:20:00


### Countdown

URL                           | Date
------------------------------|------
`([0-9]{4})(-([0-9]{2}))-([0-9]{2})(T([0-9]{2}):([0-9]{2}))?` | `$1-$2-$3T$4:$5`
christmas, xmas, x-mas        | \<thisYear>–12–24 or \<nextYear>–12–24
newyear                       | \<nextYear>–01–01
