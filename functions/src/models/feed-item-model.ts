import { Enclosure, Image, Item, Meta } from 'feedparser';

/**
 * Feed Item Model
 */
export class FeedItemModel implements Item {
    /** author */
    author: string;
    /** categories */
    categories: Array<string>;
    /** comments */
    comments: string;
    /** date */
    date: Date | null;
    /** description */
    description: string;
    /** enclosures */
    enclosures: Array<Enclosure>;
    /** guid */
    guid: string;
    /** image */
    image: Image;
    /** link */
    link: string;
    /** meta */
    meta: Meta;
    /** origlink */
    origlink: string;
    /** pubdate */
    pubdate: Date | null;
    /** summary */
    summary: string;
    /** title */
    title: string;
}
