import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
    AngularFirestore,
    AngularFirestoreDocument
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { auth } from 'firebase/app';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserCredentialsModel, UserModel } from '../models';
import { AlertService } from './alert.service';

/**
 * Authentication Service
 */
@Injectable({providedIn: 'root'})
export class AuthService {
    /** current user */
    user$: Observable<UserModel>;

    /**
     * constructor of AuthService
     * @param afAuth: AngularFireAuth
     * @param afs: AngularFirestore
     * @param router: Router
     * @param alert: AlertService
     * @param locale: LOCALE_ID
     */
    constructor(
        private readonly afAuth: AngularFireAuth,
        private readonly afs: AngularFirestore,
        private readonly router: Router,
        private readonly alert: AlertService,
        @Inject(LOCALE_ID) public locale: string
    ) {
        this.user$ = this.afAuth.authState.pipe(
            switchMap(user => {
                // istanbul ignore else
                if (user) {
                    return this.afs.doc<any>(`users/${user.uid}`)
                        .valueChanges();
                }

                // istanbul ignore next
                return of(undefined);
            })
        );
    }

    /**
     * register user
     * @param credentials: user credentials
     */
    async register(credentials: UserCredentialsModel): Promise<any> {
        return this.afAuth.auth.createUserWithEmailAndPassword(
                credentials.email,
                credentials.password
            );
    }

    /**
     * log in with credentials
     * @param credentials: user credentials
     */
    async logIn(credentials: UserCredentialsModel): Promise<any> {
        return this.afAuth.auth.signInWithEmailAndPassword(
                credentials.email,
                credentials.password
            );
    }

    /**
     * sign in with google
     */
    async googleSignIn(): Promise<void> {
        const provider = new auth.GoogleAuthProvider();

        return this.oAuthLogin(provider)
            .then(value => {
                this.router.navigate(['/', this.locale === 'tr-TR' ? 'pano' : 'dashboard'])
                    .catch(// istanbul ignore next
                        reason => {
                            this.alert.error(reason);
                        });
            });
    }

    /**
     * sign out
     */
    async signOut(): Promise<boolean> {
        await this.afAuth.auth.signOut();

        return this.router.navigate(['/']);
    }

    /**
     * attempt to login
     * @param provider: Firebase Auth Provider
     */
    private async oAuthLogin(provider): Promise<void> {
        const credential = await this.afAuth.auth.signInWithPopup(provider);

        return this.updateUserData(credential.user);
    }

    /**
     * update current user data
     * @param userData: uid, email, display name, photo URL, etc
     */
    private async updateUserData(userData: UserModel): Promise<void> {
        const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${userData.uid}`);

        return userRef.set(JSON.parse(JSON.stringify(userData)), {merge: true});
    }
}
