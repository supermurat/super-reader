import { InjectionToken } from '@angular/core';

/** Interface of APP_CONFIG */
export interface InterfaceAppConfig {
    /** is Unit Test running ? */
    isUnitTest: boolean;
}

/** default configuration object */
export const APP_DI_CONFIG: InterfaceAppConfig = {
    isUnitTest: false
};

/** configuration object for unit tests */
export const APP_UNIT_TEST_CONFIG: InterfaceAppConfig = {
    isUnitTest: true
};

/** InjectionToken for APP_CONFIG */
export const APP_CONFIG = new InjectionToken<InterfaceAppConfig>('app.config');

/** language names by language code */
export const languageNames = {
    en: 'English',
    tr: 'Türkçe'
};
