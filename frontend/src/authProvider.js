// Simple auth provider that uses your existing FastAPI session auth
const authProvider = {
  login: () => {
    // Already authenticated via portal, no login needed
    return Promise.resolve();
  },
  logout: () => {
    // Redirect to portal logout
    window.location.href = '/logout';
    return Promise.resolve();
  },
  checkAuth: () => {
    // Check if user is authenticated via your FastAPI session
    return fetch('/api/current-user', { credentials: 'include' })
      .then(response => {
        if (response.ok) {
          return Promise.resolve();
        }
        return Promise.reject();
      })
      .catch(() => {
        // Redirect to portal login
        window.location.href = '/';
        return Promise.reject();
      });
  },
  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getIdentity: () => {
    return fetch('/api/current-user', { credentials: 'include' })
      .then(response => response.json())
      .then(user => ({
        id: user.email,
        fullName: user.name || user.email,
        avatar: user.picture,
      }))
      .catch(() => ({
        id: 'unknown',
        fullName: 'User',
      }));
  },
  getPermissions: () => Promise.resolve(''),
};

export default authProvider;

