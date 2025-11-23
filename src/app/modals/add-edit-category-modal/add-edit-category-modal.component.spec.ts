import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditCategoryModalComponent } from './add-edit-category-modal.component';

describe('AddEditCategoryModalComponent', () => {
  let component: AddEditCategoryModalComponent;
  let fixture: ComponentFixture<AddEditCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditCategoryModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditCategoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
