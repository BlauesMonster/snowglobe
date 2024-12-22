import { Component, HostListener } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-snow-globe',
  templateUrl: './snow-globe.component.html',
  styleUrls: ['./snow-globe.component.scss'],
})
export class SnowGlobeComponent {
  scene = new THREE.Scene();
  camera: THREE.OrthographicCamera;
  renderer = new THREE.WebGLRenderer();
  snowParticles!: THREE.Points;
  snowPositions!: Float32Array;
  snowStates: boolean[] = [];
  fallingSpeed: number[] = [];
  maxSnowflakes = 5000; // Limit the number of snowflakes
  groundLevel = 0; // Dynamically calculated
  snowPile: Map<number, number> = new Map(); // Tracks accumulated snow at specific x positions

  constructor() {
    this.camera = this.createCamera();
  }

  ngOnInit() {
    this.initScene();
    this.addSnowParticles();
    this.animate();
  }

  createCamera(): THREE.OrthographicCamera {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 5; // Adjust for the visible range
    return new THREE.OrthographicCamera(
      -aspect * viewSize,
      aspect * viewSize,
      viewSize,
      -viewSize,
      0.1,
      1000
    );
  }

  initScene() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.z = 5;

    // Set the ground level based on the camera's bottom
    this.groundLevel = this.camera.bottom;
  }

  addSnowParticles() {
    this.snowPositions = new Float32Array(this.maxSnowflakes * 3); // 3 values per particle (x, y, z)
    this.fallingSpeed = Array(this.maxSnowflakes).fill(0);
    this.snowStates = Array(this.maxSnowflakes).fill(true);

    for (let i = 0; i < this.maxSnowflakes; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 10; // Random x position across screen width
      this.snowPositions[i * 3 + 1] = Math.random() * 10 - 5; // Random y position in screen height
      this.snowPositions[i * 3 + 2] = 0; // Flat in Z-axis for 2D
      this.fallingSpeed[i] = 0.01 + Math.random() * 0.02; // Random falling speed
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    this.snowParticles = new THREE.Points(geometry, material);
    this.scene.add(this.snowParticles);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const positions = this.snowParticles.geometry.attributes['position'].array as Float32Array;

    for (let i = 0; i < this.maxSnowflakes; i++) {
        if (this.snowStates[i]) {
            // Update y position
            positions[i * 3 + 1] -= this.fallingSpeed[i];

            // Check collision with the current pile height
            const x = positions[i * 3];
            const targetHeight = this.groundLevel + this.getPileHeight(x);

            if (positions[i * 3 + 1] <= targetHeight) {
                // Smoothly settle the particle
                this.fallingSpeed[i] *= 0.5; // Slow down as it settles
                if (this.fallingSpeed[i] < 0.001) {
                    // Once the speed is minimal, stop the particle
                    positions[i * 3 + 1] = targetHeight;
                    this.snowStates[i] = false;
                    this.addToPile(x); // Add the particle to the pile
                }
            }
        }
    }

    this.snowParticles.geometry.attributes['position'].needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
}



  getPileHeight(x: number): number {
    // Calculate the height of the snow pile at a specific x position
    const roundedX = Math.round(x * 10) / 10; // Round x to reduce precision issues
    return this.snowPile.get(roundedX) || 0;
  }

  addToPile(x: number) {
    const roundedX = Math.round(x * 10) / 10; // Round x to reduce precision issues
    let currentHeight = this.snowPile.get(roundedX) || 0;

    // Check left and right neighbors for a compact pile
    const leftX = Math.round((roundedX - 0.1) * 10) / 10;
    const rightX = Math.round((roundedX + 0.1) * 10) / 10;

    const leftHeight = this.snowPile.get(leftX) || 0;
    const rightHeight = this.snowPile.get(rightX) || 0;

    // Settle the particle based on the lowest adjacent height
    const minHeight = Math.min(leftHeight, currentHeight, rightHeight);

    if (minHeight === leftHeight) {
        this.snowPile.set(leftX, leftHeight + 0.05);
    } else if (minHeight === rightHeight) {
        this.snowPile.set(rightX, rightHeight + 0.05);
    } else {
        this.snowPile.set(roundedX, currentHeight + 0.05);
    }
}

  @HostListener('window:resize')
  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 5;

    this.camera.left = -aspect * viewSize;
    this.camera.right = aspect * viewSize;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Update the ground level based on the camera's new bottom
    this.groundLevel = this.camera.bottom;
  }
}
