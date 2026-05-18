import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Point to our minimal backend
});

export default api;
