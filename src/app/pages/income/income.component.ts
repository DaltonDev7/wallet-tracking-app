import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { Subscription } from 'rxjs';
import { FixedIncome } from '../../core/interfaces/movements';
import { AddEditIncomeModalComponent } from '../../modals/add-edit-income-modal/add-edit-income-modal.component';
import { IncomesService } from '../../core/services/incomes.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DatePickerModule, AddEditIncomeModalComponent, ConfirmModalComponent],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss'
})
export class IncomeComponent implements OnInit {

  //services
  private fixedIncomeService = inject(IncomesService);
  private destroyRef = inject(DestroyRef);
  private incomesSubscription?: Subscription;

  // resumen
  public activeFixedIncomesCount = 0;
  public totalFixedIncomes = 0;

  // modal
  public showModal = false;
  public incomeBeingEdited: FixedIncome | null = null;

  // confirm delete
  public showConfirmDelete = false;
  public incomePendingDelete: FixedIncome | null = null;

  public selectedMonthToApply!: string;
  public selectedMonthDate!: Date;

  public fixedIncomes: FixedIncome[] = [];


  ngOnInit(): void {
    this.selectedMonthToApply = this.getCurrentMonth();
    this.selectedMonthDate = this.monthKeyToDate(this.selectedMonthToApply);
    this.loadIncomesForMonth();
  }

  onMonthChange(value?: Date | null): void {
    if (value) {
      this.selectedMonthDate = value;
      this.selectedMonthToApply = this.toMonthKey(value);
    }

    this.loadIncomesForMonth();
  }

  private loadIncomesForMonth(): void {
    this.incomesSubscription?.unsubscribe();

    this.incomesSubscription = this.fixedIncomeService
      .getUserFixedIncomesByMonth$(this.selectedMonthToApply)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((incomes) => {
        this.fixedIncomes = incomes;
        this.recalculateSummary();
      });
  }

  public onAddFixedIncome(): void {
    this.incomeBeingEdited = null;
    this.showModal = true;
  }

  public onEditFixedIncome(income: FixedIncome): void {
    this.incomeBeingEdited = { ...income };
    this.showModal = true;
  }

  public onModalClosed(): void {
    this.showModal = false;
    this.incomeBeingEdited = null;
  }

  public async onIncomeSaved(saved: FixedIncome): Promise<void> {

    if (saved.id) {
      // editar
      await this.fixedIncomeService.updateFixedIncome(saved.id, {
        name: saved.name,
        // category: saved.category,
        amount: saved.amount,
        active: saved.active,
        startDate: saved.startDate,
        notes: saved.notes,
      });
    } else {
      // crear
      await this.fixedIncomeService.createFixedIncome({
        name: saved.name,
        // category: saved.category,
        amount: saved.amount,
        active: saved.active,
        startDate: saved.startDate,
        notes: saved.notes,
      });
    }

    this.showModal = false;
    this.incomeBeingEdited = null;
  }

  public confirmDeleteFixedIncome(income: FixedIncome): void {
    this.incomePendingDelete = income;
    this.showConfirmDelete = true;
  }

  public async handleConfirmDelete(): Promise<void> {
    if (!this.incomePendingDelete) return;
    if (!this.incomePendingDelete.id) return;
    await this.fixedIncomeService.deleteFixedIncome(this.incomePendingDelete.id);
    this.incomePendingDelete = null;
    this.showConfirmDelete = false;
  }

  public handleCancelDelete(): void {
    this.incomePendingDelete = null;
    this.showConfirmDelete = false;
  }

  private recalculateSummary(): void {
    const active = this.fixedIncomes.filter((i) => i.active);
    this.activeFixedIncomesCount = active.length;
    this.totalFixedIncomes = active.reduce((sum, i) => sum + i.amount, 0);
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private monthKeyToDate(monthKey: string): Date {
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  private toMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
