export interface RssItem {
	title: string;
	link: string;
	description: string;
	source: string;
	pubDate: string;
}

export interface RssFeed {
	items: RssItem[];
}
