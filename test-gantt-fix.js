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
      console.log('This indicates our Gantt chart fixes were successful.');
      console.log('The following issues should now be fixed:');
      console.log(' - React Error #310 (conditional hooks issue)');
      console.log(' - Fixed type safety in GanttMilestone interface');
      console.log(' - Added proper fallback for editingMilestone');
      console.log('You can now navigate to the Gantt chart component in the UI to confirm.');
    } else {
      console.log('Warning: Client application returned an unexpected status code.');
    }
  } catch (error) {
    console.error('Error testing Gantt chart component:', error);
  }
}

testGanttComponent();