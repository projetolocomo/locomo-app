import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams, Alert, AlertController, Platform, Navbar, Loading, LoadingController, Toast, ToastController } from 'ionic-angular';
import { Media, MediaObject } from '@ionic-native/media';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { PermissionProvider } from '../../providers/permission.provider';
import { FileProvider } from '../../providers/file.provider';
import { MarkerProvider } from '../../providers/marker.provider';

import { MapMainPage } from '../map-main/map-main';

@Component({
  selector: 'page-manage-marker',
  templateUrl: 'manage-marker.html'
})

export class ManageMarkerPage {

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
              private camera:Camera,
              private permissionProvider:PermissionProvider,
              private fileProvider:FileProvider,
              private markerProvider:MarkerProvider){}

  ionViewDidEnter():void{
    if (sessionStorage.getItem('mapToEdit')){
      this.pageTitle = 'EDITAR MARCAÇÃO';
      this.enterEditMode();
    } else {
      this.pageTitle = 'CRIAR NOVA MARCAÇÃO';
    }
  }

  ionViewDidLoad():void{
    console.log('entering ManageMarkerPage');
    this.navbar.backButtonClick = (e:UIEvent) => {
      this.confirmExit();
    }
    this.platform.registerBackButtonAction((e:UIEvent) => {
      this.confirmExit();
    });
  }

  ionViewDidLeave():void{
    console.log('exiting ManageMarkerPage');
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
  private markerAudioDescription:MediaObject;
  private currentAudioName:string;
  private isPlayingAudio:boolean = false;
  private audioDuration:number;
  private markerFormSubmitted:boolean = false;
  private editMode:boolean = false;
  private mapToEdit:any;
  private previousRecordedAudioInfo:any;
  private isAudioLoaded:boolean = false;
  private isPictureTook:boolean = false;
  private pictureUri:string = null;
  private alert:Alert;
  private loading:Loading;
  private toast:Toast;

  newMarkerForm = this.fb.group({
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
    if (this.newMarkerForm.controls['textualDescription'].value.length == 0){
      return false;
    } else {
      return true;
    }
  }

  enterEditMode():void{
    this.editMode = true;
    // this.mapToEdit = JSON.parse(sessionStorage.getItem('mapToEdit'));
    // sessionStorage.removeItem('mapToEdit');
    // this.newMarkerForm.controls['name'].setValue(this.mapToEdit.name);
    // this.newMarkerForm.controls['name'].markAsDirty();
    // if (this.mapToEdit.textualDescription){
    //   this.newMarkerForm.controls['textualDescription'].setValue(this.mapToEdit.textualDescription);
    // } else if (this.mapToEdit.voiceDescription){
    //   this.isAudioRecorded = true;
    //   this.secondsElapsed = 0;
    //   //it waits for a json containing the audio information and for the file in the root of the internal memory with its original filename (not the id)
    //   this.mapProvider.retrieveAudioContent(this.mapToEdit.voiceDescription).then(fileContent => {
    //     console.log('file content: ', fileContent)
    //     this.previousRecordedAudioInfo = fileContent;
    //     this.audioDuration = this.previousRecordedAudioInfo.audioDuration;
    //     this.mapAudioDescription = this.media.create(this.previousRecordedAudioInfo._id);
    //     this.isAudioLoaded = true;
    //   }).catch(error => {
    //     this.isAudioLoaded = true;
    //     console.log(error);
    //   });
    // };
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
            this.markerAudioDescription = this.media.create(this.currentAudioName);
            this.markerAudioDescription.startRecord();
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
      this.markerAudioDescription.stopRecord();
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
    this.markerAudioDescription.release();
  }

  generateAudioName():any{
    return Date.now();
  }

  playRecord():void{
    this.isPlayingAudio = true;
    this.timerSubscription = this.timer.subscribe(timeCount => {
      this.secondsElapsed = timeCount;
    });
    this.markerAudioDescription.play();
    setTimeout(() => {
      this.isPlayingAudio = false;
      this.timerSubscription.unsubscribe();
    }, (this.audioDuration + 1) * 1000);
  }

  stopPlayingRecord():void{
    this.isPlayingAudio = false;
    this.markerAudioDescription.stop();
    this.timerSubscription.unsubscribe();
    this.secondsElapsed = 0;
  }

  manageMarker(){
    this.markerFormSubmitted = true;
    if (!this.editMode){
      console.log('markerForm validation status: ', this.newMarkerForm.valid);
      if (this.newMarkerForm.valid){
        if (this.isAudioRecorded){
          this.markerAudioDescription.release();
        };
        this.loading = this.loadingCtrl.create({
          content: 'Criando marcação...'
        });
        this.loading.present().then(() => {
          this.markerProvider.newMarker(this.newMarkerForm.value, this.currentAudioName, this.audioDuration, this.pictureUri).then((response) => {
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
        this.newMarkerForm.controls['name'].markAsPristine();
      }
    } else {
      if (this.newMarkerForm.valid){
        this.updateMarker();
      } else {
        this.newMarkerForm.controls['name'].markAsPristine();
      };
    };
  }

  takePicture(){
    console.log('called TakePicture()');
    if (!this.isPictureTook && !this.pictureUri){
       const options:CameraOptions = {
        quality: 70,
        destinationType: this.camera.DestinationType.FILE_URI,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        targetHeight: 2048,
        targetWidth: 2580,
        correctOrientation: true
      }
      this.camera.getPicture(options).then((imageURI) => {
       console.log('image URI: ', imageURI);
       this.isPictureTook = true;
       this.pictureUri = imageURI;
       document.getElementById('thumbnail').setAttribute('src', imageURI);
      }, (err) => {
       // Handle error
       this.isPictureTook = false;
       console.log('error on camera :( ', err);
      });
    }
  }

  removePicture(){
    console.log('removing picture...');
    this.fileProvider.removeTempPicture(this.pictureUri);
    this.pictureUri = null;
    document.getElementById('thumbnail').removeAttribute('src');
    this.isPictureTook = false;
  }

  //IF FILE CONTAINS 'ISDOWNLOADED' PROPERTY, THEN REMOVE!!!
  //IF FILE CONTAINS PREVIOUS VOICEDESCRIPTION, THEN REMOVE!!!
  updateMarker(){
    let loading = this.loadingCtrl.create({
      content: 'Salvando mapa...'
    });
    loading.present();
    // this.markerProvider.updateMarker(this.mapToEdit, this.newMarkerForm.value, this.currentAudioName, this.audioDuration, this.isAudioRecorded).then((response) => {
    //   console.log('response from mapProvider.updateMap(): ', response)
    //   if (response == 'noChanges'){
    //     let toast = this.toastCtrl.create({
    //       message: 'Não houveram mudanças',
    //       duration: 3000
    //     });
    //     toast.present();
    //   } else {
    //     console.log('updating: ', response);
    //     let toast = this.toastCtrl.create({
    //       message: 'Marcação atualizada',
    //       duration: 3000
    //     });
    //     toast.present();
    //   }
    //   loading.dismiss();
    //   // this.navParams.get("parentPage").loadMaps();
    //   this.navCtrl.pop();
    // }).catch((e) => {
    //   this.alert = this.alertCtrl.create({
    //     title: 'Erro',
    //     subTitle: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    //     buttons: ['Ok']
    //   });
    //   this.alert.present();
    // })
  }

  removeMarker(){
    this.alert = this.alertCtrl.create({
      message: 'Tem certeza de que deseja excluir este mapa? Todas as notas de áudio e fotos associadas a ele também serão removidas.',
      buttons: [
        {
          text: 'Excluir',
          handler: () => {
            this.loading = this.loadingCtrl.create({
              content: 'Excluindo marcação...'
            });
            // this.loading.present().then(() => {
            //   this.markerProvider.removeMap(this.mapToEdit).then((response) => {
            //     console.log('response from mapProvider.removeMap(): ', response);
            //     this.dismissLoading();
            //     if (response.ok){
            //       this.toast = this.toastCtrl.create({
            //         message: 'Mapa removido',
            //         duration: 3000
            //       });
            //       this.toast.present();
            //       // this.navParams.get("parentPage").loadMaps();
            //       this.navCtrl.pop();
            //     }
            //   });
            // });
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
      if (this.isAudioRecorded || this.newMarkerForm.controls['name'].value.length > 0 || this.newMarkerForm.controls['textualDescription'].value.length > 0){
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
      if (this.currentAudioName || this.newMarkerForm.controls['name'].value !== this.mapToEdit.name || this.newMarkerForm.controls['textualDescription'].value !== this.mapToEdit.textualDescription){
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