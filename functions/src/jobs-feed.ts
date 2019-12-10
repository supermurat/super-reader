import { Storage } from '@google-cloud/storage';
import * as FeedParser from 'feedparser';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import * as h2p from 'html2plaintext';
import * as requestOrigin from 'request';
import * as stringToStream from 'string-to-stream';

import { FUNCTIONS_CONFIG } from './config';
import { FeedModel, JobModel } from './models/';

/** firestore instance */
const db = admin.firestore();

/** my default request */
const request = requestOrigin.defaults({
    headers: {'User-Agent': 'chrome'}
});

/** get content of feed */
const getContentOfFeed = (mainDocData: FeedModel): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        request(mainDocData.url, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve({isHealthy: true, rawContent: body.toString()});
            } else {
                if (error) {
                    reject({isHealthy: false, lastError: JSON.parse(JSON.stringify(error))});
                } else {
                    reject({isHealthy: false, lastError: JSON.parse(JSON.stringify(response))});
                }
            }
        });
    });

/** parse feed */
const parseFeed = (mainDocData: FeedModel): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        console.log(mainDocData);
        const fp = new FeedParser({});
        stringToStream(mainDocData.rawContent).pipe(fp);
        const parsedItems = [];
        fp.on('error', (error): void => {
            console.error(error);
            reject({...mainDocData, ...{isHealthy: false, lastError: JSON.parse(JSON.stringify(error))}});
        });
        fp.on('end', (): void => {
            resolve({...mainDocData, ...{isHealthy: true, items: parsedItems}});
        });
        fp.on('readable', function(): Array<any> {
            let item;
            // tslint:disable-next-line:no-conditional-assignment
            while (item = this.read()) {
                parsedItems.push(item);
            }

            return parsedItems;
        });
    });

/** refresh rss feeds */
export const refreshFeeds = async (snap: DocumentSnapshot, jobData: JobModel): Promise<any> => {
    console.log('refreshFeeds is started');
    let processedDocCount = 0;
    if (!jobData.limit) {
        jobData.limit = 10;
    }
    const query = db.collection('feeds')
        .where('type', '==', 'rss');

    return query
        .limit(jobData.limit)
        .get()
        .then(async mainDocsSnapshot =>
            Promise.all(mainDocsSnapshot.docs.map(async mainDoc => {
                const mainDocData = mainDoc.data() as FeedModel;

                return getContentOfFeed(mainDocData)
                    .then(parseFeed)
                    .then(value =>
                        mainDoc.ref.set({...value, ...{refreshedAt: new Date()}}, {merge: true})
                            .then(() => {
                                processedDocCount++;
                            })
                    )
                    .catch(reason => {
                        console.error(reason);
                        mainDoc.ref.set({...reason, ...{refreshedAt: new Date()}}, {merge: true})
                            .then(() => {
                                processedDocCount++;
                            });
                    });
            })))
        .then(async values =>
            snap.ref.set({result: `Count of processed documents: ${processedDocCount}`}, {merge: true})
                .then(() =>
                    Promise.resolve(`refreshFeeds is finished. Count of processed documents: ${processedDocCount}`)
                )
        );
};
