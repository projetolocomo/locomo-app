import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams, Alert, AlertController, Platform, Navbar, Loading, LoadingController, Toast, ToastController } from 'ionic-angular';
import { Media, MediaObject } from '@ionic-native/media';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { PermissionProvider } from '../../providers/permission.provider';
import { FileProvider } from '../../providers/file.provider';
import { MapProvider } from '../../providers/map.provider';

import { MapMainPage } from '../map-main/map-main';

@Component({
  selector: 'page-manage-map',
  templateUrl: 'manage-map.html'
})

export class ManageMapPage {

  @ViewChild(Navbar) navbar:Navbar;

  constructor(private navCtrl:NavController,
              private navParams:NavParams,
              private alertCtrl:AlertController,
              private fb:FormBuilder,
              private media:Media,
              private platform:Platform,
              private diagnostic:Diagnostic,
              private loadingCtrl:LoadingController,
              private toastCtrl:ToastController,
              private permissionProvider:PermissionProvider,
              private fileProvider:FileProvider,
              private mapProvider:MapProvider){}

  ionViewDidEnter():void{
    if (sessionStorage.getItem('mapToEdit')){
      this.pageTitle = 'EDITAR INFORMAÇÕES DO MAPA';
      this.enterEditMode();
    } else {
      this.pageTitle = 'CRIAR NOVO MAPA';
    }
  }

  ionViewDidLoad():void{
    console.log('entering ManageMapPage');
    this.navbar.backButtonClick = (e:UIEvent) => {
      this.confirmExit();
    }
    this.platform.registerBackButtonAction((e:UIEvent) => {
      this.confirmExit();
    });
  }

  ionViewDidLeave():void{
    console.log('exiting ManageMapPage');
    this.alert = null;
    this.loading = null;
    this.toast = null;
    this.navbar.backButtonClick = (e:UIEvent) => {
      return true;
    };
    this.platform.registerBackButtonAction((e:UIEvent) => {
      return true;
    });
  }

  private pageTitle:string;
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
  private editMode:boolean = false;
  private mapToEdit:any;
  private previousRecordedAudioInfo:any;
  private isAudioLoaded:boolean = false;
  private alert:Alert;
  private loading:Loading;
  private toast:Toast;

  newMapForm = this.fb.group({
    name: ['', Validators.required],
    textualDescription: ['']
  });

  dismissLoading(){
    if(this.loading){
      this.loading.dismiss();
      this.loading = null;
    }
  }  

  textualDescriptionInitiated():boolean{
    if (this.newMapForm.controls['textualDescription'].value.length == 0){
      return false;
    } else {
      return true;
    }
  }

  enterEditMode():void{
    this.editMode = true;
    this.mapToEdit = JSON.parse(sessionStorage.getItem('mapToEdit'));
    sessionStorage.removeItem('mapToEdit');
    this.newMapForm.controls['name'].setValue(this.mapToEdit.name);
    this.newMapForm.controls['name'].markAsDirty();
    if (this.mapToEdit.textualDescription){
      this.newMapForm.controls['textualDescription'].setValue(this.mapToEdit.textualDescription);
    } else if (this.mapToEdit.voiceDescription){
      this.isAudioRecorded = true;
      this.secondsElapsed = 0;
      //it waits for a json containing the audio information and for the file in the root of the internal memory with its original filename (not the id)
      this.mapProvider.retrieveAudioContent(this.mapToEdit.voiceDescription).then(fileContent => {
        console.log('file content: ', fileContent)
        this.previousRecordedAudioInfo = fileContent;
        this.audioDuration = this.previousRecordedAudioInfo.audioDuration;
        this.mapAudioDescription = this.media.create(this.previousRecordedAudioInfo._id);
        this.isAudioLoaded = true;
      }).catch(error => {
        this.isAudioLoaded = true;
        console.log(error);
      });
    };
  }

