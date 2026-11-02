import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Champions } from './pages/champions/champions';
import { Events } from './pages/events/events';
import { Shop } from './pages/shop/shop';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'bajnokok',
        component: Champions
    },
    {
        path: 'esemenyek',
        component: Events
    },
    {
        path: 'webshop',
        component: Shop
    },
    { path: '**', redirectTo: '' }
];
