import { Component, ViewChild } from '@angular/core';
import { AlertController, LoadingController, Navbar, NavController, Platform } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, LatLng, CameraPosition, MarkerOptions, Marker } from '@ionic-native/google-maps';

import { PermissionProvider } from '../../providers/permission.provider';

import { HomePage } from '../home/home';
import { ManageMarkerPage } from '../manage-marker/manage-marker';

@Component({
  selector: 'map-main',
  templateUrl: 'map-main.html'
})
export class MapMainPage {

  // @ViewChild(Navbar) navbar:Navbar;

  constructor(private alertCtrl:AlertController,
              private navCtrl:NavController,
              private diagnostic:Diagnostic,
              private geolocation:Geolocation,
              private googleMaps:GoogleMaps,
              private loadingCtrl:LoadingController,
              private platform:Platform,
              private permissionProvider:PermissionProvider){}

  ionViewCanEnter():any{
    if (sessionStorage.getItem('currentMapId')){
      this.currentMapId = sessionStorage.getItem('currentMapId');
      return true;
    } else {
      this.navCtrl.setRoot(HomePage);
    }
  }

  ionViewDidEnter():any{
    sessionStorage.removeItem('currentMapId');
    let element:HTMLElement = document.getElementById('map');
    this.map = this.googleMaps.create(element);
    this.loadMap();
    this.checkLocationAuth();
    this.platform.registerBackButtonAction((e:UIEvent) => {
      this.navCtrl.setRoot(HomePage);
    });
    // this.navbar.backButtonClick = (e:UIEvent) => {
    //   this.navCtrl.setRoot(HomePage);
    // }
    
  }

  ionViewDidLoad():void{
    // this.platform.registerBackButtonAction((e:UIEvent) => {
    //   return true;
    // });
  }

  ionViewDidLeave():void{
    this.alert = null;
    this.loading = null;
    // this.navbar.backButtonClick = (e:UIEvent) => {
    //   return true;
    // };
    this.platform.registerBackButtonAction((e:UIEvent) => {
      return true;
    });
  }

  private currentMapId:string;
  private alert;
  private loading;
  // private currentLocationMarker;
  private isLocationAcquired:boolean = false;
  private currentPosition:any = {};
  private map:GoogleMap;
  private watchLocation = this.geolocation.watchPosition({enableHighAccuracy:true});

  checkLocationAuth(){
    let success = (authorized) => {
      if (authorized){
        try {
          this.checkGpsStatus();
        } 
        catch(e){
          this.alert = this.alertCtrl.create({
            title: 'Erro',
            subTitle: 'Não foi possível obter sua localização. (2)',
            buttons: ['Ok']
          });
          this.alert.present();
        }
      } else {
        this.permissionProvider.requestLocationAuthorization();
      }
    };
    let error = (e) => {
      this.alert = this.alertCtrl.create({
        title: 'Erro',
        subTitle: 'Não foi possível obter sua localização.',
        buttons: ['Ok']
      });
      this.alert.present();
      console.error(e);
    }
    this.diagnostic.isLocationAuthorized().then(success).catch(error);
  }

  checkGpsStatus(){
    let success = (enabled) => {
      if (enabled){
        console.log('Location is fine.');
      } else {
        let confirm = this.alertCtrl.create({
          message: 'Sua localização por GPS parece estar desativada. Vamos ativá-la a seguir.',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.diagnostic.switchToLocationSettings();
              }
            }
          ]
        });
        confirm.present();
      }
    };
    let error = (e) => {
      console.error(e);
    }
    this.diagnostic.isGpsLocationEnabled().then(success).catch(error);
  }

  loadMap(){
    console.log('loading map...');
    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      console.log('Map is ready!');
      this.loading = this.loadingCtrl.create({
        content: 'Obtendo seu local...'
      });
      this.loading.present();
      let initLocation = this.watchLocation.subscribe((data) => {
        console.log('accuracy of location obtained: ', data.coords.accuracy);
        if (data.coords.accuracy < 30){
          this.isLocationAcquired = true;
          this.loading.dismiss(); 
          this.startWatchingLocation(data.coords.latitude, data.coords.longitude);
          this.map.animateCamera({
           target: {lat:data.coords.latitude, lng:data.coords.longitude},
           zoom: 18,
           duration: 3000
          }).then(() => {
            initLocation.unsubscribe();
          });
        }
      });
    });
	
  // tilt: 60,
  // bearing: 140,
    
  // // create new marker
  // let markerOptions: MarkerOptions = {
  //  position: ionic,
  //  title: 'Ionic'
  // };

  // const marker: Marker = map.addMarker(markerOptions)
  //  .then((marker: Marker) => {
  //     marker.showInfoWindow();
  //   });
  }

  startWatchingLocation(currentLat, currentLng){
    console.log('start watching location...')
    this.currentPosition.lat = currentLat;
    this.currentPosition.lng = currentLng;
    let centerMarker;
    const iconImage = {
      url: './assets/markers/map_pin_icon_hole.png',
      size: {
        width: 48,
        height: 48
      }
    }
    centerMarker = this.map.addMarker({
      position: this.currentPosition,
      icon: iconImage,
      draggable: false
    }).then((marker) => {
      let watchLocation = this.watchLocation.subscribe((data) => {
        this.currentPosition.lat = data.coords.latitude;
        this.currentPosition.lng = data.coords.longitude;
        marker.setPosition(this.currentPosition);
      });
    });
  }

  newMarker(){
    console.log('opening add marker screen with position ', this.currentPosition);
    this.navCtrl.push(ManageMarkerPage);
  }

}
