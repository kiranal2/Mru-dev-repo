// Application Configuration
export const BASE_URL = process.env.API_BASE_URL;
export const AppTitle = "Meeru AI";
export const env = process.env.NODE_ENV || "development";
export const COMMAND_ENTER_SSE_URL = "/sse/query";

// Local Storage Keys
export const localStorageNames = {
  userLoggedInLocalStorageName: "userLoggedIn",
  lastActivityTimeLocalStorageName: "lastActivityTime",
  sessionTokenName: "sessionToken",
  userDataName: "userData",
};

// Route Constants
export const LOGIN_PATH = "/login";
export const FIRST_PAGE_PATH = "home/command-center";
export const ROOT_PATH = "/";

export default {
  BASE_URL,
  AppTitle,
  env,
  localStorageNames,
  LOGIN_PATH,
  FIRST_PAGE_PATH,
  ROOT_PATH,
  COMMAND_ENTER_SSE_URL,
};
