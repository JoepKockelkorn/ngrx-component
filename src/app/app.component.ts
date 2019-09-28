import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { startWith, scan } from 'rxjs/operators';

import { ReactiveComponent } from './reactive.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ReactiveComponent {
  values$ = new Subject<number>();
  state = this.connect({
    count: this.values$.pipe(
      startWith(0),
      scan((count, next) => count + next, 0)
    )
  });
}
