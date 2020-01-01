import { Injectable } from '@angular/core';
import { CanDeactivate, NavigationStart, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Alert Service
 */
@Injectable()
export class AlertService {
    /** collection of messages */
    private readonly subject = new Subject<any>();
    /** do you want to keep message as shown even after gone to another page? */
    private keepAfterNavigationChange = false;

    /**
     * constructor of AlertService
     * @param router: Router
     */
    constructor(router: Router) {
        // clear alert message on route change
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (this.keepAfterNavigationChange) {
                    // only keep for a single location change
                    this.keepAfterNavigationChange = false;
                } else {
                    // clear alert
                    this.subject.next();
                }
            }
        });
    }

    /**
     * Show message to user
     * @param message: message text
     * @param keepAfterNavigationChange: do you want to keep message as shown even after gone to another page?
     */
    success(message: string, keepAfterNavigationChange = false): void {
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.subject.next({type: 'success', text: message});
    }

    // istanbul ignore next
    /**
     * Show error to user
     * @param message: error text
     * @param keepAfterNavigationChange: do you want to keep message as shown even after gone to another page?
     */
    error(message: string, keepAfterNavigationChange = false): void {
        this.keepAfterNavigationChange = keepAfterNavigationChange;
        this.subject.next({type: 'error', text: message});
    }

    /**
     * get current messages
     */
    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}

/**
 * Component Can Deactivate interface
 */
export interface ComponentCanDeactivate {
    /**
     * can deactivate?
     */
    canDeactivate(): boolean | Observable<boolean>;
}

/**
 * Pending Changes Guard
 */
@Injectable()
export class PendingChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
    /**
     * can deactivate?
     */
    canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
        // if there are no pending changes, just allow deactivation; else confirm first
        return component.canDeactivate() ?
            true :
            confirm('Are you sure you want to go? You may not continue from where you left.');
    }
}
