import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MasterComponent } from './pages/master/master.component';
import { SlaveComponent } from './pages/slave/slave.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'master',
    pathMatch: 'full'
  },
  {
    path: 'master',
    component: MasterComponent
  },
  {
    path: 'slave',
    component: SlaveComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
