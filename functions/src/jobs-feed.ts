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

/** get link of feed item */
// tslint:disable-next-line: arrow-return-shorthand
const getLink = (feedItem: FeedItemModel): string => {
    return feedItem.origlink ? feedItem.origlink : feedItem.link;
};

/** get document ID */
// tslint:disable-next-line: arrow-return-shorthand
const getDocumentID = (feedItem: FeedItemModel): string => {
    return getLink(feedItem)
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

/** fix missing html tag */
const fixMissingHtmlTag = (htmlContent: string, tag: string): string => {
    let content = htmlContent;
    const countOfDiv = content.split(`<${tag}`).length;
    let countOfEndDiv = content.split(`</${tag}`).length;
    while (countOfEndDiv < countOfDiv) {
        content += `</${tag}>`;
        countOfEndDiv = content.split(`</${tag}`).length;
    }

    return content;
};

/** fix missing html tags */
const fixMissingHtmlTags = (htmlContent: string): string => {
    let content = htmlContent;
    content = fixMissingHtmlTag(content, 'div');
    content = fixMissingHtmlTag(content, 'p');

    return content;
};

/** do RegExp action */
const doRegExpAction = (actions: Array<string>, source: string): string => {
    let content = '';
    let sourceJSON: any;

    try {
        for (const action of actions) {
            if (action.startsWith('toJSON')) {
                sourceJSON = JSON.parse(source);
            } else if (action.startsWith('foreach:') && sourceJSON) {
                const acts = action.toString().split(';');
                for (const item of sourceJSON[acts[0].replace('foreach:', '')]) {
                    if (acts.length > 0 && acts[1].startsWith('get:')) {
                        content += item[acts[1].replace('get:', '')];
                    }
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    return content;
};

/** clear full content */
const clearFullContent = (sourceMainDocData: FeedModel, fullContent: string): string => {
    let content = '';
    if (sourceMainDocData.clearFullContentConfig.combineRegexps.length > 0) {
        for (const regexpValue of sourceMainDocData.clearFullContentConfig.combineRegexps) {
            const m = fullContent.match(new RegExp(regexpValue.regexp, regexpValue.flags));
            if (m) {
                let contentSub = '';
                if (regexpValue.clearFullContentConfig && regexpValue.clearFullContentConfig.combineRegexps &&
                    regexpValue.clearFullContentConfig.combineRegexps.length > 0) {
                    for (const regexpValueSub of regexpValue.clearFullContentConfig.combineRegexps) {
                        const mSub = m.join().match(new RegExp(regexpValueSub.regexp, regexpValueSub.flags));
                        if (mSub) {
                            if (regexpValueSub.actions && regexpValueSub.actions.length > 0) {
                                contentSub += doRegExpAction(regexpValueSub.actions, mSub.join());
                            } else {
                                contentSub += mSub.join();
                            }
                        }
                    }
                } else {
                    if (regexpValue.actions && regexpValue.actions.length > 0) {
                        contentSub += doRegExpAction(regexpValue.actions, m.join());
                    } else {
                        contentSub += m.join();
                    }
                }
                if (regexpValue.clearFullContentConfig && regexpValue.clearFullContentConfig.replaceRegexps &&
                    regexpValue.clearFullContentConfig.replaceRegexps.length > 0) {
                    for (const regexpValueSub of regexpValue.clearFullContentConfig.replaceRegexps) {
                        contentSub = contentSub.replace(
                            new RegExp(regexpValueSub.regexp, regexpValueSub.flags), regexpValueSub.replaceWith);
                    }
                }
                content += contentSub;
            }
        }
    } else {
        content = fullContent;
    }

    if (sourceMainDocData.clearFullContentConfig.replaceRegexps.length > 0) {
        for (const regexpValue of sourceMainDocData.clearFullContentConfig.replaceRegexps) {
            content = content.replace(new RegExp(regexpValue.regexp, regexpValue.flags), regexpValue.replaceWith);
        }
    }
    content = fixMissingHtmlTags(content);

    if (content === '') {
        content = fullContent;
    }

    return content;
};

/** clear summary content */
const clearSummaryContent = (sourceMainDocData: FeedModel, fullContent: string): string => {
    let content = '';
    if (sourceMainDocData.clearSummaryContentConfig && sourceMainDocData.clearSummaryContentConfig.combineRegexps &&
        sourceMainDocData.clearSummaryContentConfig.combineRegexps.length > 0) {
        for (const regexpValue of sourceMainDocData.clearSummaryContentConfig.combineRegexps) {
            const m = fullContent.match(new RegExp(regexpValue.regexp, regexpValue.flags));
            if (m) {
                content += m.join();
            }
        }
    } else {
        content = fullContent;
    }

    if (sourceMainDocData.clearSummaryContentConfig && sourceMainDocData.clearSummaryContentConfig.replaceRegexps &&
        sourceMainDocData.clearSummaryContentConfig.replaceRegexps.length > 0) {
        for (const regexpValue of sourceMainDocData.clearSummaryContentConfig.replaceRegexps) {
            content = content.replace(new RegExp(regexpValue.regexp, regexpValue.flags), regexpValue.replaceWith);
        }
    }
    content = fixMissingHtmlTags(content);

    if (content === '') {
        content = fullContent;
    }

    return content;
};

/** get full content of related page of feed item */
const getFullContentOfFeedItem = async (sourceMainDocData: FeedModel, feedItem: FeedItemModel): Promise<string> =>
    new Promise((resolve, reject): void => {
        request(feedItem.link, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(clearFullContent(sourceMainDocData, body.toString()));
            } else {
                if (error) {
                    reject(error);
                } else {
                    reject(response);
                }
            }
        });
    });

/** get image of feed item */
const getImageOfFeedItem = (feedItem: FeedItemModel): FeedParser.Image => {
    const firstImage = feedItem.summary.match(/<img([\w\W]+?)(\/>|><\/[ ]?img>)/iu);
    if (!firstImage || firstImage.length === 0) {
        // tslint:disable-next-line:no-null-keyword
        return null;
    }
    const src = firstImage[0].match(/src="([\w\W]+?)"/iu);
    const alt = firstImage[0].match(/alt="([\w\W]+?)"/iu);

    return {
        // tslint:disable-next-line:no-null-keyword
        title: alt && alt.length === 2 ? alt[1] : null,
        // tslint:disable-next-line:no-null-keyword
        url: src && src.length === 2 ? src[1] : null
    };
};

/** get tags of feed item */
const getTagsOfFeedItem = (sourceMainDocData: FeedModel, feedItem: FeedItemModel): Array<string> => {
    const dynamicTags  = [...[], ...sourceMainDocData.tags];
    if (sourceMainDocData.tagRules && sourceMainDocData.tagRules.length > 0) {
        for (const tagRule of sourceMainDocData.tagRules) {
            if (feedItem[tagRule.field].match(new RegExp(tagRule.regexp, tagRule.flags))) {
                dynamicTags.push(tagRule.tag);
            }
        }
    }

    return dynamicTags;
};

/** get only needed fields of feed item */
const getFeedItem = (sourceMainDocData: FeedModel, feedItem: FeedItemModel): FeedItemModel =>
    ({
        link: getLink(feedItem),
        date: feedItem.date,
        image: getImageOfFeedItem(feedItem),
        summary: clearSummaryContent(sourceMainDocData, feedItem.summary),
        summaryPreview: h2p(feedItem.summary).substring(0, 256),
        title: feedItem.title,
        isRead: false,
        tags: getTagsOfFeedItem(sourceMainDocData, feedItem)
    });

/** create feed item */
const createFeedItem = async (sourceMainDocData: FeedModel, feedItemRaw: FeedItemModel): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        clearFeedItem(feedItemRaw);
        const documentID = getDocumentID(feedItemRaw);
        db.collection('feedItems')
            .doc(documentID)
            .get()
            .then(value => {
                const feedItem = getFeedItem(sourceMainDocData, feedItemRaw);
                if (value.exists) {
                    console.log(`feedItems/${documentID} is already exist!`);
                    resolve(feedItem);
                } else {
                    db.collection('feedItemsRaw')
                        .doc(documentID)
                        .set(feedItemRaw)
                        .then(valueOfRaw =>
                            db.collection('feedItems')
                                .doc(documentID)
                                .set(feedItem)
                                .then(valueOfItem => {
                                    if (FUNCTIONS_CONFIG.getFullContentASAP && sourceMainDocData.isGetFullContentASAP) {
                                        getFullContentOfFeedItem(sourceMainDocData, feedItem)
                                            .then(fullContent => {
                                                db.collection('feedItemsFull')
                                                    .doc(documentID)
                                                    .set({fullContent})
                                                    .then(valueOfFull => {
                                                        resolve(feedItem);
                                                    })
                                                    .catch(reason => {
                                                        reject(reason);
                                                    });
                                            })
                                            .catch(reason => {
                                                console.error(reason);
                                                reject(reason);
                                            });
                                    } else {
                                        resolve(feedItem);
                                    }
                                })
                                .catch(reason => {
                                    reject(reason);
                                }))
                        .catch(reason => {
                            reject(reason);
                        });
                }
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
const parseFeed = async (sourceMainDocData: FeedModel, newMainDocData: FeedModel): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        const fp = new FeedParser({});
        stringToStream(newMainDocData.rawContent).pipe(fp);
        const items: Array<FeedItemModel> = [];
        fp.on('error', (error): void => {
            console.error(error);
            reject({...newMainDocData, ...{isHealthy: false, lastError: JSON.parse(JSON.stringify(error))}});
        });
        fp.on('end', async (): Promise<void> => {
            let i = 1;
            for (const item of items) {
                try {
                    console.log(`Started : ${sourceMainDocData.url} : ${i}/${items.length} : ${item.link}`);
                    await createFeedItem(sourceMainDocData, item);
                    console.log(`Done : ${sourceMainDocData.url} : ${i}/${items.length} : ${item.link}`);
                    i++;
                } catch (e) {
                    console.error(e);
                }
            }
            resolve({...newMainDocData, ...{isHealthy: true}});
        });
        fp.on('readable', function(): void {
            let item;
            // tslint:disable-next-line:no-conditional-assignment
            while (item = this.read()) {
                items.push(item);
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
        .where('isActive', '==', true);

    return query
        .limit(jobData.limit)
        .get()
        .then(async mainDocsSnapshot =>
            Promise.all(mainDocsSnapshot.docs.map(async mainDoc => {
                const mainDocData = mainDoc.data() as FeedModel;

                if (jobData.customData && jobData.customData.url && jobData.customData.url !== mainDocData.url) {
                    return Promise.resolve();
                }

                if (!jobData.overwrite && mainDocData.refreshPeriod && mainDocData.refreshedAt &&
                    (mainDocData.refreshedAt.seconds * 1000) + (mainDocData.refreshPeriod * 1000 * 60) > new Date().getTime()) {
                    // skip to refresh feed
                    return Promise.resolve();
                }

                return getContentOfFeed(mainDocData)
                    .then(value =>
                        parseFeed(mainDocData, value)
                    )
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
        .then(async values => {
            if (snap) {
                return snap.ref.set({result: `Count of processed feeds: ${processedDocCount}`}, {merge: true})
                    .then(() =>
                        Promise.resolve(`refreshFeeds is finished. Count of processed feeds: ${processedDocCount}`)
                    );
            }

            return Promise.resolve(`refreshFeeds is finished. Count of processed feeds: ${processedDocCount}`);
        });
};
