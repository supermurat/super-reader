import { Storage } from '@google-cloud/storage';
import * as FeedParser from 'feedparser';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import * as h2p from 'html2plaintext';
import * as requestOrigin from 'request';
import * as stringToStream from 'string-to-stream';

import { FUNCTIONS_CONFIG } from './config';
import { FeedItemModel, FeedModel, JobModel } from './models/';

/** firestore instance */
const db = admin.firestore();

/** my default request */
const request = requestOrigin.defaults({
    headers: {'User-Agent': 'chrome'}
});

/** get document ID */
// tslint:disable-next-line: arrow-return-shorthand
const getDocumentID = (link: string): string => {
    return link
        .replace(/\//gi, '\\')
        .split('#')[0];
};

/** clear feed item */
const clearFeedItem = (feedItem: FeedItemModel): void => {
    if (feedItem.description) {
        delete feedItem.description;
    }
    if (feedItem['rss:description']) {
        delete feedItem['rss:description'];
    }
    if (feedItem.meta) {
        if (feedItem.meta['#ns']) {
            delete feedItem.meta['#ns'];
        }
        if (feedItem.meta['#xml']) {
            delete feedItem.meta['#xml'];
        }
        if (feedItem.meta['@']) {
            delete feedItem.meta['@'];
        }
    }
};

/** get full content of related page of feed item */
const getFullContentOfFeedItem = async (feedItem: FeedItemModel): Promise<string> =>
    new Promise((resolve, reject): void => {
        if (!FUNCTIONS_CONFIG.getFullContentASAP) {
            resolve('');

            return;
        }
        request(feedItem.link, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(body.toString());
            } else {
                if (error) {
                    reject(error);
                } else {
                    reject(response);
                }
            }
        });
    });

/** get only needed fields of feed item */
// tslint:disable-next-line: arrow-return-shorthand
const getFeedItem = async (feedItem: FeedItemModel): Promise<FeedItemModel> =>
    new Promise((resolve, reject): void => {
        getFullContentOfFeedItem(feedItem)
            .then(fullContent => {
                resolve({
                    link: feedItem.link,
                    date: feedItem.date,
                    image: (feedItem.image && Object.keys(feedItem.image).length > 0) ? feedItem.image :
                        ((feedItem.meta && feedItem.meta.image) ? feedItem.meta.image : undefined),
                    summary: feedItem.summary,
                    title: feedItem.title,
                    fullContent
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });

/** create feed item */
const createFeedItem = async (feedItemRaw: FeedItemModel): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        clearFeedItem(feedItemRaw);
        const documentID = getDocumentID(feedItemRaw.link);
        getFeedItem(feedItemRaw)
            .then(feedItem => {
                db.collection('feedItemsRaw')
                    .doc(documentID)
                    .set(feedItemRaw)
                    .then(valueOfRaw =>
                        db.collection('feedItems')
                            .doc(documentID)
                            .set(feedItem)
                            .then(valueOfItem => {
                                resolve(feedItem);
                            })
                            .catch(reason => {
                                reject(reason);
                            }))
                    .catch(reason => {
                        reject(reason);
                    });
            })
            .catch(reason => {
                reject(reason);
            });
    });

/** get content of feed */
const getContentOfFeed = async (mainDocData: FeedModel): Promise<FeedModel> =>
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
const parseFeed = async (mainDocData: FeedModel): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        console.log(mainDocData);
        const fp = new FeedParser({});
        stringToStream(mainDocData.rawContent).pipe(fp);
        fp.on('error', (error): void => {
            console.error(error);
            reject({...mainDocData, ...{isHealthy: false, lastError: JSON.parse(JSON.stringify(error))}});
        });
        fp.on('end', (): void => {
            resolve({...mainDocData, ...{isHealthy: true}});
        });
        fp.on('readable', async function(): Promise<void> {
            let item;
            // tslint:disable-next-line:no-conditional-assignment
            while (item = this.read()) {
                await createFeedItem(item);
            }
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
        ; // .where('type', '==', 'rss');

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
                            })
                            .catch(reason1 => {
                                console.error(reason1);
                            });
                    });
            })))
        .then(async values =>
            snap.ref.set({result: `Count of processed feeds: ${processedDocCount}`}, {merge: true})
                .then(() =>
                    Promise.resolve(`refreshFeeds is finished. Count of processed feeds: ${processedDocCount}`)
                )
        );
};
