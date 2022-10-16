import * as FeedParser from 'feedparser';
import * as admin from 'firebase-admin';
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

/** get date of feed item */
// tslint:disable-next-line: arrow-return-shorthand
const getDateOfItem = (feedItem: FeedItemModel): Date => {
    // tslint:disable-next-line: strict-comparisons
    if (feedItem.date > new Date ('1970')) {
        return feedItem.date;
    }
    // tslint:disable-next-line: strict-comparisons
    if (feedItem.pubdate > new Date ('1970')) {
        return feedItem.pubdate;
    }
    // tslint:disable-next-line: strict-comparisons
    if (feedItem['rss:pubdate'] && feedItem['rss:pubdate']['#'] && new Date(feedItem['rss:pubdate']['#']) > new Date ('1970')) {
        return new Date(feedItem['rss:pubdate']['#']);
    }

    return new Date();
};

/** get document ID */
// tslint:disable-next-line: arrow-return-shorthand
const getDocumentID = (feedItem: FeedItemModel): string => {
    return getLink(feedItem)
        .match(/[\w\d\:\-\+//.\\\#]*/gi)
        .join('')
        .replace(/\//gi, '\\')
        .split('#')[0];
};

/** clear and fix feed item */
const clearAndFixFeedItem = (feedItem: FeedItemModel): void => {
    if (!feedItem.summary) {
        feedItem.summary = (feedItem['content:encoded'] && feedItem['content:encoded']['#']) ? feedItem['content:encoded']['#'] : '';
    }
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

/** fix html */
const fixHtml = (htmlContent: string): string => {
    let content = htmlContent;
    content = fixMissingHtmlTag(content, 'div');
    content = fixMissingHtmlTag(content, 'p');

    const images = content.match(/<img([\w\W]+?)(\/>|><\/[ ]?img>)/gui);
    if (images && images.length > 0) {
        for (const imgPart of images) {
            if (imgPart.indexOf(' src=') === -1) {
                content = content.replace(imgPart, imgPart.replace(' data-src-orig=', ' src='));
            }
        }
    }

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

/** fix target of links */
const fixLinks = (fullContent: string): string => {
    let content = fullContent;
    content = content.replace(new RegExp(/ target="[a-zA-Z0-9-+]*"/gui), '');
    content = content.replace(new RegExp(/ target='[a-zA-Z0-9-+]*'/gui), '');
    content = content.replace(new RegExp(/<a /gui), '<a target="_blank" ');

    return content;
};

/** fix images */
const fixImages = (fullContent: string): string => {
    let content = fullContent;
    content = content.replace(new RegExp(/.jpg\?quality=[0-9]*&amp;strip=info&amp;w=[0-9]*/gui), '.jpg');
    content = content.replace(new RegExp(/.jpg\?resize=[0-9]*/gui), '.jpg');

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

    if (content === '') {
        content = fullContent;
    }
    content = fixHtml(content);
    content = fixLinks(content);
    content = fixImages(content);

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
    content = fixHtml(content);

    if (content === '') {
        content = fullContent;
    }

    return fixLinks(content);
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
    const src = firstImage[0].match(/src=(["'])([\w\W]+?)(["'])/iu);
    const alt = firstImage[0].match(/alt=(["'])([\w\W]+?)(["'])/iu);

    return {
        // tslint:disable-next-line:no-null-keyword
        title: alt && alt.length === 4 && alt[0].indexOf('""') === -1 && alt[0].indexOf("''") === -1 ? alt[2] : null,
        // tslint:disable-next-line:no-null-keyword
        url: src && src.length === 4 ? src[2] : null
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
        date: getDateOfItem(feedItem),
        image: getImageOfFeedItem(feedItem),
        summary: clearSummaryContent(sourceMainDocData, feedItem.summary),
        summaryPreview: h2p(feedItem.summary).substring(0, 256),
        title: feedItem.title,
        isRead: false,
        isKept: false,
        tags: getTagsOfFeedItem(sourceMainDocData, feedItem)
    });

/** create raw feed item */
const createRawFeedItem = async (sourceMainDocData: FeedModel, feedItemRaw: FeedItemModel, documentID: string,
                                 force?: boolean): Promise<FeedItemModel> =>
    new Promise((resolve, reject): void => {
        if (FUNCTIONS_CONFIG.keepRawFeedItems || force) {
            db.collection('feedItemsRaw')
                .doc(documentID)
                .set(JSON.parse(JSON.stringify(feedItemRaw)), {merge: true})
                .then(valueOfRaw => {
                    resolve(feedItemRaw);
                })
                .catch(reason => {
                    reject(reason);
                });
        } else {
            resolve(undefined);
        }
    });

/** create full feed item */
const createFullFeedItem = async (sourceMainDocData: FeedModel, feedItem: FeedItemModel, documentID: string): Promise<FeedItemModel> =>
    new Promise((resolve, reject): void => {
        if (FUNCTIONS_CONFIG.getFullContentASAP && sourceMainDocData.isGetFullContentASAP) {
            getFullContentOfFeedItem(sourceMainDocData, feedItem)
                .then(fullContent => {
                    db.collection('feedItemsFull')
                        .doc(documentID)
                        .set({fullContent, date: new Date()}, {merge: true})
                        .then(valueOfFull => {
                            resolve({fullContent});
                        })
                        .catch(reason => {
                            reject(reason);
                        });
                })
                .catch(reason => {
                    reject(reason);
                });
        } else {
            resolve(undefined);
        }
    });

/** create feed item */
const createFeedItem = async (sourceMainDocData: FeedModel, feedItemRaw: FeedItemModel, overwrite: boolean): Promise<FeedModel> =>
    new Promise((resolve, reject): void => {
        clearAndFixFeedItem(feedItemRaw);
        const documentID = getDocumentID(feedItemRaw);
        db.collection('feedItems')
            .doc(documentID)
            .get()
            .then(value => {
                const feedItem = getFeedItem(sourceMainDocData, feedItemRaw);
                if (value.exists && !overwrite) {
                    console.log(`feedItems/${documentID} is already exist!`);
                    resolve(feedItem);
                } else {
                    db.collection('feedItems')
                        .doc(documentID)
                        .set(feedItem, {merge: true})
                        .then(result =>
                            createFullFeedItem(sourceMainDocData, feedItem, documentID))
                        .then(result =>
                            createRawFeedItem(sourceMainDocData, feedItemRaw, documentID))
                        .then(result => {
                            resolve(feedItem);
                        })
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
const parseFeed = async (sourceMainDocData: FeedModel, newMainDocData: FeedModel, overwrite: boolean): Promise<FeedModel> =>
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
                    console.log(`Started : ${i}/${items.length} : ${item.link}`);
                    await createFeedItem(sourceMainDocData, item, overwrite);
                    console.log(`Done : ${i}/${items.length} : ${item.link}`);
                    i++;
                } catch (e) {
                    console.error(e);
                    try {
                        const documentID = getDocumentID(item);
                        await createRawFeedItem(
                            sourceMainDocData,
                            {...item, ...{
                                error: {
                                    message: e.message,
                                    stack: e.stack
                                }
                            }},
                            documentID, true);
                    } catch (e2) {
                        console.error(e2);
                    }
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
                        parseFeed(mainDocData, value, jobData.overwrite)
                    )
                    .then(async value => {
                        if (!FUNCTIONS_CONFIG.keepRawFeedItems) {
                            delete value.rawContent;
                        }

                        return mainDoc.ref.set({...value, ...{refreshedAt: new Date()}}, {merge: true})
                            .then(() => {
                                processedDocCount++;
                            });
                    })
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

/** clear old rss feed items */
export const clearOldRssFeedItems = async (snap: DocumentSnapshot, jobData: JobModel): Promise<any> => {
    console.log('clearOldRssFeeds is started');
    let processedDocCount = 0;
    const eraDate = new Date();
    eraDate.setDate(Number(eraDate.getDate()) - Number(30)); // add days
    if (!jobData.limit) {
        jobData.limit = 5000;
    }

    return db.collection('feedItems')
        .where('isKept', '==', false)
        .where('isRead', '==', true)
        .where('date', '>', eraDate)
        .limit(jobData.limit)
        .get()
        .then(async mainDocsSnapshot =>
            Promise.all(mainDocsSnapshot.docs.map(async mainDoc =>
                mainDoc.ref.delete()
                    .then(() => {
                        processedDocCount++;
                    }))))
        .then(async values => {
                if (snap) {
                    return snap.ref.set({result: `Count of processed documents: ${processedDocCount}`}, {merge: true})
                        .then(() =>
                            Promise.resolve(`clearOldRssFeeds is finished. Count of processed documents: ${processedDocCount}`)
                        );
                }

                return Promise.resolve();
            }
        );
};

/** clear feed items */
export const clearFeedItems = async (snap: DocumentSnapshot, jobData: JobModel): Promise<any> => {
    console.log('clearOldRssFeeds is started');
    let processedDocCount = 0;
    const eraDate = new Date();
    eraDate.setDate(Number(eraDate.getDate()) - Number(jobData.customData.days)); // add days
    if (!jobData.limit) {
        jobData.limit = 5000;
    }

    return db.collection('feedItems')
        .where('isKept', '==', false)
        .where('isRead', '==', jobData.customData.isRead)
        .where('date', '>', eraDate)
        .limit(jobData.limit)
        .get()
        .then(async mainDocsSnapshot =>
            Promise.all(mainDocsSnapshot.docs.map(async mainDoc =>
                mainDoc.ref.delete()
                    .then(() => {
                        processedDocCount++;
                    }))))
        .then(async values => {
                if (snap) {
                    return snap.ref.set({result: `Count of processed documents: ${processedDocCount}`}, {merge: true})
                        .then(() =>
                            Promise.resolve(`clearOldRssFeeds is finished. Count of processed documents: ${processedDocCount}`)
                        );
                }

                return Promise.resolve();
            }
        );
};

/** create full feed item again */
export const createFullFeedItemAgain = async (feedItem: FeedItemModel): Promise<FeedItemModel> =>
    new Promise((resolve, reject): void => {
        db.collection('feeds')
            .where('isActive', '==', true)
            .get()
            .then(async mainDocsSnapshot =>
                Promise.all(mainDocsSnapshot.docs.map(async mainDoc => {
                    const mainDocData = mainDoc.data() as FeedModel;
                    for (const domain of mainDocData.domains) {
                        if (feedItem.link.indexOf(domain) > -1) {
                            const documentID = getDocumentID(feedItem);
                            createFullFeedItem(mainDocData, feedItem, documentID)
                                .catch(reason => {
                                    reject(reason);
                                });

                            return Promise.resolve();
                        }
                    }

                    return Promise.reject("Couldn't find feed record for this feed item. Please check for domains.");
                })))
            .catch(err => {
                console.error('createFullFeedItemAgain', err);

                return err;
            });
    });
