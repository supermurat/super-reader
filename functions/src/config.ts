/** Local Configs */
const FUNCTIONS_CONFIG_LOCAL = {
    /** supported culture codes; ['en', 'tr'] */
    supportedCultureCodes: ['en-US', 'tr-TR'],
    /** supported language codes; ['en', 'tr'] */
    supportedLanguageCodes: ['en', 'tr'],
    /** default language code to redirect; en, tr */
    defaultLanguageCode: 'tr',
    /** do you want to get full content of related page of feed item ASAP? */
    getFullContentASAP: true
};

/** Production Configs */
const FUNCTIONS_CONFIG_LIVE = {
    /** supported culture codes; ['en', 'tr'] */
    supportedCultureCodes: ['en-US', 'tr-TR'],
    /** supported language codes; ['en', 'tr'] */
    supportedLanguageCodes: ['en', 'tr'],
    /** default language code to redirect; en, tr */
    defaultLanguageCode: 'tr',
    /** do you want to get full content of related page of feed item ASAP? */
    getFullContentASAP: false
};

// istanbul ignore next
/** Current Configs */
export const FUNCTIONS_CONFIG = process.env.IS_RUNNING_ON_LOCALHOST ? FUNCTIONS_CONFIG_LOCAL : FUNCTIONS_CONFIG_LIVE;

// istanbul ignore next
console.log('FUNCTIONS_CONFIG IN USE:', process.env.IS_RUNNING_ON_LOCALHOST ? '_LOCAL' : '_LIVE');
