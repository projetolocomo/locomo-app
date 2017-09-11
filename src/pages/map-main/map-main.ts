import { Component, ViewChild } from '@angular/core';
import { AlertController, LoadingController, Navbar, NavController, Platform } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';

import { MapProvider } from '../../providers/map.provider';
import { MarkerProvider } from '../../providers/marker.provider';
import { PermissionProvider } from '../../providers/permission.provider';

import { HomePage } from '../home/home';
import { ManageMarkerPage } from '../manage-marker/manage-marker';

// declare var google:any;
declare var plugin:any;

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
              private loadingCtrl:LoadingController,
              private platform:Platform,
              private mapProvider:MapProvider,
              private markerProvider:MarkerProvider,
              private permissionProvider:PermissionProvider){}

  ionViewCanEnter():any{
    if (this.mapProvider.getCurrentMapId()){
      this.currentMapId = this.mapProvider.getCurrentMapId();
      return true;
    } else {
      this.navCtrl.setRoot(HomePage);
    }
  }

  ionViewDidEnter():any{
    let mapElement = document.getElementById('map');
    this.map = plugin.google.maps.Map.getMap(mapElement);
    this.platform.registerBackButtonAction((e:UIEvent) => {
      this.navCtrl.setRoot(HomePage);
    });
    // this.navbar.backButtonClick = (e:UIEvent) => {
    //   this.navCtrl.setRoot(HomePage);
    // }
    this.stopWatchingLocation = false;
    this.markerProvider.buildUrls();
    this.checkLocationAuth();
  }

  ionViewDidLoad():void{
    // this.platform.registerBackButtonAction((e:UIEvent) => {
    //   return true;
    // });
    this.platform.ready().then(() => {
      this.pause = this.platform.pause.subscribe(() => {
        console.log('pausing...');
        this.stopWatchingLocation = true;
      });
      this.resume = this.platform.resume.subscribe(() => {
        this.stopWatchingLocation = false;
        this.checkLocationAuth();
      });
    });
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
    this.stopWatchingLocation = true;
    this.pause.unsubscribe();
    this.resume.unsubscribe();
  }

  private currentMapId:string;
  private alert;
  private loading;
  private isLocationAcquired:boolean = false;
  private isMapCentered:boolean = true;
  private currentPosition:any = {};
  private cameraPosition:any = {};
  private map;
  private watchLocation = this.geolocation.watchPosition({enableHighAccuracy:true});
  private markers:any = {};
  private resume;
  private pause;
  private stopWatchingLocation:boolean;
  // private cameraMoveStart;
  // private cameraMoveEnd;
  // private cameraMove;

  checkLocationAuth(){
    console.log('checking location auth...');
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
    console.log('checking gps status...');
    let success = (enabled) => {
      if (enabled){
        console.log('Location is fine.');
        this.loadMap();
      } else {
        // this.map.on(plugin.google.maps.event.MAP_READY, function(map) {
        //   map.setClickable(false);
        // });
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
    // this.map.on(plugin.google.maps.event.MAP_READY, function(map) {
    //   console.log('ready');
    //   map.setClickable(true);
    // });
    // this.map.setClickable(true);
    // console.log('map is ready!');
    this.loading = this.loadingCtrl.create({
      content: 'Obtendo seu local...'
    });
    this.loading.present();
    this.markerProvider.getMarkers(this.currentMapId).then((markersData) => {
      this.markers = markersData;
    });
    let initLocation = this.watchLocation.subscribe((data) => {
      console.log('accuracy of location obtained: ', data.coords.accuracy);
      if (data.coords.accuracy < 30){
        this.isLocationAcquired = true;
        this.loading.dismiss(); 
        // this.startWatchingLocation(data.coords.latitude, data.coords.longitude);
        this.startWatchingLocation();
        this.map.animateCamera({
         target: {lat:data.coords.latitude, lng:data.coords.longitude},
         zoom: 18,
         duration: 3000
        }, function() {
          initLocation.unsubscribe();
        });
      }
    });
    // this.map.on(plugin.google.maps.event.CAMERA_MOVE_START, this.setMapCenteredFalse);
    this.map.on(plugin.google.maps.event.CAMERA_MOVE_END, function(cameraEvent){
      sessionStorage.setItem('cameraTarget', JSON.stringify(cameraEvent.target));
    });
  }

  setMapCenteredFalse(){
    this.isMapCentered = false;
  }

  setMapCenteredTrue(){
      this.isMapCentered = true;
  }

  editMarker(){
    console.log('editing marker');
  }

  // startWatchingLocation(currentLat, currentLng){
  startWatchingLocation(){
    console.log('start watching location...');
    // this.currentPosition.lat = currentLat;
    // this.currentPosition.lng = currentLng;
    // let centerMarker;
    // const iconImage = {
    //   url: './assets/markers/map_pin_icon_fullfilled.png',
    //   size: {
    //     width: 54,
    //     height: 54
    //   }
    // }
    // centerMarker = this.map.addMarker({
    //   position: this.currentPosition,
    //   icon: iconImage,
    //   draggable: false,
    //   zIndex: 10
    // })
    // .then((marker) => {
      let watchLocation = this.watchLocation.subscribe((data) => {
        // console.log(this.isMapCentered)
        // if (this.isMapCentered){
        //   this.map.animateCamera({
        //     target: {lat:data.coords.latitude, lng:data.coords.longitude},
        //     duration: 500
        //   });
        // }
        this.currentPosition.lat = data.coords.latitude;
        this.currentPosition.lng = data.coords.longitude;
        // marker.setPosition(this.currentPosition);
        if (this.stopWatchingLocation){
          // marker.remove();
          watchLocation.unsubscribe();
        }
      });
    // });
    this.buildMarkers();
  }

  buildMarkers():void{
    const iconImage = {
      url: './assets/markers/map_pin_icon_fullfilled.png',
      size: {
        width: 48,
        height: 48
      }
    }
    for (let i in this.markers){
      let lat = this.markers[i].geometry.coordinates[0];
      let lng = this.markers[i].geometry.coordinates[1];
      let position = {
        lat:lat,
        lng:lng
      };
      let marker = this.map.addMarker({
        position: position,
        icon: iconImage
      }, function(marker){
        marker.setDisableAutoPan(true);
        marker.on(plugin.google.maps.event.MARKER_CLICK, function() {
          console.log('marker clicked')
          marker.showInfoWindow();
        });
      });
    };
  }

  newMarker():void{
    this.cameraPosition = JSON.parse(sessionStorage.getItem('cameraTarget'));
    console.log('opening add marker screen with camera position ', this.cameraPosition);
    this.markerProvider.setNewMarkerLocation(this.cameraPosition);
    this.navCtrl.push(ManageMarkerPage);
  }

  centerMap(){
    console.log('centering map...');
    this.map.animateCamera({
     target: this.currentPosition,
     zoom: 18,
     duration: 1500
    }, this.setMapCenteredTrue);
  }

  // getNewLocation(){
  //   console.log('new location')
  //   this.map.getCameraTarget().then((ct) => {
  //     console.log('cameratarget', ct)
  //   })
  //   this.cameraMove = this.map.on(GoogleMapsEvent.CAMERA_MOVE).subscribe((move) => {
  //     console.log('move', move)
  //   })
  //   this.cameraMoveStart = this.map.on(GoogleMapsEvent.CAMERA_MOVE_START).subscribe((move) => {
  //     console.log('start', move)
  //   })
  //   this.cameraMoveEnd = this.map.on(GoogleMapsEvent.CAMERA_MOVE_END).subscribe((move) => {
  //     console.log('end', move)
  //   })
  // }

}
