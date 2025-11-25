import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditExpensesModalComponent } from './add-edit-expenses-modal.component';

describe('AddEditExpensesModalComponent', () => {
  let component: AddEditExpensesModalComponent;
  let fixture: ComponentFixture<AddEditExpensesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditExpensesModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditExpensesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
