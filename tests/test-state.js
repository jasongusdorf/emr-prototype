/* ============================================================
   test-state.js — Tests for state.js (EMRState)
   Only runs if EMRState is loaded.
   ============================================================ */

if (typeof EMRState !== 'undefined') {
  describe('EMRState — State Management', function() {
    it('get returns default values', function() {
      var chart = EMRState.get('chart');
      assertNotNull(chart);
      assertEqual(chart.activeTab, 'overview');
    });

    it('set updates a field', function() {
      EMRState.set('chart.patientId', 'test-123');
      assertEqual(EMRState.get('chart.patientId'), 'test-123');
      EMRState.reset('chart');
    });

    it('set with object merges multiple fields', function() {
      EMRState.set('chart', { patientId: 'abc', activeTab: 'notes' });
      assertEqual(EMRState.get('chart.patientId'), 'abc');
      assertEqual(EMRState.get('chart.activeTab'), 'notes');
      EMRState.reset('chart');
    });

    it('on subscribes to field changes', function() {
      var received = null;
      var unsub = EMRState.on('chart.patientId', function(newVal) { received = newVal; });
      EMRState.set('chart.patientId', 'xyz');
      assertEqual(received, 'xyz');
      unsub();
      EMRState.reset('chart');
    });

    it('on subscribes to namespace changes', function() {
      var fields = [];
      var unsub = EMRState.on('chart', function(field) { fields.push(field); });
      EMRState.set('chart.patientId', 'a');
      EMRState.set('chart.activeTab', 'meds');
      assert(fields.indexOf('patientId') !== -1);
      assert(fields.indexOf('activeTab') !== -1);
      unsub();
      EMRState.reset('chart');
    });

    it('unsubscribe stops notifications', function() {
      var count = 0;
      var unsub = EMRState.on('chart.patientId', function() { count++; });
      EMRState.set('chart.patientId', 'a');
      unsub();
      EMRState.set('chart.patientId', 'b');
      assertEqual(count, 1);
      EMRState.reset('chart');
    });

    it('reset restores defaults', function() {
      EMRState.set('chart.patientId', 'test');
      EMRState.reset('chart');
      assertEqual(EMRState.get('chart.patientId'), null);
    });

    it('set does not notify if value unchanged', function() {
      EMRState.reset('chart');
      var count = 0;
      var unsub = EMRState.on('chart.activeTab', function() { count++; });
      EMRState.set('chart.activeTab', 'overview'); // same as default
      assertEqual(count, 0);
      unsub();
    });

    it('dump returns full state snapshot', function() {
      var dump = EMRState.dump();
      assertNotNull(dump.chart);
      assertNotNull(dump.app);
      assertNotNull(dump.encounter);
      assertNotNull(dump.orders);
      assertNotNull(dump.dashboard);
    });
  });
}
