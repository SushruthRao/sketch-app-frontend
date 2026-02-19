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
        variants={dropIn}
        initial="hidden"
        animate="visible"
        custom={4}
        className="relative hidden h-100 md:flex w-full items-center justify-center bg-red"
      >
        <div className="relative h-[95%] w-full flex items-center justify-center">
          <svg
            viewBox="0 0 66 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 m-auto translate-x-1/2 translate-y-3/2 bottom-1 w-[35%] h-auto scale-75 pointer-events-none z-10"
          >
            <motion.path
              d="M5.01442 0.28515C4.8957 0.0358316 4.59734 -0.0700368 4.34803 0.048686L0.285152 1.98339C0.0358341 2.10211 -0.0700343 2.40046 0.0486884 2.64978C0.167411 2.8991 0.465767 3.00497 0.715086 2.88625L4.32653 1.16651L6.04626 4.77796C6.16498 5.02727 6.46334 5.13314 6.71266 5.01442C6.96198 4.8957 7.06784 4.59734 6.94912 4.34802L5.01442 0.28515ZM4.56299 0.500116L4.09178 0.332911C1.30644 8.1825 1.91158 14.5427 4.80066 19.0549C7.68803 23.5643 12.7914 26.125 18.7877 26.5095C30.7772 27.2781 46.445 19.3821 56.0079 0.728214L55.563 0.500116L55.118 0.272018C45.6988 18.6457 30.3666 26.2497 18.8517 25.5115C13.0957 25.1425 8.32074 22.698 5.64282 18.5156C2.96662 14.336 2.31954 8.31773 5.03421 0.667321L4.56299 0.500116Z"
              initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 3.3 }}
                fill="black"
                stroke="black"
                strokeWidth="0.3"
                strokeLinecap="round"
            />
            <path
              d="M33.1842 32.2632C33.0585 32.0562 32.9917 31.8637 32.984 31.6855C32.983 31.5033 33.0249 31.3316 33.1097 31.1703C33.1905 31.0024 33.2988 30.8497 33.4347 30.7122C33.5772 30.5707 33.7312 30.4406 33.8967 30.3217C34.0648 30.1921 34.2343 30.0799 34.4053 29.9852C34.5722 29.8837 34.7257 29.7904 34.8659 29.7052C35.1396 29.5388 35.4296 29.3992 35.7358 29.2862C36.042 29.1733 36.3391 29.1207 36.6272 29.1284C36.922 29.1321 37.2051 29.2068 37.4766 29.3527C37.744 29.4918 37.9792 29.7283 38.1821 30.0621C38.3606 30.3559 38.4791 30.6861 38.5374 31.0529C38.5984 31.409 38.6166 31.7773 38.592 32.158C38.57 32.5279 38.5091 32.894 38.4093 33.2564C38.3055 33.612 38.1834 33.9376 38.0431 34.2332C37.9094 34.5247 37.7621 34.7788 37.6013 34.9954C37.447 35.208 37.2938 35.3469 37.1414 35.4121C37.2195 35.7211 37.3399 36.0319 37.5024 36.3445C37.6676 36.6464 37.8408 36.9389 38.0219 37.2219C38.199 37.4982 38.3734 37.7625 38.545 38.0148C38.7125 38.2603 38.8331 38.4888 38.9066 38.7C38.9828 38.9006 38.9992 39.078 38.9559 39.2324C38.9085 39.38 38.7712 39.5 38.5439 39.5924C38.1958 39.155 37.8569 38.7027 37.5273 38.2356C37.2044 37.7645 36.8868 37.2947 36.5747 36.8262C36.2625 36.3577 35.9584 35.9025 35.6625 35.4607C35.3691 35.0082 35.08 34.5851 34.795 34.1914C34.5168 33.7937 34.2414 33.4309 33.9688 33.1028C33.6963 32.7748 33.4348 32.4949 33.1842 32.2632ZM35.4995 30.4995C35.3994 30.5603 35.2779 30.6387 35.1351 30.7347C34.9922 30.8306 34.8629 30.9412 34.7471 31.0665C34.6338 31.181 34.5589 31.3134 34.5222 31.4637C34.4815 31.6073 34.5119 31.7626 34.6133 31.9295L36.208 34.5532C36.4817 34.3868 36.7275 34.1369 36.9453 33.8033C37.1631 33.4698 37.3299 33.1125 37.4456 32.7313C37.5614 32.3501 37.6155 31.9653 37.6079 31.5767C37.6003 31.1882 37.5113 30.8538 37.3409 30.5734C37.2151 30.3664 37.0777 30.2305 36.9286 30.1657C36.7861 30.0969 36.6333 30.0709 36.4699 30.088C36.3132 30.1009 36.154 30.1474 35.9924 30.2273C35.8307 30.3073 35.6664 30.398 35.4995 30.4995ZM41.3377 34.329C41.1185 33.9685 40.9428 33.5816 40.8105 33.1683C40.6782 32.7551 40.6182 32.3481 40.6307 31.9474C40.6498 31.5426 40.7548 31.1588 40.9457 30.796C41.1432 30.4291 41.459 30.1138 41.8929 29.85C42.14 29.6999 42.3853 29.6147 42.6291 29.5946C42.8688 29.5678 43.0966 29.5892 43.3128 29.659C43.5289 29.7288 43.7278 29.8456 43.9097 30.0093C44.0941 30.1624 44.2512 30.3457 44.3811 30.5593C44.588 30.8998 44.7088 31.279 44.7433 31.6968C44.7845 32.1106 44.7467 32.5222 44.6297 32.9315C44.5155 33.3301 44.3266 33.6963 44.0632 34.03C43.7958 34.3572 43.4649 34.5949 43.0704 34.7431C43.1948 34.9327 43.3536 35.051 43.5468 35.0982C43.7426 35.1346 43.9456 35.1301 44.1557 35.0847C44.3658 35.0392 44.5704 34.9697 44.7695 34.8762C44.9645 34.7759 45.1355 34.6811 45.2823 34.5919C45.4359 34.4985 45.5713 34.3979 45.6886 34.2901C45.8059 34.1822 45.9212 34.071 46.0344 33.9565C46.1476 33.842 46.2629 33.7308 46.3802 33.6229C46.5042 33.511 46.6429 33.4084 46.7965 33.315C46.8566 33.2785 46.9187 33.2453 46.9828 33.2155C47.047 33.1857 47.1138 33.1679 47.1835 33.1621C47.2491 33.1497 47.3148 33.16 47.3806 33.1931C47.4424 33.2196 47.4956 33.2695 47.5402 33.343C47.6173 33.4698 47.6355 33.605 47.5948 33.7486C47.55 33.8855 47.4725 34.0287 47.3621 34.178C47.2584 34.3233 47.13 34.4654 46.9767 34.6043C46.8193 34.7365 46.6633 34.8633 46.5085 34.9848C46.3564 35.0955 46.2103 35.1935 46.0701 35.2787C45.9406 35.3666 45.8425 35.4308 45.7757 35.4713C45.3485 35.731 44.924 35.8976 44.5024 35.971C44.0767 36.0377 43.674 36.0219 43.2942 35.9236C42.9104 35.8186 42.5516 35.6344 42.2179 35.371C41.8867 35.0969 41.5933 34.7496 41.3377 34.329ZM42.0035 33.0329C42.1456 33.2665 42.2791 33.4185 42.4041 33.4888C42.5358 33.5551 42.7251 33.5131 42.9721 33.363C43.1457 33.2575 43.2977 33.124 43.4281 32.9625C43.5544 32.7942 43.6498 32.6128 43.7144 32.4182C43.7856 32.2195 43.8146 32.019 43.8014 31.8168C43.7882 31.6145 43.7268 31.4233 43.6172 31.243C43.5564 31.1429 43.4835 31.0455 43.3985 30.9508C43.3202 30.8521 43.228 30.7756 43.1219 30.7213C43.0116 30.6603 42.8969 30.6294 42.7777 30.6288C42.661 30.6174 42.536 30.6523 42.4024 30.7334C42.2021 30.8552 42.047 31.0135 41.9369 31.2084C41.8294 31.3926 41.7635 31.5926 41.7393 31.8084C41.711 32.0176 41.7216 32.2306 41.7711 32.4474C41.8165 32.6574 41.894 32.8526 42.0035 33.0329ZM46.5665 30.3419C46.461 30.1683 46.4293 30.0184 46.4715 29.8922C46.5096 29.7594 46.6254 29.6341 46.819 29.5164L46.9192 29.4556C47.0041 29.5502 47.1025 29.6595 47.2145 29.7835C47.3264 29.9075 47.4537 30.0266 47.5963 30.1411C47.739 30.2555 47.8856 30.3538 48.0362 30.436C48.1826 30.5115 48.3316 30.5536 48.4831 30.5621C48.3477 30.3244 48.2685 30.0662 48.2455 29.7877C48.2251 29.4984 48.2443 29.2216 48.3031 28.9573C48.3645 28.6823 48.4575 28.4292 48.5821 28.198C48.7094 27.9561 48.8576 27.7563 49.0269 27.5986L49.2472 27.4647C49.5676 27.2699 49.886 27.177 50.2023 27.1859C50.5145 27.1881 50.815 27.2614 51.1039 27.4058C51.3954 27.5395 51.6705 27.7289 51.9291 27.9739C52.1878 28.219 52.4305 28.4829 52.6572 28.7656C52.8865 29.0377 53.0917 29.3152 53.2729 29.5982C53.4567 29.8705 53.6094 30.1068 53.7311 30.307L53.0001 30.7514C52.7166 30.3751 52.4332 30.0217 52.15 29.691C52.0407 29.5563 51.9206 29.419 51.7899 29.2791C51.655 29.1324 51.525 29.0012 51.3997 28.8854C51.2704 28.7628 51.1459 28.6557 51.0261 28.5639C50.9023 28.4655 50.7839 28.3911 50.6711 28.3408C50.6282 28.3304 50.5691 28.316 50.494 28.2976C50.4255 28.2753 50.3537 28.2549 50.2786 28.2366C50.2035 28.2182 50.1357 28.2046 50.0754 28.1955C50.015 28.1865 49.9815 28.184 49.9748 28.1881C49.7421 28.2564 49.5929 28.4019 49.5271 28.6247C49.4574 28.8408 49.4327 29.0935 49.4531 29.3828C49.4735 29.6721 49.5322 29.9793 49.6292 30.3043C49.7328 30.6253 49.8404 30.9302 49.9519 31.2189C50.0594 31.501 50.1619 31.745 50.2596 31.9508C50.3532 32.1499 50.4088 32.2715 50.4265 32.3156C50.3326 32.5372 50.198 32.6693 50.0227 32.7118C49.8434 32.7477 49.6383 32.7261 49.4074 32.647C49.1832 32.5638 48.9446 32.4346 48.6917 32.2592C48.4455 32.0797 48.1978 31.8828 47.9487 31.6685C47.6956 31.4475 47.4491 31.2225 47.2093 30.9934C46.9762 30.7603 46.7619 30.5431 46.5665 30.3419ZM52.3835 27.3001C52.2131 27.0197 52.0946 26.6894 52.0282 26.3093C51.9684 25.9251 51.9669 25.5466 52.0237 25.1738C52.0765 24.7943 52.1857 24.4399 52.3513 24.1107C52.5235 23.7775 52.7599 23.5195 53.0603 23.3369C53.2139 23.2436 53.3837 23.177 53.5697 23.1371C53.7557 23.0971 53.9392 23.0907 54.1202 23.1178C54.3079 23.1409 54.4811 23.2002 54.6398 23.2958C54.8051 23.3873 54.9405 23.5198 55.046 23.6934C54.9258 23.7664 54.8076 23.82 54.6912 23.8542C54.5815 23.8843 54.4698 23.9111 54.356 23.9345C54.2382 23.9512 54.1245 23.9747 54.0148 24.0048C53.9117 24.0308 53.8068 24.0763 53.7 24.1412C53.4263 24.3076 53.2452 24.5136 53.1569 24.7593C53.0711 24.9943 53.0411 25.2457 53.0667 25.5135C53.0923 25.7813 53.1582 26.0476 53.2642 26.3123C53.3728 26.5662 53.49 26.7967 53.6158 27.0036C53.6361 27.037 53.6747 27.1004 53.7315 27.1939C53.795 27.2833 53.8592 27.3814 53.9241 27.4882C53.9916 27.5843 54.0538 27.6791 54.1106 27.7726C54.1741 27.862 54.2193 27.9213 54.2463 27.9507C54.4171 28.0662 54.5623 28.1471 54.6818 28.1934C54.808 28.2355 54.9253 28.2556 55.0338 28.2537C55.1383 28.245 55.2413 28.219 55.3429 28.1755C55.4404 28.1254 55.5526 28.0618 55.6794 27.9847C55.853 27.8792 55.987 27.7612 56.0814 27.6307C56.1825 27.4961 56.2674 27.3576 56.3363 27.2152C56.4051 27.0728 56.4633 26.9278 56.5107 26.7801C56.554 26.6258 56.6068 26.4794 56.6689 26.3411C56.7337 26.192 56.8154 26.0555 56.9138 25.9317C57.0149 25.7971 57.1488 25.6791 57.3157 25.5777C57.5146 25.9048 57.631 26.2317 57.665 26.5585C57.7057 26.8811 57.674 27.1975 57.5699 27.5076C57.4725 27.8137 57.3107 28.104 57.0845 28.3786C56.8609 28.6425 56.5822 28.8759 56.2484 29.0788C55.9346 29.2695 55.586 29.3351 55.2025 29.2757C54.8256 29.2122 54.4537 29.0816 54.0868 28.8841C53.7225 28.6758 53.3881 28.4265 53.0837 28.1362C52.7792 27.8458 52.5458 27.5671 52.3835 27.3001ZM57.2807 23.3088C57.2564 23.2688 57.2178 23.2054 57.1651 23.1186C57.1149 23.021 57.0594 22.9222 56.9986 22.8221C56.9444 22.7179 56.8889 22.619 56.8321 22.5256C56.7819 22.428 56.7447 22.3593 56.7204 22.3192C56.7289 22.1677 56.7696 22.0242 56.8425 21.8884C56.9221 21.7486 57.0098 21.6222 57.1056 21.5091C57.3448 21.8574 57.6348 22.2068 57.9758 22.5572C58.3168 22.9077 58.6665 23.2574 59.0249 23.6064C59.3792 23.9487 59.7182 24.2958 60.0417 24.6477C60.372 24.9955 60.6426 25.343 60.8536 25.6901C61.0362 25.9906 60.9739 26.2341 60.6668 26.4208C60.4799 26.5344 60.2764 26.553 60.0562 26.4765C59.836 26.4 59.6149 26.2693 59.3927 26.0844C59.1732 25.8886 58.9529 25.6615 58.7316 25.4028C58.5064 25.1374 58.2985 24.8707 58.1081 24.6024C57.9243 24.3302 57.7581 24.0792 57.6094 23.8496C57.4674 23.6159 57.3578 23.4357 57.2807 23.3088ZM55.1385 19.4683C55.2978 19.4446 55.4573 19.4665 55.6172 19.5339C55.777 19.6013 55.8807 19.6892 55.9282 19.7974C55.9783 19.8949 55.9455 20.0063 55.8296 20.1316C55.7097 20.2502 55.4517 20.3522 55.0556 20.4375C54.946 20.2572 54.884 20.0801 54.8696 19.906C54.8619 19.7278 54.9515 19.5819 55.1385 19.4683ZM58.3013 20.0693C58.1836 19.8757 58.0566 19.6969 57.9204 19.5328C57.7801 19.3621 57.674 19.2026 57.6021 19.0543C57.5262 18.8993 57.5053 18.752 57.5393 18.6125C57.58 18.4689 57.7205 18.3241 57.9609 18.178C58.1277 18.2869 58.3398 18.478 58.5972 18.7512C58.8614 19.0203 59.1506 19.3382 59.4649 19.7049C59.7792 20.0716 60.1124 20.477 60.4646 20.9211C60.8128 21.3586 61.1564 21.8035 61.4952 22.2558C61.8408 22.704 62.1723 23.1516 62.4897 23.5987C62.8097 24.035 63.0954 24.4373 63.3467 24.8057C63.2157 25.0865 63.0448 25.204 62.8342 25.1583C62.6236 25.1126 62.3836 24.9659 62.1142 24.7183C61.8408 24.4639 61.5488 24.134 61.2383 23.7284C60.9238 23.3162 60.6012 22.8906 60.2704 22.4517C59.9422 22.002 59.6102 21.5685 59.2742 21.151C58.9341 20.7269 58.6098 20.3663 58.3013 20.0693Z"
              fill="black"
            />
          </svg>

          <AnimatedPencilWithBackground
            height="100%" // Adjusted to fill the wrapper
            width="100%"
            color="#6b6b6b"
            useCustomColor={true}
          />
        </div>
      </motion.div>
  
        <div  className="flex flex-col items-center justify-center w-full max-w-2xl">
          <motion.div 
          
            variants={dropIn} initial="hidden" animate="visible" custom={1}
            className="w-full"
          >
            <SketchTitleComponent isTitle={true}/>
          </motion.div>
  
          <motion.div
          id="welcome-message"
          variants={dropIn}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-md md:text-xl lg:text-2xl mb-8 font-gloria text-center w-full"
        >
          <span className="relative inline-block">
            {isAuthenticated ? `Welcome, ${username}` : `Welcome, Guest`}
            <svg
              viewBox="0 0 79 11"
              fill="none"
              className="absolute left-3/4 -bottom-4 w-[50%] -translate-x-1/2 h-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M0.500084 5.9054C32.2285 0.5 49.7339 0.5 72.7097 0.5C95.6855 0.5 43.5341 3.74324 33.6873 7.7973C23.8406 11.8514 67.604 0.50231 67.2393 10.5" // Example path data
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 1.3 }}
                fill="transparent"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
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
