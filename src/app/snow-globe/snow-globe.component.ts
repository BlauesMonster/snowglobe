import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, signal, viewChild } from '@angular/core';
function randomIntFromInterval(min: number, max: number) {
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
  ctx = computed(() => this.canvas().nativeElement.getContext('2d')!);
  canvasWidth = signal(window.innerWidth);
  canvasHeight = signal(window.innerHeight);
  isPointerDown = false;
  pointerX = 0;
  pointerY = 0;

  ngOnInit() {
    this.addSnowParticles();
    this.setupPointerEvents();
    window.addEventListener('devicemotion', this.handleShake.bind(this));
    requestAnimationFrame(this.animate.bind(this));
  }

  addSnowParticles() {
    for (let i = 0; i < this.maxSnowflakes; i++) {
      this.snowParticles.push(this.createSnowParticle());
    }
  }

  createSnowParticle(x: number = Math.random() * this.canvasWidth(), y: number = Math.random() * this.canvasHeight()) {
    return {
      x,
      y,
      speed: 0.5 + Math.random() * 1.5,
      state: true,
      angle: Math.random() * 2 * Math.PI, // Random angle for twisting
      rotationSpeed: 0.02 + Math.random() * 0.05, // Random rotation speed
    };
  }

  private lastRender = 0; // Track last render time for throttling

  setupPointerEvents() {
    const canvas = this.canvas().nativeElement;

    canvas.style.touchAction = 'none';
    // Start spawning particles on pointer down
    canvas.addEventListener('pointerdown', (event) => {
      this.isPointerDown = true;
      const rect = canvas.getBoundingClientRect();
      this.pointerX = event.clientX - rect.left;
      this.pointerY = event.clientY - rect.top;
      this.spawnParticlesContinuously();
    });

    // Update pointer position on pointer move
    canvas.addEventListener('pointermove', (event) => {
      if (this.isPointerDown) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        this.pointerX = event.clientX - rect.left;
        this.pointerY = event.clientY - rect.top;
      }
    });

    // Stop spawning particles on pointer up
    canvas.addEventListener('pointerup', (event) => {
      event.preventDefault();
      this.isPointerDown = false;
    });

    // Stop spawning particles if the pointer leaves the canvas
    canvas.addEventListener('pointerleave', (event) => {
      event.preventDefault();
      this.isPointerDown = false;
    });
  }

  spawnParticlesContinuously() {
    if (this.isPointerDown) {
      for (let i = 0; i < 5; i++) {
        this.snowParticles.push(this.createSnowParticle(this.pointerX, this.pointerY));
      }
      // Schedule the next particle spawn
      setTimeout(() => this.spawnParticlesContinuously(), 50); // Adjust the interval as needed
    }
  }

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
      Object.assign(particle, this.createSnowParticle());
    }
  }
}
