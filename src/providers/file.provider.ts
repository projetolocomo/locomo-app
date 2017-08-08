import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';

@Injectable()
export class FileProvider {
  constructor(private file:File){}

  prepareNeededFolders(){
    function success(){}
    function error(e){
      console.log(e)
    }
    // this.file.checkDir(this.file.externalCacheDirectory, "audio").then(success, error);
    this.file.createDir(this.file.externalCacheDirectory, "audio", false).then(success, error)
    this.file.createDir(this.file.externalCacheDirectory, "maps", false).then(success, error)
    this.file.createDir(this.file.externalCacheDirectory, "pictures", false).then(success, error)
  }

  moveAudioRecordingToCacheFolder(recordingName:string):void{
    this.file.moveFile(this.file.externalRootDirectory, recordingName, this.file.externalCacheDirectory + '/audio', recordingName);
  }

  removeTempRecording(recordingName:string){
    this.file.removeFile(this.file.externalRootDirectory, recordingName);
  }
}