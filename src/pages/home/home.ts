import { Component } from '@angular/core';
import { AlertController, Loading, LoadingController, NavController } from 'ionic-angular';

import { LoginPage } from '../login/login';
import { ManageMapPage } from '../manage-map/manage-map';
import { MapMainPage } from '../map-main/map-main';

import { MapProvider } from '../../providers/map.provider';
import { FileProvider } from '../../providers/file.provider';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public alertCtrl:AlertController,
              public navCtrl:NavController,
              public loadingCtrl:LoadingController,
              private mapProvider:MapProvider,
              private fileProvider:FileProvider){}

  private userMaps = [];
  private loadingFinished;

  private loading:Loading;

  ionViewCanEnter():any{
  	if (localStorage.getItem('authData')){
  		return true;
  	} else {
  		this.navCtrl.setRoot(LoginPage);
  	}
  }

  ionViewDidEnter():any{
    console.log("entering HomePage");
    if (localStorage.getItem('authData')){
      this.loading = this.loadingCtrl.create({
        content: 'Carregando seus mapas...',
        dismissOnPageChange: true
      });
      this.loading.setShowBackdrop(false);
      this.loadMaps();
      this.fileProvider.checkCacheFolders();
    }
  }

  ionViewDidLeave():any{
    console.log("exiting HomePage");
    this.loading = null;
  }

  loadMaps(){
    this.loading.present().then(() => {
      this.mapProvider.retrieveUserMaps().subscribe((response) => {
        console.log('loaded maps: ', response);
        this.userMaps = response;
        this.loading.dismiss();
        this.loadingFinished = true;
      }, (e) => {
        this.loading.dismiss().then(() => {
          this.loadingFinished = true;
          let loadingErrorAlert = this.alertCtrl.create({
            title: 'Erro',
            subTitle: 'Não foi possível conectar-se ao servidor. Verifique sua conexão e tente novamente.',
            buttons: ['Ok']
          });
          loadingErrorAlert.present();
        });     
      });
    });
  }

  newMap():void{
    this.navCtrl.push(ManageMapPage);
  }

  // presentLoading(message){

  // };

  editMap(map):void{
    // sessionStorage.setItem("mapToEdit", JSON.stringify(map));
    // this.navCtrl.push(ManageMapPage, { "parentPage":this });;
    this.mapProvider.setMapToEdit(map);
    this.navCtrl.push(ManageMapPage);
  }

  openMap(map){
    this.mapProvider.setCurrentMapId(map._id);
    this.navCtrl.setRoot(MapMainPage);
  }

}
