import { Injectable } from '@angular/core';
import { Combobox } from '../interfaces/combobox';

@Injectable({
  providedIn: 'root'
})
export class ComboxboxService {

  constructor() { }

  public getMonths(): Combobox<string>[] {
    let months: Combobox<string>[] = [
      { value: 'Enero', label: 'Enero' },
      { value: 'Febrero', label: 'Febrero' },
      { value: 'Marzo', label: 'Marzo' },
      { value: 'Abril', label: 'Abril' },
      { value: 'Mayo', label: 'Mayo' },
      { value: 'Junio', label: 'Junio' },
      { value: 'Julio', label: 'Julio' },
      { value: 'Agosto', label: 'Agosto' },
      { value: 'Septiembre', label: 'Septiembre' },
      { value: 'Octubre', label: 'Octubre' },
      { value: 'Noviembre', label: 'Noviembre' },
      { value: 'Diciembre', label: 'Diciembre' },
    ];
    return months;
  }



}
