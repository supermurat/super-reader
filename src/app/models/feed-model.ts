import { ClearFullContentConfigModel } from './clear-full-content-config-model';
/**
 * Feed Model
 */
export class FeedModel {
    /** url */
    url?: string;
    /** refreshedAt */
    refreshedAt?: any = {seconds: undefined};
    /** content */
    content?: any;
    /** rawContent */
    rawContent?: any;
    /** meta */
    meta?: any;
    /** lastError */
    lastError?: any;
    /** isHealthy */
    isHealthy?: boolean;
    /** tags */
    tags?: Array<string>;

    /** clear full content config */
    clearFullContentConfig?: ClearFullContentConfigModel;
}
