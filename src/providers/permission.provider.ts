import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';

@Injectable()
export class PermissionProvider {
  constructor(private alertCtrl:AlertController,
              private diagnostic:Diagnostic){}

  requestMicrophoneAndFileAuthorization():any{
    let confirm = this.alertCtrl.create({
      message: "Para gravar notas de voz, precisamos de permissão para usar o microfone e acessar o sistema de arquivos. Conceda-as a seguir.",
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.diagnostic.requestRuntimePermissions([this.diagnostic.permission.RECORD_AUDIO, this.diagnostic.permission.READ_EXTERNAL_STORAGE, this.diagnostic.permission.WRITE_EXTERNAL_STORAGE])          
          }
        }
      ]
    });
    confirm.present();
  };

  // requestCameraPermission():any{
  //   this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA).then(
  //     success => { return true },
  //     err => { return false }
  //   );
  // };

  // requestFineLocationPermission():any{
  //   this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
  //     success => { return true },
  //     err => { return false }
  //   );
  // };

}