// API Fetch Utility with Hostname Extraction

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Custom fetch wrapper that appends Auth headers, formats URL,
 * and extracts the load balancer instance hostname.
 * 
 * @param {string} endpoint - The API route (e.g. '/auth/login', '/reports')
 * @param {object} [options] - Fetch options (method, body, headers, etc.)
 * @param {function} [setHostname] - Callback to update the servedBy hostname state
 */
export async function apiFetch(endpoint, options = {}, setHostname = null) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  // Set Authorization header if logged in
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Inject current user ID for vote matching in agency details
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      headers['X-User-Id'] = parsedUser.id.toString();
    } catch (_e) {
      // Ignored
    }
  }

  // Don't set Content-Type if uploading file (multipart/form-data)
  const isMultipart = options.body instanceof FormData;
  if (!isMultipart && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Extract hostname from custom response header
  const servedBy = response.headers.get('X-Served-By');
  if (servedBy && setHostname) {
    setHostname(servedBy);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export { API_BASE_URL };
