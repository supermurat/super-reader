import { MyRegExpModel } from './my-regexp-model';

/**
 * Clear Full Content Config Model
 */
export class ClearFullContentConfigModel {
    /** combine regexps */
    combineRegexps?: Array<MyRegExpModel>;

    /** replace regexps */
    replaceRegexps?: Array<MyRegExpModel>;
}
