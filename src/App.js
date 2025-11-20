import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";  
import Login from "./components/Login";
import SkinDiseaseForm from "./components/SkinDiseaseForm";
import Results from "./components/Results";
import Profile from "./components/Profile";
import History from "./components/History";
import ModelPerformance from "./components/ModelPerformance";
import NotFound from "./components/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/form" element={<SkinDiseaseForm />} />
      <Route path="/results" element={<Results />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/history" element={<History />} />
      <Route path="/performance" element={<ModelPerformance />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;