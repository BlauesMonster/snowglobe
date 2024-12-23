import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SnowGlobeComponent } from "./snow-globe/snow-globe.component";

@Component({
  selector: 'app-root',
  imports: [SnowGlobeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'snow-globe-app';
}
