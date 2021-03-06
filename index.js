const axios = require('axios')

const debug = require('@ff0000-ad-tech/debug')
var log = debug('PM')

// options
let options = {}

// prepare
const prepare = (_options) => {
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

const getCmd = (name) => {
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
const prepareInterrupt = () => {
	const cleanup = async () => {
		const processExit = () => {
			log('Goodbye~')
			process.exit()
		}
		await stopWatching(processExit, processExit)
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
const startWatching = async () => {
	const cmd = getCmd('watch-start')
	if (cmd) {
		log('Requesting Creative-Server to watch')
		log(cmd)
		prepareInterrupt()
		try {
			await axios.get(`${cmd}/${process.pid}`)
		} catch (err) {
			log('unable to connect to Creative-Server')
		}
	}
}

// stop watching
const stopWatching = async (cb, errCb) => {
	const cmd = getCmd('watch-stop')
	if (cmd) {
		log('Requesting Creative-Server to stop watching')
		log(cmd)
		try {
			await axios.get(`${cmd}/${process.pid}`)
			process.stdin.destroy() // release the process to terminate on its own
			if (cb) {
				cb()
			}
		} catch (err) {
			log('unable to connect to Creative-Server')
			// return log(err)
			if (errCb) {
				errCb()
			}
		}
	}
}

// complete watching
const completeWatch = async () => {
	const cmd = getCmd('watch-complete')
	if (cmd) {
		log('Inform Creative-Server process is complete')
		log(cmd)
		try {
			await axios.get(cmd)
			stopWatching()
		} catch (err) {
			log('unable to connect to Creative-Server')
		}
	}
}

// processing
const setProcessing = async (toggle) => {
	let cmd = getCmd('processing-start')
	if (!toggle) {
		cmd = getCmd('processing-stop')
	}
	if (cmd) {
		try {
			await axios.get(`${cmd}`)
		} catch (err) {
			// return log(err)
		}
	}
}

// erroring
const setError = async (toggle) => {
	let cmd = getCmd('error-dispatch')
	if (!toggle) {
		cmd = getCmd('error-reset')
	}
	if (cmd) {
		try {
			await axios.get(`${cmd}`)
		} catch (err) {
			// return log(err)
		}
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
