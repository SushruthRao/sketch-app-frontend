import React from "react";
import SketchPageNotFound from "../components/SketchPageNotFound";
import SketchButton from "../components/SketchButton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const dropIn = {
  hidden: { y: -50, opacity: 0 },
  visible: (custom) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: custom * 0.2,
      type: "spring",
      stiffness: 40,
    },
  }),
};

const PageNotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <motion.div variants={dropIn} initial="hidden" animate="visible" custom={1} className="w-full min-w-sm max-w-xl">
        <SketchPageNotFound />
      </motion.div>
      <motion.h1 variants={dropIn} initial="hidden" animate="visible" custom={2} className="mb-8 text-2xl md:text-4xl font-bold tracking-tight text-gray-900">
        Page Not Found !
      </motion.h1>

      <motion.div variants={dropIn} initial="hidden" animate="visible" custom={3} className="w-3xs">
        <SketchButton text="Home" onClick={() => navigate("/home")} />
      </motion.div>
    </div>
  );
};

export default PageNotFound;
