Task: Add "End Delivery / Mark Delivery Completed" option and show completed orders/deliveries

Steps:
1. delivery-tracking.page.html
   - Add "End Delivery" button visible to workers when delivery is in progress. ✅ COMPLETED
2. delivery-tracking.page.ts
   - Implement method to call updateOrderStatus('delivered') on button click. ✅ COMPLETED
   - Update UI state after marking delivery completed. ✅ COMPLETED
   - Notify user side of status change (e.g., via event or polling). ✅ HANDLED BY API
3. customer-profile.page.ts (if needed)
   - Ensure UI updates when order status changes to delivered. ✅ HANDLED BY API REFRESH
4. worker-dashboard.page.html and .ts
   - Confirm completed deliveries count is shown. ✅ ALREADY IMPLEMENTED
   - Optionally add tab/filter for completed deliveries (deferred).

Testing:
- Verify "End Delivery" button appears and works for workers.
- Verify order status updates to delivered on both worker and user sides.
- Verify completed orders/deliveries display correctly on user and worker dashboards.
- Test UI updates on status change.
