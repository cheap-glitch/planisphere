export function wrapSitemap(xml: string | Array<string>, pretty = false): string {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		(Array.isArray(xml) ? xml.join(pretty ? '\n' : '') : xml),
		'</urlset>',
	].join(pretty ? '\n' : '');
}

export function indexes(length: number): Array<number> {
	return Array.from({ length }, (_, i) => i) as Array<number>;
}
