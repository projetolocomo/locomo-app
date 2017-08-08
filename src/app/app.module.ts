import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HttpModule } from '@angular/http';
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { Diagnostic } from '@ionic-native/diagnostic';

//directives
import { ValidateOnBlurDirective } from '../directives/validate-onblur/validate-onblur';

//providers
import { UserProvider } from '../providers/user.provider';
import { PermissionProvider } from '../providers/permission.provider';
import { FileProvider } from '../providers/file.provider';

//pages
import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { HomePage } from '../pages/home/home';
import { CreateMapPage } from '../pages/create-map/create-map';
import { MapMainPage } from '../pages/map-main/map-main';

@NgModule({
  declarations: [
    MyApp,
    ValidateOnBlurDirective,
    LoginPage,
    SignupPage,
    HomePage,
    CreateMapPage,
    MapMainPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    SignupPage,
    HomePage,
    CreateMapPage,
    MapMainPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Media,
    File,
    Diagnostic,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UserProvider,
    PermissionProvider,
    FileProvider
  ]
})
export class AppModule {}
