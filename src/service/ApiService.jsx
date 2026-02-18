import api from "./Api";

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

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
    let statusCode = 0;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || error.response.data?.error || `Error: ${statusCode}`;
    } else if (error.request) {
      errorMessage = "No response from server. Check your connection or CORS settings.";
    } else {
      errorMessage = error.message;
    }

    console.error(`API Error [${statusCode}]: ${errorMessage}`);

    throw new ApiError(errorMessage, statusCode);
  }
};
