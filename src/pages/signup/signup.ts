import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserProvider } from '../../providers/user.provider';
import { PasswordValidation } from './password.validation';

import { HomePage } from '../home/home';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html'
})
export class SignupPage {

  constructor(public alertCtrl:AlertController,
              public loadingCtrl:LoadingController,
              public navCtrl:NavController,
              public navParams:NavParams,
              public fb:FormBuilder,
              private userProvider:UserProvider){}

  signupForm = this.fb.group({
    name: ['', Validators.compose([Validators.pattern('[A-Za-zÀ-ÿ].* [A-Za-zÀ-ÿ].*'), Validators.minLength(2), Validators.required])],
    age: ['', Validators.compose([Validators.maxLength(2), Validators.required])],
    school: ['', Validators.compose([Validators.pattern('[A-Za-zÀ-ÿ].*'), Validators.minLength(3), Validators.required])],
    email: ['', Validators.compose([Validators.email, Validators.required])],
    password: ['', Validators.compose([Validators.minLength(6), Validators.maxLength(20), Validators.required])],
    confirmPassword: ['', Validators.compose([Validators.required])]
  }, { 
    validator:PasswordValidation.MatchPassword
  });

  private signupFormSubmitted:boolean = false;

  createAccount():void{
    this.signupFormSubmitted = true;
    if (this.signupForm.valid) {
      let loading = this.loadingCtrl.create({
        content: 'Criando conta...'
      });
      loading.setShowBackdrop(false);
      loading.present();
      this.userProvider.createAccount(this.signupForm.value).subscribe((response) => {
        loading.dismiss();
        this.navCtrl.setRoot(HomePage);
      }, (e) => {
        loading.dismiss();
        if (e._body == "emailAlreadyTaken"){
          this.signupForm.controls['email'].setErrors({'alreadyTaken':true});
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
}
