// Simple auth provider - assumes user is already authenticated by main portal
const authProvider = {
  login: () => Promise.resolve(),
  logout: () => {
    window.location.href = '/auth/logout';
    return Promise.resolve();
  },
  checkError: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(), // Always authenticated if you got here
  getPermissions: () => Promise.resolve(),
  getIdentity: () =>
    Promise.resolve({
      id: 'user',
      fullName: 'Portal User',
    }),
};

export default authProvider;
