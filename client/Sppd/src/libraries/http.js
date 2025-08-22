import axios from "axios";

const http = axios.create({
  baseURL: "https://gc01.kemilinthesky.web.id", 
});

export default http;