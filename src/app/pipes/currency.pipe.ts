import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizationService } from '../services/localization.service';

@Pipe({
  name: 'localCurrency',
  pure: false, // Make it impure to detect currency changes
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  private localizationService = inject(LocalizationService);

  transform(priceUSD: number): string {
    return this.localizationService.formatPrice(priceUSD);
  }
}
