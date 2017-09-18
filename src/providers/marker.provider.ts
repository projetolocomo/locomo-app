import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs';
import { File } from '@ionic-native/file';
import { FileProvider } from './file.provider';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import 'rxjs/add/observable/fromPromise';

import { MapProvider } from './map.provider';
import { UrlProvider } from './url.provider';

@Injectable()
export class MarkerProvider {
  constructor(public http:Http,
              public fileProvider:FileProvider,
              private mapProvider:MapProvider,
              public platform:Platform,
              public fileTransfer:FileTransfer,
              public file:File,
              private urlProvider:UrlProvider){}

  private serverUrl:string = this.urlProvider.getServerUrl();
  
  // private serverUrl:string = 'http://locomo.eu-4.evennode.com/api/';
  // private downloadUrl = this.serverUrl + this.userData.id + '/files/598b65362f55060fa0518a49?token=' + this.userData.token;
  // private mapManagementUrl:string;
  
  private userData:any = {id:null, token:null};
  private uploadUrl:string;
  private markerManagementUrl:string;
  private rootPath:string = this.file.externalRootDirectory;
  private currentMapId:string;
  private newMarkerLocation:any;
  private currentMarkerToEdit:any;

  buildUrls(){
    if (this.mapProvider.getCurrentMapId()){
      this.currentMapId = this.mapProvider.getCurrentMapId();
      console.log('building urls for map', this.currentMapId);
      this.userData = JSON.parse(localStorage.getItem('authData'));
      this.markerManagementUrl = this.serverUrl + this.userData.id + '/' + this.currentMapId + '/markers?token=' + this.userData.token;
      this.uploadUrl = this.serverUrl + this.userData.id + '/upload?token=' + this.userData.token;
    } else {
      console.log('no map id in sessionStorage');
    }
  }

  setCurrentMarkerToEdit(marker:any):void{
    console.log('current marker updated to', marker);
    this.currentMarkerToEdit = marker;
  }

  getCurrentMarkerToEdit():any{
    return this.currentMarkerToEdit;
  }

  // retrieveUserMaps(){
  //   this.buildUrls();
  //   console.log('retrieving user maps from url ' + this.serverUrl + this.userData.id + '/maps');
  //   return this.http.get(this.serverUrl + this.userData.id + '/maps', {params:{'token':this.userData.token}})
  //                   .map((response:Response) => {
  //                     return response.json();
  //                   }).catch((error:Response) => {
  //                     return Observable.throw(error);
  //                   });
  // }

  // retrieveAudioContent(audioId){
  //   return this.fileProvider.retrieveAudioFileContent(audioId).then(fileContents => {
  //     console.log("obtained data from local");
  //     return fileContents;
  //   }).catch((fileError) => {
  //     console.log("data not found locally, obtaining from server");
  //     return this.http.get(this.serverUrl + this.userData.id + '/files/' + audioId, {params:{'token':this.userData.token}})
  //                     .map(response => {
  //                       console.log(response.json())
  //                       let fileDetails = response.json();
  //                       let ft = this.fileTransfer.create();
  //                       console.log(this.serverUrl + this.userData.id + '/files/' + audioId + '?token=' + this.userData.token)
  //                       console.log(this.file.externalRootDirectory + fileDetails._id + '.mp3')
  //                       return ft.download(this.serverUrl + this.userData.id + '/files/' + audioId + '?token=' + this.userData.token, this.file.externalRootDirectory + fileDetails._id + '.mp3').then((entry) => {
  //                         fileDetails.isDownloaded = true;
  //                         return fileDetails;
  //                       }, (error) => {
  //                         throw new Error(error);                          
  //                       });
  //                     }).catch(error => {
  //                       throw new Error(error);
  //                     }).toPromise()
  //   });
  // }

  setNewMarkerLocation(location):void{
    this.newMarkerLocation = location;
  }

  getNewMarkerLocation():any{
    return this.newMarkerLocation;
  }

  getMarkers(mapId){
    return this.http.get(this.markerManagementUrl).map((response:Response) => {
      console.log('getting markers from ' + this.markerManagementUrl);
      return response.json();
    }).catch((error:Response) => {
      return Observable.throw(error);
    }).toPromise();
  }

