import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

import { FUNCTIONS_CONFIG } from './config';
import { refreshFeeds } from './jobs-feed';
import { JobModel } from './models/';

/** firestore instance */
const db = admin.firestore();

/** fix public files permissions on storage */
const fixPublicFilesPermissions = async (snap: DocumentSnapshot, jobData: JobModel): Promise<any> => {
    console.log('fixPublicFilesPermissions is started');
    const storage = new Storage();
    const bucketName = `${process.env.GCP_PROJECT}.appspot.com`;
    const bucket = admin.storage().bucket(bucketName);

    let processedDocCount = 0;

    return bucket.getFiles({
        prefix: 'publicFiles',
        autoPaginate: false
    })
         .then(async allFiles => {
             const files = allFiles[0];

             return Promise.all(files.map(async file => {
                     if (file.name.endsWith('/')) {
                         return Promise.resolve();
                     }

                     return file.acl.add({
                         entity: 'allUsers',
                         role: storage.acl.READER_ROLE
                     }).then(info => {
                         // console.log(info); // this "info" contains lots of cool info about file
                         processedDocCount++;
                     });
                 }
             ));
         })
         .then(async values =>
            snap.ref.set({result: `Count of processed files: ${processedDocCount}`}, {merge: true})
                .then(() =>
                    Promise.resolve(`fixPublicFilesPermissions is finished. Count of processed docs: ${processedDocCount}`)
                )
         );
};

/** job runner function */
export const jobRunner = functions
    // .region('europe-west1')
    // .runWith({ memory: '1GB', timeoutSeconds: 120 })
    .firestore
    .document('jobs/{jobId}')
    // tslint:disable-next-line:promise-function-async
    .onCreate((snap, context) => {
        console.log('jobRunner is started');
        const jobData = snap.data() as JobModel;
        let job: Promise<any>;
        if (jobData.actionKey === 'fixPublicFilesPermissions') {
            job = fixPublicFilesPermissions(snap, jobData);
        }
        if (jobData.actionKey === 'refreshFeeds') {
            job = refreshFeeds(snap, jobData);
        }
        if (job !== undefined) {
            return job
                .then(value => {
                    console.log(value);

                    return value;
                })
                .catch(err => {
                    console.error('functions.onCreate', err);

                    return err;
                });
        }

        return Promise.resolve();
    });
