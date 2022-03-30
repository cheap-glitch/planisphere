export function wrapSitemapIndex(xml: string | string[], pretty = false): string {
	return wrapXML(xml, 'sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', pretty);
}

export function wrapSitemap(xml: string | string[], pretty = false): string {
	return wrapXML(xml, 'urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', pretty);
}

function wrapXML(xml: string | string[], mainTag: string, pretty: boolean): string {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<${mainTag}>`,
		Array.isArray(xml) ? xml.join(pretty ? '\n' : '') : xml,
		`</${mainTag.split(' ', 1)[0]}>`,
	].join(pretty ? '\n' : '');
}

export function indexes(length: number): number[] {
	return Array.from({ length }, (_, index) => index) as number[];
}
