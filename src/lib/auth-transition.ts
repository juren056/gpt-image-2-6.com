let signOutInProgress = false;

export function beginSignOut() {
  signOutInProgress = true;
}

export function cancelSignOut() {
  signOutInProgress = false;
}

export function isSigningOut() {
  return signOutInProgress;
}
