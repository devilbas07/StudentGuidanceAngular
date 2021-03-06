import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMajorAdminDialogComponent } from './list-major-dialog.component';

describe('ListMajorDialogComponent', () => {
  let component: ListMajorAdminDialogComponent;
  let fixture: ComponentFixture<ListMajorAdminDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListMajorAdminDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListMajorAdminDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
