import 'expect-more-jest';
import { resolve } from 'path';
import { mkdtemp, rm, readFile, readdir } from 'fs/promises';

import { indexes, wrapSitemap, wrapSitemapIndex } from './helpers';
import { generateSitemaps, generateSitemapsIndex, writeSitemaps } from '../src';

describe('generateSitemaps', () => {

	it('generates a simple sitemap from full URLs', () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about']))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps([{ loc: 'https://example.com' }, { loc: 'https://example.com/about' }]))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

	}); // }}}

	it('generates a simple sitemap from partial URLs and a base URL', () => { // {{{

		expect(generateSitemaps(['', 'about'], { baseUrl: 'https://example.com' }))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://example.com' }))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://example.com/' }))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://example.com:7000' }))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com:7000</loc></url><url><loc>https://example.com:7000/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://162.75.90.1' }))
		.toStrictEqual([wrapSitemap('<url><loc>https://162.75.90.1</loc></url><url><loc>https://162.75.90.1/about</loc></url>')]);

		expect(generateSitemaps([{ loc: '/' }, { loc: '/about' }], { baseUrl: 'https://example.com' }))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

	}); // }}}

	it('leaves trailing slashes untouched if `trailingSlash` is unspecified', () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about/', 'https://example.com/page']))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

		expect(generateSitemaps(['/', '/about/', '/page'], { baseUrl: 'https://example.com' }))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

	}); // }}}

	it('adds a trailing slash if `trailingSlash` is set to `true`', () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about/', 'https://example.com/page'], { trailingSlash: true }))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com/</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page/</loc></url>',
		])]);

		expect(generateSitemaps(['/', '/about/', '/page'], { baseUrl: 'https://example.com', trailingSlash: true }))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com/</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page/</loc></url>',
		])]);

	}); // }}}

	it('remove trailing slashes if `trailingSlash` is set to `false`', () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about/', 'https://example.com/page'], { trailingSlash: false }))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

		expect(generateSitemaps(['/', '/about/', '/page'], { baseUrl: 'https://example.com', trailingSlash: false }))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

	}); // }}}

	it('encodes URLs properly', () => { // {{{

		expect(generateSitemaps(['https://example.com/search?color="always"&reverse-order']))
		.toStrictEqual([wrapSitemap('<url><loc>https://example.com/search?color=%22always%22&amp;reverse-order</loc></url>')]);

		expect(generateSitemaps(['https://éléphant.com/about']))
		.toStrictEqual([wrapSitemap('<url><loc>https://%C3%A9l%C3%A9phant.com/about</loc></url>')]);

	}); // }}}

	it('takes URL meta tags into account', () => { // {{{

		expect(generateSitemaps([{
			loc: 'https://example.com/about',
			lastmod: '2020-01-01',
			priority: 0.3,
			changefreq: 'monthly',
		}]))
		.toStrictEqual([wrapSitemap([
			'<url>',
				'<loc>https://example.com/about</loc>',
				'<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
				'<priority>0.3</priority>',
				'<changefreq>monthly</changefreq>',
			'</url>',
		])]);

	}); // }}}

	it('takes default meta tags into account', () => { // {{{

		expect(generateSitemaps(['https://example.com/about'], {
			defaults: {
				lastmod: '2020-01-01',
				priority: 0.3,
				changefreq: 'monthly',
			},
		}))
		.toStrictEqual([wrapSitemap([
			'<url>',
				'<loc>https://example.com/about</loc>',
				'<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
				'<priority>0.3</priority>',
				'<changefreq>monthly</changefreq>',
			'</url>',
		])]);

	}); // }}}

	it('prioritizes per-URL meta tags over global defaults', () => { // {{{

		expect(generateSitemaps([{
			loc: 'https://example.com/about',
			lastmod: '2020-01-01',
			priority: 0.3,
			changefreq: 'monthly',
		}], {
			defaults: {
				priority: 0.8,
				changefreq: 'never',
			},
		}))
		.toStrictEqual([wrapSitemap([
			'<url>',
				'<loc>https://example.com/about</loc>',
				'<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
				'<priority>0.3</priority>',
				'<changefreq>monthly</changefreq>',
			'</url>',
		])]);

	}); // }}}

	it('handles dates in various formats', () => { // {{{

		expect(generateSitemaps([
			{
				loc: 'https://example.com/about',
				lastmod: 'December 17, 1995 03:24:00',
			},
			{
				loc: 'https://example.com/info',
				lastmod: new Date('December 17, 1995 03:24:00'),
			},
			{
				loc: 'https://example.com/page',
				lastmod: 1_578_485_826_000,
			},
		]))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com/about</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
			'<url><loc>https://example.com/info</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
			'<url><loc>https://example.com/page</loc><lastmod>2020-01-08T12:17:06.000Z</lastmod></url>',
		])]);

	}); // }}}

	it('writes whole-number priorities with a decimal', () => { // {{{

		expect(generateSitemaps([
			{
				loc: 'https://example.com/about',
				priority: 1,
			},
			{
				loc: 'https://example.com/old',
				priority: 0,
			},
		]))
		.toStrictEqual([wrapSitemap([
			'<url><loc>https://example.com/about</loc><priority>1.0</priority></url>',
			'<url><loc>https://example.com/old</loc><priority>0.0</priority></url>',
		])]);

	}); // }}}

	it('generates several sitemaps if the total number of URLs exceeds 50,000', () => { // {{{

		expect(generateSitemaps(indexes(100_001).map(index => `https://example.com/user/${index + 1}`)))
		.toStrictEqual([
			wrapSitemap(indexes(50_000).map(index => `<url><loc>https://example.com/user/${index + 1}</loc></url>`)),
			wrapSitemap(indexes(50_000).map(index => `<url><loc>https://example.com/user/${index + 50_001}</loc></url>`)),
			wrapSitemap('<url><loc>https://example.com/user/100001</loc></url>'),
		]);

	}); // }}}

	it('generates formatted XML if pretty is set to `true`', () => { // {{{

		expect(generateSitemaps(['/', '/about'], {
			baseUrl: 'https://example.com',
			defaults: { priority: 0.7 },
			pretty: true,
		}))
		.toStrictEqual([wrapSitemap([
			'\t<url>',
				'\t\t<loc>https://example.com</loc>',
				'\t\t<priority>0.7</priority>',
			'\t</url>',
			'\t<url>',
				'\t\t<loc>https://example.com/about</loc>',
				'\t\t<priority>0.7</priority>',
			'\t</url>',
		], true)]);

	}); // }}}

});

