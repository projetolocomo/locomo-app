import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs';
import { FileProvider } from './file.provider';
import { File, Entry } from '@ionic-native/file';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import 'rxjs/add/observable/fromPromise';

@Injectable()
export class MapProvider {
  constructor(public http:Http,
              public fileProvider:FileProvider,
              public file:File,
              public platform:Platform,
              public fileTransfer:FileTransfer){}

  private serverUrl:string = 'http://192.168.0.51:3000/api';
  private userData = JSON.parse(localStorage.getItem('authData'));
  private mapManagementUrl = this.serverUrl + '/' + this.userData.id + '/maps?token=' + this.userData.token;
  private uploadUrl = this.serverUrl + '/' + this.userData.id + '/upload?token=' + this.userData.token;
  // private downloadUrl = this.serverUrl + '/' + this.userData.id + '/files/598b65362f55060fa0518a49?token=' + this.userData.token
  private rootPath = this.file.externalRootDirectory;

  newMap(mapData, audioRecordingName, audioDuration){
    if (audioRecordingName){
      return this.uploadFile(this.rootPath, audioRecordingName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveAudioToCacheAndRename(audioRecordingName, uploadResponse._id);
        this.fileProvider.saveObjectToFile(uploadResponse, 'audio');
        mapData.voiceDescription = uploadResponse._id;
        return this.sendMap(mapData);
      });
    } else {
      return this.sendMap(mapData);
    }
  };

  updateMap(previousMapData, newMapData, currentAudioName, audioDuration, isAudioRecorded){
    let textualChanges:boolean = false;
    let audioChanges:boolean = false;
    if (previousMapData.name !== newMapData.name){
      textualChanges = true;
    }
    if (previousMapData.textualDescription){
      if (currentAudioName && isAudioRecorded){
        console.log('textual changed to audio'); //remove textual, send audio
        audioChanges = true;
      } if (previousMapData.textualDescription !== newMapData.textualDescription){
        console.log('textual description changed');
        textualChanges = true;
      }
    }
    if (previousMapData.voiceDescription){
      if (currentAudioName){
        console.log('audio changed'); //remove previous, send audio
        audioChanges = true;
      } else if (newMapData.textualDescription){
        console.log('audio description changed to text'); //remove previous
        textualChanges = true;
      }
    }
    if (audioChanges){ //send new audio
      console.log('audio changes')
      return this.uploadFile(this.rootPath, currentAudioName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveAudioToCacheAndRename(currentAudioName, uploadResponse._id);
        this.fileProvider.saveObjectToFile(uploadResponse, 'audio');
        if (previousMapData.voiceDescription){
          this.fileProvider.removeFileFromData('audio', previousMapData.voiceDescription);
        };
        newMapData._id = previousMapData._id;
        newMapData.previousVoiceDescription = previousMapData.voiceDescription;
        newMapData.voiceDescription = uploadResponse._id;
        console.log("data sent: ", newMapData);
        return this.sendMap(newMapData);
      });
    }
    if (textualChanges){
      console.log('textualChanges');
      newMapData._id = previousMapData._id;
      console.log("data sent: ", newMapData);
      return this.sendMap(newMapData);
    } else {
      console.log('no changes');
      return Promise.resolve("noChanges");
    }
  };

  removeMap(mapData){
    let mapRemovalUrl = this.serverUrl + '/' + this.userData.id + '/maps/' + mapData._id + '?token=' + this.userData.token;
    return this.http.delete(mapRemovalUrl).map((response:Response) => {
      return this.fileProvider.removeMap(mapData);
    }).catch((error:Response) => {
      return Observable.throw(error);
    }).toPromise();
  }

  sendMap(mapData){
    return this.http.post(this.mapManagementUrl, mapData).map((response:Response) => {
      console.log('response from server: ', response.json());
      this.fileProvider.saveObjectToFile(response.json(), 'maps');
      if (mapData.previousVoiceDescription){
        this.fileProvider.removeFileFromData('audio', mapData.previousVoiceDescription + '.mp3');
      }
      return response.json();
    }).catch((error:Response) => {
      return Observable.throw(error);
    }).toPromise();
  };

  uploadFile(filePath:string, fileName:string, mimeType:string, audioDuration){
    let ft:FileTransferObject = this.fileTransfer.create();
    let options:FileUploadOptions;
    if (mimeType == 'audio/mp3'){
      options = { fileName:fileName + '-' + audioDuration, mimeType:mimeType }
    };
    return ft.upload(filePath + fileName, this.uploadUrl, options).then((fileUploadResult) => {
      return fileUploadResult.response;
    }, 
    (error) => {
      //lidar com possíveis erros de upload aqui
      return Observable.throw(error);
    });
  }

}
