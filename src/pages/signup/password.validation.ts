import { AbstractControl } from '@angular/forms';

export class PasswordValidation {
    static MatchPassword(abstractControl:AbstractControl){
       let password = abstractControl.get('password').value; // to get value in input tag
       let confirmPassword = abstractControl.get('confirmPassword').value; // to get value in input tag
        if(password != confirmPassword) {
            abstractControl.get('confirmPassword').setErrors({'invalidInput':true})
        } else {
            return null;
        }
    }
}