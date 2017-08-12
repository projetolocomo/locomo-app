import { Injectable, Component } from '@angular/core';
import { File } from '@ionic-native/file';

@Injectable()
export class FileProvider {
  constructor(private file:File){}

  public dataDirectory = this.file.externalDataDirectory;
  public rootDirectory = this.file.externalRootDirectory;
  public fileProvider = this;
  
  prepareNeededFolders(){
    console.log('Preparing folders');
    this.file.checkDir(this.dataDirectory, 'audio').catch(err => this.file.createDir(this.dataDirectory, 'audio', false));
    this.file.checkDir(this.dataDirectory, 'maps').catch(err => this.file.createDir(this.dataDirectory, 'maps', false));
    this.file.checkDir(this.dataDirectory, 'pictures').catch(err => this.file.createDir(this.dataDirectory, 'pictures', false));
  }

  moveAudioToCacheAndRename(audioRecordingName, audioId){
    console.log('moving ' + audioRecordingName + ' from ' + this.rootDirectory + ' to ' + this.dataDirectory + '/audio and renaming to ' + audioId + '.mp3' );
    return this.file.moveFile(this.rootDirectory, audioRecordingName, this.dataDirectory + 'audio', audioId + '.mp3');
  }

  removeTempRecording(recordingName:string){
    console.log('removing ' + this.rootDirectory + recordingName);
    return this.file.removeFile(this.rootDirectory, recordingName);
  }

  removeFileFromData(folder:string, filename:string){
    let extension:string;
    if (folder == 'audio'){
      extension = '.mp3';
    }; 
    console.log('removing ' + filename + extension + ' and ' + filename + '.json from ' + this.dataDirectory);
    return this.file.removeFile(this.dataDirectory + folder, filename + extension).then(() => {
      return this.file.removeFile(this.dataDirectory + folder, filename + '.json');
    });
  }

  retrieveLocalMaps(){
    let localMaps = [];
    console.log(this.file.listDir(this.dataDirectory, 'maps'))
    return this.file.listDir(this.dataDirectory, 'maps').then((fileEntries) => {
      for (let fileEntry in fileEntries){
        this.file.readAsText(this.dataDirectory + 'maps', fileEntries[fileEntry].name).then((contents) => {
          localMaps.push(JSON.parse(contents));
        })
      }
      return localMaps;
    });
  }

  retrieveFileContent(path, fileId){
    return this.file.readAsText(this.dataDirectory + path, fileId + '.json').then((fileContents) => {
      return JSON.parse(fileContents);
    });
  }

  //if file exists, it will be replaced!
  saveObjectToFile(objectData, folder){
    console.log('writing ' + objectData._id + ' to ' + folder);
    return this.file.writeFile(this.dataDirectory + folder, objectData._id + '.json', JSON.stringify(objectData), {append:false, replace:true});
  }

  copyAudioToRoot(filename){
    console.log('copying ' + filename + ' from ' + this.dataDirectory + ' to ' + this.rootDirectory);
    return this.file.copyFile(this.dataDirectory + 'audio', filename, this.rootDirectory, filename);
  }

  removeMap(mapData){
    console.log('removing map data...')
    return this.file.removeFile(this.dataDirectory + 'maps', mapData._id + '.json').then(() => {
      if (mapData.voiceDescription){
        return this.fileProvider.removeFileFromData('audio', mapData.voiceDescription);
      }
    });
  }
}