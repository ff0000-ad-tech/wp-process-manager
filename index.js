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

// start watching
function startWatching() {
	if (options.start) {
		log('Requesting Creative-Server to watch')
		log(options.start)
		request(options.start, (err, res, body) => {
			if (err) {
				return log(err)
			}
			log(res.headers)
		})
	}
}

module.exports = {
	prepare,
	startWatching
}
