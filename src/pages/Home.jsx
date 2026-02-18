/* eslint-disable no-unused-vars */
import React, { useContext, useState } from "react";
import SketchTitleComponent from "../components/SketchTitleComponent";
import SketchButton from "../components/SketchButton";
import SketchInput from "../components/SketchInput";
import AuthContext from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { createRoom, getRoomDetails } from "../service/RoomService";
import { useToast } from "../toast/CustomToastHook";
import { HOME_CONFIG as CONFIG } from "../config/LabelConfig";
import { logger } from "../utils/Logger";
import PencilScene from "../components/PencilScene";
import EraserScene from "../components/EraserScene";
import AnimatedPencilWithBackground from "../components/AnimatedPencilWithBackground";
import AnimatedEraserWithBackground from "../components/AnimatedEraserWithBackground";
import SketchLoader from "../components/SketchLoader";
import { motion } from "framer-motion"; // 1. Import motion

const Home = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const { showSuccessToast, showErrorToast } = useToast();
  const { isAuthenticated, username, logout, isLoggingOut, loading } = useContext(AuthContext);
  const [isRecon, setIsRecon] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);


   const dropIn = {
    hidden: { y: -50, opacity: 0 },
    visible: (custom) => ({
      y: 0,
      opacity: 1,
      transition: { 
        delay: custom * 0.2, 
        type: "spring", 
        stiffness: 40 
      },
    }),
  };

  const handleCreateRoom = async () => {
    try {
      const response = await createRoom();
      if (response.roomCode) {
        setIsNavigating(true);
        navigate(`/room/${response.roomCode}`);
        showSuccessToast(CONFIG.messages.createRoomSuccess);
        logger(
          CONFIG.fileName,
          CONFIG.methods.handleCreateRoom,
          CONFIG.messages.createRoomSuccess,
          response,
        );
      }
    } catch (err) {
      showErrorToast(CONFIG.messages.createRoomFailure);
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleCreateRoom,
        CONFIG.messages.createRoomFailure,
        err,
      );
    }
  };

  const handleJoinRoom = async (e) => {
    if (e) e.preventDefault();
    if (!roomCode) {
      showErrorToast(CONFIG.messages.handleJoinRoomErrorToast);
      return;
    }

    try {
      const response = await getRoomDetails(roomCode);
      if (response.success) {
        const players = response.players;
        const userIsReconnecting = players.some(
          (player) => player.username === username,
        );

        setIsRecon(userIsReconnecting);

        if (response.room.status === CONFIG.roomStatus.FINISHED) {
          showErrorToast(CONFIG.messages.roomHasFinishedToast);
          return;
        }
        if (
          response.room.status === CONFIG.roomStatus.PLAYING &&
          !userIsReconnecting
        ) {
          showErrorToast(CONFIG.messages.roomIsInProgressToast);
          return;
        }
        setIsNavigating(true);
        navigate(`/room/${roomCode}`);
        showSuccessToast(CONFIG.messages.createRoomSuccess);
      }
    } catch (err) {
      showErrorToast(`Roomcode: ${roomCode} not found`);
      logger(CONFIG.fileName, CONFIG.methods.handleJoinRoom, err);
    }
  };

  if (loading) {
    return <SketchLoader />;
  }

  if (isNavigating) {
    return <SketchLoader message="Joining room..." />;
  }

  if (isLoggingOut) {
    return <SketchLoader message="Logging out..." />;
  }

  return (
      <div className="flex min-h-screen w-full flex-col md:grid md:grid-cols-3 items-center p-3 overflow-hidden">
        <motion.div 
          variants={dropIn} initial="hidden" animate="visible" custom={4}
          className="hidden h-100 md:flex w-full items-center justify-center bg-red"
        >
          <AnimatedPencilWithBackground height="95%" width="100%" color="#2a2a2a" useCustomColor={true} />
        </motion.div>
  
        <div className="flex flex-col items-center justify-center w-full max-w-2xl">
          <motion.div 
            variants={dropIn} initial="hidden" animate="visible" custom={1}
            className="w-full"
          >
            <SketchTitleComponent isTitle={true}/>
          </motion.div>
  
          <motion.div 
            variants={dropIn} initial="hidden" animate="visible" custom={2}
            className="text-md md:text-xl lg:text-2xl mb-8 font-gloria text-center w-full"
          >
            {isAuthenticated ? `Welcome, ${username}` : `Welcome, Guest`}
          </motion.div>
  
          <motion.div 
            variants={dropIn} initial="hidden" animate="visible" custom={3}
            className="flex w-full max-w-xs flex-col gap-6"
          >
            {isAuthenticated ? (
              <>
                <SketchButton text="Create Room" color="rgba(34, 197, 94, 0.4)" onClick={handleCreateRoom} />
                <div className="flex items-center gap-2">
                  <div className="h-[1px] grow bg-gray-500" />
                  <span className="font-gloria text-gray-600">or</span>
                  <div className="h-[1px] grow bg-gray-500" />
                </div>
                <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                  <SketchInput
                    placeholder={CONFIG.ui.joinRoomInput.joinRoomInputText}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                  />
                  <SketchButton
                    text={CONFIG.ui.joinRoomButton.joinRoomButtonText}
                    color={CONFIG.ui.joinRoomButton.joinRoomButtonColor}
                    onClick={handleJoinRoom}
                  />
                </form>
                <div className="mt-4">
                  <SketchButton text={CONFIG.ui.logoutButton.logoutButtonText} color={CONFIG.ui.logoutButton.logoutButtonColor} onClick={logout} />
                </div>
              </>
            ) : (
              <>
                <SketchButton text={CONFIG.ui.loginButton.loginButtonText} color={CONFIG.ui.loginButton.loginButtonColor} onClick={() => navigate("/login")} />
                <SketchButton text={CONFIG.ui.registerButton.registerButtonText} color={CONFIG.ui.registerButton.registerButtonColor} onClick={() => navigate("/register")} />
              </>
            )}
          </motion.div>
        </div>
  
        <motion.div 
          variants={dropIn} initial="hidden" animate="visible" custom={4}
          className="hidden h-100 md:flex w-full items-center justify-center"
        >
          <AnimatedEraserWithBackground height="70%" width="100%" color="#2a2a2a" useCustomColor={true} />
        </motion.div>
      </div>
    );
  };
  
  export default Home;
