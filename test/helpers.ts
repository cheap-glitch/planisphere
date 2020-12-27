export function wrapSitemap(xml: string | Array<string>): string {
	return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + (Array.isArray(xml) ? xml.join('') : xml) + '</urlset>';
}

export function indexes(length: number): Array<number> {
	return Array.from({ length }, (_, i) => i) as Array<number>;
}
