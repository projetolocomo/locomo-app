import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HttpModule } from '@angular/http';
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { FileTransfer } from '@ionic-native/file-transfer';
import { Diagnostic } from '@ionic-native/diagnostic';
import { GoogleMaps } from '@ionic-native/google-maps';
import { Network } from '@ionic-native/network';

//directives
import { ValidateOnBlurDirective } from '../directives/validate-onblur/validate-onblur';

//providers
import { UserProvider } from '../providers/user.provider';
import { PermissionProvider } from '../providers/permission.provider';
import { FileProvider } from '../providers/file.provider';
import { MapProvider } from '../providers/map.provider';

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
    FileTransfer,
    GoogleMaps,
    Network,
    Diagnostic,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UserProvider,
    PermissionProvider,
    FileProvider,
    MapProvider
  ]
})
export class AppModule {}
