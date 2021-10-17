import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdvisorComponent } from './pages/advisor/advisor.component';
import { CustomerComponent } from './pages/customer/customer.component';
import { MasterComponent } from './pages/master/master.component';
import { SlaveComponent } from './pages/slave/slave.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'customer',
    pathMatch: 'full'
  },
  // {
  //   path: 'master',
  //   component: MasterComponent
  // },
  // {
  //   path: 'slave',
  //   component: SlaveComponent
  // },
  {
    path: 'customer',
    component: CustomerComponent
  },
  {
    path: 'advisor',
    component: AdvisorComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
