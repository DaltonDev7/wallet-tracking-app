import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'animatedNumber',
  standalone: true
})
export class AnimatedNumberPipe implements PipeTransform {

 private currentValue = 0;
  private startValue = 0;
  private targetValue = 0;
  private startTime: number | null = null;
  private readonly duration = 600; // ms

  transform(value: number | null | undefined): number {
    if (value == null) {
      this.currentValue = 0;
      this.targetValue = 0;
      return 0;
    }

    // Si el valor no cambió, solo devolvemos el actual
    if (value === this.targetValue) {
      return this.currentValue;
    }

    // Nuevo objetivo → iniciamos animación
    this.startValue = this.currentValue || 0;
    this.targetValue = value;
    this.startTime = null;
    this.startAnimation();

    return this.currentValue;
  }

  private startAnimation() {
    const duration = this.duration;
    const startValue = this.startValue;
    const target = this.targetValue;
    const change = target - startValue;

    const step = (timestamp: number) => {
      if (this.startTime === null) {
        this.startTime = timestamp;
      }

      const progress = timestamp - this.startTime;
      const percent = Math.min(progress / duration, 1);

      this.currentValue = startValue + change * percent;

      if (percent < 1) {
        requestAnimationFrame(step);
      } else {
        // asegurar que termine exacto en el target
        this.currentValue = target;
        this.startTime = null;
      }
    };

    requestAnimationFrame(step);
  }

}
