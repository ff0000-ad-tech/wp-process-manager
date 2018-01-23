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
}

// prepare interrupt
function prepareInterrupt() {
	const cleanup = () => {
		stopWatching(() => {
			log('Goodbye~')
			process.exit()
		})
	}
	process.stdin.resume() // so the program will not terminate instantly
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
		prepareInterrupt()
		request(options.start, (err, res, body) => {
			if (err) {
				log('unable to connect to Creative-Server')
				// return log(err)
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
			process.stdin.destroy() // release the process to terminate on its own
			if (err) {
				log('unable to connect to Creative-Server')
				// return log(err)
			}
			if (cb) {
				cb()
			}
		})
	}
}

// complete watching
function completeWatch() {
	if (options.complete) {
		log('Inform Creative-Server process is complete')
		log(options.complete)
		request(options.complete, (err, res, body) => {
			if (err) {
				log('unable to connect to Creative-Server')
				// return log(err)
			}
			stopWatching()
		})
	}
}

module.exports = {
	prepare,
	startWatching,
	stopWatching,
	completeWatch
}
