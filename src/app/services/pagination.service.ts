import { Inject, Injectable, NgZone } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, FieldPath, Query } from '@angular/fire/firestore';
import WhereFilterOp = firebase.firestore.WhereFilterOp;
import { CollectionReference } from '@angular/fire/firestore/interfaces';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { scan, take, tap } from 'rxjs/operators';
import { APP_CONFIG, InterfaceAppConfig } from '../app-config';

/**
 * options to reproduce firestore queries consistently
 */
interface QueryConfig {
    /** path to collection */
    path: string;
    /** field to orderBy */
    field: string | FieldPath | Array<string | FieldPath>;
    /** limit per query */
    limit?: number;
    /** reverse order? */
    reverse?: boolean;
    /** prepend to source? */
    prepend?: boolean;
    /** where part of firestore query */
    where?: WhereInterface;
    /** second where part of firestore query */
    where2?: WhereInterface;
}

/**
 * where part of firestore queries
 */
interface WhereInterface {
    /** string | FieldPath */
    fieldPath: string | FieldPath;
    /** WhereFilterOp */
    opStr: WhereFilterOp;
    /** value */
    value: any;
}

/**
 * Pagination Service
 */
@Injectable()
export class PaginationService {
    /** observable data */
    data: Observable<any>;
    /** is done? */
    done = new BehaviorSubject<boolean>(false);
    /** is loading? */
    loading = new BehaviorSubject<boolean>(false);

    /** private source data */
    private readonly _data = new BehaviorSubject([]);

    /** QueryConfig */
    private query: QueryConfig;

    /**
     * constructor of PaginationService
     * @param afs: AngularFirestore
     * @param ngZone: NgZone
     * @param loadingBar: LoadingBarService
     * @param appConfig: APP_CONFIG
     */
    constructor(private readonly afs: AngularFirestore,
                private readonly ngZone: NgZone,
                private readonly loadingBar: LoadingBarService,
                @Inject(APP_CONFIG) private readonly appConfig: InterfaceAppConfig) {
    }

    /**
     * initial query sets options and defines the Observable
     * @param path: path to collection
     * @param field: field to orderBy
     * @param opts: options
     * @param isReset: do you want to reset before init?
     * @param where: WhereInterface
     */
    init(path: string, field: string | Array<string>, opts?: any, isReset?: boolean,
         where?: WhereInterface, where2?: WhereInterface): void {
        this.query = {
            path,
            field,
            where,
            where2,
            limit: 2,
            reverse: false,
            prepend: false,
            ...opts
        };
        if (isReset || isReset === undefined) {
            this.reset();
        }

        setTimeout(() => {
            const first = this.afs.collection(this.query.path, ref => {
                let refVal = ref as (CollectionReference | Query);
                if (this.query.where) {
                    refVal = refVal.where(this.query.where.fieldPath, this.query.where.opStr, this.query.where.value);
                }
                if (this.query.where2) {
                    refVal = refVal.where(this.query.where2.fieldPath, this.query.where2.opStr, this.query.where2.value);
                }
                if (this.query.field instanceof Array) {
                    for (const f of this.query.field) {
                        refVal = refVal.orderBy(f, this.query.reverse ? 'desc' : 'asc');
                    }
                } else {
                    refVal = refVal.orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc');
                }

                return refVal.limit(this.query.limit);
            });

            this.mapAndUpdate(first);

            // create the observable array for consumption in components
            this.data = this._data.asObservable()
                .pipe(scan((acc, val) =>
                    this.query.prepend ? val.concat(acc) : acc.concat(val)));
        }, 0);
    }

    /**
     * Retrieves additional data from firestore
     */
    more(): any {
        const cursor = this.getCursor();
        if (cursor) {
            const more = this.afs.collection(this.query.path, ref => {
                let refVal = ref as (CollectionReference | Query);
                if (this.query.where) {
                    refVal = refVal.where(this.query.where.fieldPath, this.query.where.opStr, this.query.where.value);
                }
                if (this.query.where2) {
                    refVal = refVal.where(this.query.where2.fieldPath, this.query.where2.opStr, this.query.where2.value);
                }
                if (this.query.field instanceof Array) {
                    for (const f of this.query.field) {
                        refVal = refVal.orderBy(f, this.query.reverse ? 'desc' : 'asc');
                    }
                } else {
                    refVal = refVal.orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc');
                }

                return refVal.limit(this.query.limit)
                    .startAfter(cursor);
            });
            this.mapAndUpdate(more);
        } else {
            this.done.next(true);
        }
    }

    /**
     * Reset the pagination
     */
    reset(): void {
        this._data.next([]);
        this.done.next(false);
        // istanbul ignore next
        if (!this.appConfig.isUnitTest) {
            // I do not want to add 'tick(x)' to all of end of unit test cases just for loading bar
            this.loadingBar.complete();
        }
        this.loading.next(false);
    }

    /**
     * Determines the doc snapshot to paginate query
     */
    private getCursor(): any {
        const current = this._data.value;
        if (current.length) {
            return this.query.prepend ? current[0].doc : current[current.length - 1].doc;
        }

        return;
    }

    /**
     * Maps the snapshot to usable format the updates source
     * @param col: AngularFirestoreCollection
     */
    private mapAndUpdate(col: AngularFirestoreCollection<any>): any {

        if (this.done.value || this.loading.value) {
            return;
        }

        // loading
        // istanbul ignore next
        if (!this.appConfig.isUnitTest) {
            // I do not want to add 'tick(x)' to all of end of unit test cases just for loading bar
            this.loadingBar.start();
        }
        this.loading.next(true);

        // map snapshot with doc ref (needed for cursor)
        return col.snapshotChanges()
            .pipe(tap(arr => {
                let values = arr.map(snap => {
                    const id = snap.payload.doc.id;
                    const data = snap.payload.doc.data();
                    const doc = snap.payload.doc;

                    return {id, ...data, doc};
                });

                // if prepending, reverse array
                values = this.query.prepend ? values.reverse() : values;

                // update source with new values, done loading
                this._data.next(values);
                // istanbul ignore next
                if (!this.appConfig.isUnitTest) {
                    // I do not want to add 'tick(x)' to all of end of unit test cases just for loading bar
                    this.loadingBar.complete();
                }
                this.loading.next(false);

                // no more values, mark done
                if (!values.length) {
                    this.done.next(true);
                }
            }))
            .pipe(take(1))
            .subscribe();
    }
}
