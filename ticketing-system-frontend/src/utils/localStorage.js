const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
 
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};
 
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};
 
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
 
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};
 
export const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
 
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};