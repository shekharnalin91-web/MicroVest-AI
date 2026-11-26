import axios from "axios";


const API = axios.create({
  baseURL: "https://microvest-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("microvest_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const checkBackend = async () => {
  const response = await API.get("/health");
  return response.data;
};

export default API;