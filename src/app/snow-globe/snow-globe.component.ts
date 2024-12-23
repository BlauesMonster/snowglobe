import { Component, HostListener } from '@angular/core';
function randomIntFromInterval(min:number, max:number) { // min and max included
  return Math.floor(Math.random() * (max - min) + min);
}
@Component({
  selector: 'app-snow-globe',
  standalone: true,
  templateUrl: './snow-globe.component.html',
  styleUrls: ['./snow-globe.component.scss'],
})
export class SnowGlobeComponent {
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  snowParticles: { x: number; y: number; speed: number; state: boolean; angle: number; rotationSpeed: number }[] = [];
  maxSnowflakes = 5000; // Limit the number of snowflakes
  groundLevel = 0; // Dynamically calculated
  snowPile: Map<number, number> = new Map(); // Tracks accumulated snow at specific x positions

  ngOnInit() {
    this.initCanvas();
    this.addSnowParticles();
    this.animate();

    // Start listening for device motion events
    window.addEventListener('devicemotion', this.handleShake.bind(this));
  }

  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.backgroundColor = 'black';
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    document.body.appendChild(this.canvas);

    // Set the ground level based on the canvas height
    this.groundLevel = this.canvas.height;
  }

  addSnowParticles() {
    for (let i = 0; i < this.maxSnowflakes; i++) {
      this.snowParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        state: true,
        angle: Math.random() * 2 * Math.PI, // Random angle for twisting
        rotationSpeed: 0.02 + Math.random() * 0.05 // Random rotation speed
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.snowParticles.length; i++) {
      const particle = this.snowParticles[i];

      if (particle.state) {
        particle.y += particle.speed;
        particle.x += Math.sin(particle.angle) * 0.5; // Simulate horizontal drifting
        particle.angle += particle.rotationSpeed; // Update angle for twisting effect

        const targetHeight = this.groundLevel - this.getPileHeight(particle.x);

        if (particle.y >= targetHeight) {
          particle.y = targetHeight;
          particle.state = false;
          this.addToPile(particle.x);
        }

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(particle.x, particle.y, 4, 4);
      }
    }

    this.snowPile.forEach((value, key) => {
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(key, this.canvas.height, 4, -value);
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
      const velocityChangeX = (Math.random() - 0.5) * 4; // Random horizontal velocity
      const velocityChangeY = (Math.random() - 0.5) * 4; // Random vertical velocity

      particle.speed = 0.5 + Math.random() * 1.5; // Randomize falling speed
      particle.angle = Math.random() * 2 * Math.PI; // Randomize twisting direction
      particle.rotationSpeed = 0.02 + Math.random() * 0.05; // Randomize rotation speed

      // Adjust particle position slightly to simulate shaking motion
      particle.x = randomIntFromInterval(0, this.canvas.width);
      particle.y =randomIntFromInterval(0, this.canvas.height);

      // Keep particles within the canvas bounds
      if (particle.x < 0) particle.x = 0;
      if (particle.x > this.canvas.width) particle.x = this.canvas.width;
      if (particle.y < 0) particle.y = 0;
      if (particle.y > this.canvas.height) particle.y = this.canvas.height;

      particle.state = true; // Keep particles active
    }
  }



  @HostListener('window:resize')
  onWindowResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.groundLevel = this.canvas.height;
  }
}
