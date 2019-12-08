import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestHelperModule } from '../../testing/test.helper.module.spec';
import { NotFoundComponent } from '../not-found/not-found.component';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let fixture: ComponentFixture<DashboardComponent>;
    let comp: DashboardComponent;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                DashboardComponent
            ],
            providers: [],
            imports: [
                TestHelperModule,
                RouterTestingModule.withRoutes([
                    {path: '', redirectTo: 'contact', pathMatch: 'full'},
                    {path: 'contact', component: DashboardComponent},
                    {path: 'http-404', component: NotFoundComponent},
                    {path: '**', component: NotFoundComponent}
                ])
            ]
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(DashboardComponent);
                comp = fixture.componentInstance;
                fixture.detectChanges();
            })
            .catch(reason => {
                expect(reason)
                    .toBeUndefined();
            });
    }));

    it('should create the app', async(() => {
        expect(comp)
            .toBeTruthy();
    }));

});
