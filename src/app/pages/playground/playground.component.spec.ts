import { PLATFORM_ID } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TestHelperModule } from '../../testing/test.helper.module.spec';
import { PlaygroundComponent } from './playground.component';

describe('PlaygroundComponent', () => {
    let fixture: ComponentFixture<PlaygroundComponent>;
    let comp: PlaygroundComponent;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                PlaygroundComponent
            ],
            providers: [],
            imports: [
                TestHelperModule,
                RouterTestingModule.withRoutes([{path: '', component: PlaygroundComponent}]),
                NgbModule
            ]
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(PlaygroundComponent);
                comp = fixture.componentInstance;
                fixture.detectChanges();
            })
            .catch(reason => {
                expect(reason)
                    .toBeUndefined();
            });
    }));

    it('imgURL of image stored on firebase should be predefined', fakeAsync(() => {
        comp.imgURL$.subscribe(blog => {
            tick();
            fixture.detectChanges();
            expect(comp.imgURL)
                .toEqual('https://storage.googleapis.com/super-reader.appspot.com/publicFiles/bad%2C%20very%20bad%20angel.gif');
        });
        tick();
        fixture.detectChanges();
    }));

});

describe('PlaygroundComponentAsync', () => {
    let fixture: ComponentFixture<PlaygroundComponent>;
    let comp: PlaygroundComponent;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                PlaygroundComponent
            ],
            providers: [],
            imports: [
                TestHelperModule,
                RouterTestingModule.withRoutes([{path: '', component: PlaygroundComponent}]),
                NgbModule
            ]
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(PlaygroundComponent);
                comp = fixture.componentInstance;
            })
            .catch(reason => {
                expect(reason)
                    .toBeUndefined();
            });
    }));

    it("should render 'Browser side rendering with Firebase 🔥' in a h2", async(() => {
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('h2').textContent)
            .toContain('Browser side rendering with Firebase 🔥');
    }));

    it('should create the app', async(() => {
        expect(comp)
            .toBeTruthy();
    }));

    it("should have as title 'Play Ground'", async(() => {
        expect(comp.title)
            .toEqual('Play Ground');
    }));

    it('male() should set gender as male', async(() => {
        comp.male();
        fixture.detectChanges();
        expect(comp.gender)
            .toBe('male');
    }));

    it('female() should set gender as female', async(() => {
        comp.female();
        fixture.detectChanges();
        expect(comp.gender)
            .toBe('female');
    }));

    it('other() should set gender as other', async(() => {
        comp.other();
        fixture.detectChanges();
        expect(comp.gender)
            .toBe('other');
    }));

    it('inc(2) should set minutes as 2', async(() => {
        comp.inc(2);
        fixture.detectChanges();
        expect(comp.minutes)
            .toBe(2);
    }));

    it('openAlert() should alert user', async(() => {
        comp.alert.getMessage()
            .subscribe(message => {
                expect(message.text)
                    .toContain('This is alert test');
            });
        comp.openAlert();
        fixture.detectChanges();
    }));

});
