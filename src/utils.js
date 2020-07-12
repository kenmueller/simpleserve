const { readFile: _readFile } = require('fs')
const { sep, join } = require('path')
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

const getMatches = (fileParts, urlParts, isIndex) => {
	const matches = {}
	
	for (let i = 0; i < fileParts.length; i++) {
		const filePart = fileParts[i]
		const urlPart = urlParts[i]
		
		if (isIndex && (i === fileParts.length - 1) && !urlPart)
			break
		
		if (filePart === urlPart)
			continue
		
		if (filePart.startsWith(':')) {
			matches[filePart.replace(/^:/, '')] = urlPart
			continue
		}
		
		// Unsuccessful match
		return
	}
	
	return matches
}

const resolveDynamicPath = (pages, url, files) => {
	const urlParts = url.replace(/\/$/, '').split('/')
	
	for (const _file of files) {
		const isIndex = _file.endsWith('/index.js')
		const file = `/${
			_file.replace(
				new RegExp(`^\/?${escapeRegex(join(cwd, pages))}\/?(.*?)\.js$`),
				'$1'
			)
		}`
		
		const fileParts = file.split(sep)
		
		if (!(
			fileParts.length === urlParts.length ||
			(isIndex && (fileParts.length - 1 === urlParts.length))
		))
			continue
		
		const matches = getMatches(fileParts, urlParts, isIndex)
		
		if (matches)
			return {
				status: 200,
				path: _file,
				matches,
				getProps: require(_file)
			}
	}
}

exports.cwd = cwd
exports.readFile = readFile
exports.glob = glob
exports.resolveDynamicPath = resolveDynamicPath
