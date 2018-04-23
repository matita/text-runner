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
    
    var startItem = {
        next: ['start'],
        run: function () {
            step()
        }
    }
    

    var defaultCommands = {}

    var gameCommands = {}
    
    var items = {
        start: {
            description: 'You have one zombie following you, you better <span class="suggest">run</span>!',
            next: ['floor'],
            run: function () { step() },
            jump: function () { step() }
        },

        floor: {
            next: ['floor', 'floor', 'floor', 'floor', 'wall', 'wall', 'zombieRight', 'zombieLeft'],
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
        say('You escaped for <span class="success">' + sec + '</span> seconds')

        game.appendChild(startBtn)
        isWaiting = true
        scroll()
    }

    function step() {
        meters++
        
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
        var p = line('command-line')
        p.innerText = text
        scroll()

        if (commands[text])
            commands[text]()
        lastCommand = text
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
        if (distance === 0) {

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