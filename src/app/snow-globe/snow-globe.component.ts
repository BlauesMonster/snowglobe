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


    // Start listening for device motion events
    window.addEventListener('devicemotion', this.handleShake.bind(this));
    requestAnimationFrame(this.animate.bind(this));
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


  private lastRender = 0; // Track last render time for throttling
  animate(timestamp: number) {
    if (timestamp - this.lastRender < 16) {
      requestAnimationFrame(this.animate.bind(this));
      return;
    }

    this.lastRender = timestamp;
    const ctx = this.ctx();

    if (ctx) {
      const canvas = this.canvas().nativeElement;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const groundLevel = this.canvasHeight();
      const snowPile = this.snowPile;

      // Draw snow particles
      ctx.fillStyle = 'white';
      const particleBatch: Path2D[] = [];
      for (const particle of this.snowParticles) {
        if (particle.state) {
          particle.y += particle.speed;
          particle.x += Math.sin(particle.angle) * 0.5;
          particle.angle += particle.rotationSpeed;

          const targetHeight = groundLevel - (snowPile.get(Math.round(particle.x)) || 0);

          if (particle.y >= targetHeight) {
            particle.y = targetHeight;
            particle.state = false;
            this.addToPile(particle.x);
          } else {
            const path = new Path2D();
            path.rect(particle.x, particle.y, 4, 4);
            particleBatch.push(path);
          }
        }
      }

      // Render all particles in one batch
      for (const path of particleBatch) {
        ctx.fill(path);
      }

      // Draw accumulated snow pile
      for (const [key, value] of snowPile.entries()) {
        ctx.fillRect(key, groundLevel, 4, -value);
      }
    }

    requestAnimationFrame(this.animate.bind(this));
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
    const acceleration = event.acceleration;
    if (acceleration) {
      const shakeThreshold = 15;
      if (
        Math.abs(acceleration.x || 0) > shakeThreshold ||
        Math.abs(acceleration.y || 0) > shakeThreshold ||
        Math.abs(acceleration.z || 0) > shakeThreshold
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
    const canvasWidth = this.canvasWidth();
    const canvasHeight = this.canvasHeight();
    for (const particle of this.snowParticles) {
      particle.speed = 0.5 + Math.random() * 1.5;
      particle.angle = Math.random() * 2 * Math.PI;
      particle.rotationSpeed = 0.02 + Math.random() * 0.05;
      particle.x = randomIntFromInterval(0, canvasWidth);
      particle.y = randomIntFromInterval(0, canvasHeight);
      particle.state = true;
    }
  }
}
