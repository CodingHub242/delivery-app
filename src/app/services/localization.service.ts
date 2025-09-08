import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from USD
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private currentCurrency = new BehaviorSubject<CurrencyInfo>({
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 1
  });

  private currentLanguage = new BehaviorSubject<string>('en');
  private userCountry = new BehaviorSubject<string>('US');

  // Common currencies with symbols and names (rates will be fetched from API)
  private currencies: { [key: string]: CurrencyInfo } = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1 },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1 },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 1 },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
    NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1 },
    GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 1 },
    KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 1 },
    ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 1 }
  };

  // Country to currency mapping
  private countryCurrencyMap: { [key: string]: string } = {
    US: 'USD',
    GB: 'GBP',
    DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', // European countries using EUR
    CA: 'CAD',
    AU: 'AUD',
    JP: 'JPY',
    IN: 'INR',
    NG: 'NGN',
    GH: 'GHS',
    KE: 'KES',
    ZA: 'ZAR'
  };

  // Country to language mapping
  private countryLanguageMap: { [key: string]: string } = {
    US: 'en', GB: 'en', CA: 'en', AU: 'en',
    DE: 'de', AT: 'de', CH: 'de',
    FR: 'fr', BE: 'fr',
    ES: 'es', MX: 'es', AR: 'es',
    IT: 'it',
    JP: 'ja',
    IN: 'hi',
    NG: 'en', // Nigeria primarily uses English
    GH: 'en', // Ghana primarily uses English
    KE: 'en', // Kenya primarily uses English
    ZA: 'en'  // South Africa primarily uses English
  };

  constructor(private http: HttpClient) {
    this.loadCurrencyRates();
    this.detectUserLocation();
  }

  // Load currency rates from free API
  private loadCurrencyRates(): void {
    // Using ExchangeRate-API (free tier)
    this.http.get('https://open.er-api.com/v6/latest/USD')
      .subscribe({
        next: (data: any) => {
          if (data && data.rates) {
            this.updateCurrencyRates(data.rates);
          }
        },
        error: (error) => {
          console.error('Failed to fetch currency rates:', error);
          // Fallback to default rates if API fails
          this.setFallbackRates();
        }
      });
  }

  private updateCurrencyRates(rates: any): void {
    Object.keys(this.currencies).forEach(currencyCode => {
      if (rates[currencyCode]) {
        this.currencies[currencyCode].rate = rates[currencyCode];
      }
    });

    // Update current currency if it exists
    const currentCurrency = this.currentCurrency.value;
    if (this.currencies[currentCurrency.code]) {
      this.currentCurrency.next({
        ...currentCurrency,
        rate: this.currencies[currentCurrency.code].rate
      });
    }
  }

  private setFallbackRates(): void {
    // Fallback rates (approximate values)
    const fallbackRates: { [key: string]: number } = {
      USD: 1,
      EUR: 0.85,
      GBP: 0.75,
      CAD: 1.25,
      AUD: 1.35,
      JPY: 110,
      INR: 75,
      NGN: 410,
      GHS: 5.8,
      KES: 110,
      ZAR: 15
    };

    Object.keys(this.currencies).forEach(currencyCode => {
      if (fallbackRates[currencyCode]) {
        this.currencies[currencyCode].rate = fallbackRates[currencyCode];
      }
    });
  }

  // Detect user location using browser API or IP-based service
  private detectUserLocation(): void {
    // Try browser geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.getCountryFromCoordinates(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          // Fallback to IP-based detection
          this.detectCountryFromIP();
        }
      );
    } else {
      // Fallback to IP-based detection
      this.detectCountryFromIP();
    }
  }

  private getCountryFromCoordinates(lat: number, lng: number): void {
    // Use a free reverse geocoding service
    this.http.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
      .subscribe({
        next: (data: any) => {
          const countryCode = data.countryCode;
          if (countryCode) {
            this.setUserCountry(countryCode);
          }
        },
        error: () => {
          this.detectCountryFromIP();
        }
      });
  }

  private detectCountryFromIP(): void {
    // Use free IP-based country detection
    this.http.get('https://ipapi.co/json/')
      .subscribe({
        next: (data: any) => {
          const countryCode = data.country_code;
          if (countryCode) {
            this.setUserCountry(countryCode);
          }
        },
        error: () => {
          // Default to US if detection fails
          this.setUserCountry('US');
        }
      });
  }

  private setUserCountry(countryCode: string): void {
    this.userCountry.next(countryCode);
    
    // Set currency based on country
    const currencyCode = this.countryCurrencyMap[countryCode] || 'USD';
    this.setCurrency(currencyCode);
    
    // Set language based on country
    const languageCode = this.countryLanguageMap[countryCode] || 'en';
    this.setLanguage(languageCode);
  }

  // Currency methods
  setCurrency(currencyCode: string): void {
    const currency = this.currencies[currencyCode.toUpperCase()] || this.currencies['USD'];
    this.currentCurrency.next(currency);
    localStorage.setItem('preferredCurrency', currencyCode);
  }

  getCurrentCurrency(): Observable<CurrencyInfo> {
    return this.currentCurrency.asObservable();
  }

  getCurrentCurrencyValue(): CurrencyInfo {
    return this.currentCurrency.value;
  }

  getAllCurrencies(): CurrencyInfo[] {
    return Object.values(this.currencies);
  }

  convertPrice(priceUSD: number): number {
    const currency = this.currentCurrency.value;
    return priceUSD * currency.rate;
  }

  formatPrice(priceUSD: number): string {
    const convertedPrice = this.convertPrice(priceUSD);
    const currency = this.currentCurrency.value;
    
    // Basic formatting - can be enhanced with Intl.NumberFormat
    return `${currency.symbol}${convertedPrice.toFixed(2)}`;
  }

  // Language methods
  setLanguage(languageCode: string): void {
    this.currentLanguage.next(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  }

  getCurrentLanguage(): Observable<string> {
    return this.currentLanguage.asObservable();
  }

  getCurrentLanguageValue(): string {
    return this.currentLanguage.value;
  }

  // Country methods
  getUserCountry(): Observable<string> {
    return this.userCountry.asObservable();
  }

  getUserCountryValue(): string {
    return this.userCountry.value;
  }
}
