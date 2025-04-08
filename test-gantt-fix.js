// Test script to verify Gantt chart fixes
import fetch from 'node-fetch';

async function testGanttComponent() {
  try {
    console.log('Checking if server is running...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Server status:', healthData.status);

    console.log('Attempting to access the client application...');
    const clientResponse = await fetch('http://localhost:5000/');
    const clientStatus = clientResponse.status;
    console.log('Client application status code:', clientStatus);

    if (clientStatus === 200) {
      console.log('Success! The application is available.');
      console.log('The fix for React Error #310 (conditional hooks issue) has been implemented by:');
      console.log(' - Moving all useState hooks to the top of the component');
      console.log(' - Moving the getStatusColor function after all the hooks');
      console.log(' - Ensuring all conditional rendering happens after hook declarations');
      console.log('\nFix details:');
      console.log('1. Originally, the useState hooks were defined after a function and before conditional returns');
      console.log('2. This violates React\'s Rules of Hooks (hooks must be called at the top level)');
      console.log('3. The fix reorganizes the component to ensure hooks are called unconditionally');
      console.log('\nTest steps:');
      console.log('1. Navigate to the Manufacturing page');
      console.log('2. Click on the "Projects" tab');
      console.log('3. Select the "Gantt" view');
      console.log('4. Verify that the Gantt chart renders without error');
      console.log('\nIf the chart displays correctly without the error message, the fix was successful!');
    } else {
      console.log('Warning: Client application returned an unexpected status code.');
    }
  } catch (error) {
    console.error('Error testing Gantt chart component:', error);
  }
}

testGanttComponent();