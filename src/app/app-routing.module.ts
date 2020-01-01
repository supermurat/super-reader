import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ContactComponent } from './pages/contact/contact.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PlaygroundComponent } from './pages/playground/playground.component';
import { PendingChangesGuard } from './services';

const routes: Routes = [
    // region home paths
    {
        path: '', redirectTo: 'home', pathMatch: 'full'
    },
    {
        path: 'home', component: HomeComponent
    },
    {
        path: 'contact', component: ContactComponent
    },
    {
        path: 'iletisim', component: ContactComponent
    },
    {
        path: 'playground', component: PlaygroundComponent
    },
    {
        path: 'dashboard', component: DashboardComponent, canDeactivate: [PendingChangesGuard]
    },
    {
        path: 'pano', component: DashboardComponent, canDeactivate: [PendingChangesGuard]
    },
    {
        path: 'http-404', component: NotFoundComponent
    },
    {
        path: '**', component: NotFoundComponent // maybe keeping current url is more cool, redirectTo: '404', pathMatch: 'full'
    }
    // endregion
];

/**
 * App Routing Module
 */
@NgModule({
    imports: [RouterModule.forRoot(routes, {
        // router options
        useHash: false,
        preloadingStrategy: PreloadAllModules,
        initialNavigation: 'enabled'
        // enableTracing: true // debugging purposes only
    })],
    exports: [RouterModule]
})
// istanbul ignore next
export class AppRoutingModule {
}
