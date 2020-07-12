const { join } = require('path')
const express = require('express')
const { compile } = require('handlebars')

const { cwd, readFile, glob, resolveDynamicPath } = require('./utils')

const requestCache = {}
const templateCache = {}

let jsFilesCache

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
			let { path, status, matches, getProps } = cachedRequestValues || {}
			
			if (!(optimize && cachedRequestValues)) {
				try {
					try {
						const path = join(cwd, pages, url)
						
						cachedRequestValues = {
							status: 200,
							path,
							matches: null,
							getProps: require(path)
						}
					} catch {
						cachedRequestValues = resolveDynamicPath(
							pages,
							url,
							(optimize && jsFilesCache) || (
								jsFilesCache = await glob(join(cwd, pages, '**', '*.js'))
							)
						)
						
						if (!cachedRequestValues)
							throw new Error() // Caught by 404
					}
				} catch {
					const path = join(cwd, pages, '404')
					
					cachedRequestValues = {
						status: 404,
						path,
						matches: null,
						getProps: require(path)
					}
				}
				
				;({ path, status, matches, getProps } = (
					requestCache[url] = cachedRequestValues
				))
			}
			
			const props = typeof getProps === 'function'
				? await getProps(Object.assign(req, matches))
				: getProps
			
			res.status(status)
			
			const cachedTemplate = templateCache[path]
			
			if (optimize && cachedTemplate)
				return res.send(cachedTemplate(props))
			
			const data = await readFile(`${path.replace(/\.js$/, '')}.html`)
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
