import { ClearFullContentConfigModel } from './clear-full-content-config-model';
import { MyRegExpModel } from './my-regexp-model';

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
    /** isActive */
    isActive?: boolean;
    /** do you want to get full content as soon as possible */
    isGetFullContentASAP?: boolean;
    /** refresh period in minute */
    refreshPeriod?: number;
    /** tags */
    tags?: Array<string>;

    /** clear full content config */
    clearFullContentConfig?: ClearFullContentConfigModel;
    /** clear summary content config */
    clearSummaryContentConfig?: ClearFullContentConfigModel;
    /** tag rule regexps */
    tagRules?: Array<MyRegExpModel>;
}
