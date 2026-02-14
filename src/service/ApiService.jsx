import api from "./Api";

export const handleApiRequest = async (method, url, data = null, params = null) => {
  try {
    const response = await api({
      method,
      url,
      data,
      params,
    });

    return response.data;

  } catch (error) {
    let errorMessage = "An unexpected error occurred";

    if (error.response) {

      errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
    } else if (error.request) {

      errorMessage = "No response from server. Check your connection or CORS settings.";
    } else {

      errorMessage = error.message;
    }

    console.error(`API Error: ${errorMessage}`);

    throw new Error(errorMessage);
  }
};
