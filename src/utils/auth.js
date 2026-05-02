export function getToken() {
  return localStorage.getItem('token');
}

export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}

export function getUserRole() {
  const role = localStorage.getItem('role');
  if (role) return role;
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = parseJwt(token);
  return payload ? payload.role : null;
}
