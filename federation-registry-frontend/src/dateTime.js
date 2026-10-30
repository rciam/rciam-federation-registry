const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLocalDateTime = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleString() : value || "";
};

export const formatLocalDate = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString() : value || "";
};
