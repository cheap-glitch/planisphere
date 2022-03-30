/*
 *!
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
const MAX_NB_URLS_IN_SITEMAP = 50_000;

export type SitemapUrlLoc = string;
export type SitemapUrlLastmod = Date | number | string;
export type SitemapUrlPriority = number | string;
export type SitemapUrlChangefreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export interface Options {
	defaults: Partial<SitemapUrl>;
	baseUrl: string;
	trailingSlash: boolean;
	pretty: boolean;
}

export interface SitemapUrl {
	loc: SitemapUrlLoc;
	lastmod?: SitemapUrlLastmod;
	priority?: SitemapUrlPriority;
	changefreq?: SitemapUrlChangefreq;
}

export async function writeSitemaps(destination: string, urls: Array<string | SitemapUrl>, options: Partial<Options> = {}): Promise<void> {
	const sitemaps = generateSitemaps(urls, options);
	if (sitemaps.length === 0) {
		return;
	}

	const sitemapFilenames = sitemaps.length === 1 ? ['sitemap.xml'] : sitemaps.map((_, index) => `sitemap-part-${String(index + 1).padStart(2, '0')}.xml`);
	await Promise.all(sitemaps.map((sitemap, index) => writeFile(resolve(destination, sitemapFilenames[index]), sitemap)));

	const sitemapIndex = generateSitemapsIndex(sitemapFilenames, options);
	if (sitemapIndex !== undefined) {
		await writeFile(resolve(destination, 'sitemap-index.xml'), sitemapIndex);
	}
}

export function generateSitemapsIndex(sitemapFilenames: string[], options: Partial<Options> = {}, lastmod: SitemapUrlLastmod = new Date()): string | undefined {
	if (sitemapFilenames.length <= 1) {
		return undefined;
	}

	const baseUrl = options.baseUrl ? options.baseUrl.replace(/\/+$/u, '') : '';
	const pretty = options.pretty ?? false;
	const NL = pretty ? '\n' : '';
	const TAB = pretty ? '\t' : '';

	const sitemaps = sitemapFilenames.map(filename => {
		return TAB + xmlTag('sitemap', NL
			+ TAB + TAB + xmlTag('loc', [baseUrl, filename].filter(Boolean).join('/')) + NL
			+ TAB + TAB + xmlTag('lastmod', formatUrlLastmod(lastmod)) + NL + TAB,
		);
	});

	return XML_DOCTYPE + NL + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + NL + sitemaps.join(NL) + NL + '</sitemapindex>';
}

export function generateSitemaps(urls: Array<string | SitemapUrl>, options: Partial<Options> = {}): string[] {
	const baseUrl = options.baseUrl ? options.baseUrl.replace(/\/+$/u, '') : '';
	const trailingSlash = options.trailingSlash ?? undefined;
	const pretty = options.pretty ?? false;

	const NL = pretty ? '\n' : '';
	const TAB = pretty ? '\t' : '';

	const sitemaps = [];
	for (let offset = 0; offset < Math.ceil(urls.length / MAX_NB_URLS_IN_SITEMAP); offset++) {
		const sitemapUrls = [];
		for (let index = offset * MAX_NB_URLS_IN_SITEMAP; index < (offset + 1) * MAX_NB_URLS_IN_SITEMAP && index < urls.length; index++) {
			const url = (typeof urls[index] === 'string' ? { loc: urls[index] } : urls[index]) as SitemapUrl;

			let loc = [baseUrl, url.loc.replace(/^\//u, '')].filter(Boolean).join('/');
			if (trailingSlash === true && !loc.endsWith('/')) {
				loc += '/';
			} else if (trailingSlash === false && loc.endsWith('/')) {
				loc = loc.slice(0, -1);
			}

			const lastmod = 'lastmod' in url ? url.lastmod : options.defaults?.lastmod ?? undefined;
			const priority = 'priority' in url ? url.priority : options.defaults?.priority ?? undefined;
			const changefreq = 'changefreq' in url ? url.changefreq : options.defaults?.changefreq ?? undefined;

			sitemapUrls.push(TAB + xmlTag('url', NL
				+ TAB + TAB + xmlTag('loc', formatUrlLoc(loc)) + NL
				+ (lastmod === undefined ? '' : TAB + TAB + xmlTag('lastmod', formatUrlLastmod(lastmod)) + NL)
				+ (priority === undefined ? '' : TAB + TAB + xmlTag('priority', formatUrPriority(priority)) + NL)
				+ (changefreq === undefined ? '' : TAB + TAB + xmlTag('changefreq', changefreq) + NL) + TAB,
			));
		}

		sitemaps.push(
			XML_DOCTYPE + NL
			+ '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + NL
				+ sitemapUrls.join(NL) + NL
			+ '</urlset>',
		);
	}

	return sitemaps;
}

const replacements: Record<string, string> = {
	'&': 'amp',
	"'": 'apos',
	'"': 'quot',
	'<': 'lt',
	'>': 'gt',
};

function formatUrlLoc(loc: SitemapUrlLoc): string {
	return encodeURI(loc).replace(/["&'<>]/ug, character => '&' + replacements[character] + ';');
}

function formatUrlLastmod(lastmod: SitemapUrlLastmod): string {
	return (lastmod instanceof Date ? lastmod : new Date(lastmod)).toISOString();
}

function formatUrPriority(priority: SitemapUrlPriority): string {
	if (priority === 0) {
		return '0.0';
	}
	if (priority === 1) {
		return '1.0';
	}

	return String(priority);
}

function xmlTag(tag: string, contents: string): string {
	return `<${tag}>${contents}</${tag}>`;
}