  newMarker(mapId, markerData, coords, audioRecordingName, audioDuration, pictureUri, isPictureFromGallery){
    console.log(mapId, markerData, coords, audioRecordingName, audioDuration, pictureUri, isPictureFromGallery)
    if (audioRecordingName && !pictureUri){
      console.log('only audio');
      return this.uploadFile(this.rootPath, audioRecordingName, 'audio/mp3', audioDuration).then((response:string) => {
        let audioUploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(audioUploadResponse);
        let geoJsonMarkerData = this.generateGeoJson(mapId, markerData, coords, audioUploadResponse._id, null);
        return this.sendMarker(geoJsonMarkerData);
      });
    } else if (!audioRecordingName && pictureUri){
      console.log('only picture');
      let fileName = pictureUri.substring(pictureUri.lastIndexOf('/') + 1);
      if (isPictureFromGallery){
        fileName = fileName.substring(0, fileName.lastIndexOf('?'));
      };
      return this.uploadFile(pictureUri,  fileName, 'image/jpeg', undefined).then((response:string) => {
        let pictureUploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(pictureUploadResponse);      
        let geoJsonMarkerData = this.generateGeoJson(mapId, markerData, coords, undefined, pictureUploadResponse._id);
        return this.sendMarker(geoJsonMarkerData);
      });
    } else if (audioRecordingName && pictureUri){
      console.log('audio and picture');
      let audioUploadResponse;
      return this.uploadFile(this.rootPath, audioRecordingName, 'audio/mp3', audioDuration).then((response:string) => {
        audioUploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(audioUploadResponse);        
        let fileName = pictureUri.substring(pictureUri.lastIndexOf('/') + 1);
        if (isPictureFromGallery){
          fileName = fileName.substring(0, fileName.lastIndexOf('?'));
        };
        return this.uploadFile(pictureUri,  fileName, 'image/jpeg', undefined).then((response:string) => {
          let pictureUploadResponse = JSON.parse(response);
          //moves audio and picture to right folder only with both uploads are ok
          this.fileProvider.moveUploadedFileToCache(pictureUploadResponse);
          let geoJsonMarkerData = this.generateGeoJson(mapId, markerData, coords, audioUploadResponse._id, pictureUploadResponse._id);
          return this.sendMarker(geoJsonMarkerData);
        });
      });
    } else {
      console.log('no audio and no picture');
      let geoJsonMarkerData = this.generateGeoJson(mapId, markerData, coords, undefined, undefined);
      return this.sendMarker(geoJsonMarkerData);
    }
  }

  retrieveAudioContent(audioId){
    return this.fileProvider.retrieveAudioFileContent(audioId).then(fileContents => {
      console.log("obtained data from local");
      return fileContents;
    }).catch((fileError) => {
      console.log("data not found locally, obtaining from server");
      return this.http.get(this.urlProvider.getFileMetaUrl(audioId))
                      .map(response => {
                        console.log(response.json())
                        let fileDetails = response.json();
                        let ft = this.fileTransfer.create();
                        // console.log(this.serverUrl + this.userData.id + '/files/' + audioId + '?token=' + this.userData.token)
                        // console.log(this.file.externalRootDirectory + fileDetails._id + '.mp3')
                        return ft.download(this.urlProvider.getFileDownloadUrl(audioId), this.file.externalRootDirectory + fileDetails._id + '.mp3').then((entry) => {
                          fileDetails.isDownloaded = true;
                          return fileDetails;
                        }, (error) => {
                          throw new Error(error);                          
                        });
                      }).catch(error => {
                        throw new Error(error);
                      }).toPromise()
    });
  }

  retrievePictureContent(pictureId){
    return this.fileProvider.retrievePictureFileContent(pictureId).then(fileContents => {
      console.log("obtained data from local");
      return fileContents;
    }).catch((fileError) => {
      console.log("data not found locally, obtaining from server");
      return this.http.get(this.urlProvider.getFileMetaUrl(pictureId))
                      .map(response => {
                        console.log(response.json())
                        let fileDetails = response.json();
                        let ft = this.fileTransfer.create();
                        // console.log(this.serverUrl + this.userData.id + '/files/' + audioId + '?token=' + this.userData.token)
                        // console.log(this.file.externalRootDirectory + fileDetails._id + '.mp3')
                        return ft.download(this.urlProvider.getFileDownloadUrl(pictureId), this.file.externalCacheDirectory + fileDetails._id + '.jpg').then((entry) => {
                          fileDetails.isDownloaded = true;
                          return fileDetails;
                        }, (e) => {
                          throw new Error(e);                          
                        });
                      }).catch(e => {
                        throw new Error(e);
                      }).toPromise()
    });
  }

  generateGeoJson(mapId, markerData, coords, voiceDescriptionId, pictureId):any{
    let geoJsonObject = {
      type: 'Point',
      properties:{
        name: markerData.name,
        textualDescription:markerData.textualDescription,
        voiceDescriptionId:voiceDescriptionId,
        pictureId:pictureId,
        mapId:mapId,
      },
      geometry:{
        coordinates:[coords.lat, coords.lng]
      }
    };
    console.log('prepared geoJSON object: ', geoJsonObject);
    return geoJsonObject;
  }

