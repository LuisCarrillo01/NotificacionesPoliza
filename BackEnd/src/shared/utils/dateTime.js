function toIsoString(dateValue) {
  if (!dateValue) {
    return null;
  }

  return new Date(dateValue).toISOString();
}

module.exports = {
  toIsoString
};
