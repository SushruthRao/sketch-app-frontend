import React from "react";
import SketchPageNotFound from "../components/SketchPageNotFound";
import SketchButton from "../components/SketchButton";
import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full min-w-sm max-w-xl">
        <SketchPageNotFound />
      </div>
      <h1 className="mb-8 text-2xl md:text-4xl font-bold tracking-tight text-gray-900">
        Page Not Found !
      </h1>

      <div className="w-3xs">
        <SketchButton text="Home" onClick={() => navigate("/home")} />
      </div>
    </div>
  );
};

export default PageNotFound;
