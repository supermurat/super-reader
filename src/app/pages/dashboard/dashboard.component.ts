import { Component, Inject, LOCALE_ID, OnInit, PLATFORM_ID } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FeedItemModel, PageModel } from '../../models';
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

        this.pagination.init(
            'feedItems', ['isRead', 'date'], {limit: 5, reverse: true, prepend: false}, undefined,
            {
                fieldPath: 'isRead', opStr: '<=', value: false
            });
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
     * show feed item preview
     * @param feedItem: FeedItemModel
     */
    showPreview(feedItem: FeedItemModel): void {
        // this.markAsRead(feedItem);
        this.focusedItem = feedItem;
    }

}
