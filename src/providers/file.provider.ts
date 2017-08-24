import { Injectable, Component } from '@angular/core';
import { File } from '@ionic-native/file';

@Injectable()
export class FileProvider {
  constructor(private file:File){}

  public cacheDirectory = this.file.externalCacheDirectory;
  public rootDirectory = this.file.externalRootDirectory;
  // public fileProvider = this;
  
  checkCacheFolders():void{
    console.log('checking/creating cache folders');
    this.file.checkDir(this.cacheDirectory, 'audio').catch(err => {
      this.file.createDir(this.cacheDirectory, 'audio', false).then(() => {
        this.file.checkDir(this.cacheDirectory + 'audio', 'meta').catch(err => {
          this.file.createDir(this.cacheDirectory + 'audio', 'meta', false);
        });
      });
    });
    this.file.checkDir(this.cacheDirectory, 'pictures').catch(err => {
      this.file.createDir(this.cacheDirectory, 'pictures', false).then(() => {
        this.file.checkDir(this.cacheDirectory + 'pictures', 'meta').catch(err => {
          this.file.createDir(this.cacheDirectory + 'pictures', 'meta', false);
        });
      });
    });
  }

  moveUploadedFileToCache(uploadResponse):void{
    let fileId:string = uploadResponse._id;
    let filename:string = uploadResponse.filename;
    let contentType:string = uploadResponse.contentType;
    let audioDuration:number = uploadResponse.audioDuration;
    let metaFolder:string;
    if (contentType == 'audio/mp3'){
      metaFolder = 'audio/meta';
      if (uploadResponse.isDownloaded){
        delete uploadResponse.isDownloaded;
        console.log('moving ' + filename + ' from ' + this.rootDirectory + ' to ' + this.cacheDirectory + '/audio and renaming to ' + fileId + '.mp3' );
        this.file.moveFile(this.rootDirectory, fileId + '.mp3', this.cacheDirectory + 'audio', fileId + '.mp3');
      } else {
        console.log('moving recorded file ' + filename + ' from ' + this.rootDirectory + ' to ' + this.cacheDirectory + '/audio and renaming to ' + fileId + '.mp3' );
        this.file.moveFile(this.rootDirectory, filename, this.cacheDirectory + 'audio', fileId + '.mp3');
      }
      console.log('writing ' + uploadResponse._id + '.json to ' + metaFolder);
      this.file.writeFile(this.cacheDirectory + metaFolder, fileId + '.json', JSON.stringify(uploadResponse), {append:false, replace:true});
    } else if (contentType == 'image/jpeg'){
      metaFolder = 'pictures/meta';
      if (uploadResponse.isDownloaded){
        delete uploadResponse.isDownloaded;
        console.log('moving ' + filename + ' from ' + this.cacheDirectory + ' to ' + this.cacheDirectory + '/pictures and renaming to ' + fileId + '.jpg' );
        this.file.moveFile(this.cacheDirectory, filename + '.jpg', this.cacheDirectory + 'pictures', fileId + '.jpg');
      } else {
        console.log('moving recorded file ' + filename + ' from ' + this.cacheDirectory + ' to ' + this.cacheDirectory + '/pictures and renaming to ' + fileId + '.jpg' );
        this.file.moveFile(this.cacheDirectory, filename, this.cacheDirectory + 'pictures', fileId + '.jpg');
      }
      console.log('writing ' + uploadResponse._id + '.json to ' + metaFolder);
      this.file.writeFile(this.cacheDirectory + metaFolder, fileId + '.json', JSON.stringify(uploadResponse), {append:false, replace:true});
    }
    
  }

  removeFileFromCache(folder:string, fileId:string):void{
    let extension:string;
    if (folder == 'audio'){
      console.log('removing ' + fileId + '.mp3 from ' + this.cacheDirectory + 'audio');
      this.file.removeFile(this.cacheDirectory + 'audio', fileId + '.mp3').then(() => {
        console.log('removing' + fileId + '.json from ' + this.cacheDirectory + 'audio/meta');
        this.file.removeFile(this.cacheDirectory + 'audio/meta', fileId + '.json');
      });
    }; 
  }

  removeTempAudioRecording(recordingName:string):void{
    console.log('removing temp audio recording' + recordingName + ' from ' + this.rootDirectory);
    this.file.removeFile(this.rootDirectory, recordingName);
  }

  removeTempPicture(pictureUri:string):void{
    let fileName = pictureUri.substring(pictureUri.lastIndexOf('/') + 1);
    console.log('removing ' + fileName + ' from ' + this.cacheDirectory);
    this.file.removeFile(this.cacheDirectory, fileName);
  }

  // retrieveLocalMaps(){
  //   let localMaps = [];
  //   console.log(this.file.listDir(this.dataDirectory, 'maps'))
  //   return this.file.listDir(this.dataDirectory, 'maps').then((fileEntries) => {
  //     for (let fileEntry in fileEntries){
  //       this.file.readAsText(this.dataDirectory + 'maps', fileEntries[fileEntry].name).then((contents) => {
  //         localMaps.push(JSON.parse(contents));
  //       })
  //     }
  //     return localMaps;
  //   });
  // }

  //if file is found, it returns its json with info, copy the file to root and renames to its 'filename'
  retrieveAudioFileContent(fileId){
    console.log("checking " + this.cacheDirectory + 'audio/' + fileId + '.mp3 and json in audio/meta');
    return this.file.checkFile(this.cacheDirectory + 'audio/', fileId + '.mp3').then(audioCheckResult => {
      return this.file.checkFile(this.cacheDirectory + 'audio/meta/', fileId + '.json').then(metaCheckResult => {
        return this.file.readAsText(this.cacheDirectory + 'audio/meta/', fileId + '.json').then(fileContents => {
          let file = JSON.parse(fileContents);
          this.file.copyFile(this.cacheDirectory + 'audio/', fileId + '.mp3', this.rootDirectory, fileId + '.mp3');
          return file;
        });
      }).catch(error => {
        throw new Error(error);
      });
    }).catch(error => {
      throw new Error(error);
    });
  }

  // this.file.copyFile(this.cacheDirectory + 'audio/', fileId + '.mp3', this.rootDirectory, parsedFileContents.filename);

  //if file exists, it will be replaced!
  // saveObjectToFile(objectData, folder){
  //   console.log('writing ' + objectData._id + ' to ' + folder);
  //   return this.file.writeFile(this.dataDirectory + folder, objectData._id + '.json', JSON.stringify(objectData), {append:false, replace:true});
  // }

  // copyAudioToRoot(filename){
  //   console.log('copying ' + filename + ' from ' + this.dataDirectory + ' to ' + this.rootDirectory);
  //   return this.file.copyFile(this.dataDirectory + 'audio', filename, this.rootDirectory, filename);
  // }

  // removeMap(mapData){
  //   console.log('removing map data...')
  //   return this.file.removeFile(this.dataDirectory + 'maps', mapData._id + '.json').then(() => {
  //     if (mapData.voiceDescription){
  //       return this.fileProvider.removeFileFromData('audio', mapData.voiceDescription);
  //     }
  //   });
  // }
}