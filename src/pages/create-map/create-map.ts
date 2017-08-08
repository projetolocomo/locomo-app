import { Component, ViewChild} from '@angular/core';
import { NavController, AlertController, Platform, Navbar } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { Media, MediaObject } from '@ionic-native/media';
import { Diagnostic } from '@ionic-native/diagnostic';

import { PermissionProvider } from '../../providers/permission.provider';
import { FileProvider } from '../../providers/file.provider';

import { MapMainPage } from '../map-main/map-main';

@Component({
  selector: 'page-create-map',
  templateUrl: 'create-map.html'
})

export class CreateMapPage {

  @ViewChild(Navbar) navbar:Navbar;

  constructor(private navCtrl:NavController,
              private alertCtrl:AlertController,
              private fb:FormBuilder,
              private media:Media,
              private platform:Platform,
              private permissionProvider:PermissionProvider,
              private fileProvider:FileProvider,
              private diagnostic:Diagnostic){}

  ionViewDidLoad():void{
    this.navbar.backButtonClick = (e:UIEvent)=>{
      this.confirmExit();
    }
    this.platform.registerBackButtonAction((e:UIEvent) => {
      this.confirmExit();
    });
  }

  newMapForm = this.fb.group({
    name: ['', Validators.required],
    textualDescription: ['']
  });

  textualDescriptionInitiated():boolean{
    if (this.newMapForm.controls['textualDescription'].value.length == 0){
      return false;
    } else {
      return true;
    }
  }

  private recordingAudio:boolean = false;
  private isAudioRecorded:boolean = false;
  private timer:any = TimerObservable.create(0, 1000);
  private secondsElapsed:number;
  private timerSubscription:Subscription;
  private mapAudioDescription:MediaObject;
  private currentAudioName:string;
  private isPlayingAudio:boolean = false;
  private audioLength:number;
  private mapFormSubmitted:boolean = false;

  startRecording():void{
    let success = (authorized) => {
      if (authorized){
        try {
          if (!this.textualDescriptionInitiated()){
            this.timerSubscription = this.timer.subscribe(timeCount => {
              this.secondsElapsed = timeCount;
            });
            this.recordingAudio = true;
            this.currentAudioName = this.generateAudioName() + '.mp3';
            this.mapAudioDescription = this.media.create(this.currentAudioName);
            this.mapAudioDescription.startRecord();
            setTimeout(() => {
              this.stopRecording();
            }, 20000);
          }
        } 
        catch(e){
          this.showAlert("Erro", "Não foi possível iniciar a gravação.");
        }
      } else {
        this.permissionProvider.requestMicrophoneAndFileAuthorization();
      }
    };
    let error = (e) => {
      this.showAlert("Erro", "A versão do sistema instalado em seu dispositivo não dá suporte ao método de gravação de áudio utilizado neste aplicativo. Utilize a descrição escrita.")
      console.error(e);
    }
    this.diagnostic.isMicrophoneAuthorized().then(success).catch(error);
  }

  stopRecording():void{
    if (this.recordingAudio){
      this.recordingAudio = false;
      this.isAudioRecorded = true;
      this.mapAudioDescription.stopRecord();
      this.timerSubscription.unsubscribe();
      this.audioLength = this.secondsElapsed;
      this.secondsElapsed = 0;
    }
  }

  removeRecording():void{
    this.recordingAudio = false;
    this.isAudioRecorded = false;
    this.fileProvider.removeTempRecording(this.currentAudioName);
    this.mapAudioDescription.release();
  }

  generateAudioName():any{
    return Date.now();
  }

  playRecord():void{
    this.isPlayingAudio = true;
    this.timerSubscription = this.timer.subscribe(timeCount => {
      this.secondsElapsed = timeCount;
    });
    this.mapAudioDescription.play();
    setTimeout(() => {
      this.isPlayingAudio = false;
      this.timerSubscription.unsubscribe();
    }, (this.audioLength + 1) * 1000);
  }

  stopPlayingRecord():void{
    this.isPlayingAudio = false;
    this.mapAudioDescription.stop();
    this.timerSubscription.unsubscribe();
    this.secondsElapsed = 0;
  }

  createNewMap(){
    this.mapFormSubmitted = true;
    if (this.newMapForm.valid){
      if (this.isAudioRecorded){
        this.mapAudioDescription.release();
        this.fileProvider.moveAudioRecordingToCacheFolder(this.currentAudioName);
      }
      // this.fileProvider.
      // this.navCtrl.setRoot(MapMainPage);
    }
  }

  showAlert(errorTitle:string, errorMessage:string):void{
    let alert = this.alertCtrl.create({
      title: errorTitle,
      subTitle: errorMessage,
      buttons: ['Ok']
    });
    alert.present();
  }

  confirmExit():void{
    if (this.navCtrl.getActive().name == "CreateMapPage" && (this.isAudioRecorded || this.newMapForm.controls['name'].value.length > 0 || this.newMapForm.controls['textualDescription'].value.length > 0)){
      let confirm = this.alertCtrl.create({
        message: "Deseja sair sem salvar?",
        buttons: [
          {
            text: 'Sair',
            handler: () => {
              this.navCtrl.pop();       
            }
          },
          {
            text: 'Cancelar'
          }          
        ]
      });
      confirm.present();
    } else if (this.navCtrl.getActive().name !== "HomePage"){
      this.navCtrl.pop();
    }
  }
}
