;(function () {
    var main = document.getElementById('main')
    var game = document.getElementById('game')
    var form = document.getElementById('command-form')
    var cmd = document.getElementById('command')
    var startBtn = document.getElementById('start')

    var isWaiting = true
    var meters = 0
    var obstacleAt
    var warningAt
    var distToObstacle
    var interval
    var lastCommand = ''
    var obstacle
    var obstacles = [{
        warning: 'A wall is approaching',
        commands: ['jump', 'climb', 'up'],
        success: 'You jumped the wall',
        fail: 'You hit the wall<br>You had to <span class="suggest">jump</span> it'
    }, {
        warning: 'A pipe in front of you',
        commands: ['slide', 'duck', 'crouch', 'down'],
        success: 'You slid below the pipe',
        fail: 'You hit the pipe<br>You had to <span class="suggest">slide</span> below it'
    }]

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

    function scroll () {
        window.scrollTo(0, document.body.scrollHeight)
    }

    function start () {
        isWaiting = false
        game.innerHTML = ''
        meters = 0
        nextObstacle()
        interval = setTimeout(loop, 1000)
        cmd.focus()
    }

    function die () {
        cmd.value = ''
        game.appendChild(startBtn)
        isWaiting = true
        scroll()
    }

    function line (type) {
        var p = document.createElement('p')
        p.className = 'line ' + (type || '')
        game.appendChild(p)
        return p
    }

    function say (text, type) {
        var p = line('info ' + (type || ''), )
        p.innerHTML = text
        scroll()
    }

    function doCommand (text) {
        var p = line('command-line')
        p.innerText = text
        lastCommand = text
        scroll()
    }

    function rand (min, max) {
        return Math.floor(Math.random() * (max + 1 - min)) + min
    }

    function nextObstacle () {
        distToObstacle = rand(2, 4)
        warningAt = meters + rand(2, 5)
        obstacleAt = warningAt + distToObstacle
        obstacle = obstacles[rand(0, obstacles.length - 1)]
    }

    function loop () {
        meters++
        if (meters === warningAt) {
            say(obstacle.warning + ' in ' + distToObstacle + ' meters', 'warning')
        } else if (meters === obstacleAt) {
            
            if (obstacle.commands.indexOf(lastCommand.toLowerCase()) !== -1) {
                say(obstacle.success, 'success')
                nextObstacle()
            } else {
                say(obstacle.fail, 'fail')
                return die()
            }

        } else {
            say(meters + ' meters')
        }
        lastCommand = ''
        interval = setTimeout(loop, 1000 - meters)
    }
})()