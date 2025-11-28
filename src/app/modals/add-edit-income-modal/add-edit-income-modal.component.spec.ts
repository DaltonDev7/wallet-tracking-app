import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditIncomeModalComponent } from './add-edit-income-modal.component';

describe('AddEditIncomeModalComponent', () => {
  let component: AddEditIncomeModalComponent;
  let fixture: ComponentFixture<AddEditIncomeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditIncomeModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditIncomeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
