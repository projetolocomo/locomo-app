import { Injectable } from '@angular/core';

@Injectable()
export class UrlProvider {
  constructor(){
    this.getUserData();
  }

  private serverUrl:string = 'http://192.168.0.123:3000/api/';
  private userData:any;
  private isUserDataLoaded:boolean = false;

  getUserData():void{
    if (!this.isUserDataLoaded){
      this.userData = JSON.parse(localStorage.getItem('authData'));
      this.isUserDataLoaded = true;
    }
  }

  getServerUrl():string{
    return this.serverUrl;
  }

  getFileMetaUrl(fileId:string):string{
    return this.serverUrl + this.userData.id + '/files/' + fileId + '/meta?token=' + this.userData.token;    
  }

  getFileDownloadUrl(fileId:string):string{
    return this.serverUrl + this.userData.id + '/files/' + fileId + '?token=' + this.userData.token;
  }

}