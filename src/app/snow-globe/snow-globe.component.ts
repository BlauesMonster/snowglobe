import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, signal, viewChild, ViewChild } from '@angular/core';
function randomIntFromInterval(min: number, max: number) { // min and max included
  return Math.floor(Math.random() * (max - min) + min);
}
@Component({
  selector: 'app-snow-globe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './snow-globe.component.html',
  styleUrls: ['./snow-globe.component.scss'],
})
export class SnowGlobeComponent {


  snowParticles: { x: number; y: number; speed: number; state: boolean; angle: number; rotationSpeed: number }[] = [];
  maxSnowflakes = 7000; // Limit the number of snowflakes
  snowPile: Map<number, number> = new Map(); // Tracks accumulated snow at specific x positions

  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>("myCanvas");

  ctx = computed(() => {
    const canvas = this.canvas();
    return canvas.nativeElement.getContext('2d')!
  });

  canvasWidth = signal(window.innerWidth)
  canvasHeight = signal(window.innerHeight)
  groundLevel = computed(() => {
    const height = this.canvasHeight();
    return height;
  });

  ngOnInit() {
    this.addSnowParticles();
    this.animate();

    // Start listening for device motion events
    window.addEventListener('devicemotion', this.handleShake.bind(this));
  }


  addSnowParticles() {
    for (let i = 0; i < this.maxSnowflakes; i++) {
      this.snowParticles.push({
        x: Math.random() * this.canvasWidth(),
        y: Math.random() * this.canvasHeight() - this.canvasHeight(),
        speed: 0.5 + Math.random() * 1.5,
        state: true,
        angle: Math.random() * 2 * Math.PI, // Random angle for twisting
        rotationSpeed: 0.02 + Math.random() * 0.05 // Random rotation speed
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.ctx().clearRect(0, 0, this.canvas().nativeElement.width, this.canvas().nativeElement.height);

    for (let i = 0; i < this.snowParticles.length; i++) {
      const particle = this.snowParticles[i];

      if (particle.state) {
        particle.y += particle.speed;
        particle.x += Math.sin(particle.angle) * 0.5; // Simulate horizontal drifting
        particle.angle += particle.rotationSpeed; // Update angle for twisting effect

        const targetHeight = this.groundLevel() - this.getPileHeight(particle.x);

        if (particle.y >= targetHeight) {
          particle.y = targetHeight;
          particle.state = false;
          this.addToPile(particle.x);
        }

        this.ctx().fillStyle = 'white';
        this.ctx().fillRect(particle.x, particle.y, 4, 4);
      }
    }

    this.snowPile.forEach((value, key) => {
      this.ctx().fillStyle = 'white';
      this.ctx().fillRect(key, this.canvasHeight(), 4, -value);
    });
  }

  getPileHeight(x: number): number {
    const roundedX = Math.round(x);
    return this.snowPile.get(roundedX) || 0;
  }

  addToPile(x: number) {
    const roundedX = Math.round(x);
    let currentHeight = this.snowPile.get(roundedX) || 0;

    const leftX = roundedX - 1;
    const rightX = roundedX + 1;

    const leftHeight = this.snowPile.get(leftX) || 0;
    const rightHeight = this.snowPile.get(rightX) || 0;

    const minHeight = Math.min(leftHeight, currentHeight, rightHeight);

    if (minHeight === leftHeight) {
      this.snowPile.set(leftX, leftHeight + 4);
    } else if (minHeight === rightHeight) {
      this.snowPile.set(rightX, rightHeight + 4);
    } else {
      this.snowPile.set(roundedX, currentHeight + 4);
    }
  }

  handleShake(event: DeviceMotionEvent) {
    // Use acceleration to determine if the device was shaken
    const acceleration = event.acceleration;
    if (acceleration) {
      const shakeThreshold = 15; // Adjust threshold as needed
      if (
        Math.abs(acceleration.x!) > shakeThreshold ||
        Math.abs(acceleration.y!) > shakeThreshold ||
        Math.abs(acceleration.z!) > shakeThreshold
      ) {
        this.clearSnowPiles();
        this.modifyParticleDynamics();
      }
    }
  }

  clearSnowPiles() {
    this.snowPile.clear();
  }

  modifyParticleDynamics() {
    // Apply randomized velocity shifts to simulate a realistic twist effect
    for (const particle of this.snowParticles) {

      particle.speed = 0.5 + Math.random() * 1.5; // Randomize falling speed
      particle.angle = Math.random() * 2 * Math.PI; // Randomize twisting direction
      particle.rotationSpeed = 0.02 + Math.random() * 0.05; // Randomize rotation speed

      // Adjust particle position slightly to simulate shaking motion
      particle.x = randomIntFromInterval(0, this.canvasWidth());
      particle.y = randomIntFromInterval(0, this.canvasHeight());

      // Keep particles within the canvas bounds
      if (particle.x < 0) particle.x = 0;
      if (particle.x > this.canvasWidth()) particle.x = this.canvasWidth();
      if (particle.y < 0) particle.y = 0;
      if (particle.y > this.canvasHeight()) particle.y = this.canvasHeight();

      particle.state = true; // Keep particles active
    }
  }
}
