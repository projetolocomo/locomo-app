import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { File } from '@ionic-native/file';

import { FileProvider } from '../../providers/file.provider';

import { LoginPage } from '../login/login';
import { CreateMapPage } from '../create-map/create-map';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController,
              public loadingCtrl:LoadingController,
              private fileProvider:FileProvider){}

  private userMaps = [];
  private loadingFinished;
  private loading = this.loadingCtrl.create({
    content: 'Carregando mapas...'
  });

  ionViewCanEnter():any{
  	if (localStorage.getItem("authData")){
  		return true;
  	} else {
  		this.navCtrl.setRoot(LoginPage);
  	}
  }

  ionViewDidLoad():any{
    console.log('check if there is internet connection, if yes then check if token is valid');
    this.loading.setShowBackdrop(false);
    this.loading.present();
    setTimeout(() => {
      this.fileProvider.prepareNeededFolders();
      this.loadMaps();
    }, 1500)  
  }

  ionViewDidLeave():any{
    this.loading.dismiss();
  }

  loadMaps(){
    this.fileProvider.retrieveLocalMaps().then((maps) => {
      this.userMaps = maps;
      this.loading.dismiss().then(() => {
        this.loadingFinished = true;
      })
    });
  }

  newMap():void{
    this.navCtrl.push(CreateMapPage);
  }

  editMap(map):void{
    sessionStorage.setItem("mapToEdit", JSON.stringify(map));
    this.navCtrl.push(CreateMapPage, { "parentPage":this });;
  }

}
