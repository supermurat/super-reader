import { Enclosure, Image, Meta } from 'feedparser';

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
    /** tags */
    tags?: Array<string>;
}