  startRecording():void{
    let success = (authorized) => {
      if (authorized){
        try {
          if (!this.textualDescriptionInitiated()){
            this.timerSubscription = this.timer.subscribe(timeCount => {
              this.secondsElapsed = timeCount;
            });
            this.recordingAudio = true;
            this.isAudioLoaded = true;
            this.currentAudioName = this.generateAudioName() + '.mp3';
            this.mapAudioDescription = this.media.create(this.currentAudioName);
            this.mapAudioDescription.startRecord();
            setTimeout(() => {
              this.stopRecording();
            }, 20000);
          }
        } 
        catch(e){
          this.alert = this.alertCtrl.create({
            title: 'Erro',
            subTitle: 'Não foi possível iniciar a gravação.',
            buttons: ['Ok']
          });
          this.alert.present();
        }
      } else {
        this.permissionProvider.requestMicrophoneAndFileAuthorization();
      }
    };
    let error = (e) => {
      this.alert = this.alertCtrl.create({
        title: 'Erro',
        subTitle: 'O sistema instalado em seu dispositivo não dá suporte ao método de gravação de áudio utilizado neste aplicativo. Utilize a descrição escrita.',
        buttons: ['Ok']
      });
      this.alert.present();
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
    if (this.editMode && this.currentAudioName == ''){
      this.fileProvider.removeTempAudioRecording(this.previousRecordedAudioInfo._id + '.mp3');
    } else if (this.editMode){
      this.fileProvider.removeTempAudioRecording(this.previousRecordedAudioInfo._id + '.mp3');
    } else {
      this.fileProvider.removeTempAudioRecording(this.currentAudioName);
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

  manageMap(){
    this.mapFormSubmitted = true;
    if (!this.editMode){
      console.log("mapForm validation status: ", this.newMapForm.valid)
      if (this.newMapForm.valid){
        if (this.isAudioRecorded){
          this.mapAudioDescription.release();
        }
        this.loading = this.loadingCtrl.create({
          content: 'Criando mapa...'
        });
        this.loading.present().then(() => {
          this.mapProvider.newMap(this.newMapForm.value, this.currentAudioName, this.audioDuration).then((response) => {
            this.dismissLoading();
            sessionStorage.setItem('currentMapId', response._id);
            this.navCtrl.setRoot(MapMainPage);
          },
          (e) => {
            this.dismissLoading();
            this.alert = this.alertCtrl.create({
              title: 'Erro',
              subTitle: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
              buttons: ['Ok']
            });
            this.alert.present();
          });
        });
      } else {
        this.newMapForm.controls['name'].markAsPristine();
      }
    } else {
      if (this.newMapForm.valid){
        this.updateMap();
      } else {
        this.newMapForm.controls['name'].markAsPristine();
      };
    };
  }

  //IF FILE CONTAINS 'ISDOWNLOADED' PROPERTY, THEN REMOVE!!!
  //IF FILE CONTAINS PREVIOUS VOICEDESCRIPTION, THEN REMOVE!!!
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
      // this.navParams.get("parentPage").loadMaps();
      this.navCtrl.pop();
    }).catch((e) => {
      this.alert = this.alertCtrl.create({
        title: 'Erro',
        subTitle: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        buttons: ['Ok']
      });
      this.alert.present();
    })
  }

  removeMap(){
    this.alert = this.alertCtrl.create({
      message: 'Tem certeza de que deseja excluir este mapa? Todas as notas de áudio e fotos associadas a ele também serão removidas.',
      buttons: [
        {
          text: 'Excluir',
          handler: () => {
            this.loading = this.loadingCtrl.create({
              content: 'Excluindo mapa...'
            });
            this.loading.present().then(() => {
              this.mapProvider.removeMap(this.mapToEdit).then((response) => {
                console.log("response from mapProvider.removeMap(): ", response);
                this.dismissLoading();
                if (response.ok){
                  this.toast = this.toastCtrl.create({
                    message: 'Mapa removido',
                    duration: 3000
                  });
                  this.toast.present();
                  // this.navParams.get("parentPage").loadMaps();
                  this.navCtrl.pop();
                }
              });
            });
          }
        },
        {
          text: 'Cancelar'
        }          
      ]
    });
    this.alert.present();
  }

  confirmExit():void{
    if (!this.editMode){
      if (this.isAudioRecorded || this.newMapForm.controls['name'].value.length > 0 || this.newMapForm.controls['textualDescription'].value.length > 0){
        let alert = this.alertCtrl.create({
          message: 'Deseja sair sem salvar?',
          buttons: [
            {
              text: 'Sair',
              handler: () => {
                if (this.isAudioRecorded){
                  this.removeRecording();
                } else {
                  this.navCtrl.pop();
                }
              }
            },
            {
              text: 'Cancelar'
            }          
          ]
        });
        alert.present();
      } else {
        this.navCtrl.pop();
      }
    } else {
      if (this.currentAudioName || this.newMapForm.controls['name'].value !== this.mapToEdit.name || this.newMapForm.controls['textualDescription'].value !== this.mapToEdit.textualDescription){
        let alert = this.alertCtrl.create({
          message: 'Deseja sair sem salvar?',
          buttons: [
            {
              text: 'Sair',
              handler: () => {
                if (this.isAudioLoaded){
                  if (this.previousRecordedAudioInfo.isDownloaded){
                    this.fileProvider.moveUploadedFileToCache(this.previousRecordedAudioInfo);
                    this.navCtrl.pop();
                  }
                  // this.removeRecording();
                } else {
                  this.navCtrl.pop();
                }
              }
            },
            {
              text: 'Cancelar'
            }          
          ]
        });
        alert.present();
      } else {
        if (this.isAudioLoaded){
          if (this.previousRecordedAudioInfo.isDownloaded){
            this.fileProvider.moveUploadedFileToCache(this.previousRecordedAudioInfo);
            this.navCtrl.pop();
          } else {
            this.removeRecording();
            this.navCtrl.pop();
          }
        } if (this.isAudioRecorded){
          this.removeRecording();
        } else {
          this.navCtrl.pop();
        }
      }
    }
  }

}