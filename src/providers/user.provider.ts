import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class UserProvider {
  constructor(public http:Http){}

  private serverUrl:string = "http://192.168.1.58:3000/api/";

  login(loginData:any):any{
    return this.http.post(this.serverUrl + 'login', loginData).map((response:Response) => {
      this.saveAuthData(response.json());
      return true;
    }).catch((error:Response) => {
      return Observable.throw(error);
    });
  };

  createAccount(accountData:any):any{
    return this.http.post(this.serverUrl + 'signup', accountData).map((response:Response) => {
      this.saveAuthData(response.json());
      return true;
    }).catch((error:Response) => {
      return Observable.throw(error);
    });
  }

  saveAuthData(authData:any):void{
    localStorage.setItem("authData", JSON.stringify(authData));
  }
}