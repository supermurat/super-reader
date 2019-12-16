import { MyRegExpModel } from './my-regexp-model';

/**
 * Clear Full Content Config Model
 */
export class ClearFullContentConfigModel {
    /** Do you want to combine html with only regexp? */
    isCombineWithRegexp?: boolean;
    /** combine regexps */
    combineRegexps?: Array<MyRegExpModel>;

    /** Do you want to delete html with regexp? */
    isDeleteWithRegexp?: boolean;
    /** combine regexps */
    deleteRegexps?: Array<MyRegExpModel>;
}
