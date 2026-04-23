export function saveUserToStorage(user) {
  localStorage.setItem('activeUser', JSON.stringify(user));
}

export function loadUserFromStorage() {
  const userJson = localStorage.getItem('activeUser');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    localStorage.removeItem('activeUser');
    return null;
  }
}

export function clearUserStorage() {
  localStorage.removeItem('activeUser');
  localStorage.removeItem('token');
}