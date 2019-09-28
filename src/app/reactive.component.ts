// tslint:disable: no-shadowed-variable
import { OnInit, OnDestroy, ɵmarkDirty as markDirty } from '@angular/core';
import { Observable, from, ReplaySubject, concat } from 'rxjs';
import { mergeMap, tap, takeUntil } from 'rxjs/operators';

type ObservableDictionary<T> = {
  [P in keyof T]: Observable<T[P]>;
};

type Constructor<T = {}> = new (...args: any[]) => T;

const OnInitSubject = Symbol('OnInitSubject');

export function WithOnInit$<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements OnInit {
    private [OnInitSubject] = new ReplaySubject<true>(1);
    onInit$ = this[OnInitSubject].asObservable();

    ngOnInit() {
      this[OnInitSubject].next(true);
      this[OnInitSubject].complete();
    }
  };
}

const OnDestroySubject = Symbol('OnDestroySubject');

export function WithOnDestroy$<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements OnDestroy {
    private [OnDestroySubject] = new ReplaySubject<true>(1);
    onDestroy$ = this[OnDestroySubject].asObservable();

    ngOnDestroy() {
      this[OnDestroySubject].next(true);
      this[OnDestroySubject].complete();
    }
  };
}

export function WithConnect<
  TBase extends Constructor &
    ReturnType<typeof WithOnDestroy$> &
    ReturnType<typeof WithOnInit$>
>(Base: TBase) {
  return class extends Base {
    connect<T>(sources: ObservableDictionary<T>): T {
      const sink = {} as T;
      const sourceKeys = Object.keys(sources) as (keyof T)[];
      const updateSink$ = from(sourceKeys).pipe(
        mergeMap(sourceKey => {
          const source$ = sources[sourceKey];

          return source$.pipe(
            tap((sinkValue: any) => {
              sink[sourceKey] = sinkValue;
            })
          );
        })
      );

      concat(this.onInit$, updateSink$)
        .pipe(takeUntil(this.onDestroy$))
        .subscribe(() => markDirty(this));

      return sink;
    }
  };
}

export class Base {}

export const ReactiveComponent = WithConnect(WithOnDestroy$(WithOnInit$(Base)));
