import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MasterComponent } from './pages/master/master.component';
import { SlaveComponent } from './pages/slave/slave.component';
import { CustomerComponent } from './pages/customer/customer.component';
import { AdvisorComponent } from './pages/advisor/advisor.component';

@NgModule({
  declarations: [
    AppComponent,
    MasterComponent,
    SlaveComponent,
    CustomerComponent,
    AdvisorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