  updateMarker(previousMarkerData, newMarkerData, currentAudioName, audioDuration, isAudioRecorded){
    let textualChanges:boolean = false;
    let audioChanges:boolean = false;
    if (previousMarkerData.name !== newMarkerData.name){
      console.log('name changed');
      textualChanges = true;
    }
    if (!isAudioRecorded){
      if (previousMarkerData.textualDescription || newMarkerData.textualDescription){
        if (previousMarkerData.textualDescription !== newMarkerData.textualDescription){
          console.log('textual description changed');
          textualChanges = true;
        }
      } if (previousMarkerData.voiceDescriptionId){
        console.log('previous voice description removed'); //remover antiga 
        textualChanges = true;
      }
    } else {
      if (previousMarkerData.voiceDescriptionId){
        console.log('voice description changed to another voice description'); //remover antiga
        audioChanges = true;
      } if (previousMarkerData.textualDescription){
        console.log('textual description changed to voice description');
        audioChanges = true;
      } else {
        console.log('added voice description');
        audioChanges = true;
      }
    }
    if (audioChanges){ //send new audio
      console.log('audio changes');
      return this.uploadFile(this.rootPath, currentAudioName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(uploadResponse);
        newMarkerData._id = previousMarkerData._id;
        newMarkerData.previousVoiceDescriptionId = previousMarkerData.voiceDescriptionId;
        newMarkerData.voiceDescriptionId = uploadResponse._id;
        console.log("data sent: ", newMarkerData);
        return this.sendMarker(newMarkerData).then((response) => {
          if (previousMarkerData.voiceDescriptionId){
            this.fileProvider.removeFileFromCache('audio', previousMarkerData.voiceDescriptionId);
          };
          return response;
        }).catch((e) => {
          throw new Error(e);
        });
      });
    } else if (textualChanges){
      console.log('textualChanges');
      newMarkerData._id = previousMarkerData._id;
      newMarkerData.previousVoiceDescriptionId = previousMarkerData.voiceDescriptionId;
      console.log("data sent: ", newMarkerData);
      return this.sendMarker(newMarkerData).then((response) => {
        if (previousMarkerData.voiceDescriptionId && !isAudioRecorded){
          this.fileProvider.removeFileFromCache('audio', previousMarkerData.voiceDescriptionId);
        };
        return response;
      }).catch((e) => {
        throw new Error(e);
      });
    } else {
      console.log('no changes');
      return Promise.resolve("noChanges");
    }
  };

  removeMarker(markerData){
    let markerRemovalUrl = this.serverUrl + this.userData.id + '/markers/' + '?token=' + this.userData.token;
    let requestOptions = new RequestOptions({ body:markerData });
    return this.http.delete(markerRemovalUrl, requestOptions).timeout(5000).map((response:Response) => {
      return response.json();
      // return this.fileProvider.removeMap(mapData);
    }).catch((error:Response) => {
      return Observable.throw(error);
    }).toPromise();
  }

  sendMarker(markerData){
    console.log('sending marker data: ', markerData);
    console.log(this.markerManagementUrl)
    return this.http.post(this.markerManagementUrl, markerData).timeout(10000).map((response:Response) => {
      console.log('response from server: ', response.json());
      if (markerData.previousVoiceDescription){
        this.fileProvider.removeFileFromCache('audio', markerData.previousVoiceDescription);
      }
      return response.json();
    }).catch((error:Response) => {
      return Observable.throw(error);
    }).toPromise();
  };

  uploadFile(filePath:string, fileName:string, mimeType:string, audioDuration){
    console.log('uploading ' + fileName + ' (located at) ' + filePath + ' with mimeType ' + mimeType + ' and audioDuration ' + audioDuration);
    let ft:FileTransferObject = this.fileTransfer.create();
    let options:FileUploadOptions;
    if (mimeType == 'audio/mp3'){
      options = { fileName:fileName + '-' + audioDuration, mimeType:mimeType };
    } else if (mimeType == 'image/jpeg'){
      options = { fileName:fileName, mimeType:mimeType };
      filePath = filePath.substring(0,(filePath.lastIndexOf('/'))) + '/';
    }
    console.log('upload parameters: ', filePath + fileName, this.uploadUrl, options);
    return ft.upload(filePath + fileName, this.uploadUrl, options).then((fileUploadResult) => {
      return fileUploadResult.response;
    }, 
    (error) => {
      //lidar com possíveis erros de upload aqui
      return Observable.throw(error);
    });
  }
}
