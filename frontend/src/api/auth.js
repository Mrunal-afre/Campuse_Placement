import axios from 'axios';

// Base URL for all API calls — points to Django
const API = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Automatically attach the JWT token to every request if user is logged in
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions
export const registerUser  = (data) => API.post('/auth/register/', data);
export const loginUser     = (data) => API.post('/auth/login/', data);
export const logoutUser    = (data) => API.post('/auth/logout/', data);
export const getCurrentUser = ()    => API.get('/auth/me/');

// Student Profile API calls
export const getMyProfile    = ()     => API.get('/students/profile/');
export const updateMyProfile = (data) => API.put('/students/profile/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }  // needed for file uploads
});
export const getAllStudents   = (filters = '') => API.get(`/students/all/${filters}`);
export const getStudentById  = (id)   => API.get(`/students/profile/${id}/`);

// Recruiter Profile API calls
export const getRecruiterProfile    = ()     => API.get('/recruiters/profile/');
export const updateRecruiterProfile = (data) => API.put('/recruiters/profile/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getRecruiterById = (id) => API.get(`/recruiters/profile/${id}/`);

// Jobs API
export const getMyJobs       = ()        => API.get('/jobs/my-jobs/');
export const postJob         = (data)    => API.post('/jobs/my-jobs/', data);
export const updateJob       = (id, data)=> API.put(`/jobs/my-jobs/${id}/`, data);
export const deleteJob       = (id)      => API.delete(`/jobs/my-jobs/${id}/`);
export const getAvailableJobs= ()        => API.get('/jobs/available/');
export const getJobDetail    = (id)      => API.get(`/jobs/${id}/`);

// Application API calls
export const applyToJob         = (data)          => API.post('/applications/apply/', data);
export const getMyApplications  = ()              => API.get('/applications/my-applications/');
export const withdrawApplication= (id)            => API.delete(`/applications/${id}/withdraw/`);
export const checkApplication   = (jobId)         => API.get(`/applications/check/${jobId}/`);
export const getJobApplicants   = (jobId, filter) =>
  API.get(`/applications/job/${jobId}/applicants/${filter ? `?status=${filter}` : ''}`);
export const updateAppStatus    = (id, data)      => API.put(`/applications/${id}/update-status/`, data);

/*
// Browse students (recruiter)
export const getAllStudents = (filters = '') =>
  API.get(`/students/all/${filters}`);
*/
// Bulk update
export const bulkUpdateStatus = (data) =>
  API.post('/applications/bulk-update-status/', data);

// Tracking & Stats
export const getStudentStats    = ()   => API.get('/applications/student-stats/');
export const getRecruiterStats  = ()   => API.get('/applications/recruiter-stats/');
export const getAppTimeline     = (id) => API.get(`/applications/${id}/timeline/`);

// Admin API
export const getAdminStats    = ()         => API.get('/admin/stats/');
export const getAdminUsers    = (q = '')   => API.get(`/admin/users/${q}`);
export const updateUserAdmin  = (id, data) => API.put(`/admin/users/${id}/`, data);
export const getAdminJobs     = ()         => API.get('/admin/jobs/');
export const deleteJobAdmin   = (id)       => API.delete(`/admin/jobs/${id}/`);
export const getPendingUsers  = ()         => API.get('/admin/pending/');