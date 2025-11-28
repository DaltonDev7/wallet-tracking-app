import { TestBed } from '@angular/core/testing';

import { ComboxboxService } from './comboxbox.service';

describe('ComboxboxService', () => {
  let service: ComboxboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComboxboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
