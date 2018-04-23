;(function () {
    var main = document.getElementById('main')
    var game = document.getElementById('game')
    var form = document.getElementById('command-form')
    var cmd = document.getElementById('command')
    var startBtn = document.getElementById('start')
    var zombieP
    var startTime

    var isWaiting = true
    var meters = 0
    var interval
    var item
    var ammo
    var weapon
    var record = window.localStorage ? +window.localStorage['text_runner_record'] || 0 : 0
    
    var startItem = {
        next: ['start'],
        run: function () {
            step()
        }
    }
    

    var defaultCommands = {}

    var gameCommands = {
        shoot: function () {
            if (!weapon)
                return say('You don\'t have any weapon', 'warning')
            if (weapon.ammo <= 0)
                return say('You don\'t have any ammo left, try to <span class="suggest">reload</span>', 'warning')

            weapon.ammo--
            var closestZombie = zombies.sort(function (z1, z2) { return z2.meters - z1.meters })[0]
            if (!closestZombie)
                return say('There is no zombie, you wasted a bullet')

            var i = zombies.indexOf(closestZombie)
            zombies.splice(i, 1)
            if (!zombies.length)
                return say('You killed the last zombie, you can take a breath', 'success')

            say('You killed a zombie, there are ' + zombies.length + ' zombies left', 'success')
        },

        reload: function () {
            if (!weapon)
                return say('You don\'t have any weapon to reload', 'warning')
            if (ammo <= 0)
                return say('You don\'t have any ammo left')
            
            ammo--
            weapon.ammo = 4
            say('You reloaded your gun', 'success')
        }
    }

    var lastGunAt = 0
    var nextItems = {
        zombie: function () {
            var i = rand(0, 1)
            console.log('next zombie', i)
            if (i === 0)
                return 'zombieLeft'
            return 'zombieRight'
        },

        gun: function () {
            if (meters - lastGunAt < 20 || ammo >= 2)
                return 'floor'
            if (weapon)
                return 'ammo'
            
            lastGunAt = meters
            return 'gun'
        }
    }
    
    var items = {
        start: {
            description: 'You have one zombie following you, you better <span class="suggest">run</span>!',
            next: ['floor'],
            run: function () { step() },
            jump: function () { step() }
        },

        floor: {
            next: ['floor', 'floor', 'floor', 'floor', 'wall', 'wall', nextItems.zombie, nextItems.gun],
            run: function () { step() },
            jump: function () { step() }
        }, 
        
        wall: {
            next: ['floor'],
            description: 'You came to a wall',
            color: 'warning',
            run: function () {
                say('You cannot run through a wall, try to <span class="suggest">jump</span> it', 'warning')
            },

            jump: function () {
                say('You jumped the wall', 'success')
                step()
            }
        },

        zombieRight: {
            description: 'A zombie growls at your right',
            color: 'warning',
            next: ['floor'],
            __init: function () {
                addZombie(meters - 2)
            },
            run: function () {
                say('You ran onto the zombie and it ate your brain. You had to dodge it going <span class="suggest">left</span>', 'fail'),
                die()
            },
            jump: function () {
                say('You jumped onto the zombie and it ate your brain. You had to dodge it going <span class="suggest">left</span>', 'fail')
                die()
            },
            left: function () {
                say('You dodged the zombie!', 'success')
                step()
            },
            right: function () {
                say('You ran onto the zombie and it ate your brain. You had to dodge it going <span class="suggest">left</span>', 'fail'),
                die()
            }
        },

        zombieLeft: {
            description: 'A zombie growls at your left',
            color: 'warning',
            next: ['floor'],
            __init: function () {
                addZombie(meters - 2)
            },
            run: function () {
                say('You ran onto the zombie and it ate your brain. You had to dodge it going <span class="suggest">right</span>', 'fail'),
                die()
            },
            jump: function () {
                say('You jumped onto the zombie and it ate your brain. You had to dodge it going <span class="suggest">right</span>', 'fail')
                die()
            },
            right: function () {
                say('You dodged the zombie!', 'success')
                step()
            },
            left: function () {
                say('You ran onto the zombie and it ate your brain. You had to dodge it going <span class="suggest">right</span>', 'fail'),
                die()
            }
        },

        gun: {
            description: 'You found a gun. You can <span class="suggest">grab</span> it or keep <span class="suggest">run</span>ning',
            next: ['floor'],
            grab: function () {
                weapon = { ammo: 4 }
                say('You took the gun, now you can <span class="suggest">shoot</span> the zombies', 'success')
                step(0)
            },
            run: function () {
                step()
            },
            jump: function () {
                step()
            }
        },

        ammo: {
            description: 'You found ammo, you can <span class="suggest">grab</span> them or keep <span class="suggest">run</span>ning',
            next: ['floor'],
            grab: function () {
                ammo++
                say('You took ammo', 'success')
                step(0)
            },
            run: function () {
                step()
            },
            jump: function () {
                step()
            }
        }
    }

    var zombies = []

    cmd.focus()

    form.onsubmit = function (e) {
        e.preventDefault()
        var command = cmd.value.trim().toLowerCase()
        if (command) {
            if (isWaiting) {
                if (command === 'run') {
                    start()
                    doCommand(command)
                }
            } else {
                doCommand(command)
            }
        }
        cmd.value = ''
        cmd.focus()
        return false
    }

    
    function start () {
        game.innerHTML = ''
        isWaiting = false
        meters = 0
        zombies = []
        weapon = null
        ammo = 0
        startTime = Date.now()

        addZombie(-3)
        item = startItem
        step()
        cmd.focus()
        interval = setTimeout(loop, 1000)
    }

    function die () {
        if (interval)
            clearTimeout(interval)
        cmd.value = ''

        var sec = Math.floor((Date.now() - startTime) / 1000)
        if (sec > record) {
            record = sec
            if (window.localStorage)
                localStorage['text_runner_record'] = record
        }
        
        var dieMessage = 'You escaped for <span class="success">' + sec + '</span> seconds'
        if (record) {
            if (record === sec)
                dieMessage += '<br>This is your best time!'
            else
                dieMessage += '<br>Your best time is <span class="success">' + record + '</span> seconds'
        }
        say(dieMessage)

        game.appendChild(startBtn)
        isWaiting = true
        scroll()
    }

    function step(dist) {
        if (typeof dist === 'undefined')
            dist = 1
        meters += dist
        
        var nextItemName = randItem(item.next)
        if (typeof nextItemName === 'function')
            nextItemName = nextItemName()
        item = items[nextItemName]
        if (item.description)
            say(item.description, item.color)
        if (item.__init)
            item.__init()
        commands = assignMethods({}, defaultCommands, gameCommands, item)
    }

    
    function doCommand (text) {
        var command = commands[text]
        var p = line('command-line ' + (command ? '' : 'invalid'))
        p.innerText = text
        scroll()

        if (command)
            command()
    }

    function addZombie(position) {
        zombies.push({
            meters: position
        })
    }

    
    function loop () {
        var maxPosition = -1000
        // make zombies walk
        zombies.forEach(function (zombie) { 
            zombie.meters++
            if (zombie.meters > maxPosition)
                maxPosition = zombie.meters
        })
        
        var distance = meters - maxPosition
        if (!zombies.length) {

            addZombie(meters - 3)
            say('Another zombie arrived and started to chase you')
            scroll()

            interval = setTimeout(loop, 2000)

        } else if (distance === 0) {

            say('Zombies ate your brain. You didn\'t <span class="suggest">run</span> enough', 'fail')
            die()

        } else {

            var p = game.lastChild === zombieP ? zombieP : line()
            zombieP = p
            var distanceSpan = distance > 3 ? distance : '<span class="warning">' + distance + '</span>'
            p.innerHTML = 'Zombies are ' + distanceSpan + ' meters behind you'
            scroll()

            interval = setTimeout(loop, 2000)
        }
    }




    /** utils */

    function say (text, type) {
        var p = line('info ' + (type || ''), )
        p.innerHTML = text
        scroll()
    }

    function line (type) {
        var p = document.createElement('p')
        p.className = 'line ' + (type || '')
        game.appendChild(p)
        return p
    }

    function rand (min, max) {
        return Math.floor(Math.random() * (max + 1 - min)) + min
    }

    function randItem(ar) {
        return ar[rand(0, ar.length - 1)]
    }

    function assignMethods (objects) {
        var ret
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i]
            ret = ret || obj
            for (var p in obj) {
                if (typeof obj[p] !== 'function')
                    continue
                ret[p] = obj[p]
            }
        }
        return ret
    }

    function scroll () {
        window.scrollTo(0, document.body.scrollHeight)
    }
})()