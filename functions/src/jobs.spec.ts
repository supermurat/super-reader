// tslint:disable:no-implicit-dependencies
import * as admin from 'firebase-admin';
import * as fTest from 'firebase-functions-test';

import { JobModel } from './models';
import { firebaseAppStub, firestoreStub, storageStub } from './testing/index.spec';

let test = fTest();

describe('Jobs - Firestore', (): void => {
    let myFunctions;

    beforeAll(() => {
        test = fTest();
        spyOn(admin, 'initializeApp').and.returnValue(firebaseAppStub);
        spyOn(admin, 'app').and.returnValue(firebaseAppStub);
        spyOn(admin, 'firestore').and.returnValue(firestoreStub);

        // tslint:disable-next-line:no-require-imports
        myFunctions = require('./index');
    });

    afterAll(() => {
        test.cleanup();
    });

    it('empty actionKey should call only jobRunner', async () => {
        const snap = {
            data: (): JobModel => ({actionKey: ''})
        };
        const wrapped = test.wrap(myFunctions.jobRunner);

        expect(await wrapped(snap))
            .toEqual(undefined);
    });

});

describe('Jobs - Storage', (): void => {
    let myFunctions;

    beforeAll(() => {
        test = fTest();
        spyOn(admin, 'initializeApp').and.returnValue(firebaseAppStub);
        spyOn(admin, 'app').and.returnValue(firebaseAppStub);
        spyOn(admin, 'firestore').and.returnValue(firestoreStub);
        spyOn(admin, 'storage').and.returnValue(storageStub);

        // tslint:disable-next-line:no-require-imports
        myFunctions = require('./index');
    });

    afterAll(() => {
        test.cleanup();
    });

    it('should call fixPublicFilesPermissions', async () => {
        const snap = {
            data: (): JobModel => ({actionKey: 'fixPublicFilesPermissions'}),
            ref: {
                set(data): any {
                    expect(data.result)
                        .toEqual('Count of processed files: 1');

                    return Promise.resolve([data]);
                }
            }
        };
        const wrapped = test.wrap(myFunctions.jobRunner);

        expect(await wrapped(snap))
            .toEqual('fixPublicFilesPermissions is finished. Count of processed docs: 1');
    });

});
