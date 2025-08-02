export const isNotNumeric = (string: string): boolean => {
  if (typeof string !== 'string') {
    throw new Error('Input must be a string');
  }

  return !/^\d+$/.test(string);
};

export const cleanStringInput = (string: string) => {
  if (typeof string !== 'string') {
    throw new Error('Input must be a string');
  }

  return string.replace(/\s+/g, '').toLowerCase();
};
