const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
const isText = (value, min, max) =>
  typeof value === 'string' &&
  value.trim().length >= min &&
  value.trim().length <= max;
const isObjectId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const userProfile = (user) => ({
  id: String(user._id),
  username: user.username,
  role: user.role === 'admin' ? 'admin' : 'customer',
});
const isImageUrl = (value) => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

module.exports = {
  asyncHandler,
  httpError,
  isText,
  isObjectId,
  userProfile,
  isImageUrl,
};
