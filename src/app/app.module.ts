import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MasterComponent } from './pages/master/master.component';
import { SlaveComponent } from './pages/slave/slave.component';

@NgModule({
  declarations: [
    AppComponent,
    MasterComponent,
    SlaveComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
