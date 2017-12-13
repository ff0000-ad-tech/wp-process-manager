const request = require('request')

const debug = require('debug')
var log = debug('PM')

// options
let options = {}

// prepare
function prepare(_options) {
	options = Object.assign(
		{
			// api call to start watching
			start: null,
			// api call to stop watching
			stop: null
		},
		_options
	)
	prepareInterrupt()
}

// prepare interrupt
function prepareInterrupt() {
	const cleanup = () => {
		stopWatching(() => {
			log('Goodbye~')
			process.exit()
		})
	}
	process.stdin.resume() //so the program will not close instantly
	process.on('SIGINT', cleanup)
	process.on('SIGUSR1', cleanup)
	process.on('SIGUSR2', cleanup)
	process.on('exit', code => {
		log(`Exit code: ${code}`)
	})
	process.on('uncaughtException', err => {
		log(err)
		cleanup()
	})
}

// start watching
function startWatching() {
	if (options.start) {
		log('Requesting Creative-Server to watch')
		log(options.start)
		request(options.start, (err, res, body) => {
			if (err) {
				return log(err)
			}
		})
	}
}

// stop watching
function stopWatching(cb) {
	if (options.stop) {
		log('Requesting Creative-Server to stop watching')
		log(options.stop)
		request(options.stop, (err, res, body) => {
			if (err) {
				return log(err)
			}
			cb()
		})
	}
}

module.exports = {
	prepare,
	startWatching
}
