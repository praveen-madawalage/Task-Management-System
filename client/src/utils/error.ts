// Pulls a human-readable message out of an axios error, preferring the API's
// first field-level validation message, then its top-level error string.
export const extractError = (err: unknown, fallback = 'Something went wrong'): string => {
  const e = err as { response?: { data?: { error?: string; details?: { msg?: string }[] } } };
  return e?.response?.data?.details?.[0]?.msg ?? e?.response?.data?.error ?? fallback;
};
