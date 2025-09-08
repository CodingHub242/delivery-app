import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerOrderAcceptancePage } from './worker-order-acceptance.page';

describe('WorkerOrderAcceptancePage', () => {
  let component: WorkerOrderAcceptancePage;
  let fixture: ComponentFixture<WorkerOrderAcceptancePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkerOrderAcceptancePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
