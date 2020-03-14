import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { CookieLawModule } from 'angular2-cookie-law';

import { APP_CONFIG, APP_UNIT_TEST_CONFIG } from '../app-config';
import { AlertComponent } from '../components/alert/alert.component';
import { FooterComponent } from '../components/footer/footer.component';
import { SideBarComponent } from '../components/side-bar/side-bar.component';
import { ScrollableDirective } from '../directives';
import { NotFoundComponent } from '../pages/not-found/not-found.component';
import {
    AlertService, AuthService, CarouselService, ConfigService, JsonLDService,
    PageService, PaginationService, SeoService
} from '../services';
import { CustomHtmlComponent } from '../widgets/custom-html/custom-html.component';
import { ActivatedRouteStub } from './activated-route-stub.spec';
import { angularFireStorageStub } from './angular-firestorage-stub.spec';
import { angularFirestoreStub } from './angular-firestore-stub.spec';

export const activatedRouteStub = new ActivatedRouteStub();

/**
 * Test Helper Module
 */
@NgModule({
    declarations: [
        AlertComponent,
        NotFoundComponent,
        ScrollableDirective,
        FooterComponent,
        SideBarComponent,
        CustomHtmlComponent
    ],
    exports: [
        AlertComponent,
        NotFoundComponent,
        ScrollableDirective,
        FooterComponent,
        SideBarComponent,
        CustomHtmlComponent,
        FormsModule,
        LoadingBarModule,
        CookieLawModule
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        LoadingBarModule,
        CookieLawModule
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
        // {provide: ComponentFixtureAutoDetect, useValue: true},
        {provide: ActivatedRoute, useValue: activatedRouteStub},
        {provide: AngularFirestore, useValue: angularFirestoreStub},
        {provide: AngularFireStorage, useValue: angularFireStorageStub},
        {provide: APP_CONFIG, useValue: APP_UNIT_TEST_CONFIG}
    ]
})
export class TestHelperModule {
}
