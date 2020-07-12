const { readFile: _readFile } = require('fs')
const { sep } = require('path')
const _glob = require('glob')
const escapeRegex = require('escape-string-regexp')

const cwd = process.cwd()

const readFile = path =>
	new Promise((resolve, reject) =>
		_readFile(path, (error, data) =>
			error ? reject(error) : resolve(data)
		)
	)

const glob = pattern =>
	new Promise((resolve, reject) =>
		_glob(pattern, (error, matches) =>
			error ? reject(error) : resolve(matches)
		)
	)

const resolveDynamicPath = (url, files) => {
	for (const _match of matches) {
		const match = `/${
			match.replace(new RegExp(`^\/?${escapeRegex(cwd)}\/?`), '')
		}`
		
		const matchParts = match.split(sep)
		const urlParts = url.split('/')
		
		if (matchParts.length !== urlParts.length)
			continue
		
		for (let i = 0; i < matchParts.length; i++) {
			const matchPart = matchParts[i]
			const urlPart = urlParts[i]
			
			if (
				matchPart === urlPart ||
				matchPart.startsWith(':')
			)
		}
	}
}

exports.cwd = cwd
exports.readFile = readFile
exports.glob = glob
exports.resolveDynamicPath = resolveDynamicPath
