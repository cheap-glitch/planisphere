/*!
 * planisphere
 *
 * A straightforward sitemap generator written in TypeScript.
 *
 * Copyright (c) 2020-present, cheap glitch
 *
 * Permission  to use,  copy, modify,  and/or distribute  this software  for any
 * purpose  with or  without  fee is  hereby granted,  provided  that the  above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS  SOFTWARE INCLUDING ALL IMPLIED  WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE  AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL  DAMAGES OR ANY DAMAGES  WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER  TORTIOUS ACTION,  ARISING OUT  OF  OR IN  CONNECTION WITH  THE USE  OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import { writeFileSync } from 'fs';

const XML_DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const MAX_NB_URLS_IN_SITEMAP = 50000;

export type SitemapUrlLoc        = string;
export type SitemapUrlLastmod    = Date | number | string;
export type SitemapUrlChangefreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
export type SitemapUrlPriority   = number | string;

export interface SitemapUrl {
	loc:         SitemapUrlLoc,
	lastmod?:    SitemapUrlLastmod,
	changefreq?: SitemapUrlChangefreq,
	priority?:   SitemapUrlPriority,
}

export function writeSitemaps(destination: string, sitemaps: Array<string>): void {
	sitemaps.forEach(sitemap => writeFileSync(destination, sitemap));
	if (sitemaps.length > 1) {
		const sitemapIndexes = sitemaps.map((_, index) => `sitemap-${(index + 1).toString().padStart(2, '0')}.xml`);
		writeFileSync(destination, XML_DOCTYPE + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + sitemapIndexes.join('') + '</sitemapindex>');
	}
}

export function generateSitemaps(
	urls:    Array<string | SitemapUrl>,
	options: { defaults?: Partial<SitemapUrl>, baseUrl?: string, trailingSlash?: boolean, pretty?: boolean } = {}
): Array<string> {
	const baseUrl       = options.baseUrl ? options.baseUrl.replace(/\/+$/, '') : '';
	const trailingSlash = options?.trailingSlash ?? undefined;
	// const pretty  = options?.pretty ?? false;

	const sitemaps = [];
	for (let offset = 0; offset < Math.ceil(urls.length / MAX_NB_URLS_IN_SITEMAP); offset++) {
		const sitemapUrls = [];
		for (let i = offset*MAX_NB_URLS_IN_SITEMAP; i < (offset + 1)*MAX_NB_URLS_IN_SITEMAP && i < urls.length; i++) {
			const url = (typeof urls[i] === 'string' ? { loc: urls[i] } : urls[i]) as SitemapUrl;

			let loc = [baseUrl, url.loc.replace(/^\//, '')].filter(Boolean).join('/');
			if (trailingSlash === true && !loc.endsWith('/')) {
				loc += '/';
			} else if (trailingSlash === false && loc.endsWith('/')) {
				loc = loc.slice(0, -1);
			}

			const lastmod    = ('lastmod'    in url) ? url.lastmod    : (options?.defaults?.lastmod    ?? undefined);
			const changefreq = ('changefreq' in url) ? url.changefreq : (options?.defaults?.changefreq ?? undefined);
			const priority   = ('priority'   in url) ? url.priority   : (options?.defaults?.priority   ?? undefined);

			sitemapUrls.push(xmlTag('url',
				xmlTag('loc', formatUrlLoc(loc)) +

				(lastmod    !== undefined ? xmlTag('lastmod',    formatUrlLastmod(lastmod))  : '') +
				(changefreq !== undefined ? xmlTag('changefreq', changefreq)                 : '') +
				(priority   !== undefined ? xmlTag('priority',   formatUrPriority(priority)) : '')
			));
		}
		sitemaps.push(XML_DOCTYPE + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + sitemapUrls.join('') + '</urlset>');
	}

	return sitemaps;
}

function formatUrlLoc(loc: SitemapUrlLoc): string {
	const replacements = {
		'&': 'amp',
		"'": 'apos',
		'"': 'quot',
		'<': 'lt',
		'>': 'gt',
	} as { [index: string]: string };

	return encodeURI(loc).replace(/[&'"<>]/g, character => '&' + replacements[character] + ';');
}

function formatUrlLastmod(lastmod: SitemapUrlLastmod): string {
	return ((lastmod instanceof Date) ? lastmod : new Date(lastmod)).toISOString();
}

function formatUrPriority(priority: SitemapUrlPriority): string {
	if (priority === 0) { return '0.0'; }
	if (priority === 1) { return '1.0'; }

	return priority.toString();
}

function xmlTag(tag: string, contents: string): string {
	return `<${tag}>${contents}</${tag}>`;
}
