import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpModule } from '@angular/http';

// ionic native
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { FileTransfer } from '@ionic-native/file-transfer';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { Network } from '@ionic-native/network';
import { Camera } from '@ionic-native/camera';

//directives
import { ValidateOnBlurDirective } from '../directives/validate-onblur/validate-onblur';

//providers
import { UserProvider } from '../providers/user.provider';
import { PermissionProvider } from '../providers/permission.provider';
import { FileProvider } from '../providers/file.provider';
import { MapProvider } from '../providers/map.provider';
import { MarkerProvider } from '../providers/marker.provider';
import { UrlProvider } from '../providers/url.provider';

//pages
import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { HomePage } from '../pages/home/home';
import { ManageMapPage } from '../pages/manage-map/manage-map';
import { MapMainPage } from '../pages/map-main/map-main';
import { ManageMarkerPage } from '../pages/manage-marker/manage-marker';

@NgModule({
  declarations: [
    MyApp,
    ValidateOnBlurDirective,
    LoginPage,
    SignupPage,
    HomePage,
    ManageMapPage,
    MapMainPage,
    ManageMarkerPage
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
    ManageMapPage,
    MapMainPage,
    ManageMarkerPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Media,
    File,
    FileTransfer,
    Geolocation,
    Network,
    Diagnostic,
    Camera,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UserProvider,
    PermissionProvider,
    FileProvider,
    MapProvider,
    MarkerProvider,
    UrlProvider
  ]
})
export class AppModule {}
