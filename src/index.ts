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

import { resolve } from 'path';
import { writeFile } from 'fs/promises';

const XML_DOCTYPE = '<?xml version="1.0" encoding="UTF-8"?>';
const MAX_NB_URLS_IN_SITEMAP = 50000;

export type SitemapUrlLoc        = string;
export type SitemapUrlLastmod    = Date | number | string;
export type SitemapUrlChangefreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
export type SitemapUrlPriority   = number | string;

interface GenerateOptions {
	defaults:      Partial<SitemapUrl>,
	baseUrl:       string,
	trailingSlash: boolean,
	pretty:        boolean,
}

export interface SitemapUrl {
	loc:         SitemapUrlLoc,
	lastmod?:    SitemapUrlLastmod,
	changefreq?: SitemapUrlChangefreq,
	priority?:   SitemapUrlPriority,
}

export async function writeSitemaps(destination: string, urls: Array<string | SitemapUrl>, options: Partial<GenerateOptions> = {}): Promise<void> {
	const sitemaps = generateSitemaps(urls, options);
	if (sitemaps.length === 0) {
		return;
	}
	if (sitemaps.length === 1) {
		await writeFile(resolve(destination, 'sitemap.xml'), sitemaps[0]);
		return;
	}

	const sitemapFilenames = sitemaps.map((_, index) => `sitemap-part-${(index + 1).toString().padStart(2, '0')}.xml`);
	await Promise.all(sitemaps.map((sitemap, index) => writeFile(resolve(destination, sitemapFilenames[index]), sitemap)));

	const sitemapIndex = generateSitemapsIndex(sitemapFilenames, options);
	if (sitemapIndex) {
		await writeFile(resolve(destination, 'sitemap.index.xml'), sitemapIndex);
	}
}

export function generateSitemapsIndex(sitemapFilenames: Array<string>, options: Partial<GenerateOptions> = {}, lastmod: SitemapUrlLastmod = new Date()): string | undefined {
	if (sitemapFilenames.length <= 1) {
		return undefined;
	}

	const baseUrl = options.baseUrl  ? options.baseUrl.replace(/\/+$/, '') : '';
	const pretty  = options?.pretty ?? false;

	const NL  = pretty ? '\n' : '';
	const TAB = pretty ? '\t' : '';

	const sitemaps = sitemapFilenames.map(filename => {
		return TAB + xmlTag('sitemap', NL +
			TAB + TAB + xmlTag('loc',     [baseUrl, filename].filter(Boolean).join('/')) + NL +
			TAB + TAB + xmlTag('lastmod', formatUrlLastmod(lastmod)) + NL + TAB
		);
	});

	return XML_DOCTYPE + NL + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + NL + sitemaps.join(NL) + NL + '</sitemapindex>'
}

export function generateSitemaps(urls: Array<string | SitemapUrl>, options: Partial<GenerateOptions> = {}): Array<string> {
	const baseUrl       = options.baseUrl ? options.baseUrl.replace(/\/+$/, '') : '';
	const trailingSlash = options?.trailingSlash ?? undefined;
	const pretty        = options?.pretty ?? false;

	const NL  = pretty ? '\n' : '';
	const TAB = pretty ? '\t' : '';

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

			sitemapUrls.push(TAB + xmlTag('url', NL +
				TAB + TAB + xmlTag('loc', formatUrlLoc(loc)) + NL +
				(lastmod    !== undefined ? TAB + TAB + xmlTag('lastmod',    formatUrlLastmod(lastmod))  + NL : '') +
				(changefreq !== undefined ? TAB + TAB + xmlTag('changefreq', changefreq)                 + NL : '') +
				(priority   !== undefined ? TAB + TAB + xmlTag('priority',   formatUrPriority(priority)) + NL : '') + TAB
			));
		}
		sitemaps.push(
			XML_DOCTYPE + NL +
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + NL +
				sitemapUrls.join(NL) + NL +
			'</urlset>'
		);
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
