import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StatusBar } from '@ionic-native/status-bar';

import { UserProvider } from '../../providers/user.provider';

import { HomePage } from '../home/home';
import { SignupPage } from '../signup/signup';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  constructor(private loadingCtrl:LoadingController,
              private navCtrl:NavController,
              private navParams:NavParams,
              private fb:FormBuilder,
              private userProvider:UserProvider,
              private statusBar:StatusBar){}

  loginForm = this.fb.group({
    email: ['', Validators.compose([Validators.email, Validators.required])],
    password: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(20), Validators.required])]
  });

  private loginFormSubmitted:boolean = false;

  login():void{
    this.loginFormSubmitted = true;
    if (this.loginForm.valid) {
      let loading = this.loadingCtrl.create({
        content: 'Entrando...'
      });
      loading.setShowBackdrop(false);
      loading.present();
      this.userProvider.login(this.loginForm.value).subscribe((response) => {
        loading.dismiss();
        this.navCtrl.setRoot(HomePage);
      },
      (e) => {
        loading.dismiss();
        if (e._body == "notFound"){
          this.loginForm.controls['email'].setErrors({'notFound':true});
        } else if (e._body == "passwordsMismatch"){
          this.loginForm.controls['password'].setErrors({'wrongPassword':true});
        }
      });
    }
  }

  createAccount():void{
    this.navCtrl.push(SignupPage);
  }
}
