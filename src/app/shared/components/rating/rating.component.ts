import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class RatingComponent implements OnInit {
  @Input() rating: number = 0; // Current rating value (0-5)
  @Input() maxRating: number = 5; // Maximum rating value
  @Input() readonly: boolean = false; // Whether the rating is read-only
  @Input() size: 'small' | 'medium' | 'large' = 'medium'; // Size of the stars
  @Input() showValue: boolean = true; // Whether to show the numeric value

  @Output() ratingChange = new EventEmitter<number>();

  stars: boolean[] = [];

  constructor() {
    addIcons({ star, starOutline });
  }

  ngOnInit() {
    this.updateStars();
  }

  ngOnChanges() {
    this.updateStars();
  }

  private updateStars() {
    this.stars = [];
    for (let i = 1; i <= this.maxRating; i++) {
      this.stars.push(i <= this.rating);
    }
  }

  onStarClick(index: number) {
    if (this.readonly) return;

    const newRating = index + 1;
    this.rating = newRating;
    this.updateStars();
    this.ratingChange.emit(newRating);
  }

  onStarHover(index: number) {
    if (this.readonly) return;

    // Temporarily show hover state
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i] = i <= index;
    }
  }

  onStarLeave() {
    if (this.readonly) return;

    // Reset to actual rating
    this.updateStars();
  }

  getStarIcon(index: number): string {
    return this.stars[index] ? 'star' : 'star-outline';
  }

  getStarColor(index: number): string {
    return this.stars[index] ? '#FFD700' : '#CCCCCC';
  }

  getSizeClass(): string {
    return `rating-${this.size}`;
  }
}
