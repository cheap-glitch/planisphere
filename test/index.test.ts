import { generateSitemaps } from '../index';
import { indexes, wrapSitemap } from './helpers';

describe("generateSitemaps", () => {

	it("generates a simple sitemap from full URLs", () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about']))
		.toEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps([{ loc: 'https://example.com' }, { loc: 'https://example.com/about' }]))
		.toEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

	}); // }}}

	it("generates a simple sitemap from partial URLs and a base URL", () => { // {{{

		expect(generateSitemaps(['', 'about'], { baseUrl: 'https://example.com' }))
		.toEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://example.com' }))
		.toEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://example.com/' }))
		.toEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://example.com:7000' }))
		.toEqual([wrapSitemap('<url><loc>https://example.com:7000</loc></url><url><loc>https://example.com:7000/about</loc></url>')]);

		expect(generateSitemaps(['/', '/about'], { baseUrl: 'https://162.75.90.1' }))
		.toEqual([wrapSitemap('<url><loc>https://162.75.90.1</loc></url><url><loc>https://162.75.90.1/about</loc></url>')]);

		expect(generateSitemaps([{ loc: '/' }, { loc: '/about' }], { baseUrl: 'https://example.com' }))
		.toEqual([wrapSitemap('<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>')]);

	}); // }}}

	it("leaves trailing slashes untouched if `trailingSlash` is unspecified", () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about/', 'https://example.com/page']))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

		expect(generateSitemaps(['/', '/about/', '/page'], { baseUrl: 'https://example.com' }))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

	}); // }}}

	it("adds a trailing slash if `trailingSlash` is set to `true`", () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about/', 'https://example.com/page'], { trailingSlash: true }))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com/</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page/</loc></url>',
		])]);

		expect(generateSitemaps(['/', '/about/', '/page'], { baseUrl: 'https://example.com', trailingSlash: true }))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com/</loc></url>',
			'<url><loc>https://example.com/about/</loc></url>',
			'<url><loc>https://example.com/page/</loc></url>',
		])]);

	}); // }}}

	it("remove trailing slashes if `trailingSlash` is set to `false`", () => { // {{{

		expect(generateSitemaps(['https://example.com', 'https://example.com/about/', 'https://example.com/page'], { trailingSlash: false }))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

		expect(generateSitemaps(['/', '/about/', '/page'], { baseUrl: 'https://example.com', trailingSlash: false }))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com</loc></url>',
			'<url><loc>https://example.com/about</loc></url>',
			'<url><loc>https://example.com/page</loc></url>',
		])]);

	}); // }}}

	it("encodes URLs properly", () => { // {{{

		expect(generateSitemaps(['https://example.com/search?color="always"&reverse-order']))
		.toEqual([wrapSitemap('<url><loc>https://example.com/search?color=%22always%22&amp;reverse-order</loc></url>')]);

		expect(generateSitemaps(['https://éléphant.com/about']))
		.toEqual([wrapSitemap('<url><loc>https://%C3%A9l%C3%A9phant.com/about</loc></url>')]);

	}); // }}}

	it("takes URL meta tags into account", () => { // {{{

		expect(generateSitemaps([{
			loc:        'https://example.com/about',
			changefreq: 'monthly',
			lastmod:    '2020-01-01',
			priority:   0.3,
		}]))
		.toEqual([wrapSitemap([
			'<url>',
			'<loc>https://example.com/about</loc>',
			'<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
			'<changefreq>monthly</changefreq>',
			'<priority>0.3</priority>',
			'</url>',
		])]);

	}); // }}}

	it("takes default meta tags into account", () => { // {{{

		expect(generateSitemaps(['https://example.com/about'], {
			defaults: {
				changefreq: 'monthly',
				lastmod:    '2020-01-01',
				priority:   0.3,
			}
		}))
		.toEqual([wrapSitemap([
			'<url>',
			'<loc>https://example.com/about</loc>',
			'<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
			'<changefreq>monthly</changefreq>',
			'<priority>0.3</priority>',
			'</url>',
		])]);

	}); // }}}

	it("prioritizes per-URL meta tags over global defaults", () => { // {{{

		expect(generateSitemaps([{
				loc:        'https://example.com/about',
				changefreq: 'monthly',
				lastmod:    '2020-01-01',
				priority:   0.3,
			}], {
				defaults: {
					changefreq: 'never',
					priority:   0.8,
				},
			}
		))
		.toEqual([wrapSitemap([
			'<url>',
			'<loc>https://example.com/about</loc>',
			'<lastmod>2020-01-01T00:00:00.000Z</lastmod>',
			'<changefreq>monthly</changefreq>',
			'<priority>0.3</priority>',
			'</url>',
		])]);

	}); // }}}

	it("handles dates in various formats", () => { // {{{

		expect(generateSitemaps([
			{
				loc:     'https://example.com/about',
				lastmod: 'December 17, 1995 03:24:00',
			},
			{
				loc:     'https://example.com/info',
				lastmod: new Date('December 17, 1995 03:24:00'),
			},
			{
				loc:     'https://example.com/page',
				lastmod: 1578485826000,
			},
		]))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com/about</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
			'<url><loc>https://example.com/info</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
			'<url><loc>https://example.com/page</loc><lastmod>2020-01-08T12:17:06.000Z</lastmod></url>',
		])]);

	}); // }}}

	it("writes whole-number priorities with a decimal", () => { // {{{

		expect(generateSitemaps([
			{
				loc:      'https://example.com/about',
				priority: 1,
			},
			{
				loc:      'https://example.com/old',
				priority: 0,
			},
		]))
		.toEqual([wrapSitemap([
			'<url><loc>https://example.com/about</loc><priority>1.0</priority></url>',
			'<url><loc>https://example.com/old</loc><priority>0.0</priority></url>',
		])]);

	}); // }}}

	it("generates several sitemaps if the total number of URLs exceeds 50,000", () => { // {{{

		expect(generateSitemaps(indexes(100001).map(i => `https://example.com/user/${i+1}`)))
		.toEqual([
			wrapSitemap(indexes(50000).map(i => `<url><loc>https://example.com/user/${i+1}</loc></url>`)),
			wrapSitemap(indexes(50000).map(i => `<url><loc>https://example.com/user/${i+50001}</loc></url>`)),
			wrapSitemap('<url><loc>https://example.com/user/100001</loc></url>'),
		]);

	}); // }}}

});
