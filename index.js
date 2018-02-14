const request = require('request')

const debug = require('debug')
var log = debug('PM')

// options
let options = {}

// prepare
function prepare(_options) {
	options = Object.assign(
		{
			api: null, // path to creative-server api
			key: null, // `/${ctype}/${size}/${index}`,
			watch: {
				start: null, // `/watch-start`,
				stop: null, // `/watch-stop`,
				complete: null // `/watch-complete`,
			},
			processing: {
				start: null, // `/processing-start`,
				stop: null // `/processing-stop`
			},
			error: null // `/error`
		},
		_options
	)
}

function getCmd(name) {
	try {
		switch (name) {
			case 'watch-start':
				return options.api + options.watch.start + options.key
			case 'watch-stop':
				return options.api + options.watch.stop + options.key
			case 'watch-complete':
				return options.api + options.watch.complete + options.key
			case 'processing-start':
				return options.api + options.processing.start + options.key
			case 'processing-stop':
				return options.api + options.processing.stop + options.key
			case 'error-dispatch':
				return options.api + options.error.dispatch + options.key
			case 'error-reset':
				return options.api + options.error.reset + options.key
		}
	} catch (err) {
		return
	}
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
	process.on('SIGTERM', cleanup)
	// process.on('SIGKILL', cleanup)
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
	const cmd = getCmd('watch-start')
	if (cmd) {
		log('Requesting Creative-Server to watch')
		log(cmd)
		prepareInterrupt()
		request(`${cmd}/${process.pid}`, (err, res, body) => {
			if (err) {
				log('unable to connect to Creative-Server')
				// return log(err)
			}
		})
	}
}

// stop watching
function stopWatching(cb) {
	const cmd = getCmd('watch-stop')
	if (cmd) {
		log('Requesting Creative-Server to stop watching')
		log(cmd)
		request(`${cmd}/${process.pid}`, (err, res, body) => {
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
	const cmd = getCmd('watch-complete')
	if (cmd) {
		log('Inform Creative-Server process is complete')
		log(cmd)
		request(cmd, (err, res, body) => {
			if (err) {
				log('unable to connect to Creative-Server')
				// return log(err)
			}
			stopWatching()
		})
	}
}

// processing
function setProcessing(toggle) {
	let cmd = getCmd('processing-start')
	if (!toggle) {
		cmd = getCmd('processing-stop')
	}
	if (cmd) {
		request(`${cmd}`, (err, res, body) => {
			if (err) {
				// return log(err)
			}
		})
	}
}

// erroring
function setError(toggle) {
	let cmd = getCmd('error-dispatch')
	if (!toggle) {
		cmd = getCmd('error-reset')
	}
	if (cmd) {
		request(`${cmd}`, (err, res, body) => {
			if (err) {
				// return log(err)
			}
		})
	}
}

module.exports = {
	prepare,
	startWatching,
	stopWatching,
	completeWatch,
	setProcessing,
	setError
}
