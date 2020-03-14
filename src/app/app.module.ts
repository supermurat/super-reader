import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { CookieLawModule } from 'angular2-cookie-law';
import { Angulartics2Module } from 'angulartics2';

import { environment } from '../environments/environment';
import { APP_CONFIG, APP_DI_CONFIG } from './app-config';
import { AppRoutingModule } from './app-routing.module';
import { AlertComponent } from './components/alert/alert.component';
import { AppComponent } from './components/app/app.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { ScrollableDirective } from './directives';
import { ContactComponent } from './pages/contact/contact.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PlaygroundComponent } from './pages/playground/playground.component';
import {
    AlertService, AuthService, CarouselService, ConfigService, JsonLDService,
    PageService, PaginationService, PendingChangesGuard, SeoService
} from './services';
import { CustomHtmlComponent } from './widgets/custom-html/custom-html.component';

/**
 * App Module
 */
@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        AlertComponent,
        NotFoundComponent,
        HomeComponent,
        PlaygroundComponent,
        ScrollableDirective,
        FooterComponent,
        SideBarComponent,
        CarouselComponent,
        CustomHtmlComponent,
        ContactComponent,
        DashboardComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        HttpClientModule,
        ReactiveFormsModule,
        FormsModule,
        NgbModule,

        AngularFireModule.initializeApp(environment.firebase),
        // AngularFirestoreModule.enablePersistence(), // will enable cache
        AngularFirestoreModule, // imports firebase/firestore, only needed for database features
        AngularFireAuthModule, // imports firebase/auth, only needed for auth features,
        AngularFireStorageModule, // imports firebase/storage only needed for storage features

        AppRoutingModule,
        Angulartics2Module.forRoot(environment.Angulartics2),
        LoadingBarRouterModule,
        LoadingBarModule,
        CookieLawModule,

        ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production})
    ],
    providers: [
        AlertService,
        SeoService,
        JsonLDService,
        AuthService,
        PaginationService,
        CarouselService,
        PageService,
        ConfigService,
        PendingChangesGuard,
        {provide: APP_CONFIG, useValue: APP_DI_CONFIG},
        {provide: FirestoreSettingsToken, useValue: {}}
    ],
    bootstrap: [AppComponent]
})
// istanbul ignore next
export class AppModule {
}
