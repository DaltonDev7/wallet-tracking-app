import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FixedIncome } from '../../core/interfaces/movements';
import { AddEditIncomeModalComponent } from '../../modals/add-edit-income-modal/add-edit-income-modal.component';
import { IncomesService } from '../../core/services/incomes.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEditIncomeModalComponent, ConfirmModalComponent],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss'
})
export class IncomeComponent implements OnInit {

  //services
  private fixedIncomeService = inject(IncomesService);

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

  public fixedIncomes: FixedIncome[] = [];


  ngOnInit(): void {
    this.selectedMonthToApply = this.getCurrentMonth();
    this.loadIncomesForMonth();
  }

  onMonthChange(): void {

    this.loadIncomesForMonth();
  }

  private loadIncomesForMonth(): void {

    this.fixedIncomeService
      .getUserFixedIncomesByMonth$(this.selectedMonthToApply)
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
}
