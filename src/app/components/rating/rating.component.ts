import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline } from 'ionicons/icons';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
  imports: [CommonModule, IonIcon],
  standalone: true
})
export class RatingComponent {
  @Input() rating: number = 0;
  @Input() maxRating: number = 5;
  @Input() readonly: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showValue: boolean = false;

  @Output() ratingChange = new EventEmitter<number>();

  constructor() {
    addIcons({ star, starOutline });
  }

  get stars(): number[] {
    return Array(this.maxRating).fill(0).map((_, i) => i + 1);
  }

  isStarFilled(starIndex: number): boolean {
    return starIndex <= this.rating;
  }

  onStarClick(starIndex: number): void {
    if (!this.readonly) {
      this.rating = starIndex;
      this.ratingChange.emit(this.rating);
    }
  }

  getStarIcon(starIndex: number): string {
    return this.isStarFilled(starIndex) ? 'star' : 'star-outline';
  }

  getStarColor(starIndex: number): string {
    return this.isStarFilled(starIndex) ? 'warning' : 'medium';
  }

  getSizeClass(): string {
    return `rating-${this.size}`;
  }
}