describe('generateSitemapsIndex', () => {

	it('returns `undefined` if there is only a single sitemap', () => { // {{{

		expect(generateSitemapsIndex([])).toBeUndefined();
		expect(generateSitemapsIndex(['sitemap.xml'])).toBeUndefined();

	}); // }}}

	it('generates a sitemap index from file paths', () => { // {{{

		expect(generateSitemapsIndex(['sitemap-01.xml', 'sitemap-02.xml'], {}, new Date('2020-01-01')))
		.toStrictEqual(wrapSitemapIndex([
			'<sitemap><loc>sitemap-01.xml</loc><lastmod>2020-01-01T00:00:00.000Z</lastmod></sitemap>',
			'<sitemap><loc>sitemap-02.xml</loc><lastmod>2020-01-01T00:00:00.000Z</lastmod></sitemap>',
		]));

	}); // }}}

	it('generates a sitemap index from file paths and a base URL', () => { // {{{

		expect(generateSitemapsIndex(['sitemap-01.xml', 'sitemap-02.xml'], { baseUrl: 'https://example.com' }, new Date('2020-01-01')))
		.toStrictEqual(wrapSitemapIndex([
			'<sitemap><loc>https://example.com/sitemap-01.xml</loc><lastmod>2020-01-01T00:00:00.000Z</lastmod></sitemap>',
			'<sitemap><loc>https://example.com/sitemap-02.xml</loc><lastmod>2020-01-01T00:00:00.000Z</lastmod></sitemap>',
		]));

	}); // }}}

	it('generates formatted XML if pretty is set to `true`', () => { // {{{

		expect(generateSitemapsIndex(['sitemap-01.xml', 'sitemap-02.xml'], {
			baseUrl: 'https://example.com',
			pretty: true,
		}, new Date('2020-01-01')))
		.toStrictEqual(wrapSitemapIndex([
			'\t<sitemap>',
				'\t\t<loc>https://example.com/sitemap-01.xml</loc>',
				'\t\t<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
			'\t</sitemap>',
			'\t<sitemap>',
				'\t\t<loc>https://example.com/sitemap-02.xml</loc>',
				'\t\t<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
			'\t</sitemap>',
		], true));

	}); // }}}

});

describe('writeSitemaps', () => {

	// Setup & teardown {{{

	let temporaryDirectory: string;
	beforeEach(async () => {
		temporaryDirectory = await mkdtemp('sitemaps-');
	});
	afterEach(() => rm(temporaryDirectory, { recursive: true, maxRetries: 3 }));

	function readSitemap(filename: string): Promise<string> {
		return readFile(resolve(temporaryDirectory, filename), { encoding: 'utf8' });
	}

	// }}}

	it('does nothing if no URLs are passed', async () => { // {{{

		await writeSitemaps(temporaryDirectory, []);

		await expect(readdir(temporaryDirectory)).resolves.toBeEmptyArray();

	}); // }}}

	it('can generate and write a single sitemap', async () => { // {{{

		await writeSitemaps(temporaryDirectory, ['https://example.com', 'https://example.com/about']);

		await expect(readdir(temporaryDirectory))
			.resolves
			// eslint-disable-next-line jest/prefer-strict-equal -- Check if the directory listing contains the relevant file
			.toEqual(['sitemap.xml']);
		await expect(readSitemap('sitemap.xml'))
			.resolves
			.toBe(wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'));

	}); // }}}

	it('can generate and write several sitemaps with their sitemap index', async () => { // {{{

		await writeSitemaps(temporaryDirectory, indexes(70_000).map(index => `https://example.com/user/${index + 1}`));

		await expect(readdir(temporaryDirectory))
			.resolves
			// eslint-disable-next-line jest/prefer-strict-equal -- Check if the directory listing contains the relevant files
			.toEqual(['sitemap-index.xml', 'sitemap-part-01.xml', 'sitemap-part-02.xml']);

	}); // }}}

});
