import { isPlatformBrowser } from '@angular/common';
import { Component, HostBinding, HostListener, Inject, LOCALE_ID, OnInit, PLATFORM_ID } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeedItemModel, PageModel, TaxonomyModel } from '../../models';
import { AlertService, ComponentCanDeactivate, PageService, PaginationService } from '../../services';

/**
 * Dashboard Component
 */
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, ComponentCanDeactivate  {
    /** class of page */
    @HostBinding('class') class = 'dashboard-page';

    /** current page object */
    page$: Observable<PageModel>;
    /** focused feed item */
    focusedItem: FeedItemModel;
    /** focused tag */
    focusedTag: TaxonomyModel;
    /** tag list */
    tagList: Array<TaxonomyModel>;
    /** scroll interval */
    scrollInterval: any;
    /** css class of tag-cloud */
    tagCloudClass = 'tag-cloud';

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
        this.loadByTag({id: 'asap'});
    }

    // @HostListener allows us to also guard against browser refresh, close, etc.
    /**
     * can deactivate component?
     */
    @HostListener('window:beforeunload') canDeactivate(): Observable<boolean> | boolean {
        return !environment.production;
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
                                .orderBy('isRead', 'asc')
                                .orderBy('date', 'asc')
                                .limit(10))
                            .valueChanges()
                            .subscribe(value => {
                                tag.countOfUnreadText = value.length > 9 ? `${value.length}+` : `${value.length}`;
                            });
                    } else {
                        this.afs.collection<FeedItemModel>('feedItems', ref =>
                            ref
                                .where('isRead', '<=', false)
                                .where('tags', 'array-contains', tag.id)
                                .orderBy('isRead', 'asc')
                                .orderBy('tags', 'asc')
                                .orderBy('date', 'asc')
                                .limit(10)
                        )
                            .valueChanges()
                            .subscribe(value => {
                                tag.countOfUnreadText = value.length > 9 ? `${value.length}+` : `${value.length}`;
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
        this.focusedTag = tag;
        if (tag.id === 'all') {
            this.pagination.init(
                'feedItems', ['isRead', 'date'], {limit: 10, reverse: false, prepend: false}, undefined,
                {
                    fieldPath: 'isRead', opStr: '<=', value: false
                });
        } else {
            this.pagination.init(
                'feedItems', ['isRead', 'tags', 'date'], {limit: 10, reverse: false, prepend: false}, undefined,
                {
                    fieldPath: 'isRead', opStr: '<=', value: false
                },
                {
                    fieldPath: 'tags', opStr: 'array-contains', value: tag.id
                });
        }
        if (document.getElementById('item-list-body')) {
            if (isPlatformBrowser(this.platformId)) {
                const scrollToTop = window.setInterval(() => {
                    const pos = document.getElementById('item-list-body').scrollTop;
                    if (pos > 0) {
                        document.getElementById('item-list-body')
                            .scrollTo(0, pos - 60); // how far to scroll on each step
                    } else {
                        window.clearInterval(scrollToTop);
                    }
                }, 16);
            }
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
    showPreview(feedItem: FeedItemModel, force?: boolean): void {
        if (!this.focusedItem || (this.focusedItem.link !== feedItem.link && (!this.focusedItem.fullContent || force))) {
            this.updateFeedItem(feedItem, {isRead: true});
            this.focusedItem = feedItem;
            this.focusedItem.tagList = this.tagList.filter(tag => this.focusedItem.tags.indexOf(tag.id) > -1);
            if (isPlatformBrowser(this.platformId)) {
                const scrollToTop = window.setInterval(() => {
                    const pos = document.getElementById('focused-item-body').scrollTop;
                    if (pos > 0) {
                        document.getElementById('focused-item-body')
                            .scrollTo(0, pos - 60); // how far to scroll on each step
                    } else {
                        window.clearInterval(scrollToTop);
                    }
                }, 16);
            }
        }
    }

    /**
     * scroll up or down content
     * @param factor: scroll factor
     */
    scrollContent(factor: number): void {
        if (isPlatformBrowser(this.platformId)) {
            this.scrollInterval = window.setInterval(() => {
                const pos = document.getElementById('focused-item-body').scrollTop;
                const scrollHeight = document.getElementById('focused-item-body').scrollHeight;
                if (pos > -1 && pos < scrollHeight) {
                    document.getElementById('focused-item-body')
                        .scrollTo(0, pos + (factor)); // how far to scroll on each step
                } else {
                    window.clearInterval(this.scrollInterval);
                }
            }, 10);
        }
    }

    /**
     * stop scroll up or down content
     */
    stopScrollContent(): void {
        if (isPlatformBrowser(this.platformId) && this.scrollInterval) {
            window.clearInterval(this.scrollInterval);
        }
    }

}
