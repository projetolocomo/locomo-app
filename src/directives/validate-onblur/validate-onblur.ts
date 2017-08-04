import { Directive } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[validate-onblur]',
  host: {
  	'(ionFocus)':'onFocus($event)',
  	'(ionBlur)':'onBlur($event)'
  }
})
export class ValidateOnBlurDirective {

  constructor(public formControl:NgControl) {
    // console.log('Hello ValidateOnblurDirective Directive');
  }

  onFocus($event){
    // this.formControl.control.markAsUntouched();
    this.formControl.control.clearValidators;
  }

  onBlur($event){
  	// this.formControl.control.markAsTouched();
    if (this.formControl.control.invalid){
      this.formControl.control.setErrors({'invalidInput':true});
    }
  }

}
