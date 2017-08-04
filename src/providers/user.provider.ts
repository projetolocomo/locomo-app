import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { Headers } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class UserProvider {
	constructor(public http:Http){}

	private serverUrl:string = "http://localhost:3000/api";

	login(loginData){
		return this.http.post(this.serverUrl + '/login', loginData).map(
		(response: Response) => {
			// this.setLocalData(response.json());
			return response.json();
		}).catch(
		(error: Response) => {
			return Observable.throw(error);
		});
	};
}