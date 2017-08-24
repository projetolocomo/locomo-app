import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs';
import { File } from '@ionic-native/file';
import { FileProvider } from './file.provider';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import 'rxjs/add/observable/fromPromise';

@Injectable()
export class MarkerProvider {
  constructor(public http:Http,
              public fileProvider:FileProvider,
              public platform:Platform,
              public fileTransfer:FileTransfer,
              public file:File){
    this.buildUrls();
  }

  private serverUrl:string = 'http://192.168.1.58:3000/api/';
  private userData:any = {id:null, token:null};
  private mapManagementUrl:string;
  private uploadUrl:string;
  private markerManagementUrl:string;
//   private downloadUrl = this.serverUrl + this.userData.id + '/files/598b65362f55060fa0518a49?token=' + this.userData.token
  private rootPath:string = this.file.externalRootDirectory;

  buildUrls(){
    if (localStorage.getItem('authData')){
      console.log('logged, building urls...');
      this.userData = JSON.parse(localStorage.getItem('authData'));
      this.mapManagementUrl = this.serverUrl + this.userData.id + '/maps?token=' + this.userData.token;
      this.markerManagementUrl = this.serverUrl + this.userData.id + '/markers?token=' + this.userData.token;
      this.uploadUrl = this.serverUrl + this.userData.id + '/upload?token=' + this.userData.token;
    } else {
      console.log('not logged yet');
    }
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
  //     return this.http.get(this.serverUrl + this.userData.id + '/files/' + audioId + '/details', {params:{'token':this.userData.token}})
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

  newMarker(markerData, audioRecordingName, audioDuration, pictureUri){
    if (audioRecordingName && !pictureUri){
      console.log('only audio');
      return this.uploadFile(this.rootPath, audioRecordingName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(uploadResponse);
        markerData.voiceDescriptionId = uploadResponse._id;
        return this.sendMarker(markerData);
      });
    } else if (!audioRecordingName && pictureUri){
      console.log('only picture');
      let fileName = pictureUri.substring(pictureUri.lastIndexOf('/') + 1);
      return this.uploadFile(pictureUri,  fileName, 'image/jpeg', null).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(uploadResponse);
        markerData.pictureId = uploadResponse._id;
        return this.sendMarker(markerData);
      });
    } else {
      console.log('audio and picture');
      return this.uploadFile(this.rootPath, audioRecordingName, 'audio/mp3', audioDuration).then((response:string) => {
        let uploadResponse = JSON.parse(response);
        this.fileProvider.moveUploadedFileToCache(uploadResponse);
        markerData.voiceDescriptionId = uploadResponse._id;
        let fileName = pictureUri.substring(0, pictureUri.lastIndexOf('/'));
        return this.uploadFile(pictureUri,  fileName, 'image/jpeg', null).then((response:string) => {
          let uploadResponse = JSON.parse(response);
          this.fileProvider.moveUploadedFileToCache(uploadResponse);
          markerData.pictureId = uploadResponse._id;
          return this.sendMarker(markerData);
        });
      });
    }
  };

  // updateMap(previousMapData, newMapData, currentAudioName, audioDuration, isAudioRecorded){
  //   let textualChanges:boolean = false;
  //   let audioChanges:boolean = false;
  //   if (previousMapData.name !== newMapData.name){
  //     console.log('name changed');
  //     textualChanges = true;
  //   }
  //   if (!isAudioRecorded){
  //     if (previousMapData.textualDescription || newMapData.textualDescription){
  //       if (previousMapData.textualDescription !== newMapData.textualDescription){
  //         console.log('textual description changed');
  //         textualChanges = true;
  //       }
  //     } if (previousMapData.voiceDescription){
  //       console.log('previous voice description removed'); //remover antiga 
  //       textualChanges = true;
  //     }
  //   } else {
  //     if (previousMapData.voiceDescription){
  //       console.log('voice description changed to another voice description'); //remover antiga
  //       audioChanges = true;
  //     } if (previousMapData.textualDescription){
  //       console.log('textual description changed to voice description');
  //       audioChanges = true;
  //     } else {
  //       console.log('added voice description');
  //       audioChanges = true;
  //     }
  //   }
  //   if (audioChanges){ //send new audio
  //     console.log('audio changes');
  //     return this.uploadFile(this.rootPath, currentAudioName, 'audio/mp3', audioDuration).then((response:string) => {
  //       let uploadResponse = JSON.parse(response);
  //       this.fileProvider.moveUploadedFileToCache(uploadResponse);
  //       newMapData._id = previousMapData._id;
  //       newMapData.previousVoiceDescription = previousMapData.voiceDescription;
  //       newMapData.voiceDescription = uploadResponse._id;
  //       console.log("data sent: ", newMapData);
  //       return this.sendMap(newMapData).then((response) => {
  //         if (previousMapData.voiceDescription){
  //           this.fileProvider.removeFileFromCache('audio', previousMapData.voiceDescription);
  //         };
  //         return response;
  //       }).catch((e) => {
  //         throw new Error(e);
  //       });
  //     });
  //   } else if (textualChanges){
  //     console.log('textualChanges');
  //     newMapData._id = previousMapData._id;
  //     newMapData.previousVoiceDescription = previousMapData.voiceDescription;
  //     console.log("data sent: ", newMapData);
  //     return this.sendMap(newMapData).then((response) => {
  //       if (previousMapData.voiceDescription && !isAudioRecorded){
  //         this.fileProvider.removeFileFromCache('audio', previousMapData.voiceDescription);
  //       };
  //       return response;
  //     }).catch((e) => {
  //       throw new Error(e);
  //     });
  //   } else {
  //     console.log('no changes');
  //     return Promise.resolve("noChanges");
  //   }
  // };

  // removeMap(mapData){
  //   let mapRemovalUrl = this.serverUrl + this.userData.id + '/maps/' + '?token=' + this.userData.token;
  //   let requestOptions = new RequestOptions({ body:mapData });
  //   return this.http.delete(mapRemovalUrl, requestOptions).map((response:Response) => {
  //     return response.json();
  //     // return this.fileProvider.removeMap(mapData);
  //   }).catch((error:Response) => {
  //     return Observable.throw(error);
  //   }).toPromise();
  // }

  sendMarker(markerData){
    return this.http.post(this.markerManagementUrl, markerData).map((response:Response) => {
      console.log('response from server: ', response.json());
      // if (markerData.previousVoiceDescription){
      //   this.fileProvider.removeFileFromCache('audio', markerData.previousVoiceDescription);
      // }
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
