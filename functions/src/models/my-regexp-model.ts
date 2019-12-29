import { ClearFullContentConfigModel } from './clear-full-content-config-model';

/**
 * My RegExp Model
 */
export class MyRegExpModel {
    /** regexp */
    regexp: string;
    /** flags */
    flags: string;
    /** clear full content config */
    clearFullContentConfig?: ClearFullContentConfigModel;
    /** custom action config array to do */
    actions?: Array<string>;
    /** tag */
    tag?: string;
    /** field */
    field?: string;
    /** replace with */
    replaceWith?: string;
}
