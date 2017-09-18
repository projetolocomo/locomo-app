import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, NavParams, Alert, AlertController, Platform, Navbar, Loading, LoadingController, Toast, ToastController } from 'ionic-angular';
import { Media, MediaObject } from '@ionic-native/media';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
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
              private file:File,
              private camera:Camera,
              private permissionProvider:PermissionProvider,
              private fileProvider:FileProvider,
              private markerProvider:MarkerProvider){}

  ionViewDidEnter():void{
    if (this.markerProvider.getCurrentMarkerToEdit()){
      console.log('edit')
      this.pageTitle = 'EDITAR MARCAÇÃO';
      this.enterEditMode();
    } else {
      console.log('create')
      this.pageTitle = 'CRIAR NOVA MARCAÇÃO';
    }
    this.coords = this.markerProvider.getNewMarkerLocation();
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
  // private audioControl:any = {
  //   isRecordingAudio: false,
  //   isAudioRecorded: false,
  //   isPlayingAudio: false,
  //   isAudioLoaded: false,
  //   currentAudioName: null,
  //   audioDuration: null
  // }
  private recordingAudio:boolean = false;
  private isAudioRecorded:boolean = false;
  private timer:any = TimerObservable.create(0, 1000);
  private secondsElapsed:number;
  private timerSubscription:Subscription;
  private markerAudioDescription:MediaObject;
  private currentAudioName:string;
  private currentMapId:string;
  private isPlayingAudio:boolean = false;
  private audioDuration:number;
  private markerFormSubmitted:boolean = false;
  private editMode:boolean = false;
  private markerToEdit:any = this.markerProvider.getCurrentMarkerToEdit();
  private previousRecordedAudioInfo:any;
  private prevTookPictureInfo:any;
  private isAudioLoaded:boolean = false;
  private isPictureTook:boolean = false;
  private isPictureLoaded:boolean = false;
  private pictureUri:string = null;
  private coords:any;
  private isPictureFromGallery:boolean = false;
  private alert:Alert;
  private loading:Loading;
  private toast:Toast;

  newMarkerForm = this.fb.group({
    name: ['', Validators.required],
    textualDescription: [''],
    notFirstAttempt: [false]
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
    this.markerToEdit = this.markerProvider.getCurrentMarkerToEdit();
    console.log(this.markerToEdit.voiceDescriptionId, this.editMode, this.isAudioLoaded)
    let markerProperties = this.markerToEdit.properties;
    this.newMarkerForm.controls['name'].setValue(markerProperties.name);
    this.newMarkerForm.controls['name'].markAsDirty();
    console.log(markerProperties)
    if (markerProperties.textualDescription){
      if (markerProperties.textualDescription.length > 0){
        console.log('marker contains textualDescription');
        this.newMarkerForm.controls['textualDescription'].setValue(markerProperties.textualDescription);
      }
    } else if (markerProperties.voiceDescriptionId){
      console.log('marker contains voiceDescription');
      this.isAudioRecorded = true;
      this.secondsElapsed = 0;
      //it waits for a json containing the audio information and for the file in the root of the internal memory with its original filename (not the id)
      this.markerProvider.retrieveAudioContent(markerProperties.voiceDescriptionId).then(fileContent => {
        console.log('audio meta', fileContent);
        this.previousRecordedAudioInfo = fileContent;
        // console.log(this.previousRecordedAudioInfo);
        this.audioDuration = this.previousRecordedAudioInfo.audioDuration;
        this.markerAudioDescription = this.media.create(this.previousRecordedAudioInfo._id);
        this.isAudioLoaded = true;
      }).catch(e => {
        this.isAudioLoaded = true;
        console.log(e);
      });
    }
    if (markerProperties.pictureId){
      console.log('marker contains picture');
      this.isPictureTook = true;
      this.markerProvider.retrievePictureContent(markerProperties.pictureId).then(fileContent => {
        console.log('picture meta', fileContent);
        this.prevTookPictureInfo = fileContent;
        this.isPictureLoaded = true;
        this.pictureUri = this.file.externalCacheDirectory + fileContent._id + '.jpg';
        this.isPictureFromGallery = false;
        document.getElementById('thumbnail').setAttribute('src', this.pictureUri);
      }).catch(e => {
        this.isPictureLoaded = true;
        console.log(e);
      })
    }
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
    }
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
          this.markerProvider.newMarker(this.currentMapId, this.newMarkerForm.value, this.coords, this.currentAudioName, this.audioDuration, this.pictureUri, this.isPictureFromGallery).then((response) => {
            this.dismissLoading();
            let toast = this.toastCtrl.create({
              message: 'Marcador salvo',
              duration: 3000
            });
            toast.present();
            this.navCtrl.pop();
          },
          (e) => {
            console.log(e);
            this.newMarkerForm.controls['notFirstAttempt'].setValue(true);
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
       this.isPictureFromGallery = false;     
       document.getElementById('thumbnail').setAttribute('src', imageURI);
      }, (e) => {
       this.isPictureTook = false;
       console.log('error on camera :( ', e);
      });
    }
  }

  selectPictureFromGallery(){
    console.log('called selectPictureFromGallery()');
    if (!this.isPictureTook && !this.pictureUri){
      const options:CameraOptions = {
        sourceType: 0,
        quality: 70,
        destinationType: this.camera.DestinationType.FILE_URI,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        targetHeight: 2048,
        targetWidth: 2580,
        correctOrientation: true
      };
      this.camera.getPicture(options).then((imageURI) => {
        console.log('image URI: ', imageURI);
        this.isPictureTook = true;
        this.pictureUri = imageURI;
        this.isPictureFromGallery = true;
        document.getElementById('thumbnail').setAttribute('src', imageURI);
      }, (e) => {
        this.isPictureTook = false;
        console.log('error on selecting image', e);
      });
    }
  }

  removePicture(){
    console.log('removing picture...');
    if (this.isPictureFromGallery) {
      this.pictureUri = this.pictureUri.substring(0, this.pictureUri.lastIndexOf('?'));
    }
    this.fileProvider.removeTempPicture(this.pictureUri);
    this.pictureUri = null;
    document.getElementById('thumbnail').removeAttribute('src');
    this.isPictureTook = false;
    this.isPictureFromGallery = false;
  }

  //IF FILE CONTAINS 'ISDOWNLOADED' PROPERTY, THEN REMOVE!!!
  //IF FILE CONTAINS PREVIOUS VOICEDESCRIPTION, THEN REMOVE!!!
  updateMarker(){
    let loading = this.loadingCtrl.create({
      content: 'Salvando marcação...'
    });
    loading.present();
    this.markerProvider.updateMarker(this.markerToEdit, this.newMarkerForm.value, this.currentAudioName, this.audioDuration, this.isAudioRecorded).then((response) => {
      console.log('response from mapProvider.updateMap(): ', response)
      if (response == 'noChanges'){
        let toast = this.toastCtrl.create({
          message: 'Não houveram mudanças',
          duration: 3000
        });
        toast.present();
      } else {
        console.log('updating: ', response);
        let toast = this.toastCtrl.create({
          message: 'Marcação atualizada',
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

  removeMarker(){
    this.alert = this.alertCtrl.create({
      message: 'Tem certeza de que deseja excluir esta marcação?',
      buttons: [
        {
          text: 'Excluir',
          handler: () => {
            this.loading = this.loadingCtrl.create({
              content: 'Excluindo marcação...'
            });
            this.loading.present().then(() => {
              this.markerProvider.removeMarker(this.markerToEdit).then((response) => {
                console.log('response from mapProvider.removeMarker(): ', response);
                this.dismissLoading();
                if (response.ok){
                  this.toast = this.toastCtrl.create({
                    message: 'Marcação removida',
                    duration: 3000
                  });
                  this.toast.present();
                  // this.navParams.get("parentPage").loadMaps();
                  this.navCtrl.pop();
                }
              }).catch((e) => {
                this.dismissLoading();
                this.toast = this.toastCtrl.create({
                  message: 'Falha na solicitação. Tente novamente.',
                  duration: 4000
                });
                this.toast.present();
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
    // if (!this.editMode){
    //   if (this.isAudioRecorded || this.newMarkerForm.controls['name'].value.length > 0 || this.newMarkerForm.controls['textualDescription'].value.length > 0){
    //     let alert = this.alertCtrl.create({
    //       message: 'Deseja sair sem salvar?',
    //       buttons: [
    //         {
    //           text: 'Sair',
    //           handler: () => {
    //             if (this.isAudioRecorded){
    //               this.removeRecording();
    //             } else {
    //               this.navCtrl.pop();
    //             }
    //           }
    //         },
    //         {
    //           text: 'Cancelar'
    //         }          
    //       ]
    //     });
    //     alert.present();
    //   } else {
    //     this.navCtrl.pop();
    //   }
    // } else {
    //   //considerar mudança de foto
    //   if (this.currentAudioName || this.newMarkerForm.controls['name'].value !== this.markerToEdit.properties.name || this.newMarkerForm.controls['textualDescription'].value !== this.markerToEdit.properties.textualDescription){
    //     let alert = this.alertCtrl.create({
    //       message: 'Deseja sair sem salvar?',
    //       buttons: [
    //         {
    //           text: 'Sair',
    //           handler: () => {
    //             if (this.isAudioLoaded || this.isPictureTook){
    //               if (this.previousRecordedAudioInfo.isDownloaded){
    //                 this.fileProvider.moveUploadedFileToCache(this.previousRecordedAudioInfo);
    //                 this.navCtrl.pop();
    //               }
    //               if (this.prevTookPictureInfo.isDownloaded){
    //                 this.fileProvider.moveUploadedFileToCache(this.prevTookPictureInfo);
    //                 this.navCtrl.pop();
    //               }
    //               // this.removeRecording();
    //             } else {
    //               this.navCtrl.pop();
    //             }
    //           }
    //         },
    //         {
    //           text: 'Cancelar'
    //         }          
    //       ]
    //     });
    //     alert.present();
    //   } else {
    //     if (this.isAudioLoaded){
    //       if (this.previousRecordedAudioInfo.isDownloaded){
    //         this.fileProvider.moveUploadedFileToCache(this.previousRecordedAudioInfo);
    //         this.navCtrl.pop();
    //       } else {
    //         this.removeRecording();
    //         this.navCtrl.pop();
    //       }
    //     } else {
    //       this.removeRecording();
    //       this.navCtrl.pop();
    //     }
    //     if (this.isPictureTook){
    //       if (this.prevTookPictureInfo.isDownloaded){
    //         this.fileProvider.moveUploadedFileToCache(this.prevTookPictureInfo);
    //         this.navCtrl.pop();
    //       } else {
    //         this.removePicture();
    //         this.navCtrl.pop();
    //       }
    //     } else {
    //       this.removePicture();
    //       this.navCtrl.pop();
    //     }
    //   }
    // }
    this.navCtrl.pop();
  }

}