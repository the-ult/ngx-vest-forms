import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  HostBinding,
  inject,
  OnDestroy,
} from '@angular/core';

import { AbstractControl, NgModel, NgModelGroup } from '@angular/forms';
import {
  catchError,
  EMPTY,
  merge,
  retry,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { FormDirective } from '../../directives/form.directive';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[sc-control-wrapper]',
  standalone: true,
  templateUrl: './control-wrapper.component.html',
  styleUrls: ['./control-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlWrapperComponent implements AfterViewInit, OnDestroy {
  @ContentChild(NgModel) public ngModel?: NgModel; // Optional ngModel
  public readonly ngModelGroup: NgModelGroup | null = inject(NgModelGroup, {
    optional: true,
    self: true,
  });
  private readonly destroy$$ = new Subject<void>();
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly formDirective = inject(FormDirective);
  // Cache the previous error to avoid 'flickering'
  private previousError?: string[];

  @HostBinding('class.sc-control-wrapper--invalid')
  public get invalid() {
    return this.control?.touched && this.errors;
  }

  public get errors(): string[] | undefined {
    if (this.control?.pending) {
      return this.previousError;
    } else {
      this.previousError = this.control?.errors?.['errors'];
    }
    return this.control?.errors?.['errors'];
  }

  private get control(): AbstractControl | undefined {
    return this.ngModelGroup
      ? this.ngModelGroup.control
      : this.ngModel?.control;
  }

  public ngOnDestroy(): void {
    this.destroy$$.next();
  }

  public ngAfterViewInit(): void {
    // Create a safe stream combining form events
    const controlEvents$ = this.control?.events || EMPTY;
    const groupEvents$ = this.ngModelGroup?.control?.events || EMPTY;

    this.formDirective.idle$
      .pipe(
        switchMap(() => merge(controlEvents$, groupEvents$)),
        retry(3), // Retry if we hit any undefined values
        catchError(() => EMPTY), // Fallback if retries fail
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        this.cdRef.markForCheck();
      });
  }
}
