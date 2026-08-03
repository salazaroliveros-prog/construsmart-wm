import { beforeEach, describe, expect, it, vi } from 'vitest';

const projectId = '11111111-1111-1111-1111-111111111111';
const purchaseOrderId = '22222222-2222-2222-2222-222222222222';
const purchaseOrderItemId = '33333333-3333-3333-3333-333333333333';
const budgetId = '44444444-4444-4444-4444-444444444444';
const budgetItemId = '55555555-5555-5555-5555-555555555555';

const createFakeTable = (records: any[]) => {
  return {
    where: vi.fn((field: string) => ({
      equals: vi.fn((value: string) => ({
        delete: vi.fn(async () => {
          for (let i = records.length - 1; i >= 0; i--) {
            if (records[i][field] === value) {
              records.splice(i, 1);
            }
          }
        }),
        toArray: vi.fn(async () => records.filter((row) => row[field] === value)),
        modify: vi.fn(async (update: any) => {
          for (const row of records) {
            if (row[field] === value) {
              Object.assign(row, update);
            }
          }
        }),
      })),
    })),
    count: vi.fn(async () => records.length),
    add: vi.fn(async (record: any) => records.push(record)),
  };
};

describe('cascadeLocalDelete', () => {
  let fakePurchaseOrderItems: any[];
  let fakePurchaseOrders: any[];
  let fakeBudgets: any[];
  let fakeBudgetItems: any[];
  let cascadeLocalDelete: (remoteTable: string, serverId: string) => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    fakePurchaseOrderItems = [];
    fakePurchaseOrders = [];
    fakeBudgets = [];
    fakeBudgetItems = [];

    vi.doMock('../lib/db/offlineStore', () => ({
      offlineDB: {
        budgets: createFakeTable(fakeBudgets),
        budgetItems: createFakeTable(fakeBudgetItems),
        financialTransactions: createFakeTable([]),
        payrollRecords: createFakeTable([]),
        warehouseStock: createFakeTable([]),
        projectLogs: createFakeTable([]),
        purchaseOrders: createFakeTable(fakePurchaseOrders),
        purchaseOrderItems: createFakeTable(fakePurchaseOrderItems),
      },
    }));

    ({ cascadeLocalDelete } = await import('../lib/utils/offlineSync'));
  });

  it('borra dependencias locales asociadas a un proyecto', async () => {
    fakePurchaseOrders.push({
      id: purchaseOrderId,
      project_id: projectId,
      supplier_id: '66666666-6666-6666-6666-666666666666',
    });
    fakePurchaseOrderItems.push({
      id: purchaseOrderItemId,
      purchase_order_id: purchaseOrderId,
    });
    fakeBudgets.push({
      id: budgetId,
      project_id: projectId,
    });
    fakeBudgetItems.push({
      id: budgetItemId,
      budget_id: budgetId,
    });

    await cascadeLocalDelete('projects', projectId);

    expect(fakePurchaseOrders).toHaveLength(0);
    expect(fakePurchaseOrderItems).toHaveLength(0);
    expect(fakeBudgets).toHaveLength(0);
    expect(fakeBudgetItems).toHaveLength(0);
  });
});
