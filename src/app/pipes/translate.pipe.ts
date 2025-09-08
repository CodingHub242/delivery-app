import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  pure: false, // Make it impure to detect language changes
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: { [key: string]: string }): string {
    return this.translationService.translate(key, params);
  }
}
