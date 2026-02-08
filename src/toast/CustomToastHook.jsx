import React from 'react'
import {Flip, toast} from "react-toastify"
import SketchToast from './SketchToast';


export const useToast = () => {
    const showSuccessToast = (message) => {
            toast(({ closeToast, isPaused, toastProps }) => (
      <SketchToast 
        text= {message} 
        closeToast={closeToast} 
        isPaused={isPaused} 
        isError={false}
        toastProps={toastProps}
      />
    ), {
      autoClose: 3000,
      position:'top-left',
      customProgressBar: true, 
      hideProgressBar: true,  
      closeButton : false, 
      pauseOnFocusLoss : false,
      pauseOnHover : false,
      style: { background: 'transparent', boxShadow: 'none' } 
    });
    }

    const showErrorToast = (message) => {
            toast(({ closeToast, isPaused, toastProps }) => (
      <SketchToast 
        text= {message} 
        closeToast={closeToast} 
        isPaused={isPaused} 
        isError={true}
        toastProps={toastProps}
      />
    ), {
      autoClose: 3000,
      position:'top-left',
      customProgressBar: true, 
      hideProgressBar: true,   
      pauseOnFocusLoss : false,
      pauseOnHover : false,
      style: { background: 'transparent', boxShadow: 'none' } 
    });
    }
     return { showErrorToast, showSuccessToast };
}
