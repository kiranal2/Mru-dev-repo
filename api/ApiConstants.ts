/**
 * ApiConstants.ts
 * This file contains constants for API endpoints used in the application.
 * It includes base URLs and specific endpoints for different functionalities.
 */

// API base URLs for different versions
import { BASE_URL } from '../conf/conf';
const v1 = `${BASE_URL}/v1/`;

// Session API endpoints
const sessionBase = `${v1}session/`;
export const sessionRoutes = {
  logindetails: `${sessionBase}login`,
  check: `${sessionBase}check`,
  createSession: sessionBase,
  logout: `${sessionBase}logout`,
};

