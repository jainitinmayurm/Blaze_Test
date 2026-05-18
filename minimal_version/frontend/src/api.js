import axios from 'axios';

// Create a pre-configured Axios instance.
// This saves us from having to type out the full URL for every single API request.
const api = axios.create({
  // The baseURL points to our minimal Express backend server.
  // All requests made with this instance will automatically prepend this URL.
  // Example: api.get('/meetings') actually requests 'http://localhost:5001/api/meetings'
  baseURL: 'http://localhost:5001/api',
});

export default api;
