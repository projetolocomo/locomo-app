import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, LatLng, CameraPosition, MarkerOptions, Marker } from '@ionic-native/google-maps';

import { HomePage } from '../home/home';

@Component({
  selector: 'map-main',
  templateUrl: 'map-main.html'
})
export class MapMainPage {

  constructor(public navCtrl:NavController,
              private googleMaps: GoogleMaps,
              private platform:Platform){}

  ionViewCanEnter():any{
    if (sessionStorage.getItem("currentMapId")){
      this.currentMapId = sessionStorage.getItem("currentMapId");
      return true;
    } else {
      this.navCtrl.setRoot(HomePage);
    }
  }

  ionViewDidEnter():any{
    sessionStorage.removeItem("currentMapId");
    this.platform.registerBackButtonAction((e:UIEvent) => {
      this.navCtrl.setRoot(HomePage);
    });
    this.loadMap();
  }


  loadMap() {
    let element: HTMLElement = document.getElementById('map');
    let map: GoogleMap = this.googleMaps.create(element);
    map.one(GoogleMapsEvent.MAP_READY).then(() => {
      console.log('Map is ready!');
      // Now you can add elements to the map like the marker
    });
    
    let position: CameraPosition = {
     target: {
       lat: 43.0741904,
       lng: -89.3809802
     },
     zoom: 18,
     tilt: 30
    };
    
    map.moveCamera(position);

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

  private currentMapId:string;


}
