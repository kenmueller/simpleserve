const { readFile: _readFile } = require('fs')
const { join } = require('path')
const express = require('express')
const { compile } = require('handlebars')

const cwd = process.cwd()

const requestCache = {}
const templateCache = {}

const readFile = path =>
	new Promise((resolve, reject) =>
		_readFile(path, (error, data) =>
			error ? reject(error) : resolve(data)
		)
	)

module.exports = ({
	optimize = process.env.NODE_ENV === 'production',
	pages = 'pages',
	public = 'public'
} = {}) => (req, res, next) => {
	const fallback = async () => {
		try {
			const { method, url } = req
			
			if (method !== 'GET')
				return next()
			
			let cachedRequestValues = requestCache[url]
			let { path, status, getProps } = cachedRequestValues || {}
			
			if (!(optimize && cachedRequestValues)) {
				try {
					const path = join(cwd, 'pages', url)
					
					cachedRequestValues = {
						status: 200,
						path,
						getProps: require(path)
					}
				} catch {
					const path = join(cwd, 'pages', '404')
					
					cachedRequestValues = {
						status: 404,
						path,
						getProps: require(path)
					}
				}
				
				;({ path, status, getProps } = (
					requestCache[url] = cachedRequestValues
				))
			}
			
			const props = typeof getProps === 'function'
				? await getProps(req)
				: getProps
			
			res.status(status)
			
			const cachedTemplate = templateCache[path]
			
			if (optimize && cachedTemplate)
				return res.send(cachedTemplate(props))
			
			const data = await readFile(`${path}.html`)
				.catch(() => readFile(join(path, 'index.html')))
			
			res.send((templateCache[path] = compile(data.toString()))(props))
		} catch (error) {
			res.status(500).json(error)
		}
	}
	
	public
		? express.static(join(cwd, public))(req, res, fallback)
		: fallback()
}
