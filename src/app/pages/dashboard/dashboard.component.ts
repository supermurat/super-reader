import { Component, Inject, LOCALE_ID, OnInit, PLATFORM_ID } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FeedItemModel, PageModel, TaxonomyModel } from '../../models';
import { AlertService, PageService, PaginationService } from '../../services';

/**
 * Dashboard Component
 */
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    /** current page object */
    page$: Observable<PageModel>;
    /** focused feed item */
    focusedItem: FeedItemModel;
    /** tag list */
    tagList: Array<TaxonomyModel>;

    /**
     * constructor of DashboardComponent
     * @param platformId: PLATFORM_ID
     * @param pageService: PageService
     * @param afs: AngularFirestore
     * @param alert: AlertService
     * @param pagination: PaginationService
     * @param locale: LOCALE_ID
     */
    constructor(@Inject(PLATFORM_ID) private readonly platformId: string,
                public pageService: PageService,
                private readonly afs: AngularFirestore,
                public alert: AlertService,
                public pagination: PaginationService,
                @Inject(LOCALE_ID) public locale: string) {
    }

    /**
     * ngOnInit
     */
    ngOnInit(): void {
        this.page$ = this.pageService.getPageFromFirestore(PageModel, 'pages', this.pageService.getRoutePathName());
        this.loadTags();
        this.loadByTag({id: 'all'});
    }

    /**
     * load tags
     */
    loadTags(): void {
        this.afs.collection<TaxonomyModel>('tags', ref => ref)
            .valueChanges()
            .subscribe(tagList => {
                this.tagList = tagList;
                this.tagList.forEach(tag => {
                    if (tag.id === 'all') {
                        this.afs.collection<FeedItemModel>('feedItems', ref =>
                            ref
                                .where('isRead', '<=', false)
                                .orderBy('isRead', 'desc')
                                .orderBy('date', 'desc')
                                .limit(10))
                            .valueChanges()
                            .subscribe(value => {
                                tag.countOfUnread = value.length;
                            });
                    } else {
                        tag.countOfUnread = 0;
                        this.afs.collection<FeedItemModel>('feedItems', ref =>
                            ref
                                .where('isRead', '<=', false)
                                .where('tags', 'array-contains', tag.id)
                                .orderBy('isRead', 'desc')
                                .orderBy('tags', 'desc')
                                .orderBy('date', 'desc')
                                .limit(10)
                        )
                            .valueChanges()
                            .subscribe(value => {
                                tag.countOfUnread = value.length;
                            });
                    }
                });
            });
    }

    /**
     * load page content by tag
     * @param tag: TaxonomyModel
     */
    loadByTag(tag: TaxonomyModel): void {
        if (tag.id === 'all') {
            this.pagination.init(
                'feedItems', ['isRead', 'date'], {limit: 10, reverse: true, prepend: false}, undefined,
                {
                    fieldPath: 'isRead', opStr: '<=', value: false
                });
        } else {
            this.pagination.init(
                'feedItems', ['isRead', 'tags', 'date'], {limit: 10, reverse: true, prepend: false}, undefined,
                {
                    fieldPath: 'isRead', opStr: '<=', value: false
                },
                {
                    fieldPath: 'tags', opStr: 'array-contains', value: tag.id
                });
        }
    }

    /**
     * scroll handler for pagination
     * @param e: event
     */
    scrollHandler(e): void {
        if (e === 'bottom') {
            this.pagination.more();
        }
    }

    /**
     * update feed item
     * @param feedItem: FeedItemModel
     * @param newData: FeedItemModel
     */
    updateFeedItem(feedItem: FeedItemModel, newData: FeedItemModel): void {
        this.afs.collection('feedItems')
            .doc(feedItem.id)
            .set(newData, {merge: true})
            .then(value => {
                Object.keys(newData)
                    .forEach(key => {
                        feedItem[key] = newData[key];
                    });
            })
            .catch(reason => {
                this.alert.error(reason);
            });
    }

    /**
     * mark feed item as read
     * @param feedItem: FeedItemModel
     */
    markAsRead(feedItem: FeedItemModel): void {
        this.updateFeedItem(feedItem, {isRead: true});
    }

    /**
     * mark feed item as unread
     * @param feedItem: FeedItemModel
     */
    markAsUnRead(feedItem: FeedItemModel): void {
        this.updateFeedItem(feedItem, {isRead: false});
    }

    /**
     * load full content of feed item
     * @param feedItem: FeedItemModel
     */
    loadFullContent(feedItem: FeedItemModel): void {
        this.afs.collection('feedItemsFull')
            .doc(feedItem.id)
            .get() // .get({source: 'server'}) // to disable cache
            .subscribe(value => {
                if (value.exists) {
                    feedItem.fullContent = value.data().fullContent;
                } else {
                    this.alert.error('There is no full content for this feed item.');
                }
            });
    }

    /**
     * show feed item preview
     * @param feedItem: FeedItemModel
     */
    showPreview(feedItem: FeedItemModel): void {
        this.markAsRead(feedItem);
        this.focusedItem = feedItem;
    }

}
