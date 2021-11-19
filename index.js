const axios = require('axios')

const debug = require('@ff0000-ad-tech/debug')
var log = debug('PM')

// options
let options = {}

// if creative server is not reachable
let csAvailable = true

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
			case 'api':
				return options.api
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
	process.on('exit', (code) => {
		log(`Exit code: ${code}`)
	})
	process.on('uncaughtException', (err) => {
		log(err)
		cleanup()
	})
}

// comm
const executeReq = async (req, { desc, cb, errCb } = {}) => {
	// give up making reqs to creative-server if previously unreachable
	if (!csAvailable) {
		errCb && errCb()
		return
	}
	desc && log(desc)
	log(req)
	try {
		await axios({ url: req, method: 'get', timeout: 200 })
		cb && cb()
	} catch (err) {
		log(`Unable to connect to Creative-Server: ${err.message}`)
		csAvailable = false
		errCb && errCb()
	}
}

// start watching
const startWatching = async () => {
	const cmd = getCmd('watch-start')
	if (cmd) {
		prepareInterrupt()
		await executeReq(`${cmd}/${process.pid}`, { desc: 'Requesting Creative-Server to watch' })
	}
}

// stop watching
const stopWatching = async (cb, errCb) => {
	const cmd = getCmd('watch-stop')
	if (cmd) {
		await executeReq(`${cmd}/${process.pid}`, {
			desc: 'Requesting Creative-Server to stop watching',
			cb: () => {
				process.stdin.destroy() // release the process to terminate on its own
				cb && cb()
			},
			errCb
		})
	}
}

// complete watching
const completeWatch = async () => {
	const cmd = getCmd('watch-complete')
	if (cmd) {
		await executeReq(cmd, { desc: 'Inform Creative-Server process is complete' })
	}
}

// processing
const setProcessing = async (toggle) => {
	let cmd = getCmd('processing-start')
	if (!toggle) {
		cmd = getCmd('processing-stop')
	}
	if (cmd) {
		await executeReq(cmd)
	}
}

// erroring
const setError = async (toggle) => {
	let cmd = getCmd('error-dispatch')
	if (!toggle) {
		cmd = getCmd('error-reset')
	}
	if (cmd) {
		await executeReq(cmd)
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
