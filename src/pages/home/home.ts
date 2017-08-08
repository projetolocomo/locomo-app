import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';

import { FileProvider } from '../../providers/file.provider';

import { LoginPage } from '../login/login';
import { CreateMapPage } from '../create-map/create-map';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(private navCtrl: NavController,
              private platform:Platform,
              private fileProvider:FileProvider) {}

  private userMaps = new Map();

  ionViewCanEnter():any{
  	if (localStorage.getItem("authData")){
  		return true;
  	} else {
  		this.navCtrl.setRoot(LoginPage);
  	}
  }

  ionViewDidEnter():any{
    if (!this.platform.is("mobileweb")){
      this.fileProvider.prepareNeededFolders();
    }
    console.log('check if there is internet connection, if yes then check if token is valid');
    console.log(this.userMaps.size);
  }

  newMap():void{
    this.navCtrl.push(CreateMapPage);
  }

}
