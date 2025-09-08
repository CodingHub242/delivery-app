import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpUtilsService {
  
  getHeaders(token: string | null): HttpHeaders {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getHeadersWithContentType(token: string | null, contentType: string = 'application/json'): HttpHeaders {
    let headers = this.getHeaders(token);
    headers = headers.set('Content-Type', contentType);
    return headers;
  }
}
