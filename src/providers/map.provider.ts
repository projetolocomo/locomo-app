import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs';
import { File } from '@ionic-native/file';
import { FileProvider } from './file.provider';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import 'rxjs/add/observable/fromPromise';

import { UrlProvider } from './url.provider';

@Injectable()
export class MapProvider {
  constructor(public http:Http,
              public fileProvider:FileProvider,
              public platform:Platform,
              public fileTransfer:FileTransfer,
              public file:File,
              private urlProvider:UrlProvider){}

  private serverUrl:string = this.urlProvider.getServerUrl();
  // private serverUrl:string = 'http://locomo.eu-4.evennode.com/api/';

  private userData:any = {id:null, token:null};
  private mapManagementUrl:string;
  private uploadUrl:string;
  // private downloadUrl = this.serverUrl + this.userData.id + '/files/598b65362f55060fa0518a49?token=' + this.userData.token
  private rootPath:string = this.file.externalRootDirectory;
  private mapToEdit:any;
  private currentMapId:any;
  private areUrlsBuilt:boolean = false;

  setCurrentMapId(mapId):void{
    this.currentMapId = mapId;
  }

  getCurrentMapId():any{
    return this.currentMapId;
  }

  setMapToEdit(map):void{
    this.mapToEdit = map;
  }

  getMapToEdit():any{
    return this.mapToEdit;
  }

  buildUrls(){
    if (localStorage.getItem('authData')){
      console.log('logged, building urls...');
      this.userData = JSON.parse(localStorage.getItem('authData'));
      this.mapManagementUrl = this.serverUrl + this.userData.id + '/maps?token=' + this.userData.token;
      this.uploadUrl = this.serverUrl + this.userData.id + '/upload?token=' + this.userData.token;
    } else {
      console.log('not logged yet');
    }
  };

  retrieveUserMaps(){
    if (!this.areUrlsBuilt){
      this.buildUrls();
      this.areUrlsBuilt = true;
    };
    console.log('retrieving user maps from', this.mapManagementUrl);
    return this.http.get(this.mapManagementUrl)
                    .timeout(10000)
                    .map((response:Response) => {
                      return response.json();
                    }).catch((error:Response) => {
                      return Observable.throw(error);
                    });
  };

  retrieveAudioContent(audioId){
    return this.fileProvider.retrieveAudioFileContent(audioId).then(fileContents => {
      console.log("obtained data from local");
      return fileContents;
    }).catch((fileError) => {
      console.log("data not found locally, obtaining from server ", this.urlProvider.getFileDownloadUrl(audioId));
      return this.http.get(this.urlProvider.getFileMetaUrl(audioId))
                      .map(response => {
                        // console.log(response.json())
                        let fileDetails = response.json();
                        let ft = this.fileTransfer.create();
                        // console.log(this.file.externalRootDirectory + fileDetails._id + '.mp3');
                        return ft.download(this.urlProvider.getFileDownloadUrl(audioId) , this.file.externalRootDirectory + fileDetails._id + '.mp3').then((entry) => {
                          fileDetails.isDownloaded = true;
                          return fileDetails;
                        }, (error) => {
                          throw new Error(error);                          
                        });
                      }).catch(error => {
                        throw new Error(error);
                      }).toPromise()
    });
  };

  newMap(mapData, audioRecordingName, audioDuration){
    if (audioRecordingName){
      return this.uploadFile(this.rootPath, audioRecordingName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(uploadResponse);
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
      console.log('name changed');
      textualChanges = true;
    };
    if (!isAudioRecorded){
      if (previousMapData.textualDescription || newMapData.textualDescription){
        if (previousMapData.textualDescription !== newMapData.textualDescription){
          console.log('textual description changed');
          textualChanges = true;
        }
      } if (previousMapData.voiceDescription){
        console.log('previous voice description removed'); //remover antiga 
        textualChanges = true;
      }
    } else {
      if (previousMapData.voiceDescription){
        console.log('voice description changed to another voice description'); //remover antiga
        audioChanges = true;
      } if (previousMapData.textualDescription){
        console.log('textual description changed to voice description');
        audioChanges = true;
      } else {
        console.log('added voice description');
        audioChanges = true;
      }
    };
    if (audioChanges){ //send new audio
      console.log('audio changes');
      return this.uploadFile(this.rootPath, currentAudioName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(uploadResponse);
        newMapData._id = previousMapData._id;
        newMapData.previousVoiceDescription = previousMapData.voiceDescription;
        newMapData.voiceDescription = uploadResponse._id;
        console.log("data sent: ", newMapData);
        return this.sendMap(newMapData).then((response) => {
          if (previousMapData.voiceDescription){
            this.fileProvider.removeFileFromCache('audio', previousMapData.voiceDescription);
          };
          return response;
        }).catch((e) => {
          throw new Error(e);
        });
      });
    } else if (textualChanges){
      console.log('textualChanges');
      newMapData._id = previousMapData._id;
      newMapData.previousVoiceDescription = previousMapData.voiceDescription;
      console.log("data sent: ", newMapData);
      return this.sendMap(newMapData).then((response) => {
        if (previousMapData.voiceDescription && !isAudioRecorded){
          this.fileProvider.removeFileFromCache('audio', previousMapData.voiceDescription);
        };
        return response;
      }).catch((e) => {
        throw new Error(e);
      });
    } else {
      console.log('no changes');
      return Promise.resolve("noChanges");
    };
  };

  //change POST to DELETE and let the server look for the voiceDescriptionId associated to the map (if there is some) and remove the appropriate file
  removeMap(mapData){
    let mapRemovalUrl = this.serverUrl + this.userData.id + '/maps/' + '?token=' + this.userData.token;
    let requestOptions = new RequestOptions({ body:mapData });
    return this.http.delete(mapRemovalUrl, requestOptions).map((response:Response) => {
      if (requestOptions.body.voiceDescription){
        let voiceDescriptionId = requestOptions.body.voiceDescription;
        this.fileProvider.removeFileFromCache('audio', voiceDescriptionId);
        this.fileProvider.removeTempAudioRecording(voiceDescriptionId + '.mp3');
      };
      // return this.fileProvider.removeMap(mapData);
      return response.json();
    }).catch((error:Response) => {
      return Observable.throw(error);
    }).toPromise();
  };

  sendMap(mapData){
    return this.http.post(this.mapManagementUrl, mapData).timeout(5000).map((response:Response) => {
      console.log('response from server: ', response.json());
      if (mapData.previousVoiceDescription){
        this.fileProvider.removeFileFromCache('audio', mapData.previousVoiceDescription);
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
  };
};
