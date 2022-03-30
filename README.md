# 🗺️ planisphere

[![License](https://shields.io/github/license/cheap-glitch/planisphere)](LICENSE)
[![Latest release](https://shields.io/github/v/release/cheap-glitch/planisphere?sort=semver&label=latest%20release&color=green)](https://github.com/cheap-glitch/planisphere/releases/latest)
[![Coverage status](https://shields.io/coveralls/github/cheap-glitch/planisphere)](https://coveralls.io/github/cheap-glitch/planisphere)

> A straightforward sitemap generator written in TypeScript.

## Features

 * Generates sitemaps with [associated metadata](https://www.sitemaps.org/protocol.html#xmlTagDefinitions) for each URL

 * Escapes problematic URLs and can append/remove trailing slashes

 * Automatically splits large sitemaps (with 50,000+ URLs) and generates the associated index

## Installation

```shell
npm i planisphere
```

## Usage

```javascript
const { writeSitemaps } = require('planisphere');

writeSitemaps('dist', [
	'/',
	'/about',
	{
		loc: '/blog',
		priority: 0.9,
		changefreq: 'weekly',
	},
], {
	baseUrl: 'https://example.com',
	trailingSlash: false,
	pretty: true,
})
.then(() => console.info('sitemap successfully generated!'));
```

## API

### `generateSitemaps(urls: Array<string | SitemapUrl>, options?): Array<string>`

Returns an  array of  sitemaps contents.

Usually   there   will   only   be   a    single   one,   but   if   more   than
50,000  URLs   are  provided,   they  will  be   split  into   several  sitemaps
[as requested  by  the protocol](https://www.sitemaps.org/protocol.html#index).
You should  then pass  the resulting  array to  `generateSitemapsIndex()`.

#### `urls`

An array of strings and/or objects with the following properties:

 * `loc: string`: the URL (_required_)

 * `lastmod: Date | number | string`: a date string in the [W3C format](https://www.w3.org/TR/NOTE-datetime), a JavaScript timestamp string, a numeric timestamp or a Date object

 * `changefreq: SitemapUrlChangefreq`: `'always'`, `'hourly'`, `'daily'`, `'weekly'`, `'monthly'`, `'yearly'` or `'never'`

 * `priority: number | string`: a multiple of `0.1` between `0.0` and `1.0` (defaults to `0.5`)

#### `options`

An object with the following properties (all optional):

 * `defaults: { lastmod?, changefreq?, priority? }`: default values for the meta tags accompanying each URL

 * `baseUrl: string`: a base URL to prepend every URL with

 * `trailingSlash: boolean`: `true` to append a trailing slash to every URL, `false` to always remove it (if unspecified, will leave the URLs unchanged)

 * `pretty: boolean`: `true` to pretty-print the outputted XML to be human-readable

### `generateSitemapsIndex(files: Array<string>, options?, lastmod?): string?`

Returns the contents of a [sitemap index](https://www.sitemaps.org/protocol.html#index), or `undefined` if there is one filename or less.

#### `files`

The filenames of the sitemap(s).

#### `lastmod`

The last modification date of the sitemaps (defaults to the current timestamp).

### `writeSitemaps(dest: string, urls: Array<string | SitemapUrl>, options?)`

Generates and write the sitemap(s) to the disk. Returns a `Promise<void>`.

#### `dest`

The path to the folder in which to write the generated file(s).

## Changelog

See the full changelog [here](https://github.com/cheap-glitch/planisphere/releases).

## Contributing

Contributions are welcomed! Please open an issue before proposing any significant changes.

## Related

 * [www.sitemaps.org](https://www.sitemaps.org/protocol.html) - Detailed description of the Sitemaps protocol
 * [sitempap.js](https://github.com/ekalinin/sitemap.js) - Another sitemap generator (TypeScript)
 * [vue-cli-plugin-sitemap](https://github.com/cheap-glitch/vue-cli-plugin-sitemap) - This module as a Vue CLI plugin

## License

ISC
