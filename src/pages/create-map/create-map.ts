import { Component, ViewChild} from '@angular/core';
import { NavController, NavParams, AlertController, Platform, Navbar, LoadingController, ToastController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { Media, MediaObject } from '@ionic-native/media';
import { Diagnostic } from '@ionic-native/diagnostic';

import { PermissionProvider } from '../../providers/permission.provider';
import { FileProvider } from '../../providers/file.provider';
import { MapProvider } from '../../providers/map.provider';

import { MapMainPage } from '../map-main/map-main';

@Component({
  selector: 'page-create-map',
  templateUrl: 'create-map.html'
})

export class CreateMapPage {

  @ViewChild(Navbar) navbar:Navbar;

  constructor(public navCtrl:NavController,
              public navParams:NavParams,
              public alertCtrl:AlertController,
              public fb:FormBuilder,
              public media:Media,
              public platform:Platform,
              public diagnostic:Diagnostic,
              public loadingCtrl:LoadingController,
              public toastCtrl:ToastController,
              private permissionProvider:PermissionProvider,
              private fileProvider:FileProvider,
              private mapProvider:MapProvider){}

  ionViewDidEnter():void{
    if (sessionStorage.getItem('mapToEdit')){
      this.editMode = true;
      this.pageTitle = 'EDITAR INFORMAÇÕES DO MAPA';
      this.mapToEdit = JSON.parse(sessionStorage.getItem('mapToEdit'));
      sessionStorage.removeItem('mapToEdit');
      this.newMapForm.controls['name'].setValue(this.mapToEdit.name);
      this.newMapForm.controls['name'].markAsDirty();
      if (this.mapToEdit.textualDescription){
        this.newMapForm.controls['textualDescription'].setValue(this.mapToEdit.textualDescription);
      } else if (this.mapToEdit.voiceDescription){
        this.isAudioRecorded = true;
        this.secondsElapsed = 0;
        this.fileProvider.retrieveFileContent('audio', this.mapToEdit.voiceDescription).then((fileContent)=>{
          this.previousRecordedAudioInfo = fileContent;
          this.audioDuration = this.previousRecordedAudioInfo.audioDuration;
        });
        this.fileProvider.copyAudioToRoot(this.mapToEdit.voiceDescription + '.mp3').then(() => {
          this.mapAudioDescription = this.media.create(this.mapToEdit.voiceDescription + '.mp3');
        });
      }
    } else {
      this.pageTitle = 'CRIAR NOVO MAPA';
    }
  }

  ionViewDidLoad():void{
    // VER ESSA HISTÓRIA DOS BOTOES !!!
    // if (this.navCtrl.getActive().name == "CreateMapPage"){
    //   this.navbar.backButtonClick = (e:UIEvent)=>{
    //     this.confirmExit();
    //   }
    //   this.platform.registerBackButtonAction((e:UIEvent) => {
    //     this.confirmExit();
    //   });
    // } else {

    // }
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

  private pageTitle:string;
  private editMode:boolean = false;
  private mapToEdit:any;
  private recordingAudio:boolean = false;
  private isAudioRecorded:boolean = false;
  private timer:any = TimerObservable.create(0, 1000);
  private secondsElapsed:number;
  private timerSubscription:Subscription;
  private mapAudioDescription:MediaObject;
  private currentAudioName:string;
  private isPlayingAudio:boolean = false;
  private audioDuration:number;
  private mapFormSubmitted:boolean = false;
  private previousRecordedAudioInfo:any;

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
          this.showAlert('Erro', 'Não foi possível iniciar a gravação.');
        }
      } else {
        this.permissionProvider.requestMicrophoneAndFileAuthorization();
      }
    };
    let error = (e) => {
      this.showAlert('Erro', 'A versão do sistema instalado em seu dispositivo não dá suporte ao método de gravação de áudio utilizado neste aplicativo. Utilize a descrição escrita.')
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
      this.audioDuration = this.secondsElapsed;
      this.secondsElapsed = 0;
    }
  }

  removeRecording():void{
    this.recordingAudio = false;
    this.isAudioRecorded = false;
    if (this.editMode && !this.currentAudioName){
      this.fileProvider.removeTempRecording(this.previousRecordedAudioInfo._id + ".mp3");
    } else {
      this.fileProvider.removeTempRecording(this.currentAudioName);
    }
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
    }, (this.audioDuration + 1) * 1000);
  }

  stopPlayingRecord():void{
    this.isPlayingAudio = false;
    this.mapAudioDescription.stop();
    this.timerSubscription.unsubscribe();
    this.secondsElapsed = 0;
  }

  createNewMap(){
    this.mapFormSubmitted = true;
    if (!this.editMode){
      console.log(this.newMapForm.valid)
      if (this.newMapForm.valid){
        if (this.isAudioRecorded){
          this.mapAudioDescription.release();
        }
        let loading = this.loadingCtrl.create({
          content: 'Criando mapa...'
        });
        // loading.setShowBackdrop(false);
        loading.present();
        this.mapProvider.newMap(this.newMapForm.value, this.currentAudioName, this.audioDuration).then((response) => {
          loading.dismiss();
          sessionStorage.setItem('currentMapId', response._id);
          this.navCtrl.setRoot(MapMainPage);
        },
        (e) => {
          console.log(e);
        });
      }
    } else {
      this.updateMap();
    }
  }

  updateMap(){
    let loading = this.loadingCtrl.create({
      content: 'Salvando mapa...'
    });
    loading.present();
    this.mapProvider.updateMap(this.mapToEdit, this.newMapForm.value, this.currentAudioName, this.audioDuration, this.isAudioRecorded).then((response) => {
      console.log("response from mapProvider.updateMap(): ", response)
      if (response == "noChanges"){
        let toast = this.toastCtrl.create({
          message: 'Não houveram mudanças',
          duration: 3000
        });
        toast.present();
      } else {
        console.log("updating: ", response);
        let toast = this.toastCtrl.create({
          message: 'Mapa atualizado',
          duration: 3000
        });
        toast.present();
      }
      loading.dismiss();
      this.navParams.get("parentPage").loadMaps();
      this.navCtrl.pop();
    }).catch((e) => {
      console.log(e);
    })
  }

  removeMap(){
    let removalConfirm = this.alertCtrl.create({
      message: 'Tem certeza de que deseja excluir este mapa? Todas as notas de áudio e fotos associadas a ele também serão removidas.',
      buttons: [
        {
          text: 'Excluir',
          handler: () => {
            let loading = this.loadingCtrl.create({
              content: 'Excluindo mapa...'
            });
            loading.present();
            this.mapProvider.removeMap(this.mapToEdit).then((response) => {
              console.log("response from mapProvider.removeMap(): ", response);
              removalConfirm.dismiss();
              this.navParams.get("parentPage").loadMaps();
              this.navCtrl.pop();
            });
          }
        },
        {
          text: 'Cancelar'
        }          
      ]
    });
    removalConfirm.present();
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
    // if (this.navCtrl.getActive().name == "CreateMapPage" && (this.isAudioRecorded || this.newMapForm.controls['name'].value.length > 0 || this.newMapForm.controls['textualDescription'].value.length > 0)){
      let confirm = this.alertCtrl.create({
        message: 'Deseja sair sem salvar?',
        buttons: [
          {
            text: 'Sair',
            handler: () => {
              if (this.isAudioRecorded){
                this.removeRecording();
              }
              this.navCtrl.pop();
            }
          },
          {
            text: 'Cancelar'
          }          
        ]
      });
      confirm.present();
    } 
    // else if (this.navCtrl.getActive().name !== "HomePage"){
    //   this.navCtrl.pop();
    // }
  // }
}
