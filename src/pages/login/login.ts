import { Component } from '@angular/core';
import { AlertController,  LoadingController, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserProvider } from '../../providers/user.provider';
import { FileProvider } from '../../providers/file.provider';

import { HomePage } from '../home/home';
import { SignupPage } from '../signup/signup';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  constructor(public alertCtrl:AlertController,
              public loadingCtrl:LoadingController,
              public navCtrl:NavController,
              public navParams:NavParams,
              public fb:FormBuilder,
              private fileProvider:FileProvider,
              private userProvider:UserProvider){}

  loginForm = this.fb.group({
    email: ['', Validators.compose([Validators.email, Validators.required])],
    password: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(20), Validators.required])]
  });

  private loginFormSubmitted:boolean = false;

  login():void{
    this.loginFormSubmitted = true;
    if (this.loginForm.valid) {
      let loadingLogin = this.loadingCtrl.create({
        content: 'Entrando...'
      });
      loadingLogin.setShowBackdrop(false);
      loadingLogin.present();
      this.userProvider.login(this.loginForm.value).subscribe((response) => {
        loadingLogin.dismiss();
        this.fileProvider.checkCacheFolders();
        this.navCtrl.setRoot(HomePage);
      },
      (e) => {
        loadingLogin.dismiss();
        if (e._body == "notFound"){
          this.loginForm.controls['email'].setErrors({'notFound':true});
        } else if (e._body == "passwordsMismatch"){
          this.loginForm.controls['password'].setErrors({'wrongPassword':true});
        } else {
          let alert = this.alertCtrl.create({
            title: 'Erro',
            subTitle: 'Não foi possível conectar-se ao servidor. Verifique sua conexão e tente novamente.',
            buttons: ['Ok']
          });
          alert.present();
        }
      });
    }
  }

  createAccount():void{
    this.navCtrl.push(SignupPage);
  }
}
