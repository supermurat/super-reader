/**
 * Feed Item Model
 */
export class FeedItemModel {
    /** author */
    author?: string;
    /** categories */
    categories?: Array<string>;
    /** comments */
    comments?: string;
    /** date */
    date?: Date | null;
    /** description */
    description?: string;
    /** enclosures */
    enclosures?: Array<Enclosure>;
    /** guid */
    guid?: string;
    /** image */
    image?: Image;
    /** link */
    link?: string;
    /** meta */
    meta?: Meta;
    /** origlink */
    origlink?: string;
    /** pubdate */
    pubdate?: Date | null;
    /** summary */
    summary?: string;
    /** summary preview */
    summaryPreview?: string;
    /** title */
    title?: string;
    /** full content of related page of feed item */
    fullContent?: string;
    /** is read? */
    isRead?: boolean;
}

// tslint:disable:completed-docs
type Type = 'atom' | 'rss' | 'rdf';

interface NS {
    [key: string]: string;
}

interface Image {
    url: string;
    title: string;
}

interface Meta {
    '#ns': Array<NS>;
    '#type': Type;
    '#version': string;
    title: string;
    description: string;
    date: Date | null;
    pubdate: Date | null;
    link: string;
    xmlurl: string;
    author: string;
    language: string;
    image: Image;
    favicon: string;
    copyright: string;
    generator: string;
    categories: Array<string>;
}

interface Enclosure {
    length?: string;
    type?: string;
    url: string;
}
